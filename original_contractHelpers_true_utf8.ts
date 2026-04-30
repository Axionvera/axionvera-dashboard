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
};

export type VaultBalances = {
  balance: string;
  rewards: string;
};

export type AxionveraVaultSdk = {
  getBalances: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultBalances>;
  getTransactions: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx[]>;
  deposit: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  withdraw: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  claimRewards: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx>;
};

export function shortenAddress(address: string, chars = 6) {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 7 }).format(n);
}

export function parsePositiveAmount(input: string) {
  const trimmed = input.trim();
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return trimmed;
}

function getStorageKey(walletAddress: string, network: StellarNetwork) {
  return `axionvera:vault:${network}:${walletAddress}`;
}

type StoredVault = {
  balance: string;
  rewards: string;
  txs: VaultTx[];
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadVault(walletAddress: string, network: StellarNetwork): StoredVault {
  if (typeof window === "undefined") return { balance: "0", rewards: "0", txs: [] };
  const raw = window.localStorage.getItem(getStorageKey(walletAddress, network));
  if (!raw) return { balance: "0", rewards: "0", txs: [] };
  try {
    const parsed = JSON.parse(raw) as StoredVault;
    return {
      balance: typeof parsed.balance === "string" ? parsed.balance : "0",
      rewards: typeof parsed.rewards === "string" ? parsed.rewards : "0",
      txs: Array.isArray(parsed.txs) ? parsed.txs : []
    };
  } catch {
    return { balance: "0", rewards: "0", txs: [] };
  }
}

function saveVault(walletAddress: string, network: StellarNetwork, vault: StoredVault) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(walletAddress, network), JSON.stringify(vault));
}

function toFixedString(n: number) {
  return n.toString();
}

export function createAxionveraVaultSdk(): AxionveraVaultSdk {
  // Base implementations without resilience
  const baseSdk = {
    async getBalances({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      await sleep(150);
      const vault = loadVault(walletAddress, network);
      return { balance: vault.balance, rewards: vault.rewards };
    },
    async getTransactions({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      await sleep(150);
      const vault = loadVault(walletAddress, network);
      return vault.txs;
    },
    async deposit({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }) {
      const tx: VaultTx = {
        id: createId(),
        type: "deposit",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const vault = loadVault(walletAddress, network);
      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Number(vault.balance) + Number(amount);
      const rewards = Number(vault.rewards) + Number(amount) * 0.01;
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balance: toFixedString(balance),
        rewards: toFixedString(rewards),
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };
      saveVault(walletAddress, network, next);
      return completed;
    },
    async withdraw({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }) {
      const tx: VaultTx = {
        id: createId(),
        type: "withdraw",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const vault = loadVault(walletAddress, network);
      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Math.max(0, Number(vault.balance) - Number(amount));
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balance: toFixedString(balance),
        rewards: vault.rewards,
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };
      saveVault(walletAddress, network, next);
      return completed;
    },
    async claimRewards({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const vault = loadVault(walletAddress, network);
      const amount = vault.rewards;
      const tx: VaultTx = {
        id: createId(),
        type: "claim",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Number(vault.balance) + Number(vault.rewards);
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balance: toFixedString(balance),
        rewards: "0",
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };
      saveVault(walletAddress, network, next);
      return completed;
    }
  };

  // Wrap all methods with resilience and error handling
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
    )
  };
}
