import { pollTransaction, TransactionTimeoutError, type TxStep } from "@/utils/pollTransaction";
import type { AxionveraVaultSdk, VaultTx } from "@/utils/contractHelpers";

function makeSdk(txs: VaultTx[]): AxionveraVaultSdk {
  return {
    getBalances: async () => ({ balance: "0", rewards: "0" }),
    getTransactions: async () => txs,
    deposit: async () => txs[0],
    withdraw: async () => txs[0],
    claimRewards: async () => txs[0],
    simulateTransaction: async () => ({ cpuInstructions: 0, ramBytes: 0, ledgerEntries: 0, maxFee: "0", estimatedFee: "0" }),
  };
}

describe("pollTransaction", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("resolves with 'confirmed' step when tx reaches success", async () => {
    const tx: VaultTx = { id: "1", type: "deposit", amount: "10", status: "success", hash: "HASH1", createdAt: "" };
    const sdk = makeSdk([tx]);
    const steps: TxStep[] = [];

    const promise = pollTransaction({
      walletAddress: "GTEST",
      network: "testnet",
      hash: "HASH1",
      sdk,
      onStep: (s) => steps.push(s),
      intervalMs: 100,
      timeoutMs: 5000,
    });

    await jest.runAllTimersAsync();
    await promise;

    expect(steps).toContain("submitted");
    expect(steps).toContain("confirming");
    expect(steps[steps.length - 1]).toBe("confirmed");
  });

  test("throws TransactionTimeoutError after timeout", async () => {
    const tx: VaultTx = { id: "1", type: "deposit", amount: "10", status: "pending", hash: "HASH2", createdAt: "" };
    const sdk = makeSdk([tx]);

    const promise = pollTransaction({
      walletAddress: "GTEST",
      network: "testnet",
      hash: "HASH2",
      sdk,
      intervalMs: 100,
      timeoutMs: 300,
    });

    await jest.runAllTimersAsync();
    await expect(promise).rejects.toBeInstanceOf(TransactionTimeoutError);
  });

  test("throws on failed tx status", async () => {
    const tx: VaultTx = { id: "1", type: "deposit", amount: "10", status: "failed", hash: "HASH3", createdAt: "" };
    const sdk = makeSdk([tx]);

    const promise = pollTransaction({
      walletAddress: "GTEST",
      network: "testnet",
      hash: "HASH3",
      sdk,
      intervalMs: 100,
      timeoutMs: 5000,
    });

    await jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow(/failed on-chain/i);
  });
});
