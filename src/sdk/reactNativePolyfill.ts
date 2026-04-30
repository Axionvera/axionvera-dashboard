/* eslint-disable */
/**
 * React Native / Expo Compatibility Layer
 * ----------------------------------------
 * Import this file INSTEAD of importing from `contractHelpers` directly
 * in any React Native or Expo project.  It installs the required polyfills
 * for the Node.js core modules that are missing in the React Native runtime
 * before the SDK code runs.
 *
 * Usage:
 *   import { createAxionveraVaultSdk } from '@/sdk/reactNativePolyfill';
 *
 * See REACT_NATIVE.md in the repo root for the full Metro / Babel setup guide.
 */

// ---------------------------------------------------------------------------
// 1. crypto
//    `react-native-quick-crypto` is a JSI-based drop-in for Node's `crypto`.
//    It also installs itself as `global.crypto` so `crypto.randomUUID()` works.
// ---------------------------------------------------------------------------
let rnCryptoInstalled = false;
try {
  // @ts-expect-error - Optional dependency for React Native environments
  const QuickCrypto = require('react-native-quick-crypto') as typeof import('react-native-quick-crypto');
  if (typeof global.crypto === 'undefined') {
    // Provide a minimal Web Crypto-compatible object so existing code paths
    // that guard with `typeof crypto !== "undefined"` work correctly.
    (global as unknown as Record<string, unknown>).crypto = QuickCrypto;
  }
  rnCryptoInstalled = true;
} catch {
  // react-native-quick-crypto not installed – fall through to the UUID shim below.
}

// ---------------------------------------------------------------------------
// 2. buffer
//    The `buffer` npm package mirrors Node's Buffer on all platforms.
// ---------------------------------------------------------------------------
try {
  const { Buffer: PolyfillBuffer } = require('buffer') as typeof import('buffer');
  if (typeof global.Buffer === 'undefined') {
    (global as unknown as Record<string, unknown>).Buffer = PolyfillBuffer;
  }
} catch {
  // `buffer` package not installed – Buffer will remain unavailable.
}

// ---------------------------------------------------------------------------
// 3. stream
//    `readable-stream` is the userland port of Node's stream module and works
//    in React Native without any native modules.
// ---------------------------------------------------------------------------
try {
  const { Readable, Writable, Transform, PassThrough } =
    require('readable-stream') as typeof import('readable-stream');
  const g = global as unknown as Record<string, unknown>;
  if (!g.Readable) g.Readable = Readable;
  if (!g.Writable) g.Writable = Writable;
  if (!g.Transform) g.Transform = Transform;
  if (!g.PassThrough) g.PassThrough = PassThrough;
} catch {
  // `readable-stream` not installed.
}

// ---------------------------------------------------------------------------
// 4. UUID shim
//    If react-native-quick-crypto was not installed we provide a lightweight
//    UUID v4 generator that only relies on Math.random as a last resort.
//    This keeps the SDK functional (though cryptographically weaker) for
//    development / CI environments where native modules are unavailable.
// ---------------------------------------------------------------------------
if (!rnCryptoInstalled && typeof global.crypto?.randomUUID !== 'function') {
  const g = global as unknown as Record<string, unknown>;
  if (!g.crypto) g.crypto = {};
  const cryptoGlobal = g.crypto as Record<string, unknown>;
  cryptoGlobal.randomUUID = function randomUUIDFallback(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

// ---------------------------------------------------------------------------
// Re-export everything from the SDK so callers just swap the import path.
// ---------------------------------------------------------------------------
export {
  createAxionveraVaultSdk,
  shortenAddress,
  formatAmount,
  parsePositiveAmount,
} from '@/utils/contractHelpers';

export type {
  AxionveraVaultSdk,
  VaultTx,
  VaultTxType,
  VaultTxStatus,
  VaultBalances,
} from '@/utils/contractHelpers';
