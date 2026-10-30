# GitHub Actions

## CI

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`.

The job installs the Vite+ toolchain, then runs `vp check`, `vp run check:version`, `vp test`, and `vp pack` on Ubuntu, macOS, and Windows. Node.js is 26. Ubuntu also runs `pnpm audit --audit-level=high`.

Windows is `continue-on-error`, matching the other packages on this stack. A Windows failure is reported and does not block the pull request.

## Audit

`.github/workflows/audit.yml` runs `pnpm audit --audit-level=high` every Monday. Dependabot does not raise security alerts for a pnpm 12 lockfile, so this schedule is the check between pull requests.

## Release

`.github/workflows/release.yml` runs on every push to `main`. Changesets opens a version pull request when `.changeset/` has a pending change. Merging that pull request publishes to npm with trusted publishing (OIDC `id-token: write` and provenance).

There is no `NPM_TOKEN` secret and no GitHub environment on this workflow.

To prepare a release, add a changeset with `vp exec changeset`. Do not edit `version` in `package.json` by hand.
