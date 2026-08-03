# Dashboard Cleanup Checklist

Rules for keeping the Axionvera dashboard maintainable as it grows.

This document exists because the repo has already accumulated duplicated modules,
orphaned abstractions, and competing conventions. Every rule below is anchored to a
real case in this codebase — not generic advice. Cite these examples in review when a
PR is about to repeat one.

**Scope.** This complements [`docs/architecture.md`](./architecture.md), which covers the
runtime data flow (`useWallet` → `useVault` → pages) and SDK/contract interaction, and
[`docs/structure.md`](./structure.md), which defines the `pages/` / `features/` /
`components/` layout and the checks that enforce it. Those documents explain *how the app
works* and *where UI lives*. This one covers the remaining conventions: component reuse,
API and state, testing, and the duplication backlog. Do not duplicate their content here —
link to it.

Branch naming (`feat/`, `fix/`, `docs/`, `refactor/`, `chore/`) and the quality gates
(`npm run lint`, `npm run typecheck`, `npm test`) are defined in
[`CONTRIBUTING.md`](../CONTRIBUTING.md). This checklist assumes those and does not restate them.

---

## How to use this

- **Opening a PR** — walk the checklist in `.github/pull_request_template.md`.
- **Reviewing a PR** — if a change trips one of the rules below, link the specific rule.
- **Cleaning up** — the "Known duplication" table is the current backlog. Reducing it is
  always in scope for a `refactor/` branch.

---

## 1. Folder structure rules

`src/` currently has **54 top-level folders**. Adding a 55th is almost never the right move.

- [ ] **Do not create a new top-level `src/` folder** for a feature. Put it under an
      existing owner (`features/`, `components/`, `hooks/`, `services/`, `utils/`).
      A new top-level folder needs justification in the PR description.
- [ ] **Never create a folder whose name is a near-synonym of an existing one.**
      This repo already has `src/logger/` and `src/logging/` — two folders, one letter
      apart, each with its own logger implementation. Before adding `src/<name>/`, grep
      for singular/plural and verb/noun variants of that name.
- [ ] **Domain UI goes in `src/features/<domain>/components/`; `src/components/` is shared
      only.** This is enforced by `tests/baseline.test.ts` — see
      [`docs/structure.md`](./structure.md) for the full rule set. `src/components/` accepts
      seven categories (`ui`, `layout`, `errors`, `guards`, `optimized`, `schema`,
      `visualizations`) and nothing else.
- [ ] **Keep the logic/UI split honest while it lasts.** Six domains still keep non-React
      code in `src/<domain>/` while their UI lives in the feature: `layout`, `notifications`,
      `diagnostics`, `insights`, `schema`, `visualizations`. `src/notifications/` (filtering,
      normalize, persistence, selectors) versus `src/features/notifications/components/`
      (`NotificationCenter`, `NotificationItem`) is the reference example. Put non-React code
      in `src/<domain>/` and JSX in the feature. Folding those folders into their feature is
      tracked in §6.
- [ ] **Update the README structure table** when you add or move a folder, and keep
      [`docs/structure.md`](./structure.md) in step.
- [ ] **New docs go in `docs/`, not the repo root.** The root holds 18 `.md` files that
      overlap `docs/` — `ANALYTICS_IMPLEMENTATION.md` vs `docs/ANALYTICS.md`,
      `PERFORMANCE_IMPLEMENTATION.md` vs `docs/PERFORMANCE.md`,
      `STATE_OPTIMIZATION_SUMMARY.md` vs `docs/STATE_ARCHITECTURE.md`, plus four separate
      RBAC documents. Do not add to that pile.

---

## 2. Component reuse rules

- [ ] **Grep for the component name before creating it.** `AnalyticsDashboard.tsx` used to
      exist in **both** `src/components/analytics/` and `src/features/analytics/`, both live,
      reached through different entry points. They were never copies — one reads data through
      hooks (`useAnalytics`, `useVaultContext`), the other through the service layer
      (`fetchAnalyticsData`). Same name, same concept, two data architectures.

      They now live side by side in `src/features/analytics/components/` under distinct
      names: `AnalyticsDashboard` (hooks, no props, wired into the widget registry) and
      `AnalyticsReportPanel` (takes an `address`, fetches a period report). Do not add a third,
      and do not reintroduce the name collision.

- [ ] **Extend the existing component instead of forking it.** If an existing component
      almost fits, add a prop. A new file with a `Enhanced`/`New`/`V2` prefix is a smell —
      see `enhancedApiClient.ts` in §3, which was added alongside `apiClient.ts` and left
      both unused.
- [ ] **Route new UI through an existing barrel.** Every feature exports through
      `src/features/<domain>/index.ts`, and shared UI through `src/components/<category>/index.ts`.
      Import `@/features/vault`, never `@/features/vault/components/BalanceCard`, so internals
      can move. `tests/baseline.test.ts` fails the build on deep feature imports.
- [ ] **Compose, don't clone.** `SessionReplayPanel` imports `SessionPlaybackPanel` rather
      than reimplementing playback controls — that is the pattern to follow.
- [ ] **Do not "consolidate" complementary components.** These pairs look redundant and are
      not; leave them alone:

      | Pair | Why they are separate |
      | :--- | :--- |
      | `Skeleton.tsx` / `Skeletons.tsx` | Generic primitive vs. domain compositions (`StatisticsSkeleton`, `UserProfileSkeleton`, `TransactionSkeleton`) |
      | `ErrorFallback.tsx` / `FallbackStates.tsx` | Error-boundary UI vs. data-unavailable placeholders |
      | `SessionReplayPanel` / `SessionPlaybackPanel` | Recording/session management vs. the player it composes |

---

## 3. API conventions

The network layer is the most fragmented area of the repo. There are **four** ways to make
a request, and the two that look most official are dead code.

**Current state, verified:**

| Module | Status |
| :--- | :--- |
| `src/utils/apiResilience.ts` | **Live.** Used by `contractHelpers.ts` and `contractHelpersGovernance.ts` |
| `src/utils/apiClient.ts` | **Orphaned** — zero importers |
| `src/utils/enhancedApiClient.ts` | **Orphaned** — zero importers |
| Raw `fetch()` | Scattered across 6 modules |

Raw `fetch()` call sites: `contexts/WalletContext.tsx`, `features/recovery/workflows.ts`,
`preload/engine.ts`, `services/events/sorobanRpcFetcher.ts`, `services/protocolHealth.ts`,
`utils/telemetry.ts`.

- [ ] **Use `withApiResilience` / `safeApiCall` from `src/utils/apiResilience.ts`** for
      contract and API calls. It is the layer with real consumers and test coverage
      (`src/utils/__tests__/apiResilience.test.ts`).
- [ ] **Do not add a fifth client.** Do not import `apiClient.ts` or `enhancedApiClient.ts`
      into new code — adopting an orphaned module makes it harder to delete. Removing them
      is tracked as cleanup, not as an integration target.
- [ ] **No raw `fetch()` in components, pages, or contexts.** Requests belong in
      `src/services/` or `src/utils/`, wrapped in resilience, and are consumed through a hook.
      `contexts/WalletContext.tsx` calling `fetch()` directly is the anti-pattern.
- [ ] **Reuse the Soroban RPC helper.** `services/events/sorobanRpcFetcher.ts` hand-rolls the
      JSON-RPC POST that `apiClient.ts` already exports as `sorobanRpc`. Both build the same
      `{jsonrpc, id, method, params}` envelope against `SOROBAN_RPC_URL`. New RPC code must
      call one shared helper, not write a third envelope.
- [ ] **Read the RPC URL from `src/utils/networkConfig.ts`.** Never inline an endpoint or
      read `process.env` at a call site.
- [ ] **Map errors once.** Use `getFriendlyErrorMessage` from `src/utils/errorFormatting.ts`
      and surface it via `useApiError`. Do not format error strings inside components.

---

## 4. State conventions

Two state patterns coexist. Both are legitimate; the problem is that the choice between
them is currently accidental.

**`src/store/`** — framework-free stores consumed via React's `useSyncExternalStore`
(`activityStore`, `notificationStore`, `searchStore`). Note this is **not** Zustand or any
other state library; it is hand-rolled and there is no state dependency in `package.json`.

**`src/contexts/`** — React providers for wallet/session-scoped concerns
(`VaultContext`, `WalletContext`, `RBACContext`, `GovernanceContext`, `ThemeContext`).

- [ ] **Choose by lifetime, not by taste.** Use `src/store/` for app-wide data that outlives
      a subtree and needs no React context (feeds, notifications, search). Use
      `src/contexts/` for state scoped to a provider subtree or tied to a connection/session
      (wallet, vault, permissions, theme).
      *Known exception:* `src/workspaces/` colocates its own `store.ts` and
      `WorkspaceContext.tsx` inside the feature folder — a third pattern this rule does not
      yet sanction. It is live code, not an oversight to "fix" casually; see §6 before
      copying or relocating it.
- [ ] **Do not introduce a state library.** Adding Zustand/Redux/Jotai now would make a
      third pattern. If you believe one is needed, open a `refactor/` issue first.
- [ ] **Always expose state through a hook.** Components consume `useNotifications`,
      `useActivityFeed`, `useSearch` — not the store module directly. Keep that boundary.
- [ ] **One type per domain concept.** Governance used to carry two incompatible proposal
      shapes: the on-chain `Proposal` in `src/utils/contractHelpersGovernance.ts` and a
      `GovernanceProposal` behind a second, mock-backed dashboard. The mock stack was removed;
      `Proposal` is now the only governance proposal type, and `@/features/governance` re-exports
      it. Before defining a domain type, grep for an existing one and extend it.
- [ ] **Keep persistence and selectors out of the store body.** `notificationStore` delegates
      to `@/notifications/persistence`, `@/notifications/selectors`, and
      `@/notifications/filtering`. Follow that separation.
- [ ] **Do not duplicate context state into a store** (or the reverse) to avoid a prop drill.
      Lift the component or add a selector instead.

---

## 5. Testing expectations

Tests currently live in **four** places, and `jest.config.js` sets no `roots` restriction, so
all four run:

| Location | Count |
| :--- | :--- |
| `tests/` (repo root — the configured `setupFilesAfterEach` root) | ~70 files |
| `src/**/__tests__/` | 4 directories (`logging`, `observability`, `utils`, `visualizations`) |
| Co-located `src/**/*.test.ts(x)` | ~14 files |
| `src/tests/` | a fourth tree, with its own subfolders |

- [ ] **Put new tests in `tests/`**, mirroring the `src/` path. It holds the large majority of
      suites and is where `jest.config.js` points its setup (`tests/setupTests.ts`).
      Do not start a fifth location.
- [ ] **Extend the co-located suite if one already exists** for the file you are changing
      (e.g. `src/store/activityStore.test.ts`, `src/hooks/useSidebar.test.tsx`). Do not create
      a second suite for the same module in `tests/`.
- [ ] **Cover new logic in `src/store/`, `src/services/`, and `src/utils/`.** These are the
      layers where behavior lives and where mocking is cheapest.
- [ ] **A test is not proof a module is used.** `src/logging/__tests__/logger.test.ts` passes
      in CI while `src/logging/logger.ts` has zero importers — green tests kept dead code
      invisible. When you touch a module, confirm someone imports it.
- [ ] **Run the gates before pushing** — `npm run lint`, `npm run typecheck`, `npm test`
      (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)). E2E and visual suites are separate:
      `npm run test:e2e`, and they are excluded from Jest via `testPathIgnorePatterns`.
- [ ] **Do not delete a test to make CI pass.** Fix the behavior or explain the removal in
      the PR description.
- [ ] **Do not weaken `tests/baseline.test.ts` to land a change.** It asserts the folder
      layout described in [`docs/structure.md`](./structure.md). If a rule genuinely needs to
      change, change the rule and the doc together, and say why in the PR.

---

## 6. Known duplication (cleanup backlog)

Verified state of the repo. Do not extend these; reducing them is welcome in a `refactor/` PR.

| Duplication | Canonical | Deprecated / dead |
| :--- | :--- | :--- |
| Logger | `src/logger/` — 4 importers, has barrel, transports, `configureLogger`, `module` field | `src/logging/logger.ts` — **zero importers**, no transports, spreads `meta` over the entry so it can overwrite `timestamp`/`level` |
| API client | `src/utils/apiResilience.ts` — real consumers + tests | `src/utils/apiClient.ts` and `src/utils/enhancedApiClient.ts` — **both orphaned** |
| Analytics dashboard | Name collision resolved: `AnalyticsDashboard` (hooks) and `AnalyticsReportPanel` (service layer), both in `features/analytics/components/` | — choosing one data strategy is still open |
| Proposal type | **Resolved.** `Proposal` in `utils/contractHelpersGovernance.ts` is the only proposal type | — the `GovernanceProposal` mock stack was removed |
| Domain logic vs. feature UI | `src/features/<domain>/` owns the UI | `@/notifications`, `@/insights`, `@/diagnostics`, `@/schema`, `@/layout`, `@/visualizations` still hold their domain logic in a top-level folder |
| Soroban RPC envelope | one shared helper (to be chosen) | `sorobanRpc` in `apiClient.ts` vs. `rpcCall` in `services/events/sorobanRpcFetcher.ts` |
| Diagnostics buffer | `src/diagnostics/` — superset API | `src/observability/diagnostics.ts` — minimal duplicate, **separate buffer** (see below) |
| Performance helpers | `src/performance/` — marks, metrics, `MetricType` | `src/observability/performance.ts` — **zero importers**; redefines `measureAsync` |
| React profiler UI | `src/performance/profiler.ts` (`DashboardProfiler`) | `src/profiler/` (`ProfilerContext`, `ProfilerReport`) — **zero importers** |
| Workspace state | — pattern not covered by §4 (see below) | `src/workspaces/store.ts` + `WorkspaceContext.tsx` live inside the feature folder, not in `src/store/` or `src/contexts/` |
| Root vs. `docs/` documentation | `docs/` | `ANALYTICS_IMPLEMENTATION.md`, `PERFORMANCE_IMPLEMENTATION.md`, `STATE_OPTIMIZATION_SUMMARY.md`, and the four root RBAC docs |

### Diagnostics: two independent buffers

This one is not just naming. `src/diagnostics/index.ts` and `src/observability/diagnostics.ts`
both export `emit`, `getEvents`, and `clear`, and each keeps its **own module-level event
array**. They are not connected, and the app currently writes to one while reading from the other:

| Module | Emits into it | Reads from it |
| :--- | :--- | :--- |
| `observability/diagnostics.ts` (minimal) | `contexts/WalletContext.tsx`, `hooks/useVault.ts`, `pages/_app.tsx` | — |
| `diagnostics/index.ts` (superset) | `performance/performance.ts` | `hooks/useDiagnostics.ts` |

Consequence: wallet and vault events emitted on the hot path are **not** visible to
`useDiagnostics`, because they land in a different array. Consolidating onto
`src/diagnostics/` is the fix — it is the superset (`DiagnosticEventType`,
`configureDiagnostics`, `getEventsByType`, `getErrorEvents`, `getStats`). Until that happens,
emit through `@/diagnostics` in new code.

### Workspaces: a third state pattern

The rule in §4 offers two homes for state — `src/store/` and `src/contexts/`. `src/workspaces/`
follows neither: it colocates `store.ts` (persistence, `WORKSPACE_STORAGE_KEY`) and
`WorkspaceContext.tsx` inside the feature folder. It is live code, imported by
`pages/_app.tsx`, `components/Navbar.tsx`, `contexts/ThemeContext.tsx`, and `hooks/useSidebar.ts`.

This is a reasonable pattern — feature-owned state kept next to the feature — but it is a third
convention, and §4 does not currently sanction it. Either it gets adopted as a documented option
for self-contained features, or `workspaces` moves into the two existing homes. **Do not copy it
into new features until that is decided.**

---

## Related documentation

- [Architecture](./architecture.md) — runtime data flow, wallet→vault, SDK/contract interaction
- [Folder structure](./structure.md) — `pages` / `features` / `components` layout and the checks that enforce it
- [Frontend guide](./frontend-guide.md)
- [State architecture](./STATE_ARCHITECTURE.md)
- [Contributing](../CONTRIBUTING.md) — branch naming, commits, quality gates
