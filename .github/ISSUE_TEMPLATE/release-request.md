---
name: Release Request
about: Request a release of stable-error through Changesets
title: "Release Request: [VERSION_TYPE]"
labels: "release"
assignees: ""
---

## Release Information

**Version Type:**

- [ ] Patch (bug fixes)
- [ ] Minor (new features)
- [ ] Major (breaking changes)

**Current Version:** `[CURRENT_VERSION]`
**Target Version:** `[TARGET_VERSION]`

## Changes Summary

### Features

- [ ] List new features here

### Bug Fixes

- [ ] List bug fixes here

### Breaking Changes

- [ ] List breaking changes here (if any)

## Checklist

- [ ] `vp check` passes
- [ ] `vp test` passes
- [ ] A changeset exists under `.changeset/`
- [ ] The changelog notes describe what consumers must do

## Release Process

Add a changeset with `vp exec changeset`. The Release workflow on `main` opens the version pull request and, after that pull request merges, publishes to npm with trusted publishing.

Do not bump `version` in `package.json` by hand. Do not create a GitHub release by hand.
