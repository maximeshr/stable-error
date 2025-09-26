---
name: Release Request
about: Request a new release of the stable-error package
title: 'Release Request: [VERSION_TYPE]'
labels: 'release'
assignees: ''
---

## Release Information

**Version Type:** 
- [ ] Patch (bug fixes)
- [ ] Minor (new features)
- [ ] Major (breaking changes)
- [ ] Prerelease (beta/alpha)

**Current Version:** `[CURRENT_VERSION]`
**Target Version:** `[TARGET_VERSION]`

## Changes Summary

### Features
- [ ] List new features here

### Bug Fixes
- [ ] List bug fixes here

### Breaking Changes
- [ ] List breaking changes here (if any)

### Other Changes
- [ ] List other changes here

## Checklist

- [ ] All tests are passing
- [ ] Code has been linted
- [ ] Documentation has been updated (if needed)
- [ ] Changelog has been updated
- [ ] Version has been bumped in package.json
- [ ] Ready for release

## Additional Notes

<!-- Add any additional notes or context here -->

## Release Process

Once this issue is approved, the release can be triggered by:

1. **Manual Release**: Go to Actions → Release workflow → Run workflow
2. **Automatic Release**: Create a GitHub release with the appropriate tag

The release process will:
- Run all tests and linting
- Build the package
- Publish to npm
- Create a GitHub release
- Generate changelog
