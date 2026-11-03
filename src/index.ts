export { createStableError } from "./stable-error.ts";

export type { StableErrorOptions, ErrorJSON, ErrorSeverity, Metadata } from "./stable-error.ts";

import { createStableError } from "./stable-error.ts";
/**
 * Default export kept for compatibility: same function as the named export.
 * @alias
 */
export default createStableError;
