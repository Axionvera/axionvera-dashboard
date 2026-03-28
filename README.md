# Axionvera Dashboard

Official frontend dashboard for interacting with Axionvera vault contracts on Stellar (Soroban), built with Next.js.

## Overview

This project helps users:

- Connect a Freighter wallet
- View vault balance and rewards
- Deposit to and withdraw from the vault
- Track transaction history

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
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React providers (ThemeContext)
│   ├── hooks/           # Custom hooks for wallet, vault, forms, errors
│   ├── pages/           # Next.js routes (Pages Router)
│   ├── styles/          # Global + generated theme styles
│   ├── tokens.json      # Theme token source of truth
│   └── utils/           # Network config and contract helper utilities
├── docs/                # Architecture and contributor docs
├── tests/               # Test suites
├── scripts/             # Build-time helpers (theme/env validation)
└── terraform/           # Infrastructure as code
```

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
- [Environment validation](docs/ENVIRONMENT_VALIDATION.md)
- [Terraform setup](terraform/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
