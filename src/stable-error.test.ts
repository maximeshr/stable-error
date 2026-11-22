import { describe, expect, it } from "vite-plus/test";
import {
  createStableError,
  generateStableId,
  normalizeMessage,
  filterMetadata,
} from "./stable-error.ts";
import type { StableErrorOptions, ErrorSeverity } from "./stable-error.ts";

/**
 * JavaScript callers are not held to the declared parameter types, and the library guards against
 * the values they can still pass
 */
const bypassTypes = (value: null | undefined): never =>
  // SAFETY: the value only reaches runtime guards that accept null and undefined
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the test needs a value the signature rejects
  value as never;

describe(normalizeMessage, () => {
  it("should normalize basic messages", () => {
    expect(normalizeMessage("User not found")).toBe("user not found");
    expect(normalizeMessage("  USER NOT FOUND  ")).toBe("user not found");
  });

  it("should replace numbers with NUMBER placeholder", () => {
    expect(normalizeMessage("User 123 not found")).toBe("user NUMBER not found");
    expect(normalizeMessage("Error code 404")).toBe("error code NUMBER");
  });

  it("should replace UUIDs with UUID placeholder", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(normalizeMessage(`User ${uuid} not found`)).toBe("user UUID not found");
  });

  it("should replace timestamps with TIMESTAMP placeholder", () => {
    expect(normalizeMessage("Error at 2023-01-01T10:00:00Z")).toBe("error at TIMESTAMP");
    expect(normalizeMessage("Error at 1672531200000")).toBe("error at TIMESTAMP_MS");
  });

  it("should normalize multiple spaces", () => {
    expect(normalizeMessage("User   123   not   found")).toBe("user NUMBER not found");
  });

  it("should handle empty or invalid input", () => {
    expect(normalizeMessage("")).toBe("");
    expect(normalizeMessage(bypassTypes(null))).toBe("");
    expect(normalizeMessage(bypassTypes(undefined))).toBe("");
  });
});

describe(filterMetadata, () => {
  it("should filter to only allowed keys", () => {
    const metadata = {
      type: "validation",
      field: "email",
      userId: 123,
      timestamp: "2023-01-01",
      sessionId: "abc123",
    };

    const filtered = filterMetadata(metadata);
    expect(filtered).toStrictEqual({
      type: "validation",
      field: "email",
    });
  });

  it("should handle empty metadata", () => {
    expect(filterMetadata({})).toStrictEqual({});
    expect(filterMetadata(bypassTypes(null))).toStrictEqual({});
    expect(filterMetadata(bypassTypes(undefined))).toStrictEqual({});
  });

  it("should exclude null and undefined values", () => {
    const metadata = {
      type: "validation",
      field: null,
      operation: undefined,
      service: "api",
    };

    const filtered = filterMetadata(metadata);
    expect(filtered).toStrictEqual({
      type: "validation",
      service: "api",
    });
  });
});

describe(generateStableId, () => {
  it("should generate consistent IDs for same input", () => {
    const id1 = generateStableId("User not found", "validation", {
      field: "email",
    });

    const id2 = generateStableId("User not found", "validation", {
      field: "email",
    });

    expect(id1).toBe(id2);
  });

  it("should generate different IDs for different messages", () => {
    const id1 = generateStableId("User not found", "validation", {});
    const id2 = generateStableId("User found", "validation", {});
    expect(id1).not.toBe(id2);
  });

  it("should generate different IDs for different categories", () => {
    const id1 = generateStableId("User not found", "validation", {});
    const id2 = generateStableId("User not found", "database", {});
    expect(id1).not.toBe(id2);
  });

  it("should generate different IDs for different metadata", () => {
    const id1 = generateStableId("User not found", "validation", {
      field: "email",
    });

    const id2 = generateStableId("User not found", "validation", {
      field: "username",
    });

    expect(id1).not.toBe(id2);
  });

  it("should generate 8-character hex IDs", () => {
    const id = generateStableId("Test message", "test", {});
    expect(id).toMatch(/^[0-9a-f]{8}$/u);
  });

  it.each([
    ["User not found", "validation", { field: "email" }, "1d40d2a1"],
    [
      "User 550e8400-E29B-41d4-a716-446655440000 at 2023-01-01T10:00:00.123Z took 1672531200000 ms",
      "Database",
      { service: "api", userId: 1, code: 42 },
      "0acb84f8",
    ],
    ["Ünïcödé 😀 ſtring with \u212A and ẞ", "", {}, "76b81b5d"],
    ["x".repeat(500), "general", { type: null, operation: "op", component: undefined }, "1285f1c8"],
  ])("should keep the ID of %s from earlier releases", (message, category, metadata, id) => {
    expect(generateStableId(message, category, metadata)).toBe(id);
  });
});

describe(createStableError, () => {
  it("should create error with string message", () => {
    const error = createStableError("Test error");

    expect(error.message).toBe("Test error");
    expect(error.name).toBe("StableError");
    expect(error.id).toMatch(/^[0-9a-f]{8}$/u);
  });

  it("should apply the default options", () => {
    const error = createStableError("Test error");

    expect(error.category).toBe("general");
    expect(error.severity).toBe("medium");
    expect(error.metadata).toStrictEqual({});
    expect(error.statusCode).toBe(500);
  });

  it("should set a timestamp", () => {
    const error = createStableError("Test error");

    expect(error.timestamp).toBeTypeOf("string");
    expect(new Date(error.timestamp)).toBeInstanceOf(Date);
  });

  it("should create error with custom options", () => {
    const options: StableErrorOptions = {
      category: "validation",
      severity: "high",
      metadata: { field: "email", type: "required" },
    };

    const error = createStableError("Validation failed", options);

    expect(error.message).toBe("Validation failed");
    expect(error.category).toBe("validation");
    expect(error.severity).toBe("high");
    expect(error.metadata).toStrictEqual({
      field: "email",
      type: "required",
    });
    expect(error.statusCode).toBe(500);
  });

  it("should create error from existing Error object", () => {
    const originalError = new Error("Original message");
    originalError.name = "OriginalError";

    const stableError = createStableError(originalError, {
      category: "conversion",
      metadata: { source: "test" },
    });

    expect(stableError.message).toBe("Original message");
    expect(stableError.name).toBe("StableError");
    expect(stableError.category).toBe("conversion");
    expect(stableError.metadata).toStrictEqual({
      source: "test",
      originalName: "OriginalError",
      originalStack: originalError.stack,
    });
    expect(stableError.statusCode).toBe(500);
  });

  it("should keep the original stack of an Error converted with options", () => {
    const originalError = new Error("Original message");

    const stableError = createStableError(originalError, {
      category: "conversion",
      metadata: { source: "test" },
    });

    expect(stableError.stack).toBe(originalError.stack);
  });

  it("should generate stable IDs for same normalized messages", () => {
    const error1 = createStableError("User 123 not found", {
      category: "test",
    });

    const error2 = createStableError("User 456 not found", {
      category: "test",
    });

    expect(error1.id).toBe(error2.id);
  });

  it("should have toJSON method", () => {
    const error = createStableError("Test error", {
      category: "test",
      severity: "low",
      metadata: { test: true },
    });

    const json = error.toJSON();

    expect(json).toStrictEqual({
      id: error.id,
      message: "Test error",
      category: "test",
      metadata: { test: true },
      severity: "low",
      timestamp: error.timestamp,
      statusCode: 500,
      stack: error.stack,
    });
  });

  it("should be throwable", () => {
    const error = createStableError("Test error");

    expect(() => {
      throw error;
    }).toThrow("Test error");
  });

  it("should handle all severity levels", () => {
    const severities: ErrorSeverity[] = ["low", "medium", "high", "critical"];

    for (const severity of severities) {
      const error = createStableError("Test error", { severity });
      expect(error.severity).toBe(severity);
    }
  });

  it("should preserve original stack when converting from Error", () => {
    const originalError = new Error("Test");
    const { stack } = originalError;

    const stableError = createStableError(originalError);
    expect(stableError.stack).toBe(stack);
  });

  it("should handle statusCode option", () => {
    const error = createStableError("Test error", {
      statusCode: 400,
      metadata: { field: "email" },
    });

    expect(error.statusCode).toBe(400);
    expect(error.metadata.field).toBe("email");
  });
});
