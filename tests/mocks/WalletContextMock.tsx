/**
 * WalletContextMock
 *
 * A lightweight test double for WalletContext that avoids the real
 * Freighter/Albedo browser extension imports, which crash in the
 * Jest / jsdom environment.
 *
 * Usage:
 *
 *   import { WalletContextMock, renderWithWallet } from '@/tests/mocks/WalletContextMock';
 *
 *   // Option 1 — use the pre-wired render helper (recommended)
 *   const { getByRole } = renderWithWallet(<BalanceCard />);
 *
 *   // Option 2 — wrap manually when you need custom overrides
 *   render(
 *     <WalletContextMock overrides={{ isConnected: false }}>
 *       <DepositForm ... />
 *     </WalletContextMock>
 *   );
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

// ── Mirror the real context type so TypeScript catches drift ─────────────────
// Keep this in sync with src/contexts/WalletContext.tsx → WalletContextType.

type StellarNetwork = 'mainnet' | 'testnet' | 'futurenet';
type WalletType = 'freighter' | 'albedo';

interface WalletContextType {
  address: string | null;
  publicKey: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletType | null;
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => void;
}

// ── Sensible connected-wallet defaults ────────────────────────────────────────

export const MOCK_PUBLIC_KEY =
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

export const DEFAULT_MOCK_WALLET: WalletContextType = {
  address:      MOCK_PUBLIC_KEY,
  publicKey:    MOCK_PUBLIC_KEY,
  network:      'testnet',
  balance:      '100.0000000',
  isConnected:  true,
  isConnecting: false,
  error:        null,
  walletType:   'freighter',
  connect:      jest.fn().mockResolvedValue(undefined),
  disconnect:   jest.fn(),
};

// ── Context re-export ─────────────────────────────────────────────────────────
// We create a *separate* test context so we don't need to import the real one
// (which drags in @stellar/freighter-api dynamic imports).

const MockWalletContext = createContext<WalletContextType>(DEFAULT_MOCK_WALLET);

export function useWalletContext(): WalletContextType {
  return useContext(MockWalletContext);
}

/** @deprecated Use useWalletContext in tests */
export const useWallet = useWalletContext;

// ── Provider component ────────────────────────────────────────────────────────

interface WalletContextMockProps {
  children: ReactNode;
  /** Selectively override any field on the default connected-wallet state. */
  overrides?: Partial<WalletContextType>;
}

export function WalletContextMock({ children, overrides }: WalletContextMockProps) {
  const value: WalletContextType = { ...DEFAULT_MOCK_WALLET, ...overrides };
  return (
    <MockWalletContext.Provider value={value}>
      {children}
    </MockWalletContext.Provider>
  );
}

// ── Render helper ─────────────────────────────────────────────────────────────

interface RenderWithWalletOptions extends Omit<RenderOptions, 'wrapper'> {
  walletOverrides?: Partial<WalletContextType>;
}

/**
 * Drop-in replacement for RTL's `render` that wraps the component in
 * `WalletContextMock`. Accepts optional `walletOverrides` to customise state.
 *
 * @example
 * const { getByRole } = renderWithWallet(<BalanceCard />, {
 *   walletOverrides: { isConnected: false },
 * });
 */
export function renderWithWallet(
  ui: React.ReactElement,
  { walletOverrides, ...options }: RenderWithWalletOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <WalletContextMock overrides={walletOverrides}>
        {children}
      </WalletContextMock>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}