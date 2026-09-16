/**
 * @module services/walletService
 *
 * High-level wallet service that wraps the `WalletRegistry` and manages a
 * single active wallet adapter instance.
 *
 * Responsibilities
 * ----------------
 * - Expose `getAvailableWallets()` so the UI can discover registered wallets.
 * - `connectWallet(id)` — resolve adapter → call `connect()` → return session.
 * - `disconnectWallet()` — call `disconnect()` on the currently active adapter.
 * - `switchWallet(newId)` — atomically disconnect → connect with a new wallet.
 * - `restoreSession()` — on mount, check adapters for an existing session.
 *
 * This service is stateless at the module level; state is owned by
 * `WalletContext`.  The service only orchestrates adapter lifecycles and
 * translates adapter errors into user-friendly messages.
 *
 * Consistent with `src/services/protocolHealth.ts`, this file contains only
 * plain async functions — no React hooks or context.
 */

// Importing from `@/wallets` triggers registry bootstrap (side effect).
import { walletRegistry, WalletAdapterError, WalletId, WalletMeta, WalletProvider } from "@/wallets";
import { StellarNetwork } from "@/utils/networkConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletSession {
  /** The connected Stellar public key. */
  address: string;
  /** The network reported by the wallet. */
  network: StellarNetwork;
  /** Which wallet adapter produced this session. */
  walletId: WalletId;
}

// ---------------------------------------------------------------------------
// Internal adapter cache
// ---------------------------------------------------------------------------

/**
 * Cache of instantiated adapters keyed by `WalletId`.
 * Adapters are created once and reused to avoid repeated extension pings.
 */
const adapterCache = new Map<WalletId, WalletProvider>();

function getAdapter(id: WalletId): WalletProvider {
  if (!adapterCache.has(id)) {
    adapterCache.set(id, walletRegistry.createAdapter(id));
  }
  return adapterCache.get(id)!;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the static metadata for every wallet registered in the registry.
 * The UI uses this to render the wallet-picker dropdown.
 */
export function getAvailableWallets(): WalletMeta[] {
  return walletRegistry.list();
}

/**
 * Check whether a specific wallet is installed / accessible.
 * Use this to show an "Install" link instead of "Connect" in the picker.
 */
export async function isWalletAvailable(id: WalletId): Promise<boolean> {
  try {
    return await getAdapter(id).isAvailable();
  } catch {
    return false;
  }
}

/**
 * Connect to the wallet identified by `id`.
 *
 * @throws {WalletAdapterError} on user rejection or wallet unavailability.
 * @throws {Error} for unexpected failures (re-thrown with context).
 */
export async function connectWallet(id: WalletId): Promise<WalletSession> {
  const adapter = getAdapter(id);
  try {
    const { address, network } = await adapter.connect();
    return { address, network, walletId: id };
  } catch (error) {
    if (error instanceof WalletAdapterError) throw error;
    throw new WalletAdapterError(
      "UNKNOWN",
      `Failed to connect to ${id}: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Disconnect the wallet identified by `id`.
 * Always resolves — errors are swallowed to ensure UI state is reset.
 */
export async function disconnectWallet(id: WalletId): Promise<void> {
  try {
    const adapter = getAdapter(id);
    await adapter.disconnect();
  } catch {
    // Disconnect must never throw.
  }
}

/**
 * Switch from the currently active wallet to a different one.
 *
 * Disconnects `currentId` first, then connects `newId`.
 * If the connect step fails the disconnect is still committed (no rollback).
 *
 * @throws {WalletAdapterError} propagated from `connectWallet`.
 */
export async function switchWallet(
  currentId: WalletId | null,
  newId: WalletId,
): Promise<WalletSession> {
  if (currentId && currentId !== newId) {
    await disconnectWallet(currentId);
  }
  return connectWallet(newId);
}

/**
 * Attempt to restore an existing session without user interaction.
 *
 * Iterates registered wallets in registration order and returns the first
 * active session found (e.g. Freighter extension already permitted this site).
 *
 * Returns `null` when no session can be restored.
 */
export async function restoreSession(): Promise<WalletSession | null> {
  const ids = walletRegistry.ids();
  for (const id of ids) {
    try {
      const adapter = getAdapter(id);
      const session = await adapter.getActiveSession();
      if (session) {
        return { ...session, walletId: id };
      }
    } catch {
      // Continue to next adapter.
    }
  }
  return null;
}

/**
 * Poll an active adapter for account/network changes.
 * Returns `null` when the adapter reports the session has ended.
 */
export async function pollSession(id: WalletId): Promise<WalletSession | null> {
  try {
    const adapter = getAdapter(id);
    const session = await adapter.getActiveSession();
    if (!session) return null;
    return { ...session, walletId: id };
  } catch {
    return null;
  }
}

/**
 * Sign a prepared Stellar transaction using a registered wallet adapter.
 */
export async function signWalletTransaction(
  id: WalletId,
  transactionXdr: string,
  options: {
    networkPassphrase: string;
    accountToSign: string;
  },
): Promise<string> {
  const adapter = getAdapter(id);

  if (!adapter.meta.capabilities.signTransaction || !adapter.signTransaction) {
    throw new WalletAdapterError(
      "NOT_AVAILABLE",
      `${adapter.meta.label} does not support transaction signing.`,
    );
  }

  try {
    return await adapter.signTransaction(transactionXdr, options);
  } catch (error) {
    if (error instanceof WalletAdapterError) {
      throw error;
    }

    throw new WalletAdapterError(
      "UNKNOWN",
      `Failed to sign transaction with ${adapter.meta.label}.`,
      error,
    );
  }
}
