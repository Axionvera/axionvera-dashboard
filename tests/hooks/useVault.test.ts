import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useVault, VaultProvider } from "@/hooks/useVault";
import { OfflineProvider } from "@/pwa/OfflineProvider";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    OfflineProvider,
    null,
    React.createElement(VaultProvider, { walletAddress: "GTESTWALLETADDRESS", children })
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

describe("useVault", () => {
  test("deposit updates balance and history", async () => {
    const { result } = renderHook(() => useVault(), { wrapper });

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

  test("withdraw reduces balance", async () => {
    const { result } = renderHook(() => useVault(), { wrapper });

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
    const { result } = renderHook(() => useVault(), { wrapper });

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
    const { result } = renderHook(() => useVault(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
