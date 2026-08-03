# Folder structure

Where code goes in `src/`, and the rules that keep it there.

This document describes the **layout** of the codebase. For runtime behaviour
(`useWallet` → `useVault` → pages, SDK/contract interaction) see
[architecture.md](./architecture.md). For the wider set of contribution rules —
API conventions, state conventions, known duplication — see the
[dashboard cleanup checklist](./dashboard-cleanup-checklist.md).

The rules below are not advisory. They are enforced by
[`tests/baseline.test.ts`](../tests/baseline.test.ts), which runs as part of
`npm test`.

---

## The three layers

```text
src/
├── pages/        Routes. Thin: wire the shell around a feature.
├── features/     Domain verticals. Own their UI, and their public API.
└── components/   Shared UI only. Knows nothing about any domain.
```

Everything else in `src/` (`hooks/`, `services/`, `utils/`, `store/`,
`contexts/`, `design-system/`, `charts/`, …) is supporting infrastructure that
either layer may use.

### `src/features/<domain>/`

A feature is a vertical slice of one business domain. It owns its components and
exposes exactly one entry point:

```text
src/features/analytics/
├── index.ts                        <- the public API; the only path outsiders import
└── components/
    ├── AnalyticsDashboard.tsx
    ├── AnalyticsReportPanel.tsx
    └── …
```

Current features: `activity`, `analytics`, `audit`, `diagnostics`, `governance`,
`insights`, `monitoring`, `notifications`, `profile`, `recovery`, `search`,
`transactions`, `vault`.

Features may also hold their own non-UI code next to the components when it is
used nowhere else — `recovery/workflows.ts` and `transactions/useSimulation.ts`
are the existing examples.

### `src/components/`

Shared, reusable UI. There are no loose files at its root; every file sits in one
of seven categories:

| Folder | Holds |
| :--- | :--- |
| `ui/` | Presentational primitives: `FormInput`, `Skeleton`, `AppTooltip`, `CopyButton`, `ThemeToggle`, fallback states |
| `layout/` | The application shell: `Navbar`, `Sidebar`, `RoleAwareNav`, dashboard layout scaffolding |
| `errors/` | Error boundaries and their fallback UI |
| `guards/` | Route and permission guards |
| `optimized/` | Lazy and memoised wrappers used for code splitting |
| `schema/` | The schema-driven dashboard renderer |
| `visualizations/` | Chart compositions built on `@/visualizations` |

---

## Rules

Each rule maps to a test in `tests/baseline.test.ts`.

1. **`src/components/` contains only the seven shared categories.** Adding a
   business domain there is the regression these checks exist to catch. Domain UI
   goes in `src/features/<domain>/components/`.
2. **No loose files at the root of `src/components/`.** Pick a category.
3. **Shared components must not import a feature.** The two exceptions are
   `components/layout/` and `components/optimized/`, which are composition roots:
   the shell composes features by definition, and the lazy wrappers exist to
   split them out of the main bundle.
4. **Every feature has an `index.ts` barrel.**
5. **Feature components live under `components/`,** not loose in the feature root.
6. **A feature is reached from outside only through its barrel.** Import
   `@/features/vault`, never `@/features/vault/components/BalanceCard`. This is
   what makes a feature's internals safe to move. Tests are exempt — they may
   target a specific module.
7. **No two page files resolve to the same route.** `pages/governance.tsx` and
   `pages/governance/index.tsx` both mapped to `/governance` until this refactor;
   Next.js reports that as a duplicate page.

---

## Where does my code go?

| I am adding… | It goes in |
| :--- | :--- |
| A screen | `src/pages/` — keep it thin, render a feature |
| UI for one business domain | `src/features/<domain>/components/`, exported from the barrel |
| A button, input, skeleton, tooltip | `src/components/ui/` |
| Navigation or page chrome | `src/components/layout/` |
| A chart | `src/components/visualizations/` (composition) or `src/charts/` (Recharts wrapper) |
| A data fetch | `src/services/`, consumed through a hook — never `fetch()` in a component |
| App-wide state | `src/store/` or `src/contexts/` — see the checklist, §4 |

Do not create a new top-level folder under `src/`. There are already more than
fifty; put the code under an existing owner.

---

## Known gaps

These are deliberate, documented, and open for a follow-up `refactor/` PR.

- **Domain logic is not yet colocated with its feature.** Six domains still keep
  their non-UI code in a top-level folder while their UI lives in the feature:
  `@/notifications`, `@/insights`, `@/diagnostics`, `@/schema`, `@/layout` and
  `@/visualizations`. Feature barrels point at the logic in their doc comment.
  Folding those folders into `src/features/<domain>/` is the natural next step.
- **`AnalyticsDashboard` and `AnalyticsReportPanel` are two dashboards.** They
  are no longer two files with the same name, but they still read analytics two
  different ways — hooks versus the service layer. Picking one is a product
  decision, not a structural one.
- **Tests still live in four places.** `tests/` is the canonical home; see the
  checklist, §5.

---

## Related documentation

- [Architecture](./architecture.md) — runtime data flow and SDK interaction
- [Dashboard cleanup checklist](./dashboard-cleanup-checklist.md) — API, state, testing and duplication rules
- [Frontend guide](./frontend-guide.md)
- [Contributing](../CONTRIBUTING.md) — branch naming, commits, quality gates
