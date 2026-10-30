# stable-error

## 2.0.0

### Major Changes

The package is ESM only and requires Node.js 26 or later.

- ESM only. There is no CommonJS build.
- The public entry is `exports`, with `import` and `types`. `main` and `module` are removed.
- Node.js must be 26 or newer. Node.js 14 through 25 are not supported.
- TypeScript is no longer a peer dependency. The published package ships its own types.

`createStableError` and the default export are unchanged.

### Migrating from CommonJS

`stable-error@1` resolved `require("stable-error")` to `dist/index.cjs.js`. Version 2.0.0 has no `require` condition.

In an ESM program:

```js
import { createStableError } from "stable-error";
```

In a CommonJS file on Node.js 26, load the same function with a dynamic import:

```js
const { createStableError } = await import("stable-error");
```

Stay on `stable-error@1` when the program must keep a synchronous `require` or run on Node.js 25 or earlier.

Set TypeScript `moduleResolution` to `nodenext`, `node16`, or `bundler`. Delete imports of `dist/index.cjs.js`. You do not need to install TypeScript to use the published types.

## 1.0.0

Initial published release.
