---
"stable-error": major
---

Publish the package as ESM only and require Node.js 22.12 or later.

Breaks from 1.0.0:

- ESM only. The CommonJS build is not published.
- The public entry is `exports`, with `import` and `types`. `main` and `module` are removed.
- Node.js must be 22.12 or newer. Node.js 14 through 22.11 are not supported.
- TypeScript is no longer a peer dependency. The package ships its own types.

`createStableError` and the default export stay the same.

CommonJS callers replace `require("stable-error")` with an ESM import:

```js
import { createStableError } from "stable-error";
```

A CommonJS file on Node.js 22.12 or later can load the same function with a dynamic import:

```js
const { createStableError } = await import("stable-error");
```

Set TypeScript `moduleResolution` to `nodenext`, `node16`, or `bundler`, and delete imports of `dist/index.cjs.js`. Stay on `stable-error@1` when the program must keep a synchronous `require` or run on Node.js 22.11 or earlier.
