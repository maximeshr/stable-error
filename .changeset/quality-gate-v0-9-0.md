---
"stable-error": patch
---

`createStableError` is now declared as a `const` arrow function and `toJSON` as a property in the type declarations. Calls, arguments and return types are unchanged, and generated IDs are identical; only calling `createStableError` with `new`, which was never documented, now throws.
