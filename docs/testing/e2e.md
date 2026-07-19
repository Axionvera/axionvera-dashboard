# End-to-End Testing

Axionvera uses Playwright to cover browser-level dashboard workflows that unit tests cannot exercise safely. The functional E2E suite lives in `tests/e2e/` and runs with `playwright.config.ts`.

## Covered Workflows

- 404 handling for unknown routes and malformed paths.
- Homepage and navigation flows.
- Protected dashboard redirects for disconnected wallets.
- Connected-wallet dashboard rendering, vault controls, and transaction history.
- Offline banner behavior, service worker registration, and cached vault data fallback.

## Test Utilities

- `tests/e2e/helpers/mockWallet.ts` seeds both browser wallet state and the middleware `hasWallet` cookie before navigation.
- `tests/e2e/helpers/testEnv.ts` loads `.env.test` defaults into Playwright and its web server process.
- Visual screenshot coverage remains separate in `tests/visual/` and `playwright.visual.config.ts`.

## Running Locally

Install dependencies and browsers once:

```bash
npm ci
npm run playwright:install
```

Run the functional E2E suite:

```bash
npm run test:e2e
```

Run only Chromium, matching the fastest local smoke path:

```bash
npm run test:e2e -- --project=chromium
```

Run visual regression checks separately:

```bash
npm run test:visual
```

## CI Coverage

GitHub Actions runs linting, type checking, Jest, functional Playwright E2E tests, visual regression tests, and the production build on pull requests to `main`. Playwright jobs upload HTML reports and `test-results/` artifacts on failure so reviewers can inspect screenshots, traces, and error context.

## Updating Tests

1. Add or update helper utilities when several specs need the same wallet, environment, or cache setup.
2. Prefer user-visible assertions over implementation details.
3. Keep functional E2E tests in `tests/e2e/` and screenshot comparisons in `tests/visual/`.
4. Run `npm run test:e2e -- --project=chromium` before opening a PR that changes dashboard flows.
5. Run `npm run test:visual:update` only when an intentional UI change requires updated screenshot baselines.
