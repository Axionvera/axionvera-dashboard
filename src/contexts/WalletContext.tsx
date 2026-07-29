/**
 * @module contexts/WalletContext
 *
 * React context that owns wallet connection state and exposes it to the
 * component tree.
 *
 * Architecture notes
 * ------------------
 * This context no longer contains any wallet-library–specific code.  All
 * adapter logic lives in `src/wallets/` and is accessed through the thin
 * `src/services/walletService.ts` layer.  To add a new wallet:
 *   1. Create an adapter in `src/wallets/adapters/`
 *   2. Register it in `src/wallets/index.ts`
 *   No changes to this file are required.
 *
 * Backward compatibility
 * ----------------------
 * The full original API is preserved:
 *   address, publicKey, network, balance, isConnected, isConnecting, error,
 *   walletType, connect(walletType), disconnect()
 *
 * New additions:
 *   availableWallets  – WalletMeta[] from the registry (for the picker UI)
 *   switchWallet(id)  – atomically disconnect + reconnect with a new wallet
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";

import { StellarNetwork, NETWORK } from "@/utils/networkConfig";
import { notify } from "@/utils/notifications";
import { emit } from "@/observability/diagnostics";
import { WalletId, WalletMeta } from "@/wallets";
import {
  getAvailableWallets,
  connectWallet,
  disconnectWallet,
  switchWallet as switchWalletService,
  restoreSession,
  pollSession
} from "@/services/walletService";
import { apiGet } from "@/utils/enhancedApiClient";

type WalletState = {
  address: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletId | null;
};

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface WalletContextType {
  // ── Core state ──────────────────────────────────────────────────────────
  address: string | null;
  /** Alias for `address` — kept for backward compatibility. */
  publicKey: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  /** Which wallet adapter is currently active. */
  walletType: WalletId | null;

  // ── Registry ─────────────────────────────────────────────────────────────
  /** All wallets registered in the provider registry. Used by the picker UI. */
  availableWallets: WalletMeta[];

  // ── Actions ───────────────────────────────────────────────────────────────
  /**
   * Connect to the given wallet.
   * @param walletType - A registered `WalletId` (e.g. "freighter" | "albedo")
   */
  connect: (walletType: WalletId) => Promise<void>;
  disconnect: () => void;
  /**
   * Atomically disconnect the current wallet and connect a new one.
   * No-op if `newWalletId` equals the currently active wallet.
   */
  switchWallet: (newWalletId: WalletId) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Balance helper
// ---------------------------------------------------------------------------

async function fetchBalance(address: string, network: StellarNetwork): Promise<string> {
  try {
    const horizonUrl =
      network === "mainnet"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org";

    const response = await apiGet(`${horizonUrl}/accounts/${address}`);
    if (!response.success || !response.data) throw new Error("Failed to fetch account");

    const xlmBalance = response.data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native",
    );
    return xlmBalance?.balance ?? "0";
  } catch {
    return "0";
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(() => {
    if (typeof window !== "undefined" && (window as any).__MOCK_WALLET_CONTEXT__) {
      const mock = (window as any).__MOCK_WALLET_CONTEXT__;
      return {
        address: mock.address,
        network: mock.network || NETWORK,
        balance: mock.balance,
        isConnecting: mock.isConnecting,
        error: mock.error,
        walletType: mock.walletType,
      };
    }
    return {
      address: null,
      network: NETWORK,
      balance: null,
      isConnecting: false,
      error: null,
      walletType: null,
    };
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = useMemo(() => Boolean(state.address), [state.address]);

  /** All registered wallets — memoised once because the registry is static. */
  const availableWallets = useMemo<WalletMeta[]>(() => getAvailableWallets(), []);

  // ── Fetch balance whenever address changes ────────────────────────────────
  useEffect(() => {
    if (!state.address) {
      setState((s) => ({ ...s, balance: null }));
      return;
    }

    let cancelled = false;
    (async () => {
      const balance = await fetchBalance(state.address!, state.network);
      if (!cancelled) setState((s) => ({ ...s, balance }));
    })();

    return () => { cancelled = true; };
  }, [state.address, state.network]);

  // ── Poll for account / network changes via the service layer ─────────────
  useEffect(() => {
    if (!state.address || !state.walletType) return;

    const walletId = state.walletType;
    const checkForChanges = async () => {
      const session = await pollSession(walletId);
      if (!session) return;

      const { address, network } = session;
      if (address !== state.address || network !== state.network) {
        setState((s) => ({ ...s, address, network }));
      }
    };

    pollingRef.current = setInterval(checkForChanges, 5000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [state.address, state.walletType, state.network]);

  // ── Restore an existing session on mount ─────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    (async () => {
      const session = await restoreSession();
      if (!cancelled && session) {
        setState((s) => ({
          ...s,
          address: session.address,
          network: session.network,
          walletType: session.walletId,
          error: null,
        }));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async (walletType: WalletId) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const session = await connectWallet(walletType);
      setState({
        address: session.address,
        network: session.network,
        balance: null,
        isConnecting: false,
        error: null,
        walletType: session.walletId,
      });

      emit('wallet_connected', { address: session.address, walletType });
      notify.success('Wallet Connected', `Successfully connected to ${walletType} wallet.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to connect wallet.";
      setState((s) => ({
        ...s,
        isConnecting: false,
        address: null,
        error: message,
        walletType: null,
      }));
      emit('wallet_connect_error', { error: message, walletType });
      notify.error('Connection Failed', message);
    }
  }, []);

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    const currentWalletType = state.walletType;
    setState({
      address: null,
      network: NETWORK,
      balance: null,
      isConnecting: false,
      error: null,
      walletType: null,
    });

    if (currentWalletType) {
      disconnectWallet(currentWalletType).catch(() => { /* swallow disconnect errors */ });
    }

    emit('wallet_disconnected');
    notify.success('Wallet Disconnected', 'You have been disconnected from your wallet.');
  }, [state.walletType]);

  // ── switchWallet ──────────────────────────────────────────────────────────
  const switchWallet = useCallback(
    async (newWalletId: WalletId) => {
      if (newWalletId === state.walletType) return;

      setState((s) => ({ ...s, isConnecting: true, error: null }));
      try {
        const session = await switchWalletService(state.walletType, newWalletId);
        setState({
          address: session.address,
          network: session.network,
          balance: null,
          isConnecting: false,
          error: null,
          walletType: session.walletId,
        });
        notify.success("Wallet Switched", `Now connected to ${newWalletId}.`);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to switch wallet.";
        setState((s) => ({
          ...s,
          isConnecting: false,
          address: null,
          error: message,
          walletType: null,
        }));
        notify.error("Switch Failed", message);
      }
    },
    [state.walletType],
  );

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo<WalletContextType>(
    () => ({
      address: state.address,
      publicKey: state.address,
      network: state.network,
      balance: state.balance,
      isConnected,
      isConnecting: state.isConnecting,
      error: state.error,
      walletType: state.walletType,
      availableWallets,
      connect,
      disconnect,
      switchWallet,
    }),
    [state, isConnected, availableWallets, connect, disconnect, switchWallet],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}

export const useWallet = useWalletContext;
