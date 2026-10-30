# StableError

A TypeScript library for generating stable, consistent error IDs based on error messages. This library is designed for error tracking and monitoring, allowing teams to identify and group similar errors consistently.

## Features

- **Stable Error IDs**: Same error message + category + metadata = Same ID
- **Message Normalization**: Automatically normalizes variable parts (IDs, timestamps, UUIDs)
- **Metadata Filtering**: Only includes relevant metadata keys for ID generation
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Installation

```bash
npm install stable-error
```

The package is ESM only and requires Node.js 26 or later. Version 1.x remains available for CommonJS and for Node.js 25 or earlier. See [Migrating from 1.x](#migrating-from-1x).

## Quick Start

```typescript
import { createStableError } from "stable-error";

// Create a stable error
const error = createStableError("User not found", {
  category: "validation",
  metadata: { userId: 123, field: "email" },
});

console.log(error.id); // Always same for "User not found" + validation category
```

## Core Concepts

### Stable Error IDs

StableError generates consistent 8-character hexadecimal IDs based on:

- **Normalized message**: Variable parts (numbers, UUIDs, timestamps) are replaced with placeholders
- **Category**: Error grouping category
- **Filtered metadata**: Only specific metadata keys are used for ID generation

### Message Normalization

The library automatically normalizes error messages by:

- Converting to lowercase and trimming whitespace
- Replacing numbers with `NUMBER` placeholder
- Replacing UUIDs with `UUID` placeholder
- Replacing timestamps with `TIMESTAMP` or `TIMESTAMP_MS` placeholders
- Normalizing multiple spaces to single space

```typescript
// These all generate the same ID:
createStableError("User 123 not found", { category: "test" });
createStableError("User 456 not found", { category: "test" });
createStableError("USER 789 NOT FOUND", { category: "test" });
```

### Metadata Filtering

Only these metadata keys are used for stable ID generation:

- `type`
- `code`
- `field`
- `operation`
- `service`
- `component`

```typescript
// These generate the same ID (timestamp and userId are ignored):
createStableError("Error", {
  metadata: { field: "email", timestamp: "2023-01-01", userId: 123 },
});
createStableError("Error", {
  metadata: { field: "email", timestamp: "2023-12-31", userId: 456 },
});
```

## API Reference

### createStableError Function

#### Function Signature

```typescript
createStableError(messageOrError: string | Error, options?: StableErrorOptions): Error & ErrorJSON
```

**Parameters:**

- `messageOrError`: The error message (string) or existing Error object
- `options`: Optional configuration object

**Options:**

```typescript
type StableErrorOptions = {
  category?: string; // Default: 'general'
  metadata?: Metadata; // Default: {}
  statusCode?: number; // Default: 500
  severity?: ErrorSeverity; // Default: 'medium'
};
```

**Returns:**
An Error object with additional properties for stable error tracking.

#### Error Object Properties

The returned error object extends the standard Error with these additional properties:

```typescript
readonly id: string;                    // 8-character stable ID
readonly category: string;              // Error category
readonly metadata: Metadata;            // Error metadata
readonly statusCode: number;            // HTTP status code
readonly severity: ErrorSeverity;       // Error severity
readonly timestamp: string;             // ISO timestamp
```

#### Methods

##### `toJSON(): ErrorJSON`

Returns JSON representation of the error:

```typescript
const json = error.toJSON();
// {
//   id: "a1b2c3d4",
//   message: "User not found",
//   category: "validation",
//   metadata: { field: "email" },
//   statusCode: 400,
//   severity: "medium",
//   timestamp: "2023-01-01T10:00:00Z",
//   stack: "Error: User not found\n    at ..."
// }
```

#### Usage Examples

```typescript
import { createStableError } from "stable-error";

// Create from string message
const error1 = createStableError("User not found", {
  category: "validation",
  metadata: { field: "email" },
});

// Create from existing Error
try {
  // Some operation
} catch (err) {
  const stableError = createStableError(err, {
    category: "database",
    metadata: { operation: "user_lookup" },
  });
}
```

## Usage Examples

### Basic Error Tracking

```typescript
import { createStableError } from "stable-error";

// Create errors with consistent IDs
const error1 = createStableError("User 123 not found", {
  category: "validation",
  metadata: { field: "email" },
});

const error2 = createStableError("User 456 not found", {
  category: "validation",
  metadata: { field: "email" },
});

console.log(error1.id === error2.id); // true - same normalized message
```

### Error Conversion

```typescript
// Convert existing errors to stable errors
try {
  await someAsyncOperation();
} catch (error) {
  const stableError = createStableError(error, {
    category: "api",
    severity: "high",
    metadata: {
      endpoint: "/users",
      method: "GET",
    },
  });

  // Log or track the stable error
  console.log(`Error ID: ${stableError.id}`);
}
```

## Type Definitions

### ErrorSeverity

```typescript
type ErrorSeverity = "low" | "medium" | "high" | "critical";
```

### Metadata

```typescript
type Metadata = Record<string, unknown>;
```

### ErrorJSON

```typescript
type ErrorJSON = {
  id: string;
  message: string;
  category: string;
  metadata: Metadata;
  severity: ErrorSeverity;
  timestamp: string;
  statusCode: number;
  stack?: string | undefined;
};
```

## Requirements

- Node.js 26 or later
- An ESM loader or bundler. There is no CommonJS entry.

The published types ship with the package. TypeScript is not a peer dependency.

## Migrating from 1.x

`stable-error@1` exposed a CommonJS file at `dist/index.cjs.js` through `main`, and an ESM file through `module`. Version 2.0.0 publishes one ESM entry through `exports`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    }
  }
}
```

`createStableError` and the default export are unchanged.

Replace a CommonJS require with an ESM import:

```js
import { createStableError } from "stable-error";
```

A CommonJS file on Node.js 26 can load the same function asynchronously:

```js
const { createStableError } = await import("stable-error");
```

Stay on `stable-error@1` when you need a synchronous `require`, or when the process runs on Node.js 25 or earlier.

In TypeScript, set `moduleResolution` to `nodenext`, `node16`, or `bundler`. Delete imports of `dist/index.cjs.js`. You do not need to install TypeScript to use the published types.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `vp check` and `vp test`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
