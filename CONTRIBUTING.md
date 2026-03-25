# Contributing to Axionvera Dashboard

Thanks for contributing! This repo is designed to be modular and easy to extend.

## Development Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`

## Branch Naming Convention

To keep the repository organized, please use the following prefix for your branches:

- `feat/` - New features or major enhancements (e.g., `feat/add-staking-view`)
- `fix/` - Bug fixes (e.g., `fix/wallet-connection-timeout`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code changes that neither fix a bug nor add a feature
- `chore/` - Maintenance tasks, library updates, etc. (e.g., `chore/update-deps`)

## Quality Checks

Run these before opening a PR:

```bash
npm run lint
npm run typecheck
npm run test
```

## Project Conventions

- Components live in `src/components` and are kept presentational when possible.
- Contract and SDK integration should go through `src/hooks/useVault.ts`.
- Wallet integration should go through `src/hooks/useWallet.ts`.
- Network and contract configuration lives in `src/utils/networkConfig.ts`.

## Pull Requests

- **Branch out**: Always create a new branch from `main`.
- **Commit Messages**: Write clear, descriptive commit messages.
- **Keep it focused**: Keep PRs focused and small when possible.
- **Testing**: Include tests for new behavior (UI or hooks).
- **Dependencies**: Avoid introducing new dependencies unless necessary.

## Reporting Security Issues

Please do not open a public issue for security vulnerabilities. Contact the maintainers privately.

