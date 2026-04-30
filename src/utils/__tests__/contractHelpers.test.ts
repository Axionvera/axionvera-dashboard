import {
  shortenAddress,
  formatAmount,
  parsePositiveAmount,
  createAxionveraVaultSdk
} from '../contractHelpers';

const ASSET_ID = 'native-xlm';
const ASSET_SYMBOL = 'XLM';

jest.mock('../apiResilience', () => ({
  withApiResilience: <T>(fn: T): T => fn,
  withErrorHandling: <T>(fn: T): T => fn,
  safeApiCall: async <T>(fn: () => Promise<T>): Promise<{ data: T }> => ({ data: await fn() }),
import {
  shortenAddress,
  formatAmount,
  parsePositiveAmount,
  createAxionveraVaultSdk,
} from "../contractHelpers";

const mockSimulateTransaction = jest.fn();
const mockSendTransaction = jest.fn();
const mockGetTransaction = jest.fn();
const mockGetAccount = jest.fn();
const mockPrepareTransaction = jest.fn();

// A fake built tx object returned by TransactionBuilder.build()
const mockBuiltTx = { toXDR: () => "FAKE_XDR", toEnvelope: () => ({}) };

jest.mock("stellar-sdk", () => {
  const actual = jest.requireActual("stellar-sdk");

  class MockServer {
    simulateTransaction = mockSimulateTransaction;
    sendTransaction = mockSendTransaction;
    getTransaction = mockGetTransaction;
    getAccount = mockGetAccount;
    prepareTransaction = mockPrepareTransaction;
  }

  class MockContract {
    constructor(_id: string) {}
    call(_method: string, ..._args: any[]) {
      return { type: "invokeHostFunction" };
    }
  }

  class MockTransactionBuilder {
    constructor(_account: any, _opts: any) {}
    addOperation(_op: any) { return this; }
    setTimeout(_t: number) { return this; }
    build() { return mockBuiltTx; }
    static fromXDR(_xdr: string, _network: string) { return mockBuiltTx; }
  }

  return {
    ...actual,
    Contract: MockContract,
    TransactionBuilder: MockTransactionBuilder,
    BASE_FEE: "100",
    nativeToScVal: actual.nativeToScVal,
    scValToNative: actual.scValToNative,
    SorobanRpc: {
      ...actual.SorobanRpc,
      Server: MockServer,
      Api: {
        ...actual.SorobanRpc?.Api,
        GetTransactionStatus: { SUCCESS: "SUCCESS", FAILED: "FAILED", NOT_FOUND: "NOT_FOUND" },
        isSimulationError: (r: any) => r?.error !== undefined,
      },
    },
  };
});

jest.mock("../apiResilience", () => ({
  withApiResilience: (fn: any) => fn,
  withErrorHandling: (fn: any) => fn,
  safeApiCall: async (fn: any) => ({ data: await fn() }),
}));

jest.mock('../networkConfig', () => ({
  NETWORK: 'testnet',
}));

describe('contractHelpers utility', () => {
  describe('parsePositiveAmount', () => {
    it('should parse valid positive amounts', () => {
      expect(parsePositiveAmount('10.5')).toBe('10.5');
    });
import { nativeToScVal } from "stellar-sdk";

function makeSimSuccess(retval: any) {
  return { result: { retval }, minResourceFee: "100", transactionData: "" };
}

function makeI128ScVal(value: bigint) {
  return nativeToScVal(value, { type: "i128" });
}

// ---------------------------------------------------------------------------
// Utility tests
// ---------------------------------------------------------------------------

describe("shortenAddress", () => {
  it("shortens a long address", () => {
    expect(shortenAddress("GABC123456789XYZ", 3)).toBe("GAB...XYZ");
  });
  it("returns empty string for empty input", () => {
    expect(shortenAddress("")).toBe("");
  });
  it("returns original if already short enough", () => {
    expect(shortenAddress("ABC", 6)).toBe("ABC");
  });
});

describe("formatAmount", () => {
  it("formats numbers with thousands separator", () => {
    expect(formatAmount("1000")).toBe("1,000");
  });
  it("returns original for non-numeric input", () => {
    expect(formatAmount("abc")).toBe("abc");
  });
});

describe("parsePositiveAmount", () => {
  it("accepts valid positive amounts", () => {
    expect(parsePositiveAmount("10.5")).toBe("10.5");
    expect(parsePositiveAmount("1")).toBe("1");
  });
  it("rejects zero, negative, and non-numeric input", () => {
    expect(parsePositiveAmount("0")).toBeNull();
    expect(parsePositiveAmount("-1")).toBeNull();
    expect(parsePositiveAmount("abc")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SDK integration tests
// ---------------------------------------------------------------------------

describe("createAxionveraVaultSdk", () => {
  const WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  const NETWORK = "testnet" as const;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccount.mockResolvedValue({});
    mockPrepareTransaction.mockResolvedValue(mockBuiltTx);
  });

  describe("getBalances", () => {
    it("returns balance and rewards from contract view calls", async () => {
      mockSimulateTransaction
        .mockResolvedValueOnce(makeSimSuccess(makeI128ScVal(1_000_000_000n))) // balance = 100
        .mockResolvedValueOnce(makeSimSuccess(makeI128ScVal(100_000_000n)));  // rewards = 10

      const sdk = createAxionveraVaultSdk();
      const result = await sdk.getBalances({ walletAddress: WALLET, network: NETWORK });
  describe('createAxionveraVaultSdk', () => {
    let sdk: ReturnType<typeof createAxionveraVaultSdk>;
    const mockStorage: Record<string, string> = {};

    beforeAll(() => {
      // Mock window and localStorage globally for this test suite
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, val: string) => {
          mockStorage[key] = val;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        }),
      };

      if (typeof window === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).window = { localStorage: mockLocalStorage } as unknown as Window &
          typeof globalThis;
      } else {
        Object.defineProperty(window, 'localStorage', {
          value: mockLocalStorage,
          writable: true,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sdk: any;

    beforeAll(() => {
      (global as any).crypto = {
        randomUUID: () => 'test-uuid',
      } as unknown as Crypto;
    });

    beforeEach(() => {
      localStorage.clear();
      sdk = createAxionveraVaultSdk();
      // Clear mockStorage manually
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    });

    afterAll(() => {
      localStorage.clear();
    });

    it('should get balances (mocked)', async () => {
      const balances = await sdk.getBalances({ walletAddress: 'G_BAL', network: 'testnet', assetId: ASSET_ID });
      expect(balances).toEqual({ balance: '0', rewards: '0' });
    });

    it("throws when RPC simulation fails", async () => {
      mockSimulateTransaction.mockResolvedValue({ error: "ledger closed" });

      const sdk = createAxionveraVaultSdk();
      await expect(
        sdk.getBalances({ walletAddress: WALLET, network: NETWORK })
      ).rejects.toThrow("Simulation failed");
    it('should deposit (mocked)', async () => {
      const tx = await sdk.deposit({
        walletAddress: 'G_DEP',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });
      expect(tx.status).toBe('success');
      expect(tx.amount).toBe('100');

      const balances = await sdk.getBalances({ walletAddress: 'G_DEP', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('100');
    });
  });

  describe("getTransactions", () => {
    it("returns an empty array (Horizon history not yet wired up)", async () => {
      const sdk = createAxionveraVaultSdk();
      const txs = await sdk.getTransactions({ walletAddress: WALLET, network: NETWORK });
      expect(txs).toEqual([]);
    it('should withdraw (mocked)', async () => {
      await sdk.deposit({
        walletAddress: 'G_WIT',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });

      const tx = await sdk.withdraw({
        walletAddress: 'G_WIT',
        network: 'testnet',
        amount: '40',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });
      expect(tx.status).toBe('success');

      const balances = await sdk.getBalances({ walletAddress: 'G_WIT', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('60');
    });
  });

  describe("deposit", () => {
    it("throws No compatible wallet in jsdom (no Freighter)", async () => {
      mockSimulateTransaction.mockResolvedValueOnce(makeSimSuccess(makeI128ScVal(0n)));
      const sdk = createAxionveraVaultSdk();
      await expect(
        sdk.deposit({ walletAddress: WALLET, network: NETWORK, amount: "50" })
      ).rejects.toThrow(/No compatible wallet/);
      expect(mockPrepareTransaction).toHaveBeenCalledTimes(1);
    it('should claim rewards (mocked)', async () => {
      await sdk.deposit({
        walletAddress: 'G_CLA',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });

      const tx = await sdk.claimRewards({
        walletAddress: 'G_CLA',
        network: 'testnet',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL
      });
      expect(tx.status).toBe('success');

      const balances = await sdk.getBalances({ walletAddress: 'G_CLA', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('101');
      expect(balances.rewards).toBe('0');
    });
  });

    it('should get transactions (mocked)', async () => {
      await sdk.deposit({
        walletAddress: 'G_TXS',
        network: 'testnet',
        amount: '100',
        assetId: ASSET_ID,
        assetSymbol: ASSET_SYMBOL,
        tokenContractId: null
      });
      const txs = await sdk.getTransactions({ walletAddress: 'G_TXS', network: 'testnet', assetId: ASSET_ID });
      expect(txs.length).toBeGreaterThan(0);
    });

    it('should handle malformed storage gracefully', async () => {
      const key = 'axionvera:vault:testnet:G_MAL';
      mockStorage[key] = 'invalid-json';
  });

  describe("claimRewards", () => {
    it("reads rewards then throws No compatible wallet in jsdom", async () => {
      mockSimulateTransaction
        .mockResolvedValueOnce(makeSimSuccess(makeI128ScVal(1_000_000_000n))) // getBalance
        .mockResolvedValueOnce(makeSimSuccess(makeI128ScVal(50_000_000n)))    // getRewards
        .mockResolvedValueOnce(makeSimSuccess(makeI128ScVal(0n)));             // claim_rewards prepare

      const sdk = createAxionveraVaultSdk();
      await expect(
        sdk.claimRewards({ walletAddress: WALLET, network: NETWORK })
      ).rejects.toThrow(/No compatible wallet/);

      expect(mockSimulateTransaction).toHaveBeenCalledTimes(2);
      expect(mockPrepareTransaction).toHaveBeenCalledTimes(1);

    it('should handle malformed storage gracefully', async () => {
      localStorage.setItem('axionvera:vault:testnet:G_MAL', 'invalid-json');
      const balances = await sdk.getBalances({ walletAddress: 'G_MAL', network: 'testnet', assetId: ASSET_ID });
      expect(balances.balance).toBe('0');
    });
  });
});
