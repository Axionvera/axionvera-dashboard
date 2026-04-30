import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/utils/notifications";
import { useVaultBalances } from "./useVaultBalances";
import { useTransactionHistory } from "./useTransactionHistory";

import {
  createAxionveraVaultSdk,
  parsePositiveAmount,
  type AxionveraVaultSdk,
  type VaultTx
} from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";
import type { VaultAsset } from "@/utils/vaultAssets";

type UseVaultArgs = {
  walletAddress: string | null;
  asset: VaultAsset;
  sdk?: AxionveraVaultSdk;
};

type VaultActionType = "deposit" | "withdraw";

type VaultActionState = {
  status: "idle" | "pending" | "success" | "error";
  txStep: TxStep | null;
  hash: string | null;
  lastAmount: string | null;
  error: string | null;
};

type VaultState = {
  isSubmitting: boolean;
  isClaiming: boolean;
  error: string | null;
  actions: Record<VaultActionType, VaultActionState>;
};

const INITIAL_ACTION_STATE: VaultActionState = {
  status: "idle",
  txStep: null,
  hash: null,
  lastAmount: null,
  error: null
};

const INITIAL_STATE: VaultState = {
  isSubmitting: false,
  isClaiming: false,
  error: null,
  actions: {
    deposit: { ...INITIAL_ACTION_STATE },
    withdraw: { ...INITIAL_ACTION_STATE }
  }
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function createPendingTransaction(type: VaultActionType, amount: string): VaultTx {
  return {
    id: `pending-${type}-${Date.now()}`,
    type,
    amount,
    status: "pending",
    createdAt: new Date().toISOString()
  };
}

function upsertTransaction(transactions: VaultTx[], transaction: VaultTx) {
  return [transaction, ...transactions.filter((t) => t.id !== transaction.id)].slice(0, 25);
}

function getWalletMessage(type: VaultActionType) {
  return type === "deposit" ? "Connect a wallet to deposit." : "Connect a wallet to withdraw.";
}

function getFailureTitle(type: VaultActionType) {
  return type === "deposit" ? "Deposit Failed" : "Withdrawal Failed";
}

function updateActionState(
  state: VaultState,
  type: VaultActionType,
  patch: Partial<VaultActionState>
): VaultState {
  return {
    ...state,
    actions: {
      ...state.actions,
      [type]: { ...state.actions[type], ...patch }
    }
  };
}

export function useVault({ walletAddress, asset, sdk: providedSdk }: UseVaultArgs) {
  const sdk = useMemo(() => providedSdk ?? createAxionveraVaultSdk(), [providedSdk]);
  const [state, setState] = useState<VaultState>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setState((current) => resetDisconnectedVaultState(current));
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const [balances, transactions] = await Promise.all([
        sdk.getBalances({ walletAddress, network: NETWORK, assetId: asset.id }),
        sdk.getTransactions({ walletAddress, network: NETWORK, assetId: asset.id })
      ]);

  // Sync query data with state
  useEffect(() => {
    if (balancesQuery.data && transactionsQuery.data) {
      const balances = balancesQuery.data;
      const transactions = transactionsQuery.data;
      
      setState((current) => ({
        ...current,
        balance: balances.balance,
        rewards: balances.rewards,
        transactions,
        isLoading: false
      }));
    } else if (balancesQuery.isLoading || transactionsQuery.isLoading) {
      setState((current) => ({ ...current, isLoading: true }));
    }
  }, [balancesQuery.data, transactionsQuery.data, balancesQuery.isLoading, transactionsQuery.isLoading]);

  // Handle query errors
  useEffect(() => {
    if (balancesQuery.error || transactionsQuery.error) {
      const error = balancesQuery.error ?? transactionsQuery.error;
      const message = getErrorMessage(error, "Failed to load vault state.");
      notify.error("Vault Update Failed", message);
      setState((current) => ({ ...current, isLoading: false, error: message }));
    }
  }, [asset.id, sdk, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setValidationError = useCallback((type: VaultActionType, message: string, amount?: string) => {
    setState((current) => {
      const next = updateActionState(current, type, {
        status: "error",
        txStep: null,
        error: message,
        hash: null,
        lastAmount: amount ?? current.actions[type].lastAmount
      });
      return { ...next, error: message };
    });
  }, []);

  const runAmountAction = useCallback(
    async (
      type: VaultActionType,
      amountInput: string,
      execute: (amount: string) => Promise<VaultTx>,
      validate?: (amount: string) => string | null
    ) => {
      const amount = parsePositiveAmount(amountInput);

      if (!walletAddress) {
        setValidationError(type, getWalletMessage(type));
        return;
      }
      if (!amount) {
        setValidationError(type, "Enter a valid amount greater than zero.");
        return;
      }
      const validationMessage = validate?.(amount);
      if (validationMessage) {
        setValidationError(type, validationMessage, amount);
        return;
      }

      const pendingTransaction = createPendingTransaction(type, amount);

      setState((current) => {
        const next = updateActionState(current, type, {
          status: "pending",
          txStep: "signed",
          hash: null,
          error: null,
          lastAmount: amount
        });
        return {
          ...next,
          isSubmitting: true,
          error: null
        };
      });

      // Optimistically add pending tx to local transaction list
      transactionsQuery.refetch();

      try {
        const transaction = await execute(amount);
        const hash = transaction.hash ?? null;

        setState((current) =>
          updateActionState(current, type, { txStep: "submitted", hash })
        );

        if (hash && walletAddress) {
          await pollTransaction({
            walletAddress,
            network: NETWORK,
            hash,
            sdk,
            onStep: (step) =>
              setState((current) => updateActionState(current, type, { txStep: step }))
          });
        }

        await refresh();

        setState((current) =>
          updateActionState(current, type, {
            status: "success",
            txStep: "confirmed",
            hash,
            error: null,
            lastAmount: amount
          })
        );

        notify.success(
          `${type === "deposit" ? "Deposit" : "Withdrawal"} Confirmed`,
          `Transaction hash: ${hash}`
        );
      } catch (err) {
        const message = getErrorMessage(err, `${type === "deposit" ? "Deposit" : "Withdraw"} failed.`);
        notify.error(getFailureTitle(type), message);
        setState((current) => {
          const next = updateActionState(current, type, {
            status: "error",
            txStep: null,
            hash: null,
            error: message,
            lastAmount: amount
          });
          return {
            ...next,
            error: message
          };
        });
        // Mark pending tx as failed in history
        transactionsQuery.refetch();
      } finally {
        setState((current) => ({ ...current, isSubmitting: false }));
      }
    },
    [refresh, setValidationError, walletAddress, sdk, transactionsQuery]
  );

  const deposit = useCallback(
    async (amountInput: string) =>
      runAmountAction("deposit", amountInput, (amount) =>
        sdk.deposit({
          walletAddress: walletAddress as string,
          network: NETWORK,
          amount,
          assetId: asset.id,
          assetSymbol: asset.symbol,
          tokenContractId: asset.tokenContractId
        })
      ),
    [asset.id, asset.symbol, asset.tokenContractId, runAmountAction, sdk, walletAddress]
  );

  const withdraw = useCallback(
    async (amountInput: string) =>
      runAmountAction(
        "withdraw",
        amountInput,
        (amount) =>
          sdk.withdraw({
            walletAddress: walletAddress as string,
            network: NETWORK,
            amount,
            assetId: asset.id,
            assetSymbol: asset.symbol,
            tokenContractId: asset.tokenContractId
          }),
        (amount) =>
          Number(amount) > Number(state.balance)
            ? "Withdrawal amount exceeds your available vault balance."
            : null
      ),
    [asset.id, asset.symbol, asset.tokenContractId, runAmountAction, sdk, state.balance, walletAddress]
  );

  const claimRewards = useCallback(async () => {
    if (!walletAddress) {
      setState((current) => ({ ...current, error: "Connect a wallet to claim rewards." }));
      return;
    }
    setState((current) => ({ ...current, isClaiming: true, error: null }));
    try {
      await sdk.claimRewards({ walletAddress, network: NETWORK, assetId: asset.id, assetSymbol: asset.symbol });
      await refresh();
      notify.success("Rewards Claimed", "Successfully claimed your vault rewards.");
    } catch (err) {
      const message = getErrorMessage(err, "Claim failed.");
      notify.error("Claim Failed", message);
      setState((current) => ({ ...current, error: message }));
    } finally {
      setState((current) => ({ ...current, isClaiming: false }));
    }
  }, [asset.id, asset.symbol, refresh, sdk, walletAddress]);

  return {
    balance: state.balance,
    rewards: state.rewards,
    transactions: state.transactions,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    isClaiming: state.isClaiming,
    error: state.error,
    depositStatus: state.actions.deposit.status,
    depositTxStep: state.actions.deposit.txStep,
    depositHash: state.actions.deposit.hash,
    lastDepositAmount: state.actions.deposit.lastAmount,
    depositError: state.actions.deposit.error,
    withdrawStatus: state.actions.withdraw.status,
    withdrawTxStep: state.actions.withdraw.txStep,
    withdrawHash: state.actions.withdraw.hash,
    lastWithdrawAmount: state.actions.withdraw.lastAmount,
    withdrawError: state.actions.withdraw.error,
    asset,
    refresh,
    deposit,
    withdraw,
    claimRewards
  };
}
