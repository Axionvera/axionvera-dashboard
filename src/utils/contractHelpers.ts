import type { StellarNetwork } from "@/utils/networkConfig";
import { withApiResilience, withErrorHandling, safeApiCall, ApiCallOptions } from "./apiResilience";

export type VaultTxType = "deposit" | "withdraw" | "claim";
export type VaultTxStatus = "pending" | "success" | "failed";

export type VaultTx = {
  id: string;
  type: VaultTxType;
  amount: string;
  status: VaultTxStatus;
  createdAt: string;
  hash?: string;
  assetId?: string;
  assetSymbol?: string;
};

export type VaultBalances = {
  balance: string;
  rewards: string;
};

export type TransactionSimulation = {
  cpuInstructions: number;
  ramBytes: number;
  ledgerEntries: number;
  maxFee: string;
  estimatedFee: string;
};

export type AxionveraVaultSdk = {
  getBalances: (args: { walletAddress: string; network: StellarNetwork; assetId?: string }, options?: ApiCallOptions) => Promise<VaultBalances>;
  getTransactions: (args: { walletAddress: string; network: StellarNetwork; assetId?: string }, options?: ApiCallOptions) => Promise<VaultTx[]>;
  deposit: (
    args: { walletAddress: string; network: StellarNetwork; amount: string; assetId?: string; assetSymbol?: string; tokenContractId?: string | null },
    options?: ApiCallOptions
  ) => Promise<VaultTx>;
  withdraw: (
    args: { walletAddress: string; network: StellarNetwork; amount: string; assetId?: string; assetSymbol?: string; tokenContractId?: string | null },
    options?: ApiCallOptions
  ) => Promise<VaultTx>;
  claimRewards: (
    args: { walletAddress: string; network: StellarNetwork; assetId?: string; assetSymbol?: string },
    options?: ApiCallOptions
  ) => Promise<VaultTx>;
};

// ---------------------------------------------------------------------------
// Stellar network passphrase map
// TODO(axionvera-sdk): replace with StellarClient.networkPassphrase()
// ---------------------------------------------------------------------------

function getNetworkPassphrase(network: StellarNetwork): string {
  switch (network) {
    case "mainnet":
      return Networks.PUBLIC;
    case "futurenet":
      return Networks.FUTURENET;
    case "testnet":
    default:
      return Networks.TESTNET;
  }
}

// ---------------------------------------------------------------------------
// StellarClient — thin wrapper around SorobanRpc.Server
// TODO(axionvera-sdk): replace with `import { StellarClient } from "axionvera-sdk"`
// ---------------------------------------------------------------------------

class StellarClient {
  readonly server: SorobanRpc.Server;
  readonly network: StellarNetwork;

  constructor(rpcUrl: string, network: StellarNetwork) {
    this.server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });
    this.network = network;
  }

  get networkPassphrase(): string {
    return getNetworkPassphrase(this.network);
  }

  async prepareTransaction(tx: ReturnType<TransactionBuilder["build"]>) {
    return this.server.prepareTransaction(tx);
  }

  async sendAndConfirm(
    signedTx: ReturnType<TransactionBuilder["build"]>
  ): Promise<SorobanRpc.Api.GetTransactionResponse & { hash: string }> {
    const sendResult = await this.server.sendTransaction(signedTx);
    if (sendResult.status === "ERROR") {
      throw new Error(`Transaction rejected by network: ${sendResult.errorResult}`);
    }

    const hash = sendResult.hash;
    for (let i = 0; i < 15; i++) {
      await sleep(2000);
      const result = await this.server.getTransaction(hash);
      if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return { ...result, hash };
      }
      if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed on-chain: ${hash}`);
      }
    }
    throw new Error(`Transaction not confirmed after 30 s: ${hash}`);
  }
}

// ---------------------------------------------------------------------------
// VaultContract — wraps the Soroban contract interface
// TODO(axionvera-sdk): replace with `import { VaultContract } from "axionvera-sdk"`
// ---------------------------------------------------------------------------

const STROOPS_PER_UNIT = 10_000_000n;

function toStroops(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt(fracPadded);
}

function fromStroops(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_UNIT;
  const frac = stroops % STROOPS_PER_UNIT;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(7, "0").replace(/0+$/, "")}`;
}

type StoredVault = {
  balances: Record<string, string>;
  rewards: Record<string, string>;
  txs: VaultTx[];
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Public utility functions
// ---------------------------------------------------------------------------

export function shortenAddress(address: string, chars = 6): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
function loadVault(walletAddress: string, network: StellarNetwork): StoredVault {
  if (typeof window === "undefined") return { balances: {}, rewards: {}, txs: [] };
  const raw = window.localStorage.getItem(getStorageKey(walletAddress, network));
  if (!raw) return { balances: {}, rewards: {}, txs: [] };
  try {
    const parsed = JSON.parse(raw) as StoredVault & { balance?: string; rewards?: string };
    const legacyBalance = typeof parsed.balance === "string" ? parsed.balance : undefined;
    const legacyRewards = typeof parsed.rewards === "string" ? parsed.rewards : undefined;
    return {
      balances:
        parsed.balances && typeof parsed.balances === "object"
          ? parsed.balances
          : legacyBalance
            ? { "native-xlm": legacyBalance }
            : {},
      rewards:
        parsed.rewards && typeof parsed.rewards === "object"
          ? parsed.rewards
          : legacyRewards
            ? { "native-xlm": legacyRewards }
            : {},
      txs: Array.isArray(parsed.txs) ? parsed.txs : []
    };
  } catch {
    return { balances: {}, rewards: {}, txs: [] };
  }
}

function saveVault(walletAddress: string, network: StellarNetwork, vault: StoredVault) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(walletAddress, network), JSON.stringify(vault));
export function formatAmount(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 7 }).format(n);
}

export function parsePositiveAmount(input: string): string | null {
  const trimmed = input.trim();
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return trimmed;
}

function resolveAssetId(assetId?: string) {
  return assetId ?? "native-xlm";
}

function resolveAssetSymbol(assetId?: string, assetSymbol?: string) {
  if (assetSymbol) return assetSymbol;
  return resolveAssetId(assetId) === "native-xlm" ? "XLM" : resolveAssetId(assetId).toUpperCase();
}

export function createAxionveraVaultSdk(): AxionveraVaultSdk {
  const baseSdk = {
    async getBalances({ walletAddress, network, assetId }: { walletAddress: string; network: StellarNetwork; assetId?: string }) {
      await sleep(150);
      const vault = loadVault(walletAddress, network);
      const resolvedAssetId = resolveAssetId(assetId);
      return {
        balance: vault.balances[resolvedAssetId] ?? "0",
        rewards: vault.rewards[resolvedAssetId] ?? "0"
      };
    },
    async getTransactions({ walletAddress, network, assetId }: { walletAddress: string; network: StellarNetwork; assetId?: string }) {
      await sleep(150);
      const vault = loadVault(walletAddress, network);
      const resolvedAssetId = resolveAssetId(assetId);
      return vault.txs.filter((tx) => (tx.assetId ?? "native-xlm") === resolvedAssetId);
    },
    async deposit({
      walletAddress,
      network,
      amount,
      assetId,
      assetSymbol
    }: {
      walletAddress: string;
      network: StellarNetwork;
      amount: string;
      assetId?: string;
      assetSymbol?: string;
      tokenContractId?: string | null;
    }) {
      const resolvedAssetId = resolveAssetId(assetId);
      const resolvedAssetSymbol = resolveAssetSymbol(assetId, assetSymbol);
      const tx: VaultTx = {
        id: createId(),
        type: 'deposit',
        amount,
        status: 'pending',
    async getBalances({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const vault = loadVault(walletAddress, network);
      return { balance: vault.balance, rewards: vault.rewards };
    },

    async getTransactions({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const vault = loadVault(walletAddress, network);
      return vault.txs;
    },

    async deposit({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }) {
      const txId = createId();

      // ✅ always reload fresh state
      const vault = loadVault(walletAddress, network);

      const tx: VaultTx = {
        id: txId,
        type: "deposit",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
        assetId: resolvedAssetId,
        assetSymbol: resolvedAssetSymbol
      };
      const preparedTx = await vault.buildDepositTx(walletAddress, amount);
      const signedXdr = await signTransactionWithWallet(preparedTx.toXDR(), network);
      const { TransactionBuilder: TB } = await import("stellar-sdk");
      const signedTx = TB.fromXDR(signedXdr, stellarClient.networkPassphrase);
      const result = await stellarClient.sendAndConfirm(signedTx as any);
      return { ...pendingTx, status: "success", hash: result.hash ?? pendingTx.id };
    },

      const vault = loadVault(walletAddress, network);
      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Number(vault.balance) + Number(amount);
      const rewards = Number(vault.rewards) + Number(amount) * 0.01;
      const completed: VaultTx = { ...tx, status: 'success', hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balance: toFixedString(balance),
        rewards: toFixedString(rewards),
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25),
    async withdraw({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }): Promise<VaultTx> {
      const pendingTx: VaultTx = {
        id: createId(),
        type: "withdraw",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const preparedTx = await vault.buildWithdrawTx(walletAddress, amount);
      const signedXdr = await signTransactionWithWallet(preparedTx.toXDR(), network);
      const { TransactionBuilder: TB } = await import("stellar-sdk");
      const signedTx = TB.fromXDR(signedXdr, stellarClient.networkPassphrase);
      const result = await stellarClient.sendAndConfirm(signedTx as any);
      return { ...pendingTx, status: "success", hash: result.hash ?? pendingTx.id };
    },

    async claimRewards({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }): Promise<VaultTx> {
      const { rewards } = await baseSdk.getBalances({ walletAddress, network });
      const pendingTx: VaultTx = {
        id: createId(),
        type: "claim",
        amount: rewards,

      saveVault(walletAddress, network, {
        ...vault,
        txs: [tx, ...vault.txs].slice(0, 25)
      });

      await sleep(1); // fast for tests

      const fresh = loadVault(walletAddress, network);

      const nextBalance = Number(fresh.balance) + Number(amount);
      const nextRewards = Number(fresh.rewards) + Number(amount) * 0.01;

      const completed: VaultTx = {
        ...tx,
        status: "success",
        hash: `SIM-${createId()}`
      };

      saveVault(walletAddress, network, {
        balance: toFixedString(nextBalance),
        rewards: toFixedString(nextRewards),
        txs: [completed, ...fresh.txs.filter(t => t.id !== txId)].slice(0, 25)
      });

      return completed;
    },
    async withdraw({
      walletAddress,
      network,
      amount,
      assetId,
      assetSymbol
    }: {
      walletAddress: string;
      network: StellarNetwork;
      amount: string;
      assetId?: string;
      assetSymbol?: string;
      tokenContractId?: string | null;
    }) {
      const resolvedAssetId = resolveAssetId(assetId);
      const resolvedAssetSymbol = resolveAssetSymbol(assetId, assetSymbol);
      const tx: VaultTx = {
        id: createId(),
        type: 'withdraw',

    async withdraw({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }) {
      const txId = createId();

      const vault = loadVault(walletAddress, network);

      const tx: VaultTx = {
        id: txId,
        type: "withdraw",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
        assetId: resolvedAssetId,
        assetSymbol: resolvedAssetSymbol
      };

      saveVault(walletAddress, network, {
        ...vault,
        txs: [tx, ...vault.txs].slice(0, 25)
      });

      await sleep(450);
      const balance = Math.max(0, Number(vault.balances[resolvedAssetId] ?? "0") - Number(amount));
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balances: {
          ...vault.balances,
          [resolvedAssetId]: toFixedString(balance)
        },
        rewards: vault.rewards,
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25),
      await sleep(1);

      const fresh = loadVault(walletAddress, network);

      const nextBalance = Math.max(0, Number(fresh.balance) - Number(amount));

      const completed: VaultTx = {
        ...tx,
        status: "success",
        hash: `SIM-${createId()}`
      };

      saveVault(walletAddress, network, {
        balance: toFixedString(nextBalance),
        rewards: fresh.rewards,
        txs: [completed, ...fresh.txs.filter(t => t.id !== txId)].slice(0, 25)
      });

      return completed;
    },
    async claimRewards({
      walletAddress,
      network,
      assetId,
      assetSymbol
    }: {
      walletAddress: string;
      network: StellarNetwork;
      assetId?: string;
      assetSymbol?: string;
    }) {
      const resolvedAssetId = resolveAssetId(assetId);
      const resolvedAssetSymbol = resolveAssetSymbol(assetId, assetSymbol);
      const vault = loadVault(walletAddress, network);
      const amount = vault.rewards[resolvedAssetId] ?? "0";
      const tx: VaultTx = {
        id: createId(),
        type: 'claim',
        amount,
        status: 'pending',
        id: txId,
        type: "claim",
        amount: vault.rewards,
        status: "pending",
        createdAt: new Date().toISOString(),
        assetId: resolvedAssetId,
        assetSymbol: resolvedAssetSymbol
      };
      const preparedTx = await vault.buildClaimRewardsTx(walletAddress);
      const signedXdr = await signTransactionWithWallet(preparedTx.toXDR(), network);
      const { TransactionBuilder: TB } = await import("stellar-sdk");
      const signedTx = TB.fromXDR(signedXdr, stellarClient.networkPassphrase);
      const result = await stellarClient.sendAndConfirm(signedTx as any);
      return { ...pendingTx, status: "success", hash: result.hash ?? pendingTx.id };
    },
  };

  return {
    getBalances: withErrorHandling(withApiResilience(baseSdk.getBalances, { timeout: 8000, retries: 2 }), "getBalances"),
    getTransactions: withErrorHandling(withApiResilience(baseSdk.getTransactions, { timeout: 8000, retries: 2 }), "getTransactions"),
    deposit: withErrorHandling(withApiResilience(baseSdk.deposit, { timeout: 60000, retries: 1 }), "deposit"),
    withdraw: withErrorHandling(withApiResilience(baseSdk.withdraw, { timeout: 60000, retries: 1 }), "withdraw"),
    claimRewards: withErrorHandling(withApiResilience(baseSdk.claimRewards, { timeout: 60000, retries: 1 }), "claimRewards"),

      await sleep(450);
      const balance = Number(vault.balances[resolvedAssetId] ?? "0") + Number(vault.rewards[resolvedAssetId] ?? "0");
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balances: {
          ...vault.balances,
          [resolvedAssetId]: toFixedString(balance)
        },
        rewards: {
          ...vault.rewards,
          [resolvedAssetId]: "0"
        },
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };

      saveVault(walletAddress, network, {
        balance: toFixedString(nextBalance),
        rewards: "0",
        txs: [completed, ...fresh.txs.filter(t => t.id !== txId)].slice(0, 25)
      });

      return completed;
    },
  };

  return {
    getBalances: withErrorHandling(
      withApiResilience(baseSdk.getBalances, { timeout: 5000, retries: 2 }),
      'getBalances'
    ),
    getTransactions: withErrorHandling(
      withApiResilience(baseSdk.getTransactions, { timeout: 5000, retries: 2 }),
      'getTransactions'
    ),
    deposit: withErrorHandling(
      withApiResilience(baseSdk.deposit, { timeout: 10000, retries: 1 }),
      'deposit'
    ),
    withdraw: withErrorHandling(
      withApiResilience(baseSdk.withdraw, { timeout: 10000, retries: 1 }),
      'withdraw'
    ),
    claimRewards: withErrorHandling(
      withApiResilience(baseSdk.claimRewards, { timeout: 10000, retries: 1 }),
      'claimRewards'
    ),
    getBalances: withErrorHandling(withApiResilience(baseSdk.getBalances), "getBalances"),
    getTransactions: withErrorHandling(withApiResilience(baseSdk.getTransactions), "getTransactions"),
    deposit: withErrorHandling(withApiResilience(baseSdk.deposit), "deposit"),
    withdraw: withErrorHandling(withApiResilience(baseSdk.withdraw), "withdraw"),
    claimRewards: withErrorHandling(withApiResilience(baseSdk.claimRewards), "claimRewards")
  };
}
