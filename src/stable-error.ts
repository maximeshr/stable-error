export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export type Metadata = Record<string, unknown>;

export type StableErrorOptions = {
  category?: string;
  metadata?: Metadata;
  severity?: ErrorSeverity;
  statusCode?: number;
};

export type ErrorJSON = {
  id: string;
  message: string;
  category: string;
  metadata: Metadata;
  severity: ErrorSeverity;
  timestamp: string;
  statusCode: number;
  stack?: string | undefined;
};

type MessageReplacement = readonly [RegExp, string];

export function normalizeMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return "";
  }

  const messageReplacements: readonly MessageReplacement[] = [
    [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "UUID"],
    [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/gi, "TIMESTAMP"],
    [/\b\d{13}\b/g, "TIMESTAMP_MS"],
    [/\b\d+\b/g, "NUMBER"],
  ];

  let normalized = message.toLowerCase().trim();
  for (const [pattern, placeholder] of messageReplacements) {
    normalized = normalized.replace(pattern, placeholder);
  }
  return normalized.replace(/\s+/g, " ");
}

export function filterMetadata(metadata: Metadata): Metadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const allowedKeys = new Set(["type", "code", "field", "operation", "service", "component"]);
  const filtered: Metadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (allowedKeys.has(key) && value !== undefined && value !== null) {
      filtered[key] = value;
    }
  }

  return filtered;
}

function toInt32(value: number): number {
  return value | 0;
}

export function generateStableId(message: string, category: string, metadata: Metadata): string {
  const parts = [
    `message:${normalizeMessage(message)}`,
    `category:${(category || "").toLowerCase().trim()}`,
  ];

  const filtered = filterMetadata(metadata);
  const sortedKeys = Object.keys(filtered).sort();

  if (sortedKeys.length > 0) {
    const metadataParts = sortedKeys.map(
      (key) => `${key}:${String(filtered[key]).toLowerCase().trim()}`,
    );
    parts.push(`metadata:${metadataParts.join(",")}`);
  }

  const stableString = parts.join("|");

  let hash = 0;
  for (let i = 0; i < stableString.length; i++) {
    const char = stableString.charCodeAt(i);
    hash = toInt32((hash << 5) - hash + char);
  }

  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Creates a stable error object with consistent error ID
 * Same error message + category + metadata = Same ID
 * Can accept either a string message or an existing Error object
 */
export function createStableError(
  messageOrError: string | Error,
  options: StableErrorOptions = {},
): Error & ErrorJSON & { toJSON(): ErrorJSON } {
  let message: string;
  let originalStack: string | undefined;
  let originalName: string;

  if (typeof messageOrError === "string") {
    message = messageOrError;
    originalStack = undefined;
    originalName = "StableError";
  } else {
    message = messageOrError.message;
    originalStack = messageOrError.stack;
    originalName = messageOrError.name;
  }

  const category = options.category || "general";
  const statusCode = options.statusCode || 500;
  const metadata = {
    ...options.metadata,
    ...(typeof messageOrError !== "string" && {
      originalName,
      originalStack,
    }),
  };
  const severity = options.severity || "medium";
  const timestamp = new Date().toISOString();

  const id = generateStableId(message, category, metadata);

  const error = new Error(message) as Error & ErrorJSON & { toJSON(): ErrorJSON };
  error.name = "StableError";
  error.id = id;
  error.category = category;
  error.metadata = metadata;
  error.severity = severity;
  error.timestamp = timestamp;
  error.statusCode = statusCode;

  if (originalStack) {
    error.stack = originalStack;
  }

  error.toJSON = function (): ErrorJSON {
    return {
      id: this.id,
      message: this.message,
      category: this.category,
      metadata: this.metadata,
      severity: this.severity,
      timestamp: this.timestamp,
      statusCode: this.statusCode,
      stack: this.stack,
    };
  };

  return error;
}
