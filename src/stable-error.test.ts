import { describe, it, expect } from "bun:test";
import {
  createStableError,
  generateStableId,
  normalizeMessage,
  filterMetadata,
  type StableErrorOptions,
  type ErrorSeverity,
} from "./stable-error.js";

describe("normalizeMessage", () => {
  it("should normalize basic messages", () => {
    expect(normalizeMessage("User not found")).toBe("user not found");
    expect(normalizeMessage("  USER NOT FOUND  ")).toBe("user not found");
  });

  it("should replace numbers with NUMBER placeholder", () => {
    expect(normalizeMessage("User 123 not found")).toBe(
      "user NUMBER not found",
    );
    expect(normalizeMessage("Error code 404")).toBe("error code NUMBER");
  });

  it("should replace UUIDs with UUID placeholder", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(normalizeMessage(`User ${uuid} not found`)).toBe(
      "user UUID not found",
    );
  });

  it("should replace timestamps with TIMESTAMP placeholder", () => {
    expect(normalizeMessage("Error at 2023-01-01T10:00:00Z")).toBe(
      "error at TIMESTAMP",
    );
    expect(normalizeMessage("Error at 1672531200000")).toBe(
      "error at TIMESTAMP_MS",
    );
  });

  it("should normalize multiple spaces", () => {
    expect(normalizeMessage("User   123   not   found")).toBe(
      "user NUMBER not found",
    );
  });

  it("should handle empty or invalid input", () => {
    expect(normalizeMessage("")).toBe("");
    expect(normalizeMessage(null as unknown as string)).toBe("");
    expect(normalizeMessage(undefined as unknown as string)).toBe("");
  });
});

describe("filterMetadata", () => {
  it("should filter to only allowed keys", () => {
    const metadata = {
      type: "validation",
      field: "email",
      userId: 123,
      timestamp: "2023-01-01",
      sessionId: "abc123",
    };

    const filtered = filterMetadata(metadata);
    expect(filtered).toEqual({
      type: "validation",
      field: "email",
    });
  });

  it("should handle empty metadata", () => {
    expect(filterMetadata({})).toEqual({});
    expect(filterMetadata(null as unknown as Record<string, unknown>)).toEqual(
      {},
    );
    expect(
      filterMetadata(undefined as unknown as Record<string, unknown>),
    ).toEqual({});
  });

  it("should exclude null and undefined values", () => {
    const metadata = {
      type: "validation",
      field: null,
      operation: undefined,
      service: "api",
    };

    const filtered = filterMetadata(metadata);
    expect(filtered).toEqual({
      type: "validation",
      service: "api",
    });
  });
});

describe("generateStableId", () => {
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
    expect(id).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("createStableError", () => {
  it("should create error with string message", () => {
    const error = createStableError("Test error");

    expect(error.message).toBe("Test error");
    expect(error.name).toBe("StableError");
    expect(error.id).toMatch(/^[0-9a-f]{8}$/);
    expect(error.category).toBe("general");
    expect(error.severity).toBe("medium");
    expect(error.metadata).toEqual({});
    expect(error.statusCode).toBe(500);
    expect(typeof error.timestamp).toBe("string");
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
    expect(error.metadata).toEqual({
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
    expect(stableError.metadata).toEqual({
      source: "test",
      originalName: "OriginalError",
      originalStack: originalError.stack,
    });
    expect(stableError.statusCode).toBe(500);
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

    expect(json).toEqual({
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

    severities.forEach((severity) => {
      const error = createStableError("Test error", { severity });
      expect(error.severity).toBe(severity);
    });
  });

  it("should preserve original stack when converting from Error", () => {
    const originalError = new Error("Test");
    const stack = originalError.stack;

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
