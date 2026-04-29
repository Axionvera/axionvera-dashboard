import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/utils/notifications";

import {
  createAxionveraVaultSdk,
  parsePositiveAmount,
  type AxionveraVaultSdk,
  type VaultTx
} from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";

type UseVaultArgs = {
  walletAddress: string | null;
  sdk?: AxionveraVaultSdk;
};

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
};

const INITIAL_ACTION_STATE: VaultActionState = {
  status: "idle",
  hash: null,
  lastAmount: null,
  error: null
};

const INITIAL_STATE: VaultState = {
  balance: "0",
  rewards: "0",
  transactions: [],
  isLoading: false,
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
  return [transaction, ...transactions.filter((existing) => existing.id !== transaction.id)].slice(0, 25);
}

function resetDisconnectedVaultState(state: VaultState): VaultState {
  return {
    ...state,
    balance: "0",
    rewards: "0",
    transactions: [],
    error: null
  };
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
      [type]: {
        ...state.actions[type],
        ...patch
      }
    }
  };
}

export function useVault({ walletAddress, sdk: providedSdk }: UseVaultArgs) {
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
        sdk.getBalances({ walletAddress, network: NETWORK }),
        sdk.getTransactions({ walletAddress, network: NETWORK })
      ]);

      setState((current) => ({
        ...current,
        balance: balances.balance,
        rewards: balances.rewards,
        transactions,
        isLoading: false
      }));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load vault state.");
      notify.error("Vault Update Failed", message);
      setState((current) => ({ ...current, isLoading: false, error: message }));
    }
  }, [sdk, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setValidationError = useCallback((type: VaultActionType, message: string, amount?: string) => {
    setState((current) => {
      const next = updateActionState(current, type, {
        status: "error",
        error: message,
        hash: null,
        lastAmount: amount ?? current.actions[type].lastAmount
      });

      return {
        ...next,
        error: message
      };
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
          hash: null,
          error: null,
          lastAmount: amount
        });

        return {
          ...next,
          isSubmitting: true,
          error: null,
          transactions: upsertTransaction(current.transactions, pendingTransaction)
        };
      });

      try {
        const transaction = await execute(amount);
        await refresh();
        setState((current) =>
          updateActionState(current, type, {
            status: "success",
            hash: transaction.hash ?? null,
            error: null,
            lastAmount: amount
          })
        );
        notify.success(`${type === "deposit" ? "Deposit" : "Withdrawal"} Confirmed`, `Transaction hash: ${transaction.hash}`);
      } catch (error) {
        const message = getErrorMessage(error, `${type === "deposit" ? "Deposit" : "Withdraw"} failed.`);
        notify.error(getFailureTitle(type), message);
        setState((current) => {
          const next = updateActionState(current, type, {
            status: "error",
            hash: null,
            error: message,
            lastAmount: amount
          });

          return {
            ...next,
            error: message,
            transactions: upsertTransaction(current.transactions, {
              ...pendingTransaction,
              status: "failed"
            })
          };
        });
      } finally {
        setState((current) => ({ ...current, isSubmitting: false }));
      }
    },
    [refresh, setValidationError, walletAddress]
  );

  const deposit = useCallback(
    async (amountInput: string) =>
      runAmountAction("deposit", amountInput, (amount) =>
        sdk.deposit({ walletAddress: walletAddress as string, network: NETWORK, amount })
      ),
    [runAmountAction, sdk, walletAddress]
  );

  const withdraw = useCallback(
    async (amountInput: string) =>
      runAmountAction(
        "withdraw",
        amountInput,
        (amount) => sdk.withdraw({ walletAddress: walletAddress as string, network: NETWORK, amount }),
        (amount) =>
          Number(amount) > Number(state.balance)
            ? "Withdrawal amount exceeds your available vault balance."
            : null
      ),
    [runAmountAction, sdk, state.balance, walletAddress]
  );

  const claimRewards = useCallback(async () => {
    if (!walletAddress) {
      setState((current) => ({ ...current, error: "Connect a wallet to claim rewards." }));
      return;
    }

    setState((current) => ({ ...current, isClaiming: true, error: null }));
    try {
      await sdk.claimRewards({ walletAddress, network: NETWORK });
      await refresh();
      notify.success("Rewards Claimed", "Successfully claimed your vault rewards.");
    } catch (error) {
      const message = getErrorMessage(error, "Claim failed.");
      notify.error("Claim Failed", message);
      setState((current) => ({ ...current, error: message }));
    } finally {
      setState((current) => ({ ...current, isClaiming: false }));
    }
  }, [refresh, sdk, walletAddress]);

  return {
    balance: state.balance,
    rewards: state.rewards,
    transactions: state.transactions,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    isClaiming: state.isClaiming,
    error: state.error,
    depositStatus: state.actions.deposit.status,
    depositHash: state.actions.deposit.hash,
    lastDepositAmount: state.actions.deposit.lastAmount,
    depositError: state.actions.deposit.error,
    withdrawStatus: state.actions.withdraw.status,
    withdrawHash: state.actions.withdraw.hash,
    lastWithdrawAmount: state.actions.withdraw.lastAmount,
    withdrawError: state.actions.withdraw.error,
    refresh,
    deposit,
    withdraw,
    claimRewards
  };
}
