/**
 * @module wallets/types
 *
 * Core type definitions for the Axionvera multi-wallet provider registry.
 * Every wallet adapter must implement the `WalletProvider` interface.
 * The `WalletRegistry` discovers and instantiates adapters via `WalletProviderFactory`.
 */

import { StellarNetwork } from "@/utils/networkConfig";

// ---------------------------------------------------------------------------
// Wallet identity
// ---------------------------------------------------------------------------

/**
 * Known wallet identifiers. Extend this union by registering a new adapter
 * in `src/wallets/registry.ts` — no changes to the context or UI are required.
 */
export type WalletId = "freighter" | "albedo";

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

/**
 * Feature flags that describe what a wallet adapter is able to do.
 * The UI uses these flags to show/hide advanced actions (e.g. transaction signing).
 */
export interface WalletCapabilities {
  /** Adapter can return the user's Stellar public key. */
  publicKey: boolean;
  /** Adapter can sign and submit Stellar transactions. */
  signTransaction: boolean;
  /** Adapter supports Soroban auth-entry signing (required for contract interactions). */
  signAuthEntry: boolean;
}

// ---------------------------------------------------------------------------
// Display metadata
// ---------------------------------------------------------------------------

/**
 * Static, display-only metadata for a wallet.
 * Used to populate the wallet-picker dropdown in the UI.
 */
export interface WalletMeta {
  /** Unique, stable identifier for the wallet. */
  id: WalletId;
  /** Human-readable label shown in the UI (e.g. "Freighter"). */
  label: string;
  /** Inline SVG string or a URL for the wallet's icon. */
  icon: string;
  /** URL users should visit to install the wallet extension / app. */
  installUrl: string;
  /** Short description shown as a tooltip or subtitle in the picker. */
  description: string;
  /** Feature flags for this wallet. */
  capabilities: WalletCapabilities;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * Contract that every wallet adapter must satisfy.
 *
 * Implementations live in `src/wallets/adapters/` and are registered via
 * `WalletRegistry.register()`.  The `WalletContext` never imports an adapter
 * directly — it only calls methods on this interface.
 */
export interface WalletProvider {
  /** Static metadata describing this wallet. */
  readonly meta: WalletMeta;

  /**
   * Returns `true` when the wallet extension / app is available in the current
   * browser environment.  If `false`, the UI disables the picker option and
   * directs the user to `meta.installUrl`.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Returns `true` when the user has already granted permission to this app.
   * Used on mount to restore an existing session without re-prompting.
   */
  isConnected(): Promise<boolean>;

  /**
   * Prompt the user to authorise this app and return their public key.
   * Throws `WalletAdapterError` on failure.
   */
  connect(): Promise<{ address: string; network: StellarNetwork }>;

  /**
   * Sign a Stellar transaction XDR with the connected wallet.
   * Optional because not every registered wallet supports transaction signing.
   */
  signTransaction?(
    transactionXdr: string,
    options: {
      networkPassphrase: string;
      accountToSign: string;
    },
  ): Promise<string>;

  /**
   * Revoke the session / clean up any listeners.
   * Must not throw — failures should be swallowed silently.
   */
  disconnect(): Promise<void>;

  /**
   * Poll for external account or network changes (e.g. the user switched
   * accounts inside the wallet extension).  Returns the latest state or
   * `null` when the wallet is no longer connected.
   */
  getActiveSession(): Promise<{ address: string; network: StellarNetwork } | null>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * A zero-argument constructor for a `WalletProvider`.
 * The registry stores factories so adapters are instantiated lazily.
 */
export type WalletProviderFactory = () => WalletProvider;

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/**
 * Typed error thrown by wallet adapters.
 * Consumers can `instanceof` check to distinguish wallet errors from
 * generic network / contract errors.
 */
export class WalletAdapterError extends Error {
  constructor(
    /** Stable machine-readable code. */
    public readonly code:
      | "NOT_AVAILABLE"
      | "NOT_CONNECTED"
      | "USER_REJECTED"
      | "NETWORK_MISMATCH"
      | "UNKNOWN",
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WalletAdapterError";
  }
}
