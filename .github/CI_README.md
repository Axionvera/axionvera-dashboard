# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment. The pipeline runs on every pull request to ensure code quality, functionality, and performance.

## Workflows

### Main CI Pipeline (`.github/workflows/main.yml`)

Runs on: Pull requests to `main` branch

**Jobs:**

1. **Lint** - Code quality checks
   - ESLint for code style
   - TypeScript type checking
   
2. **Test** - Unit tests
   - Jest with React Testing Library
   - Coverage reporting
   
3. **E2E** - End-to-end tests
   - Playwright tests across Chromium, Firefox, and WebKit
   - Full application testing
   
4. **Visual** - Visual regression testing
   - Screenshot comparison
   - UI consistency checks
   
5. **Build** - Production build
   - Runs only if all tests pass
   - Validates deployability

### Docker Publish (`.github/workflows/docker-publish.yml`)

Runs on: Push to `main` branch

**Actions:**
- Builds Docker image
- Pushes to AWS ECR
- Tags with commit SHA and `latest`

## Environment Variables

All jobs use test environment variables from `.env.test`:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID=test-vault-contract-id
NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID=test-token-contract-id
```

## Local CI Simulation

To run the same checks locally:

```bash
# 1. Lint
npm run lint
npm run typecheck

# 2. Unit Tests
npm test

# 3. E2E Tests (requires build)
npm run test:e2e

# 4. Visual Tests
npm run test:visual

# 5. Build
npm run build
```

## Troubleshooting

### Build Failures

**Issue**: `validate-env.js` fails
- **Fix**: Ensure `.env` file exists with required variables
- **Command**: `cp .env.test .env`

**Issue**: Theme generation fails
- **Fix**: Check `src/tokens.json` exists
- **Command**: `npm run generate-theme`

### Test Failures

**Issue**: Playwright installation fails
- **Fix**: Install browsers manually
- **Command**: `npm run playwright:install`

**Issue**: Tests timeout
- **Fix**: Increase timeout in `playwright.config.ts`
- **Default**: 120 seconds for webServer

### Visual Test Failures

**Issue**: Screenshots don't match
- **Fix**: Update baseline screenshots
- **Command**: `npm run test:visual:update`

**Note**: Visual tests run only on Chromium for consistency

## CI Performance

**Typical run times:**
- Lint: ~1-2 minutes
- Test: ~2-3 minutes
- E2E: ~5-8 minutes
- Visual: ~3-5 minutes
- Build: ~2-3 minutes

**Total**: ~15-20 minutes

## Optimization Tips

1. **Parallel Jobs**: Lint, Test, E2E, and Visual run in parallel
2. **Caching**: npm dependencies are cached between runs
3. **Selective Browser Installation**: Only necessary browsers installed per job
4. **Artifacts**: Test reports and build files uploaded for debugging

## Required Secrets (for Docker workflow)

- `AWS_ROLE_ARN`: IAM role for ECR push access

## Artifacts

The pipeline generates several artifacts:

1. **Playwright Report** (E2E job)
   - HTML report with test results
   - Retention: 30 days

2. **Visual Test Results** (Visual job)
   - Screenshot diffs
   - Retention: 30 days

3. **Build Files** (Build job)
   - `.next/` directory
   - Retention: 1 day

## Status Checks

All jobs must pass for PR merge:
- ✅ Lint Code
- ✅ Run Tests  
- ✅ E2E Tests
- ✅ Visual Regression Tests
- ✅ Build Application

## Maintenance

### Updating Dependencies

When updating dependencies that affect CI:

1. Update `package.json`
2. Run `npm install` locally
3. Test all CI commands locally
4. Update this README if needed

### Updating Playwright

```bash
npm install -D @playwright/test@latest
npx playwright install --with-deps
```

### Node.js Version

Currently using: **Node.js 18**

To update, change in `.github/workflows/main.yml`:
```yaml
node-version: '18'  # Change this
```

## Contact

For CI/CD issues, contact the DevOps team or open an issue.
