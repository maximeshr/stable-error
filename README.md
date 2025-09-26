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
# or
yarn add stable-error
# or
bun add stable-error
```

## Quick Start

```typescript
import { createStableError } from 'stable-error';

// Create a stable error
const error = createStableError('User not found', {
  category: 'validation',
  metadata: { userId: 123, field: 'email' }
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
createStableError('User 123 not found', { category: 'test' });
createStableError('User 456 not found', { category: 'test' });
createStableError('USER 789 NOT FOUND', { category: 'test' });
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
createStableError('Error', { 
  metadata: { field: 'email', timestamp: '2023-01-01', userId: 123 }
});
createStableError('Error', { 
  metadata: { field: 'email', timestamp: '2023-12-31', userId: 456 }
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
interface StableErrorOptions {
  category?: string;           // Default: 'general'
  metadata?: Metadata;         // Default: {}
  statusCode?: number;         // Default: 500
  severity?: ErrorSeverity;    // Default: 'medium'
}
```

**Returns:**
An Error object with additional properties for stable error tracking.

#### Error Object Properties

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
import { createStableError } from 'stable-error';

// Create from string message
const error1 = createStableError('User not found', {
  category: 'validation',
  metadata: { field: 'email' }
});

// Create from existing Error
try {
  // Some operation
} catch (err) {
  const stableError = createStableError(err, {
    category: 'database',
    metadata: { operation: 'user_lookup' }
  });
}
```

## Usage Examples

### Basic Error Tracking

```typescript
import { createStableError } from 'stable-error';

// Create errors with consistent IDs
const error1 = createStableError('User 123 not found', {
  category: 'validation',
  metadata: { field: 'email' }
});

const error2 = createStableError('User 456 not found', {
  category: 'validation', 
  metadata: { field: 'email' }
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
    category: 'api',
    severity: 'high',
    metadata: { 
      endpoint: '/users',
      method: 'GET'
    }
  });
  
  // Log or track the stable error
  console.log(`Error ID: ${stableError.id}`);
}
```

### Error Monitoring

```typescript
class ErrorMonitor {
  private errors: Array<Error & { id: string; severity: string }> = [];
  
  addError(error: Error & { id: string; severity: string }) {
    this.errors.push(error);
    
    // Check for alert conditions
    if (error.severity === 'critical') {
      this.sendAlert(error);
    }
  }
  
  getErrorStats() {
    const errorCounts = new Map<string, number>();
    
    for (const error of this.errors) {
      const count = errorCounts.get(error.id) || 0;
      errorCounts.set(error.id, count + 1);
    }
    
    return errorCounts;
  }
  
  private sendAlert(error: Error & { id: string }) {
    console.log(`🚨 CRITICAL ERROR: ${error.message} (ID: ${error.id})`);
  }
}
```

## Type Definitions

### ErrorSeverity
```typescript
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
```

### Metadata
```typescript
type Metadata = Record<string, unknown>;
```

### ErrorJSON
```typescript
interface ErrorJSON {
  id: string;
  message: string;
  category: string;
  metadata: Metadata;
  severity: ErrorSeverity;
  timestamp: string;
  statusCode: number;
  stack?: string | undefined;
}
```

## Performance

- **ID Generation**: < 1ms per error
- **Memory Efficient**: Optimized for high-volume error tracking
- **Scalable**: Handles thousands of errors efficiently

## Browser Compatibility

- Modern browsers (ES2018+)
- Node.js 14+
- TypeScript 4.5+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### 1.0.0
- Initial release
- Core StableError functionality
- Message normalization
- Metadata filtering
- Error conversion utilities
- Comprehensive TypeScript support