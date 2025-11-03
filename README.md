# edp5-actions

Reusable GitHub Actions for the edp5 organization.

## Overview

This repository contains composite GitHub Actions designed to streamline common workflows in the edp5 organization, including:
- Automated pull request merging
- Pull request title validation
- Automated releases and changelog generation

## Available Actions

### 1. Auto Merge (`auto-merge`)

Automatically merges pull requests with the 'Ready to merge' or 'Auto merge' label if they are not drafts.

**Features:**
- Rebases the branch before merging
- Enables auto-merge with squash strategy
- Automatically approves pull requests from Dependabot

**Usage:**

```yaml
name: Auto merge
on:
  pull_request:
    branches:
      - main
    types:
      - labeled
      - unlabeled
      - reopened
      - synchronize

jobs:
  auto-merge:
    if: (contains(github.event.pull_request.labels.*.name, 'Ready to merge') && github.event.pull_request.draft == false) || (contains(github.event.pull_request.labels.*.name, 'Auto merge') && github.event.pull_request.draft == false)
    runs-on: ubuntu-latest
    steps:
      - uses: edp5/edp5-actions/auto-merge@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

**Inputs:**
- `token` (required): GitHub token with repo permissions

### 2. PR Title Check (`pr-title-check`)

Validates that pull request titles follow the conventional commit format.

**Accepted formats:**
- `fix:` - Bug fixes
- `feat:` - New features
- `tech:` - Technical changes
- `docs:` - Documentation changes
- `bump:` - Dependency updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements
- `test:` - Test changes
- `revert:` - Reverts
- `breaking:` - Breaking changes

Optionally, a scope can be included in parentheses: `feat(scope): description`

**Usage:**

```yaml
name: PR Title Check
on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - reopened
      - synchronize
      - edited

jobs:
  pr-title-check:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    steps:
      - uses: edp5/edp5-actions/pr-title-check@main
```

### 3. Release (`release`)

Generates a changelog and releases the repository using semantic-release.

**Features:**
- Automatic versioning based on conventional commits
- Changelog generation
- Git tag creation
- GitHub release creation

**Usage:**

```yaml
name: Release
on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: edp5/edp5-actions/release@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

**Inputs:**
- `token` (required): GitHub token with repo permissions

## Contributing

We welcome contributions to improve these actions! Please follow the guidelines below.

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/edp5/edp5-actions.git
cd edp5-actions
```

2. **Install dependencies**

```bash
npm install
```

3. **Run tests**

```bash
npm test
```

4. **Run linter**

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

### Creating a New Action

Use the provided script to scaffold a new action:

```bash
npm run add-action -- --name=my-action --description="My action description"
```

This will:
1. Create a new directory with the action name
2. Generate an `action.yml` file from the template
3. Set up the basic structure for your action

After creating the action, edit the generated `action.yml` file to add your specific steps and logic.

### Development Workflow

1. **Create a new branch** for your changes:
   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make your changes** and ensure they follow the project's coding standards

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes** using conventional commit format:
   ```bash
   git commit -m "feat: add new feature"
   ```
   
   See the [PR Title Check](#2-pr-title-check-pr-title-check) section for valid commit prefixes.

5. **Push your branch** and create a pull request:
   ```bash
   git push origin feat/my-new-feature
   ```

6. **Ensure your PR title** follows the conventional commit format (the PR title check will validate this)

### Pull Request Guidelines

- **Title**: Must follow conventional commit format (e.g., `feat: add new action`, `fix: resolve merge issue`)
- **Description**: Clearly describe what changes you've made and why
- **Tests**: Add or update tests for your changes
- **Documentation**: Update the README if you're adding or modifying actions
- **Linting**: Ensure `npm run lint` passes without errors
- **Draft PRs**: Mark your PR as draft while it's in progress

### Auto-Merge Workflow

Once your PR is ready:
1. Ensure all CI checks pass
2. Get the required approvals
3. Add the `Ready to merge` or `Auto merge` label to your PR
4. The auto-merge workflow will automatically merge your PR

For Dependabot PRs, the auto-merge workflow will also automatically approve them.

### Release Process

Releases are automated using semantic-release:
- When commits are merged to the `main` branch, the release workflow analyzes the commit messages
- Based on the conventional commit types, it determines the next version number
- A new release is created with an updated changelog
- The version is bumped in `package.json`

### Code Style

- Follow the existing code style in the repository
- Use ESLint configuration provided in `eslint.config.js`
- Write clear, descriptive variable and function names
- Add comments for complex logic

### Testing

- Write tests for new functionality
- Ensure existing tests continue to pass
- Tests are located in `script/__tests__/` directory
- We use Vitest as our testing framework

## License

ISC

## Support

For issues, questions, or contributions, please open an issue in the [GitHub repository](https://github.com/edp5/edp5-actions/issues).
