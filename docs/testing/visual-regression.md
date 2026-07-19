# Visual Regression Testing

Axionvera uses Playwright screenshot assertions to detect unintended UI changes in dashboard-facing pages. The visual suite is intentionally separate from functional E2E tests so teams can update or review screenshots without changing behavior checks.

## Snapshot strategy

- Tests live in `tests/visual/` and run with `playwright.visual.config.ts`.
- Baselines are committed under Playwright snapshot folders next to each spec.
- Snapshot paths are platform-neutral so CI and local runs use the same reviewed baselines.
- Chromium desktop is the canonical baseline browser to minimize cross-browser rendering noise.
- The suite fixes viewport, locale, timezone, color scheme, reduced motion, and common animation styles before comparing screenshots.
- Dynamic regions can be hidden by adding `data-visual-mask="true"` to an element or by extending the shared mask selector list in the visual spec.

## Running locally

Install dependencies and browsers once:

```bash
npm ci
npm run playwright:install
```

Run the visual comparison suite:

```bash
npm run test:visual
```

Generate or approve updated baselines after intentionally changing UI:

```bash
npm run test:visual:update
```

Review generated image changes before committing. Playwright writes expected, actual, and diff images when a comparison fails.

## CI workflow

The GitHub Actions visual regression job installs Playwright browsers, runs `npm run test:visual`, and uploads both the HTML report and `test-results/` artifacts. Failed visual comparisons therefore include diff images for reviewers.

## Approval workflow

1. Run `npm run test:visual` before opening a PR that changes UI.
2. If diffs are unintended, fix the component and rerun the suite.
3. If diffs are intentional, run `npm run test:visual:update` and commit the updated baseline images with the code change.
4. In PR review, inspect changed `*-snapshots/*.png` files plus the uploaded CI diff artifacts.
5. Do not approve visual baseline updates unless the UI change is explained in the PR notes.
