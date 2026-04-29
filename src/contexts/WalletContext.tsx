import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useRef,
} from "react";
import { StellarNetwork, NETWORK } from "@/utils/networkConfig";
import { notify } from "@/utils/notifications";

type WalletType = "freighter" | "albedo";

type WalletState = {
  address: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletType | null;
};

interface WalletContextType {
  address: string | null;
  publicKey: string | null; // Alias for acceptance criteria
  network: StellarNetwork;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletType | null;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

async function loadFreighter() {
  const mod = await import("@stellar/freighter-api");
  return mod;
}

async function loadAlbedo() {
  const mod = await import("@albedo-link/intent");
  return mod.default;
}

async function fetchBalance(
  address: string,
  network: StellarNetwork,
): Promise<string> {
  try {
    const horizonUrl =
      network === "mainnet"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org";

    const response = await fetch(`${horizonUrl}/accounts/${address}`);
    if (!response.ok) {
      throw new Error("Failed to fetch account");
    }

    const data = await response.json();
    const xlmBalance = data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native",
    );
    return xlmBalance?.balance ?? "0";
  } catch {
    return "0";
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    network: NETWORK,
    balance: null,
    isConnecting: false,
    error: null,
    walletType: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = useMemo(() => Boolean(state.address), [state.address]);

  // Fetch balance when address changes
  useEffect(() => {
    if (!state.address) {
      setState((s) => ({ ...s, balance: null }));
      return;
    }

    let cancelled = false;
    (async () => {
      const balance = await fetchBalance(state.address!, state.network);
      if (!cancelled) {
        setState((s) => ({ ...s, balance }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.address, state.network]);

  // Poll for account/network changes
  useEffect(() => {
    if (!state.address || !state.walletType) return;

    const checkForChanges = async () => {
      try {
        if (state.walletType === "freighter") {
          const freighter = await loadFreighter();
          const currentAddress = await freighter.getPublicKey();
          const currentNetwork = await freighter.getNetwork();

          const networkMap: Record<string, StellarNetwork> = {
            PUBLIC: "mainnet",
            TESTNET: "testnet",
            FUTURENET: "futurenet",
          };

          const mappedNetwork = networkMap[currentNetwork] ?? "testnet";

          if (
            currentAddress !== state.address ||
            mappedNetwork !== state.network
          ) {
            setState((s) => ({
              ...s,
              address: currentAddress,
              network: mappedNetwork,
            }));
          }
        }
      } catch {
        // Ignore polling errors
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

  // Check for existing connection on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      try {
        const freighter = await loadFreighter();
        if (await freighter.isConnected() && await freighter.isAllowed()) {
          const address = await freighter.getPublicKey();
          const network = await freighter.getNetwork();

          const networkMap: Record<string, StellarNetwork> = {
            PUBLIC: "mainnet",
            TESTNET: "testnet",
            FUTURENET: "futurenet",
          };

          const mappedNetwork = networkMap[network] ?? "testnet";

          if (!cancelled) {
            setState((s) => ({
              ...s,
              address,
              network: mappedNetwork,
              walletType: "freighter",
              error: null,
            }));
          }
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, address: null, walletType: null }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (walletType: WalletType) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      if (typeof window === "undefined")
        throw new Error("Wallet is only available in the browser.");

      let address: string;
      let mappedNetwork: StellarNetwork = NETWORK;

      if (walletType === "freighter") {
        const freighter = await loadFreighter();
        if (!(await freighter.isConnected())) {
          throw new Error("Freighter wallet not detected.");
        }
        await freighter.setAllowed();
        address = await freighter.getPublicKey();
        const network = await freighter.getNetwork();

        const networkMap: Record<string, StellarNetwork> = {
          PUBLIC: "mainnet",
          TESTNET: "testnet",
          FUTURENET: "futurenet",
        };
        mappedNetwork = networkMap[network] ?? "testnet";
      } else if (walletType === "albedo") {
        const albedo = await loadAlbedo();
        const result = await albedo.publicKey({});
        address = result.pubkey;
        mappedNetwork = NETWORK;
      } else {
        throw new Error("Unsupported wallet type");
      }

      setState({
        address,
        network: mappedNetwork,
        balance: null,
        isConnecting: false,
        error: null,
        walletType,
      });

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
      notify.error('Connection Failed', message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setState({
      address: null,
      network: NETWORK,
      balance: null,
      isConnecting: false,
      error: null,
      walletType: null,
    });
    
    notify.success('Wallet Disconnected', 'You have been disconnected from your wallet.');
  }, []);

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
      connect,
      disconnect,
    }),
    [state, isConnected, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}

export const useWallet = useWalletContext;
