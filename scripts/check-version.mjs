// Versions are bumped by changesets only. The version in package.json must
// either be published already, or come from `changeset version`, which adds
// its heading to CHANGELOG.md. A hand-edited version has neither and fails.
import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const { name, version } = pkg;

const changelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8").catch(
  (error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  },
);
if (changelog.split("\n").includes(`## ${version}`)) process.exit(0);

const response = await fetch(`https://registry.npmjs.org/${name}/${version}`);
if (response.ok) process.exit(0);
if (response.status !== 404) {
  throw new Error(`npm registry answered ${response.status} for ${name}@${version}`);
}

console.error(
  `${name}@${version} is neither published nor in CHANGELOG.md.\n` +
    "Do not edit the version or create release tags by hand: add a changeset with\n" +
    "`vp exec changeset`, and the Release workflow opens the version pull request.",
);
process.exit(1);
