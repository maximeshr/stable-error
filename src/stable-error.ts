/**
 * Types for StableError
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

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

/**
 * Utility functions for StableError
 */

/**
 * Normalizes an error message by replacing variable parts with placeholders
 */
export function normalizeMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  let normalized = message.toLowerCase().trim();

  // Replace common variable patterns with placeholders (order matters!)
  normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID');
  normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/gi, 'TIMESTAMP');
  normalized = normalized.replace(/\b\d{13}\b/g, 'TIMESTAMP_MS'); // Must come before NUMBER
  normalized = normalized.replace(/\b\d+\b/g, 'NUMBER');
  
  // Normalize multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Filters metadata to only include stable keys for ID generation
 */
export function filterMetadata(metadata: Metadata): Metadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const allowedKeys = new Set(['type', 'code', 'field', 'operation', 'service', 'component']);
  const filtered: Metadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (allowedKeys.has(key) && value !== undefined && value !== null) {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Generates a stable error ID from message, category, and metadata
 */
export function generateStableId(
  message: string,
  category: string,
  metadata: Metadata
): string {
  // Create stable string representation
  const parts = [
    `message:${normalizeMessage(message)}`,
    `category:${(category || '').toLowerCase().trim()}`,
  ];

  // Add filtered metadata (sorted keys for consistency)
  const filtered = filterMetadata(metadata);
  const sortedKeys = Object.keys(filtered).sort();

  if (sortedKeys.length > 0) {
    const metadataParts = sortedKeys.map(key => 
      `${key}:${String(filtered[key]).toLowerCase().trim()}`
    );
    parts.push(`metadata:${metadataParts.join(',')}`);
  }

  const stableString = parts.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < stableString.length; i++) {
    const char = stableString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return first 8 characters as hex
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Creates a stable error object with consistent error ID
 * Same error message + category + metadata = Same ID
 * Can accept either a string message or an existing Error object
 */
export function createStableError(
  messageOrError: string | Error, 
  options: StableErrorOptions = {}
): Error & ErrorJSON & { toJSON(): ErrorJSON } {
  let message: string;
  let originalStack: string | undefined;
  let originalName: string;

  if (typeof messageOrError === 'string') {
    message = messageOrError;
    originalStack = undefined;
    originalName = 'StableError';
  } else {
    message = messageOrError.message;
    originalStack = messageOrError.stack;
    originalName = messageOrError.name;
  }

  const category = options.category || 'general';
  const statusCode = options.statusCode || 500;
  const metadata = {
    ...options.metadata,
    ...(typeof messageOrError !== 'string' && {
      originalName,
      originalStack
    })
  };
  const severity = options.severity || 'medium';
  const timestamp = new Date().toISOString();
  
  // Generate stable ID
  const id = generateStableId(message, category, metadata);

  // Create error object
  const error = new Error(message) as Error & ErrorJSON & { toJSON(): ErrorJSON };
  error.name = 'StableError';
  error.id = id;
  error.category = category;
  error.metadata = metadata;
  error.severity = severity;
  error.timestamp = timestamp;
  error.statusCode = statusCode;

  // Preserve original stack if available
  if (originalStack) {
    error.stack = originalStack;
  }

  // Add toJSON method
  error.toJSON = function(): ErrorJSON {
    return {
      id: this.id,
      message: this.message,
      category: this.category,
      metadata: this.metadata,
      severity: this.severity,
      timestamp: this.timestamp,
      statusCode: this.statusCode,
      stack: this.stack
    };
  };

  return error;
}
