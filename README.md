# Axionvera Dashboard

Axionvera Dashboard is a web application that allows users to interact with Axionvera smart contracts deployed on Stellar using Soroban.

## Features

- Connect Stellar wallet (Freighter-compatible)
- Display connected wallet address
- View vault balance and rewards
- Deposit tokens into the Axionvera vault
- Withdraw tokens from the vault
- Claim rewards
- View transaction history

## Tech Stack

- **Framework**: Next.js (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Stellar (Soroban)
- **Integration**: `@stellar/freighter-api`, `stellar-sdk`

## Prerequisites

To run this project locally, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm (v9+) or yarn (v1.22+)

## Quick Start

Get the project up and running in 3 steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Axionvera/axionvera-dashboard.git
   cd axionvera-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the application.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check
- `npm run test` - Run unit tests with Jest

## Wallet Connection

This dashboard supports Freighter-style wallet connection via `@stellar/freighter-api`.

1. Install the [Freighter browser extension](https://www.freighter.app/).
2. Create or import a Stellar account.
3. Open the dashboard and click “Connect Wallet”.

If you’re integrating additional wallets, start in [src/hooks/useWallet.ts](src/hooks/useWallet.ts).

## Configuration

Set environment variables in `.env.local` (copy from `.env.example` if available):

| Variable | Description | Default (Testnet) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` \| `futurenet` \| `mainnet` | `testnet` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Soroban RPC endpoint | https://soroban-testnet.stellar.org |
| `NEXT_PUBLIC_HORIZON_URL` | Horizon API endpoint | https://horizon-testnet.stellar.org |
| `NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID` | Axionvera Vault Contract ID | |
| `NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID` | Axionvera Token Contract ID | |

Network defaults live in [src/utils/networkConfig.ts](src/utils/networkConfig.ts).

## Troubleshooting

| Issue | Potential Cause | Solution |
| :--- | :--- | :--- |
| `Module not found` | Dependency mismatch or missing installation | Run `rm -rf node_modules package-lock.json && npm install` |
| `.env` variables not loading | Missing `.env.local` or incorrect naming | Ensure all variables are prefixed with `NEXT_PUBLIC_` and the file is named `.env.local` |
| Wallet connection fails | Extension not installed or locked | Check if Freighter is installed and unlocked. Ensure you are on the correct network. |
| Build errors (TypeScript) | Type mismatch in props or API | Run `npm run typecheck` to identify specific errors. |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions and setup guides.

## License

MIT — see [LICENSE](LICENSE).

