# GitHub Actions Setup

This repository includes automated CI/CD workflows for building, testing, and publishing the `stable-error` package to npm.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- GitHub releases

**Jobs:**
- **Test**: Runs linting, tests, and builds the package
- **Publish**: Publishes to npm when a GitHub release is created
- **Publish Version**: Alternative publishing on version bump commits

### 2. Release Workflow (`release.yml`)

**Triggers:**
- Manual workflow dispatch

**Features:**
- Automated version bumping (patch, minor, major, prerelease)
- Changelog generation
- Git tag creation
- GitHub release creation
- npm publishing

## Setup Instructions

### 1. NPM Token Setup

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Go to "Access Tokens" in your account settings
3. Create a new "Automation" token
4. Copy the token
5. In your GitHub repository, go to Settings → Secrets and variables → Actions
6. Add a new repository secret named `NPM_TOKEN` with your npm token

### 2. GitHub Token

The `GITHUB_TOKEN` is automatically provided by GitHub Actions and doesn't need manual setup.

### 3. Repository Settings

Ensure your repository has the following settings:
- Actions are enabled
- The `main` branch is protected (optional but recommended)
- Required status checks are configured (optional)

## Usage

### Automatic Publishing

The package will be automatically published to npm when:
1. A GitHub release is created
2. A commit message contains `chore(release):` (for version bump publishing)

### Manual Release

To create a new release manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Release" workflow
3. Click "Run workflow"
4. Choose the version bump type:
   - `patch`: Bug fixes (1.0.0 → 1.0.1)
   - `minor`: New features (1.0.0 → 1.1.0)
   - `major`: Breaking changes (1.0.0 → 2.0.0)
   - `prerelease`: Pre-release version (1.0.0 → 1.0.1-0)

### Local Development

Before pushing changes, ensure:
- All tests pass: `bun test`
- Code is linted: `bun run lint`
- Package builds successfully: `bun run build`

## Workflow Details

### Build Process

The build process uses Bun and includes:
1. TypeScript compilation for type definitions
2. ESM build for modern environments
3. CommonJS build for Node.js compatibility
4. Source maps and declaration maps

### Test Process

Tests are run using Bun's built-in test runner and include:
- Unit tests for all exported functions
- Error handling tests
- Type safety tests

### Publishing Process

The publishing process:
1. Builds the package
2. Validates build artifacts
3. Publishes to npm using the automation token
4. Creates a GitHub release with changelog

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all dependencies are properly installed
2. **Tests fail**: Ensure all tests pass locally before pushing
3. **Publishing fails**: Verify the NPM_TOKEN secret is correctly set
4. **Version conflicts**: Ensure the version in package.json doesn't already exist on npm

### Debugging

- Check the Actions tab for detailed logs
- Verify secrets are properly configured
- Ensure the package name is available on npm
- Check that the repository has the correct permissions

## Security

- The NPM_TOKEN is stored as a repository secret
- Tokens are only used during the publishing process
- All workflows run in isolated environments
- No sensitive data is logged or exposed
