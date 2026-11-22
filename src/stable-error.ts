export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- public API: callers attach arbitrary context, and filterMetadata keeps only known keys before hashing
export type Metadata = Record<string, unknown>;

// oxlint-disable-next-line typescript/consistent-type-definitions -- public API: an interface has no implicit index signature, so callers assigning it to Record<string, unknown> would stop compiling
export type StableErrorOptions = {
  category?: string;
  // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- public API, see Metadata
  metadata?: Metadata;
  severity?: ErrorSeverity;
  statusCode?: number;
};

// oxlint-disable-next-line typescript/consistent-type-definitions -- public API: an interface has no implicit index signature, so callers assigning it to Record<string, unknown> would stop compiling
export type ErrorJSON = {
  id: string;
  message: string;
  category: string;
  // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- public API, see Metadata
  metadata: Metadata;
  severity: ErrorSeverity;
  timestamp: string;
  statusCode: number;
  stack?: string | undefined;
};

type MessageReplacement = readonly [RegExp, string];

const ALLOWED_METADATA_KEYS = new Set([
  "type",
  "code",
  "field",
  "operation",
  "service",
  "component",
]);

const isNonEmptyString = (value: string | undefined): value is string =>
  typeof value === "string" && value !== "";

const isMetadataObject = (value: Metadata | undefined): value is Metadata =>
  typeof value === "object" && value !== null;

const isMessageText = (messageOrError: string | Error): messageOrError is string =>
  typeof messageOrError === "string";

/**
 * Every falsy value takes the fallback, not only `null` and `undefined`: an empty category or a
 * zero status code has always fallen back to the default
 */
const orDefault = <T>(value: T | undefined, fallback: T): T =>
  // oxlint-disable-next-line typescript/prefer-nullish-coalescing, typescript/strict-boolean-expressions -- falsy values must take the default too; `??` would change IDs and status codes
  value || fallback;

export const normalizeMessage = (message: string): string => {
  if (!isNonEmptyString(message)) {
    return "";
  }

  const messageReplacements: readonly MessageReplacement[] = [
    [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "UUID"],
    [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?/giu, "TIMESTAMP"],
    [/\b\d{13}\b/gu, "TIMESTAMP_MS"],
    [/\b\d+\b/gu, "NUMBER"],
  ];

  let normalized = message.toLowerCase().trim();

  for (const [pattern, placeholder] of messageReplacements) {
    normalized = normalized.replace(pattern, placeholder);
  }

  return normalized.replaceAll(/\s+/gu, " ");
};

export const filterMetadata = (metadata: Metadata): Metadata => {
  if (!isMetadataObject(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) => ALLOWED_METADATA_KEYS.has(key) && value !== undefined && value !== null,
    ),
  );
};

export const generateStableId = (message: string, category: string, metadata: Metadata): string => {
  const parts = [
    `message:${normalizeMessage(message)}`,
    `category:${(category || "").toLowerCase().trim()}`,
  ];

  const filtered = filterMetadata(metadata);
  const sortedKeys = Object.keys(filtered).toSorted();

  if (sortedKeys.length > 0) {
    const metadataParts = sortedKeys.map(
      (key) => `${key}:${String(filtered[key]).toLowerCase().trim()}`,
    );

    parts.push(`metadata:${metadataParts.join(",")}`);
  }

  const stableString = parts.join("|");

  let hash = 0;

  for (let index = 0; index < stableString.length; index += 1) {
    // oxlint-disable-next-line no-bitwise, unicorn/prefer-math-trunc, unicorn/prefer-code-point -- published IDs are a 32-bit hash of UTF-16 code units: `| 0` wraps to int32 where Math.trunc does not, and codePointAt would change IDs of astral characters
    hash = ((hash << 5) - hash + stableString.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(16).padStart(8, "0");
};

/**
 * Creates a stable error object with consistent error ID
 * Same error message + category + metadata = Same ID
 * Can accept either a string message or an existing Error object
 */
export const createStableError = (
  messageOrError: string | Error,
  options: StableErrorOptions = {},
): Error & ErrorJSON & { toJSON: () => ErrorJSON } => {
  const {
    message,
    stack: originalStack,
    name: originalName,
  } = isMessageText(messageOrError)
    ? { message: messageOrError, stack: undefined, name: "StableError" }
    : messageOrError;

  const category = orDefault(options.category, "general");
  const statusCode = orDefault(options.statusCode, 500);

  const metadata = {
    ...options.metadata,
    ...(!isMessageText(messageOrError) && {
      originalName,
      originalStack,
    }),
  };

  const severity = orDefault(options.severity, "medium");
  const timestamp = new Date().toISOString();

  const id = generateStableId(message, category, metadata);

  const error = Object.assign(new Error(message), {
    name: "StableError",
    id,
    category,
    metadata,
    severity,
    timestamp,
    statusCode,
    toJSON(this: ErrorJSON): ErrorJSON {
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
    },
  });

  if (isNonEmptyString(originalStack)) {
    error.stack = originalStack;
  }

  return error;
};
