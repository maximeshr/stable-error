// Checks the tarball that npm will receive, not the sources: publint for
// package.json and published files, attw for the types consumers resolve.
// tsdown (0.x) and the TypeScript 7 declaration emit have no stable API yet;
// this guard stops a toolchain regression before it reaches npm.
// Run after `vp pack`.
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publint } from "publint";
import { formatMessage } from "publint/utils";

// Windows resolves pnpm and attw through .cmd shims, which need a shell.
const shell = process.platform === "win32";
const dir = await mkdtemp(join(tmpdir(), "stable-error-pack-"));
try {
  // `npm pack` refuses to run here: devEngines pins pnpm.
  execFileSync("pnpm", ["pack", "--pack-destination", dir], { stdio: "ignore", shell });
  const [name] = await readdir(dir);
  if (!name) throw new Error("pnpm pack produced no tarball");
  const file = join(dir, name);

  const tarball = await readFile(file);
  const { messages, pkg } = await publint({
    pack: {
      tarball: tarball.buffer.slice(tarball.byteOffset, tarball.byteOffset + tarball.length),
    },
    strict: true,
  });
  for (const message of messages)
    console.error(`publint ${message.type}: ${formatMessage(message, pkg)}`);
  if (messages.length > 0) process.exitCode = 1;
  else console.log("publint: no issues");

  // The package is ESM only: CommonJS consumers load it with import().
  execFileSync("attw", [file, "--profile", "esm-only", "--format", "table-flipped"], {
    stdio: "inherit",
    shell,
  });
} finally {
  await rm(dir, { recursive: true, force: true });
}
