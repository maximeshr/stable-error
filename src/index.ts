/**
 * stable-error
 * 
 * A TypeScript library for generating stable, consistent error IDs based on error messages.
 * This library is designed for error tracking and dashboard analytics, allowing teams to 
 * monitor error frequency and patterns over time.
 * 
 * @example
 * ```typescript
 * import { createStableError } from 'stable-error';
 * 
 * const error = createStableError('User not found', {
 *   category: 'validation',
 *   metadata: { userId: 123, field: 'email' }
 * });
 * 
 * console.log(error.id); // Always same for "User not found" + validation category
 * ```
 */

// Only export the public API
export { createStableError } from './stable-error.js';

// Export types for TypeScript users
export type { 
  StableErrorOptions, 
  ErrorJSON, 
  ErrorSeverity,
  Metadata
} from './stable-error.js';

// Default export
import { createStableError } from './stable-error.js';
export default createStableError;