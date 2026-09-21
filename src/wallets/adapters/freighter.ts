/**
 * @module wallets/adapters/freighter
 *
 * Freighter wallet adapter.
 *
 * Freighter (https://www.freighter.app) is a browser extension that provides
 * the `@stellar/freighter-api` package.  This adapter wraps that package
 * behind the common `WalletProvider` interface so the rest of the app is
 * decoupled from Freighter specifics.
 *
 * Capabilities
 * ------------
 * - publicKey       ✓
 * - signTransaction ✓  (Freighter exposes `signTransaction`)
 * - signAuthEntry   ✗  (not yet exposed via the browser extension API)
 */

import { StellarNetwork } from "@/utils/networkConfig";
import { WalletAdapterError, WalletMeta, WalletProvider } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lazy-load the Freighter API to avoid bundling it when not used. */
async function loadFreighter() {
  const mod = await import("@stellar/freighter-api");
  return mod;
}

/**
 * Map Freighter network strings → `StellarNetwork` discriminated union.
 * Freighter returns "PUBLIC", "TESTNET", or "FUTURENET".
 */
const FREIGHTER_NETWORK_MAP: Record<string, StellarNetwork> = {
  PUBLIC: "mainnet",
  TESTNET: "testnet",
  FUTURENET: "futurenet",
};

function mapFreighterNetwork(raw: string): StellarNetwork {
  return FREIGHTER_NETWORK_MAP[raw] ?? "testnet";
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const FREIGHTER_META: WalletMeta = {
  id: "freighter",
  label: "Freighter",
  description: "Official Stellar browser extension wallet by the SDF.",
  installUrl: "https://www.freighter.app",
  icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="#5B4FE8"/>
    <path d="M10 20C10 14.477 14.477 10 20 10s10 4.477 10 10-4.477 10-10 10S10 25.523 10 20z" fill="#fff" fill-opacity=".15"/>
    <path d="M14 20h12M20 14v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>`,
  capabilities: {
    publicKey: true,
    signTransaction: true,
    signAuthEntry: false,
  },
};

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class FreighterAdapter implements WalletProvider {
  readonly meta: WalletMeta = FREIGHTER_META;

  async isAvailable(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const freighter = await loadFreighter();
      return freighter.isConnected();
    } catch {
      return false;
    }
  }

  async isConnected(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const freighter = await loadFreighter();
      const connected = await freighter.isConnected();
      const allowed = await freighter.isAllowed();
      return connected && allowed;
    } catch {
      return false;
    }
  }

  async connect(): Promise<{ address: string; network: StellarNetwork }> {
    if (typeof window === "undefined") {
      throw new WalletAdapterError(
        "NOT_AVAILABLE",
        "Freighter is only available in the browser.",
      );
    }

    let freighter: Awaited<ReturnType<typeof loadFreighter>>;
    try {
      freighter = await loadFreighter();
    } catch (cause) {
      throw new WalletAdapterError(
        "NOT_AVAILABLE",
        "Failed to load the Freighter API.",
        cause,
      );
    }

    const available = await freighter.isConnected();
    if (!available) {
      throw new WalletAdapterError(
        "NOT_AVAILABLE",
        "Freighter wallet extension is not installed. Please install it from freighter.app.",
      );
    }

    try {
      await freighter.setAllowed();
    } catch (cause) {
      throw new WalletAdapterError(
        "USER_REJECTED",
        "User rejected the Freighter connection request.",
        cause,
      );
    }

    let address: string;
    let rawNetwork: string;

    try {
      address = await freighter.getPublicKey();
      rawNetwork = await freighter.getNetwork();
    } catch (cause) {
      throw new WalletAdapterError(
        "UNKNOWN",
        "Failed to retrieve account details from Freighter.",
        cause,
      );
    }

    return { address, network: mapFreighterNetwork(rawNetwork) };
  }

  async signTransaction(
    transactionXdr: string,
    options: {
      networkPassphrase: string;
      accountToSign: string;
    },
  ): Promise<string> {
    if (typeof window === "undefined") {
      throw new WalletAdapterError(
        "NOT_AVAILABLE",
        "Freighter transaction signing is only available in the browser.",
      );
    }

    try {
      const freighter = await loadFreighter();

      if (!(await freighter.isConnected()) || !(await freighter.isAllowed())) {
        throw new WalletAdapterError(
          "NOT_CONNECTED",
          "Freighter is not connected.",
        );
      }

      return await freighter.signTransaction(transactionXdr, {
        networkPassphrase: options.networkPassphrase,
        accountToSign: options.accountToSign,
      });
    } catch (cause) {
      if (cause instanceof WalletAdapterError) {
        throw cause;
      }

      throw new WalletAdapterError(
        "UNKNOWN",
        "Failed to sign transaction with Freighter.",
        cause,
      );
    }
  }

  async disconnect(): Promise<void> {
    // Freighter does not expose a programmatic disconnect API.
    // We simply treat clearing local state as a disconnect.
  }

  async getActiveSession(): Promise<{ address: string; network: StellarNetwork } | null> {
    if (typeof window === "undefined") return null;
    try {
      const freighter = await loadFreighter();
      if (!(await freighter.isConnected()) || !(await freighter.isAllowed())) {
        return null;
      }
      const address = await freighter.getPublicKey();
      const rawNetwork = await freighter.getNetwork();
      return { address, network: mapFreighterNetwork(rawNetwork) };
    } catch {
      return null;
    }
  }
}

/** Factory function used by the wallet registry. */
export function createFreighterAdapter(): WalletProvider {
  return new FreighterAdapter();
}
