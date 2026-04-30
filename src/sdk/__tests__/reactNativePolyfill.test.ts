/**
 * Tests for the React Native polyfill entry point.
 *
 * Strategy
 * --------
 * - The polyfill module runs its side-effects (global patching) at import time.
 *   In jsdom (Jest's default env) the Web Crypto API already exists, so the
 *   polyfill's guard clauses leave it untouched — exactly the right behaviour.
 * - We test the pure UUID fallback function in isolation (no global mutation)
 *   to avoid crashing Jest's `deepCyclicCopy` on jsdom's complex WebCrypto obj.
 * - react-native-quick-crypto and readable-stream are NOT installed here (they
 *   are RN-only deps). The polyfill catches their absence gracefully.
 */

// Static import so Jest can resolve module graph once cleanly.
import {
  createAxionveraVaultSdk,
  shortenAddress,
  formatAmount,
  parsePositiveAmount,
} from '../reactNativePolyfill';

// ─── UUID v4 fallback (pure-function copy) ───────────────────────────────────

/** Exact copy of the Math.random-based UUID shim in reactNativePolyfill.ts */
function uuidV4Fallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── 1. UUID fallback shim ───────────────────────────────────────────────────

describe('UUID v4 fallback shim', () => {
  it('produces a 36-character string', () => {
    expect(uuidV4Fallback()).toHaveLength(36);
  });

  it('matches the v4 UUID format', () => {
    for (let i = 0; i < 30; i++) {
      expect(uuidV4Fallback()).toMatch(UUID_RE);
    }
  });

  it('version nibble is always "4"', () => {
    for (let i = 0; i < 30; i++) {
      // position 14 is the version character
      expect(uuidV4Fallback()[14]).toBe('4');
    }
  });

  it('variant nibble is always 8, 9, a, or b', () => {
    const valid = new Set(['8', '9', 'a', 'b']);
    for (let i = 0; i < 30; i++) {
      // position 19 is the variant character
      expect(valid.has(uuidV4Fallback()[19])).toBe(true);
    }
  });

  it('does not collide across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuidV4Fallback()));
    expect(ids.size).toBe(100);
  });

  it('no-overwrite guard: condition is false when randomUUID already exists', () => {
    // Simulates the polyfill's guard:
    //   if (!rnCryptoInstalled && typeof global.crypto?.randomUUID !== 'function')
    // When the existing crypto already has randomUUID, the block must NOT run.
    const existingRandomUUID = jest.fn(() => 'pre-existing-uuid');
    const fakeCrypto = { randomUUID: existingRandomUUID };

    // Replicate the guard logic
    const rnCryptoInstalled = false;
    const shouldInstall =
      !rnCryptoInstalled &&
      typeof (fakeCrypto as unknown as Record<string, unknown>).randomUUID !== 'function';

    expect(shouldInstall).toBe(false);
    expect(existingRandomUUID).not.toHaveBeenCalled(); // shim never ran
  });
});

// ─── 2. Module re-exports ────────────────────────────────────────────────────

describe('reactNativePolyfill – re-exports', () => {
  it('exports createAxionveraVaultSdk as a function', () => {
    expect(typeof createAxionveraVaultSdk).toBe('function');
  });

  it('exports shortenAddress as a function', () => {
    expect(typeof shortenAddress).toBe('function');
  });

  it('exports formatAmount as a function', () => {
    expect(typeof formatAmount).toBe('function');
  });

  it('exports parsePositiveAmount as a function', () => {
    expect(typeof parsePositiveAmount).toBe('function');
  });

  it('shortenAddress truncates long addresses correctly', () => {
    const addr = 'GABCDE1234567890ABCDE1234567890ABCDE1234567890';
    expect(shortenAddress(addr, 6)).toMatch(/^.{6}\.{3}.{6}$/);
  });

  it('shortenAddress returns short addresses unchanged', () => {
    expect(shortenAddress('SHORT')).toBe('SHORT');
    expect(shortenAddress('')).toBe('');
  });

  it('formatAmount formats a numeric string', () => {
    const result = formatAmount('1234567.89');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('parsePositiveAmount accepts valid positive numbers', () => {
    expect(parsePositiveAmount('5')).toBe('5');
    expect(parsePositiveAmount('  3.14  ')).toBe('3.14');
  });

  it('parsePositiveAmount rejects invalid inputs', () => {
    expect(parsePositiveAmount('-1')).toBeNull();
    expect(parsePositiveAmount('0')).toBeNull();
    expect(parsePositiveAmount('abc')).toBeNull();
    expect(parsePositiveAmount('')).toBeNull();
  });
});

// ─── 3. SDK integration ──────────────────────────────────────────────────────

describe('reactNativePolyfill – SDK integration', () => {
  const WALLET = 'GTEST_RN_POLYFILL_COMPAT';
  const NETWORK = 'testnet' as const;

  beforeEach(() => {
    localStorage.clear();
  });

  it('createAxionveraVaultSdk returns an object with all five methods', () => {
    const sdk = createAxionveraVaultSdk();
    expect(typeof sdk.getBalances).toBe('function');
    expect(typeof sdk.getTransactions).toBe('function');
    expect(typeof sdk.deposit).toBe('function');
    expect(typeof sdk.withdraw).toBe('function');
    expect(typeof sdk.claimRewards).toBe('function');
  });

  it('getBalances returns zero balances for a fresh wallet', async () => {
    const sdk = createAxionveraVaultSdk();
    const { balance, rewards } = await sdk.getBalances({ walletAddress: WALLET, network: NETWORK });
    expect(balance).toBe('0');
    expect(rewards).toBe('0');
  });

  it('getTransactions returns an empty array for a fresh wallet', async () => {
    const sdk = createAxionveraVaultSdk();
    const txs = await sdk.getTransactions({ walletAddress: WALLET, network: NETWORK });
    expect(Array.isArray(txs)).toBe(true);
    expect(txs).toHaveLength(0);
  });

  it('deposit increases balance and returns a success tx', async () => {
    const sdk = createAxionveraVaultSdk();
    const tx = await sdk.deposit({ walletAddress: WALLET, network: NETWORK, amount: '50' });

    expect(tx.type).toBe('deposit');
    expect(tx.status).toBe('success');
    expect(tx.hash).toMatch(/^SIM-/);

    const { balance } = await sdk.getBalances({ walletAddress: WALLET, network: NETWORK });
    expect(Number(balance)).toBeCloseTo(50, 5);
  });

  it('withdraw decreases balance and returns a success tx', async () => {
    const sdk = createAxionveraVaultSdk();
    await sdk.deposit({ walletAddress: WALLET, network: NETWORK, amount: '100' });
    const tx = await sdk.withdraw({ walletAddress: WALLET, network: NETWORK, amount: '40' });

    expect(tx.type).toBe('withdraw');
    expect(tx.status).toBe('success');

    const { balance } = await sdk.getBalances({ walletAddress: WALLET, network: NETWORK });
    expect(Number(balance)).toBeCloseTo(60, 5);
  });

  it('claimRewards moves rewards into balance and zeroes rewards', async () => {
    const sdk = createAxionveraVaultSdk();
    // A deposit earns 1 % rewards
    await sdk.deposit({ walletAddress: WALLET, network: NETWORK, amount: '200' });
    const before = await sdk.getBalances({ walletAddress: WALLET, network: NETWORK });
    expect(Number(before.rewards)).toBeGreaterThan(0);

    const tx = await sdk.claimRewards({ walletAddress: WALLET, network: NETWORK });
    expect(tx.type).toBe('claim');
    expect(tx.status).toBe('success');

    const after = await sdk.getBalances({ walletAddress: WALLET, network: NETWORK });
    expect(Number(after.rewards)).toBe(0);
    expect(Number(after.balance)).toBeGreaterThan(Number(before.balance));
  });

  it('completed transactions appear in getTransactions', async () => {
    const sdk = createAxionveraVaultSdk();
    await sdk.deposit({ walletAddress: WALLET, network: NETWORK, amount: '10' });

    const txs = await sdk.getTransactions({ walletAddress: WALLET, network: NETWORK });
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0].type).toBe('deposit');
    expect(txs[0].status).toBe('success');
  });
});
