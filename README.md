# Axionvera Dashboard

Official frontend dashboard for interacting with Axionvera vault contracts on Stellar (Soroban), built with Next.js.

## Overview

This project helps users:

- Connect a Freighter wallet
- View vault balance and rewards
- Deposit to and withdraw from the vault
- Track transaction history
- Customize the dashboard layout by dragging widgets, resizing them, and keeping the arrangement across refreshes

For contributors, the frontend follows a simple pattern:

- `components/` contains presentational UI
- `hooks/` contains wallet and vault side effects
- `utils/` contains network and contract helpers

## Quick Start

```bash
git clone https://github.com/Axionvera/axionvera-dashboard.git
cd axionvera-dashboard
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Prerequisites

- Node.js `>=18`
- npm `>=9`
- Freighter browser extension

## Environment Setup

Required variables are defined in `.env.example`:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID=
NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID=
```

The project validates environment variables automatically before `dev` and `build`.

Useful commands:

```bash
npm run validate-env
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

## Project Structure

```text
axionvera-dashboard/
├── src/                 # Application source (54 modules — see tables below)
├── docs/                # Architecture and contributor docs
├── tests/               # Jest suites (see Testing note below)
├── scripts/             # Build-time helpers (theme/env validation)
├── mock-backend/        # Local stub API for development
├── public/              # Static assets
└── terraform/           # Infrastructure as code
```

`src/` has grown to 54 top-level modules. They group by concern as follows.

**App shell and routing**

| Folder | Responsibility |
| :--- | :--- |
| `pages/` | Next.js routes (Pages Router) |
| `middleware.ts` | Edge middleware |
| `providers/` | Root service-provider composition |
| `layout/` | Dashboard layout types, manager, persistence logic |
| `navigation/` | Navigation state machine |
| `core/` | DI container, app services, extension wiring |

**UI**

| Folder | Responsibility |
| :--- | :--- |
| `components/` | Presentational UI, grouped by domain subfolder |
| `design-system/` | Base primitives (`Button`, `Card`, `Dialog`, `Alert`, `Badge`) |
| `charts/` | Recharts wrappers (`LineChart`, `BarChart`, `PieChart`, …) |
| `visualizations/` | Visualization framework: theme, hooks, utils |
| `widgets/` | Dashboard widget registry |
| `styles/` | Global and generated theme CSS |
| `tokens/`, `tokens.json` | Design-token source of truth and accessors |
| `rendering/` | Render boundaries and incremental update helpers |

**Domain features**

| Folder | Responsibility |
| :--- | :--- |
| `features/` | Vertical slices: `analytics`, `governance`, `monitoring`, `recovery`, `search`, `transactions` |
| `wallets/` | Wallet adapters and registry |
| `workspaces/` | Workspace switching, context, and store |
| `collaboration/` | Presence, conflict resolution, sync protocol |
| `insights/` | Protocol insight generation |
| `search/` | Search service, fuzzy matching, index builder |
| `notifications/` | Filtering, normalization, prioritization, persistence |

**State and data**

| Folder | Responsibility |
| :--- | :--- |
| `contexts/` | React providers: `Vault`, `Wallet`, `RBAC`, `Governance`, `Theme` |
| `store/` | Framework-free stores consumed via `useSyncExternalStore` |
| `hooks/` | Custom hooks — the consumption boundary for all state |
| `services/` | Data access: analytics, events, audit, protocol health, SDK |
| `sdk/` | Host bindings and validation |
| `query/` | Query engine and cache |
| `data/` | Dashboard data pipeline |
| `cache/`, `sync/` | Offline cache and sync |
| `indexing/` | On-chain event indexer |
| `schema/` | Dashboard schema parser |
| `migrations/` | State migration engine |
| `types/` | Shared domain types |

**Cross-cutting**

| Folder | Responsibility |
| :--- | :--- |
| `utils/` | Network config, contract helpers, API resilience, formatting |
| `lib/` | Fonts and small shared helpers |
| `config/` | Static configuration (experiments) |
| `errors/` | Error detection, categorization, recovery |
| `events/` | Application event bus |
| `permissions/`, `policy/` | RBAC roles, route guards, policy engine |
| `extensions/` | Protocol extension points |

**Observability and performance**

| Folder | Responsibility |
| :--- | :--- |
| `observability/` | Diagnostics and performance instrumentation |
| `logger/` | Canonical logger (levels, transports, configuration) |
| `logging/` | ⚠️ Deprecated duplicate of `logger/` — no importers; do not use |
| `performance/`, `profiler/` | Performance metrics and React profiling |
| `diagnostics/` | Runtime diagnostic reporting |
| `session/`, `replay/` | Session recording, masking, and replay engine |
| `experiments/` | Feature flags and experiment evaluation |
| `preload/` | Asset preloading engine |
| `scheduler/` | Resource scheduling policies |
| `pwa/` | Service worker registration and offline provider |
| `tests/` | Co-located suites (see note below) |

> **Note on duplication.** A few modules overlap by design and a few by accident —
> `logger/` vs `logging/`, `charts/` vs `visualizations/`, `observability/` vs
> `diagnostics/` and `performance/`, and tests living in four different places.
> Before adding a folder or component, read the
> [dashboard cleanup checklist](docs/dashboard-cleanup-checklist.md), which documents
> which module is canonical in each case.

## Routes

| File | Route | Purpose |
| :--- | :--- | :--- |
| `src/pages/index.tsx` | `/` | Landing and entry screen |
| `src/pages/dashboard.tsx` | `/dashboard` | Main vault dashboard |
| `src/pages/profile.tsx` | `/profile` | User profile/security settings |
| `src/pages/_app.tsx` | N/A | Global app wrapper/providers |
| `src/pages/_document.tsx` | N/A | Custom HTML document + theme bootstrap |

## Components

Main UI components in `src/components/`:

| Component | Responsibility |
| :--- | :--- |
| `Navbar.tsx` | Wallet status and top navigation |
| `Sidebar.tsx` | Primary navigation for dashboard pages |
| `BalanceCard.tsx` | Displays balance/reward summary |
| `DepositForm.tsx` | Deposit flow UI |
| `WithdrawForm.tsx` | Withdraw flow UI |
| `TransactionHistory.tsx` | Transaction list and rewards actions |
| `ProfileForm.tsx` | Profile editing form |
| `SecuritySettingsForm.tsx` | Security preferences form |
| `FormInput.tsx` | Shared form input primitive |
| `ThemeToggle.tsx` | Theme mode switcher |
| `Skeleton.tsx` / `Skeletons.tsx` | Loading placeholders |
| `ErrorBoundary.tsx` / `ErrorFallback.tsx` | Error containment and fallback UI |

## Hooks

Custom hooks in `src/hooks/`:

| Hook | Responsibility |
| :--- | :--- |
| `useWallet.ts` | Freighter connection lifecycle and wallet state |
| `useVault.ts` | Vault reads/writes (deposit, withdraw, rewards, refresh) |
| `useFormValidation.ts` | Form validation helpers |
| `useApiError.ts` | Consistent API/contract error mapping |
| `useSidebar.ts` | Sidebar open/close state |

## Screenshots

Illustrative UI snapshots for quick contributor orientation:

### Dashboard

![Dashboard overview](docs/screenshots/dashboard-overview.png)

### Profile

![Profile page](docs/screenshots/profile-page.png)

## Documentation

- [Frontend guide](docs/frontend-guide.md)
- [Architecture](docs/architecture.md)
- [Dashboard cleanup checklist](docs/dashboard-cleanup-checklist.md) — folder, component, API, state, and testing rules for contributors
- [Environment validation](docs/ENVIRONMENT_VALIDATION.md)
- [End-to-end testing](docs/testing/e2e.md)
- [Visual regression testing](docs/testing/visual-regression.md)
- [Terraform setup](terraform/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branch naming, and quality gates.

Before opening a PR, review the [dashboard cleanup checklist](docs/dashboard-cleanup-checklist.md) —
it defines the folder structure, component reuse, API/state, and testing rules that keep the
dashboard maintainable.

## License

MIT. See [LICENSE](LICENSE).
## Regression Test Baseline
- Added tests, fixtures, scripts, and documentation.

## Architecture Documentation
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.
