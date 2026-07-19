import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createAxionveraVaultSdk,
  parsePositiveAmount,
  type AxionveraVaultSdk,
  type VaultTx,
  type AnalyticsData,
} from "@/utils/contractHelpers";
import { NETWORK, AXIONVERA_VAULT_CONTRACT_ID } from "@/utils/networkConfig";
import { notify } from "@/utils/notifications";
import { useSorobanEvents } from "@/hooks/useSorobanEvents";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import type { SyncAction } from "@/sync/offlineSync";
import {
  cacheBalances,
  getCachedBalances,
  cacheTransactions,
  getCachedTransactions,
  cacheAnalytics,
  getCachedAnalytics,
} from "@/cache/offlineCache";
import { useOffline } from "@/pwa/OfflineProvider";

type VaultActionType = "deposit" | "withdraw";
type VaultActionState = {
  status: "idle" | "pending" | "success" | "error";
  hash: string | null;
  lastAmount: string | null;
  error: string | null;
};
type VaultState = {
  balance: string;
  rewards: string;
  transactions: VaultTx[];
  isLoading: boolean;
  isSubmitting: boolean;
  isClaiming: boolean;
  error: string | null;
  actions: Record<VaultActionType, VaultActionState>;
  analytics: AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
};

type VaultContextType = VaultState & {
  depositStatus: VaultActionState["status"];
  depositHash: string | null;
  lastDepositAmount: string | null;
  depositError: string | null;
  withdrawStatus: VaultActionState["status"];
  withdrawHash: string | null;
  lastWithdrawAmount: string | null;
  withdrawError: string | null;
  refresh: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  deposit: (amount: string) => Promise<void>;
  withdraw: (amount: string) => Promise<void>;
  claimRewards: () => Promise<void>;
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const INITIAL_ACTION: VaultActionState = { status: "idle", hash: null, lastAmount: null, error: null };
const INITIAL_STATE: VaultState = {
  balance: "0", rewards: "0", transactions: [], isLoading: false,
  isSubmitting: false, isClaiming: false, error: null,
  actions: { deposit: { ...INITIAL_ACTION }, withdraw: { ...INITIAL_ACTION } },
  analytics: null, analyticsLoading: false, analyticsError: null,
};

function getError(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function updateAction(state: VaultState, type: VaultActionType, patch: Partial<VaultActionState>): VaultState {
  return { ...state, actions: { ...state.actions, [type]: { ...state.actions[type], ...patch } } };
}

function upsert(txs: VaultTx[], tx: VaultTx) {
  return [tx, ...txs.filter((t) => t.id !== tx.id)].slice(0, 25);
}

function createPending(type: VaultActionType, amount: string): VaultTx {
  return { id: `pending-${type}-${Date.now()}`, type, amount, status: "pending", createdAt: new Date().toISOString() };
}

function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

type VaultProviderProps = { children: ReactNode; walletAddress: string | null; sdk?: AxionveraVaultSdk };

export function VaultProvider({ children, walletAddress, sdk: providedSdk }: VaultProviderProps) {
  const sdk = useMemo(() => providedSdk ?? createAxionveraVaultSdk(), [providedSdk]);
  const { isOnline: isAppOnline } = useOffline();
  const [state, setState] = useState<VaultState>(INITIAL_STATE);
  const walletRef = useRef(walletAddress);
  const isOnlineRef = useRef(true);
  walletRef.current = walletAddress;

  const refresh = useCallback(async () => {
    if (!walletRef.current) {
      setState((s) => ({ ...s, balance: "0", rewards: "0", transactions: [], error: null }));
      return;
    }

    if (!isAppOnline || !isOnlineRef.current || isBrowserOffline()) {
      const cachedBalances = getCachedBalances(walletRef.current);
      const cachedTransactions = getCachedTransactions(walletRef.current);
      if (cachedBalances || cachedTransactions) {
        setState((s) => ({
          ...s,
          balance: cachedBalances?.balance ?? "0",
          rewards: cachedBalances?.rewards ?? "0",
          transactions: cachedTransactions ?? [],
          isLoading: false,
          error: null,
        }));
        notify.info("Offline Mode", "Displaying cached vault details.");
        return;
      }
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [balances, transactions] = await Promise.all([
        sdk.getBalances({ walletAddress: walletRef.current, network: NETWORK }),
        sdk.getTransactions({ walletAddress: walletRef.current, network: NETWORK }),
      ]);
      cacheBalances(walletRef.current, balances);
      cacheTransactions(walletRef.current, transactions);
      setState((s) => ({ ...s, balance: balances.balance, rewards: balances.rewards, transactions, isLoading: false }));
    } catch (e) {
      const cachedBalances = getCachedBalances(walletRef.current);
      const cachedTransactions = getCachedTransactions(walletRef.current);
      if (cachedBalances || cachedTransactions) {
        setState((s) => ({
          ...s,
          balance: cachedBalances?.balance ?? "0",
          rewards: cachedBalances?.rewards ?? "0",
          transactions: cachedTransactions ?? [],
          isLoading: false,
          error: null,
        }));
        notify.info("Offline Mode", "Displaying cached vault details.");
      } else {
        const message = getError(e, "Failed to load vault state.");
        notify.error("Vault Update Failed", message);
        setState((s) => ({ ...s, isLoading: false, error: message }));
      }
    }
  }, [isAppOnline, sdk]);

  const refreshAnalytics = useCallback(async () => {
    if (!walletRef.current) {
      setState((s) => ({ ...s, analytics: null, analyticsError: null }));
      return;
    }
    setState((s) => ({ ...s, analyticsLoading: true, analyticsError: null }));
    try {
      const analytics = await sdk.getAnalytics({ walletAddress: walletRef.current, network: NETWORK });
      cacheAnalytics(walletRef.current, analytics);
      setState((s) => ({ ...s, analytics, analyticsLoading: false }));
    } catch (e) {
      const cachedAnalytics = getCachedAnalytics(walletRef.current);
      if (cachedAnalytics) {
        setState((s) => ({ ...s, analytics: cachedAnalytics, analyticsLoading: false, analyticsError: null }));
      } else {
        const message = getError(e, "Failed to load analytics.");
        setState((s) => ({ ...s, analyticsLoading: false, analyticsError: message }));
      }
    }
  }, [sdk]);

  const handleEvent = useCallback(() => {
    refresh();
    refreshAnalytics();
  }, [refresh, refreshAnalytics]);

  const handleSyncAction = useCallback(async (action: SyncAction<{ amount: string; walletAddress: string }>) => {
    if (!action.payload.walletAddress) {
      throw new Error("Connect a wallet to synchronize pending actions.");
    }

    if (action.type === "deposit") {
      const tx = await sdk.deposit({ walletAddress: action.payload.walletAddress, network: NETWORK, amount: action.payload.amount });
      setState((s) => updateAction(s, "deposit", { status: "success", hash: tx.hash ?? null, error: null, lastAmount: action.payload.amount }));
      notify.success("Deposit Confirmed", `Transaction hash: ${tx.hash ?? "N/A"}`);
    } else if (action.type === "withdraw") {
      const tx = await sdk.withdraw({ walletAddress: action.payload.walletAddress, network: NETWORK, amount: action.payload.amount });
      setState((s) => updateAction(s, "withdraw", { status: "success", hash: tx.hash ?? null, error: null, lastAmount: action.payload.amount }));
      notify.success("Withdrawal Confirmed", `Transaction hash: ${tx.hash ?? "N/A"}`);
    } else if (action.type === "claim") {
      await sdk.claimRewards({ walletAddress: action.payload.walletAddress, network: NETWORK });
      notify.success("Rewards Claimed", "Successfully synchronized queued reward claim.");
    }

    await refresh();
    await refreshAnalytics();
  }, [refresh, refreshAnalytics, sdk]);

  const { isOnline, queueAction } = useOfflineSync({
    storageKey: "axionvera:vault:syncQueue",
    onSync: handleSyncAction,
    onConflict: (_action, error) => {
      notify.warning("Sync Conflict", error.message);
    },
  });
  isOnlineRef.current = isOnline;

  useSorobanEvents({
    contractId: AXIONVERA_VAULT_CONTRACT_ID,
    onEvent: handleEvent,
  });

  useEffect(() => { void refresh(); }, [refresh, walletAddress]);
  useEffect(() => { void refreshAnalytics(); }, [refreshAnalytics, walletAddress]);

  const runAction = useCallback(async (
    type: VaultActionType,
    amountInput: string,
    execute: (amount: string) => Promise<VaultTx>,
    validate?: (amount: string) => string | null,
  ) => {
    const amount = parsePositiveAmount(amountInput);
    if (!walletRef.current) {
      setState((s) => updateAction(s, type, { status: "error", error: type === "deposit" ? "Connect a wallet to deposit." : "Connect a wallet to withdraw.", hash: null, lastAmount: null }));
      return;
    }
    if (!amount) {
      setState((s) => updateAction(s, type, { status: "error", error: "Enter a valid amount greater than zero.", hash: null, lastAmount: null }));
      return;
    }
    const validationError = validate?.(amount);
    if (validationError) {
      setState((s) => updateAction(s, type, { status: "error", error: validationError, hash: null, lastAmount: amount }));
      return;
    }
    const pending = createPending(type, amount);
    if (!isOnline) {
      queueAction({ type, payload: { amount, walletAddress: walletRef.current } });
      setState((s) => ({ ...updateAction(s, type, { status: "pending", hash: null, error: null, lastAmount: amount }), isSubmitting: false, error: null, transactions: upsert(s.transactions, pending) }));
      notify.info("Offline Mode", "Your action is queued and will sync automatically when connectivity resumes.");
      return;
    }
    setState((s) => ({ ...updateAction(s, type, { status: "pending", hash: null, error: null, lastAmount: amount }), isSubmitting: true, error: null, transactions: upsert(s.transactions, pending) }));
    try {
      const tx = await execute(amount);
      await refresh();
      setState((s) => updateAction(s, type, { status: "success", hash: tx.hash ?? null, error: null, lastAmount: amount }));
      notify.success(`${type === "deposit" ? "Deposit" : "Withdrawal"} Confirmed`, `Transaction hash: ${tx.hash ?? "N/A"}`);
    } catch (e) {
      const message = getError(e, `${type === "deposit" ? "Deposit" : "Withdraw"} failed.`);
      notify.error(type === "deposit" ? "Deposit Failed" : "Withdrawal Failed", message);
      setState((s) => ({ ...updateAction(s, type, { status: "error", hash: null, error: message, lastAmount: amount }), error: message, transactions: upsert(s.transactions, { ...pending, status: "failed" }) }));
    } finally {
      setState((s) => ({ ...s, isSubmitting: false }));
    }
  }, [isOnline, queueAction, refresh]);

  const deposit = useCallback((amountInput: string) =>
    runAction("deposit", amountInput, (amount) =>
      sdk.deposit({ walletAddress: walletRef.current!, network: NETWORK, amount })
    ), [runAction, sdk]);

  const withdraw = useCallback((amountInput: string) =>
    runAction("withdraw", amountInput,
      (amount) => sdk.withdraw({ walletAddress: walletRef.current!, network: NETWORK, amount }),
      (amount) => Number(amount) > Number(state.balance) ? "Withdrawal amount exceeds your available vault balance." : null,
    ), [runAction, sdk, state.balance]);

  const claimRewards = useCallback(async () => {
    if (!walletRef.current) {
      setState((s) => ({ ...s, error: "Connect a wallet to claim rewards." }));
      return;
    }
    setState((s) => ({ ...s, isClaiming: true, error: null }));
    try {
      await sdk.claimRewards({ walletAddress: walletRef.current, network: NETWORK });
      await refresh();
      notify.success("Rewards Claimed", "Successfully claimed your vault rewards.");
    } catch (e) {
      const message = getError(e, "Claim failed.");
      notify.error("Claim Failed", message);
      setState((s) => ({ ...s, error: message }));
    } finally {
      setState((s) => ({ ...s, isClaiming: false }));
    }
  }, [refresh, sdk]);

  const value = useMemo<VaultContextType>(() => ({
    ...state,
    depositStatus: state.actions.deposit.status,
    depositHash: state.actions.deposit.hash,
    lastDepositAmount: state.actions.deposit.lastAmount,
    depositError: state.actions.deposit.error,
    withdrawStatus: state.actions.withdraw.status,
    withdrawHash: state.actions.withdraw.hash,
    lastWithdrawAmount: state.actions.withdraw.lastAmount,
    withdrawError: state.actions.withdraw.error,
    refresh,
    refreshAnalytics,
    deposit,
    withdraw,
    claimRewards,
  }), [state, refresh, refreshAnalytics, deposit, withdraw, claimRewards]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVaultContext() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVaultContext must be used within a VaultProvider");
  return ctx;
}
