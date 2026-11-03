# Contributing

## Setup

Install [Vite+](https://viteplus.dev) once (`curl -fsSL https://vite.plus | bash`), then:

```sh
vp install        # dependencies and git hooks
```

The git hooks run on every commit (format, lint, secrets on staged files; commit message), and before every push (full check, tests, dead code, duplication). Do not bypass them with `--no-verify`: CI runs the same gates.

## Branches

- `canary` is the default branch. **Every pull request targets `canary`.**
- `main` is production. It only receives the release pull request (`canary` → `main`), merged by the maintainer.
- Branch from `origin/canary` as `<type>/<short-name>` (`feat/`, `fix/`, `docs/`, `chore/`, `ci/`, `build/`, `refactor/`, `test/`).
- Rebasing your branch onto `canary` is fine. Pull requests are merged with a **merge commit**: squash and rebase merging are disabled.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), present tense, written for the reader of the history: `fix: keep the focus ring on the search field`. The `commit-msg` hook checks the format.

## Changesets

Every user-facing pull request adds a changeset:

```sh
vp exec changeset
```

Pick the bump (`patch`, `minor`, `major`) and write a summary for a user of the project, at least 20 characters. Internal pull requests do not need one: their title starts with `ci`, `build`, `test`, `docs` or `chore` (but `chore(deps)` does, since a runtime dependency update reaches users).

## Pull requests

- One change per pull request, small enough to review.
- The description says what changed, why, and how it was checked (commands and their real output).
- The quality report is posted on the pull request. Fix what it finds in the project; the shared configuration only changes when a rule is wrong for every project ([quality-gate](https://github.com/maximeshr/quality-gate)).

## Releases

Releases are automatic. Each push to `canary` opens or updates the `canary` → `main` release pull request with the release notes. Merging it versions the project, updates `CHANGELOG.md`, tags it, creates the GitHub release, and publishes it when it is a package. Never edit a version or push a tag by hand.
