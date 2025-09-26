/**
 * Basic Usage Examples for StableError
 * 
 * This file demonstrates the core functionality of the StableError library
 * including creating errors, generating stable IDs, and basic error handling.
 */

import { createStableError } from '../index.js';

console.log('=== Basic StableError Usage Examples ===\n');

// Example 1: Basic error creation
console.log('1. Basic Error Creation:');
const basicError = createStableError('User not found');
console.log('Error ID:', basicError.id);
console.log('Message:', basicError.message);
console.log('Category:', basicError.category);
console.log('Severity:', basicError.severity);
console.log('Timestamp:', basicError.timestamp);
console.log();

// Example 2: Error with custom options
console.log('2. Error with Custom Options:');
const customError = createStableError('Database connection failed', {
  category: 'database',
  metadata: { 
    host: 'localhost',
    port: 5432,
    operation: 'connect'
  },
  statusCode: 503,
  severity: 'high'
});
console.log('Error ID:', customError.id);
console.log('Category:', customError.category);
console.log('Metadata:', customError.metadata);
console.log('Status Code:', customError.statusCode);
console.log('Severity:', customError.severity);
console.log();

// Example 3: Stable ID generation
console.log('3. Stable ID Generation:');
const error1 = createStableError('User 123 not found', {
  category: 'validation',
  metadata: { field: 'email' }
});
const error2 = createStableError('User 456 not found', {
  category: 'validation',
  metadata: { field: 'email' }
});
const error3 = createStableError('User 123 not found', {
  category: 'validation',
  metadata: { field: 'email' }
});

console.log('Error 1 ID:', error1.id);
console.log('Error 2 ID:', error2.id);
console.log('Error 3 ID:', error3.id);
console.log('Error 1 and 2 have same ID (normalized numbers):', error1.id === error2.id);
console.log('Error 1 and 3 have same ID (identical):', error1.id === error3.id);
console.log();

// Example 4: Message normalization
console.log('4. Message Normalization:');
const messages = [
  'User 123 not found',
  'User 456 not found',
  'USER 789 NOT FOUND',
  '  User   999   not   found  '
];

const normalizedErrors = messages.map(msg => createStableError(msg, { category: 'test' }));
console.log('All messages normalized to same ID:', 
  normalizedErrors.every(error => error.id === normalizedErrors[0]!.id));
console.log('Normalized IDs:', normalizedErrors.map(e => e.id));
console.log();

// Example 5: UUID normalization
console.log('5. UUID Normalization:');
const uuidMessages = [
  'User 550e8400-e29b-41d4-a716-446655440000 not found',
  'User 6ba7b810-9dad-11d1-80b4-00c04fd430c8 not found',
  'User 123e4567-e89b-12d3-a456-426614174000 not found'
];

const uuidErrors = uuidMessages.map(msg => createStableError(msg, { category: 'test' }));
console.log('All UUID messages normalized to same ID:', 
  uuidErrors.every(error => error.id === uuidErrors[0]!.id));
console.log('Normalized IDs:', uuidErrors.map(e => e.id));
console.log();

// Example 6: Timestamp normalization
console.log('6. Timestamp Normalization:');
const timestampMessages = [
  'Error at 2023-01-01T10:00:00Z',
  'Error at 2023-12-31T23:59:59Z',
  'Error at 1672531200000',
  'Error at 1704067199999'
];

const timestampErrors = timestampMessages.map(msg => createStableError(msg, { category: 'test' }));
console.log('All timestamp messages normalized to same ID:', 
  timestampErrors.every(error => error.id === timestampErrors[0]!.id));
console.log('Normalized IDs:', timestampErrors.map(e => e.id));
console.log();

// Example 7: Metadata filtering
console.log('7. Metadata Filtering:');
const metadata1 = {
  field: 'email',
  type: 'validation',
  timestamp: '2023-01-01T10:00:00Z', // Not allowed for ID generation
  userId: 123, // Not allowed for ID generation
  sessionId: 'abc123' // Not allowed for ID generation
};

const metadata2 = {
  field: 'email',
  type: 'validation',
  timestamp: '2023-12-31T23:59:59Z', // Different timestamp
  userId: 456, // Different user ID
  sessionId: 'xyz789' // Different session ID
};

const metaError1 = createStableError('Test error', { category: 'test', metadata: metadata1 });
const metaError2 = createStableError('Test error', { category: 'test', metadata: metadata2 });

console.log('Errors with different non-allowed metadata have same ID:', 
  metaError1.id === metaError2.id);
console.log('Error 1 ID:', metaError1.id);
console.log('Error 2 ID:', metaError2.id);
console.log();

// Example 8: Error conversion
console.log('8. Error Conversion:');
try {
  throw new Error('Original error message');
} catch (originalError) {
  const stableError = createStableError(originalError as Error, {
    category: 'conversion',
    severity: 'medium',
    metadata: { source: 'try-catch' }
  });
  
  console.log('Original error name:', (originalError as Error).name);
  console.log('Stable error name:', stableError.name);
  console.log('Stable error message:', stableError.message);
  console.log('Stable error category:', stableError.category);
  console.log('Stable error metadata:', stableError.metadata);
  console.log('Has original stack:', !!(stableError.metadata as any).originalStack);
}
console.log();

// Example 8b: Using createStableError with Error object
console.log('8b. Using createStableError with Error object:');
try {
  throw new Error('Another error message');
} catch (originalError) {
  const stableError = createStableError(originalError as Error, {
    category: 'convenience',
    severity: 'low',
    metadata: { source: 'fromError' }
  });
  
  console.log('Using createStableError with Error:');
  console.log('Stable error ID:', stableError.id);
  console.log('Stable error message:', stableError.message);
  console.log('Stable error category:', stableError.category);
  console.log('Stable error severity:', stableError.severity);
}
console.log();

// Example 9: JSON serialization
console.log('9. JSON Serialization:');
const jsonError = createStableError('JSON test error', {
  category: 'serialization',
  metadata: { test: true, count: 42 }
});

const json = jsonError.toJSON();
console.log('JSON representation:');
console.log(JSON.stringify(json, null, 2));
console.log();


console.log('=== Basic Usage Examples Complete ===');
