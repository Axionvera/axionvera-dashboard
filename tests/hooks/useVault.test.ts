import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useVault } from "@/hooks/useVault";
import type { AxionveraVaultSdk } from "@/utils/contractHelpers";
import { getDefaultVaultAsset } from "@/utils/vaultAssets";

const defaultAsset = getDefaultVaultAsset();

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useVault", () => {
  test("deposit updates balance and history", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS", asset: defaultAsset }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.balance).toBe("0");

    await act(async () => {
      void result.current.deposit("10");
    });

    await waitFor(() => expect(result.current.depositStatus).toBe("pending"));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(Number(result.current.balance)).toBeGreaterThanOrEqual(10);
    expect(result.current.transactions[0]?.type).toBe("deposit");
    expect(result.current.depositStatus).toBe("success");
    expect(result.current.depositHash).toMatch(/^SIM-/);
  });

  test("deposit exposes txStep progression", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS_STEP" }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const stepsSeen: (string | null)[] = [];
    await act(async () => {
      void result.current.deposit("5");
    });

    // txStep should be "signed" immediately after starting
    await waitFor(() => expect(result.current.depositTxStep).toBe("signed"));
    stepsSeen.push(result.current.depositTxStep);

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(result.current.depositStatus).toBe("success");
    expect(result.current.depositTxStep).toBe("confirmed");
  });

  test("withdraw reduces balance", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS_2", asset: defaultAsset }));

    await act(async () => {
      await result.current.deposit("5");
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    await act(async () => {
      void result.current.withdraw("3");
    });
    await waitFor(() => expect(result.current.withdrawStatus).toBe("pending"));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(Number(result.current.balance)).toBeGreaterThanOrEqual(0);
    expect(result.current.withdrawStatus).toBe("success");
    expect(result.current.withdrawHash).toMatch(/^SIM-/);
  });

  test("withdraw prevents invalid amounts above balance", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS_3", asset: defaultAsset }));

    await act(async () => {
      await result.current.deposit("5");
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    await act(async () => {
      await result.current.withdraw("10");
    });

    expect(result.current.withdrawStatus).toBe("error");
    expect(result.current.withdrawError).toMatch(/exceeds your available vault balance/i);
    expect(Number(result.current.balance)).toBe(5);
  });

  test("deposit surfaces sdk errors without changing the public api", async () => {
    const failingSdk: AxionveraVaultSdk = {
      getBalances: async () => ({ balance: "0", rewards: "0" }),
      getTransactions: async () => [],
      deposit: async () => {
        throw new Error("Simulated deposit failure");
      },
      withdraw: async () => ({ id: "withdraw-1", type: "withdraw", amount: "1", status: "success", createdAt: new Date().toISOString() }),
      claimRewards: async () => ({ id: "claim-1", type: "claim", amount: "0", status: "success", createdAt: new Date().toISOString() }),
      simulateTransaction: async () => ({ cpuInstructions: 0, ramBytes: 0, ledgerEntries: 0, maxFee: "0", estimatedFee: "0" }),
    };

    const { result } = renderHook(() =>
      useVault({ walletAddress: "GTESTWALLETADDRESS_4", asset: defaultAsset, sdk: failingSdk })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deposit("7");
    });

    expect(result.current.depositStatus).toBe("error");
    expect(result.current.depositTxStep).toBeNull();
    expect(result.current.depositError).toMatch(/simulated deposit failure/i);
    expect(result.current.error).toMatch(/simulated deposit failure/i);
  });

  test("deposit forwards the selected asset contract id", async () => {
    const customAsset = {
      id: "usdc",
      symbol: "USDC",
      label: "USDC",
      tokenContractId: "C_TOKEN_123",
      isNative: false
    };

    const deposit = jest.fn(async () => ({
      id: "deposit-custom-1",
      type: "deposit" as const,
      amount: "7",
      status: "success" as const,
      createdAt: new Date().toISOString(),
      assetId: customAsset.id,
      assetSymbol: customAsset.symbol
    }));

    const sdk: AxionveraVaultSdk = {
      getBalances: async () => ({ balance: "0", rewards: "0" }),
      getTransactions: async () => [],
      deposit,
      withdraw: async () => ({ id: "withdraw-1", type: "withdraw", amount: "1", status: "success", createdAt: new Date().toISOString() }),
      claimRewards: async () => ({ id: "claim-1", type: "claim", amount: "0", status: "success", createdAt: new Date().toISOString() })
    };

    const { result } = renderHook(() =>
      useVault({ walletAddress: "GTESTWALLETADDRESS_5", asset: customAsset, sdk })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deposit("7");
    });

    expect(deposit).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: "usdc",
        assetSymbol: "USDC",
        tokenContractId: "C_TOKEN_123"
      })
    );
  });
});
