import type { StellarNetwork } from "@/utils/networkConfig";
import { withApiResilience, withErrorHandling, safeApiCall, ApiCallOptions } from "./apiResilience";
import { cache } from "./cache";

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

export type HistoricalBalancePoint = {
  timestamp: string;
  balance: string;
  rewards: string;
};

export type RewardPerformance = {
  totalRewardsEarned: string;
  averageRewardRate: string; // percentage
  lastRewardDate: string | null;
};

export type VaultParticipationMetrics = {
  totalDeposits: string;
  totalWithdrawals: string;
  netDeposits: string;
  transactionCount: number;
  firstInteractionDate: string | null;
  lastInteractionDate: string | null;
  activeDays: number;
};

export type AnalyticsData = {
  historicalBalances: HistoricalBalancePoint[];
  rewardPerformance: RewardPerformance;
  participationMetrics: VaultParticipationMetrics;
};

export type AxionveraVaultSdk = {
  getBalances: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultBalances>;
  getTransactions: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx[]>;
  deposit: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  withdraw: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  claimRewards: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx>;
  getAnalytics: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<AnalyticsData>;
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

/** Cache TTLs (ms) */
const CACHE_TTL = {
  balances: 30_000,
  transactions: 60_000,
  analytics: 120_000,
} as const;

function walletTag(walletAddress: string) {
  return `wallet:${walletAddress}`;
}


export function createAxionveraVaultSdk(): AxionveraVaultSdk {
  // Base implementations without resilience
  const baseSdk = {
    async getBalances({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const key = `balances:${network}:${walletAddress}`;
      return cache.getOrFetch(
        key,
        async () => {
          await sleep(150);
          const vault = loadVault(walletAddress, network);
          return { balance: vault.balance, rewards: vault.rewards };
        },
        { ttl: CACHE_TTL.balances, swr: true, tags: [walletTag(walletAddress)] },
      );
    },
    async getTransactions({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const key = `transactions:${network}:${walletAddress}`;

      return cache.getOrFetch(
        key,
        async () => {
          const response = await fetch(
            `/api/vault/transactions?user=${encodeURIComponent(walletAddress)}`,
          );

          const body = (await response.json()) as {
            transactions?: VaultTx[];
            error?: string;
          };

          if (!response.ok) {
            throw new Error(
              body.error ?? "Failed to load transaction history",
            );
          }

          return body.transactions ?? [];
        },
        {
          ttl: CACHE_TTL.transactions,
          swr: true,
          tags: [walletTag(walletAddress)],
        },
      );
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
      cache.invalidateByTag(walletTag(walletAddress));
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
      cache.invalidateByTag(walletTag(walletAddress));
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
      cache.invalidateByTag(walletTag(walletAddress));
      return completed;
    },
    async getAnalytics({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const key = `analytics:${network}:${walletAddress}`;
      return cache.getOrFetch(
        key,
        async () => {
          await sleep(200);
          const vault = loadVault(walletAddress, network);
          const txs = vault.txs.filter(tx => tx.status === "success");
      
          // Generate historical balances (last 30 days)
          const historicalBalances: HistoricalBalancePoint[] = [];
          let currentBalance = 0;
          let currentRewards = 0;
          const now = new Date();
      
          for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const timestamp = date.toISOString();
        
            // Simulate balance changes based on transactions
            const txsOnDay = txs.filter(tx => {
              const txDate = new Date(tx.createdAt);
              return txDate.toDateString() === date.toDateString();
            });
        
            txsOnDay.forEach(tx => {
              if (tx.type === "deposit") {
                currentBalance += Number(tx.amount);
                currentRewards += Number(tx.amount) * 0.01;
              } else if (tx.type === "withdraw") {
                currentBalance = Math.max(0, currentBalance - Number(tx.amount));
              } else if (tx.type === "claim") {
                currentBalance += currentRewards;
                currentRewards = 0;
              }
            });
        
            historicalBalances.push({
              timestamp,
              balance: toFixedString(currentBalance),
              rewards: toFixedString(currentRewards)
            });
          }
      
          // Calculate reward performance
          const claimTxs = txs.filter(tx => tx.type === "claim");
          const totalRewardsEarned = claimTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
          const lastClaimTx = claimTxs.length > 0 ? claimTxs[0] : null;
          const averageRewardRate = totalRewardsEarned > 0 ? "1.0" : "0"; // 1% mock rate
      
          // Calculate participation metrics
          const depositTxs = txs.filter(tx => tx.type === "deposit");
          const withdrawTxs = txs.filter(tx => tx.type === "withdraw");
          const totalDeposits = depositTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
          const totalWithdrawals = withdrawTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
          const netDeposits = totalDeposits - totalWithdrawals;
          const transactionCount = txs.length;
      
          const firstInteractionDate = txs.length > 0 ? txs[txs.length - 1].createdAt : null;
          const lastInteractionDate = txs.length > 0 ? txs[0].createdAt : null;
      
          // Calculate active days
          const activeDaysSet = new Set<string>();
          txs.forEach(tx => {
            const date = new Date(tx.createdAt).toDateString();
            activeDaysSet.add(date);
          });
          const activeDays = activeDaysSet.size;
      
          return {
            historicalBalances,
            rewardPerformance: {
              totalRewardsEarned: toFixedString(totalRewardsEarned),
              averageRewardRate,
              lastRewardDate: lastClaimTx ? lastClaimTx.createdAt : null
            },
            participationMetrics: {
              totalDeposits: toFixedString(totalDeposits),
              totalWithdrawals: toFixedString(totalWithdrawals),
              netDeposits: toFixedString(netDeposits),
              transactionCount,
              firstInteractionDate,
              lastInteractionDate,
              activeDays
            }
          };
        },
        { ttl: CACHE_TTL.analytics, swr: true, tags: [walletTag(walletAddress)] },
      );
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
    ),
    getAnalytics: withErrorHandling(
      withApiResilience(baseSdk.getAnalytics, { timeout: 5000, retries: 2 }),
      'getAnalytics'
    )
  };
}
