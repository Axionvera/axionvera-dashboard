import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useVault, VaultProvider } from "@/hooks/useVault";
import { OfflineProvider } from "@/pwa/OfflineProvider";
import { signWalletTransaction } from "@/services/walletService";
import { createAxionveraVaultSdk } from "@/utils/contractHelpers";

jest.mock("@/hooks/useSorobanEvents", () => ({
  useSorobanEvents: jest.fn(),
}));

jest.mock("@/services/walletService", () => {
  const actual = jest.requireActual("@/services/walletService");

  return {
    ...actual,
    signWalletTransaction: jest.fn(),
  };
});

const mockedSignWalletTransaction =
  signWalletTransaction as jest.MockedFunction<typeof signWalletTransaction>;

const WALLET = "GTESTWALLETADDRESS";
const originalFetch = global.fetch;

const baseSdk = createAxionveraVaultSdk();

const testSdk = {
  ...baseSdk,
  getBalances: jest.fn(async () => ({
    balance: "5",
    rewards: "0",
  })),
  getTransactions: jest.fn(async () => []),
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    OfflineProvider,
    null,
    React.createElement(VaultProvider, {
      walletAddress: WALLET,
      walletType: "freighter",
      sdk: testSdk,
      children,
    }),
  );

function mockSuccessfulWrite(hash: string) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : String(input);

    if (url === "/api/vault/prepare-write") {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          unsignedXdr: "UNSIGNED_XDR",
          networkPassphrase: "Test SDF Network ; September 2015",
          accountToSign: WALLET,
        }),
      } as Response;
    }

    if (url === "/api/vault/submit-signed") {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          status: "success",
          hash,
        }),
      } as Response;
    }

    throw new Error(`Unexpected fetch request: ${url}`);
  }) as jest.Mock;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();

  mockedSignWalletTransaction.mockResolvedValue("SIGNED_XDR");
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("useVault", () => {
  test("deposit prepares, signs, and submits a real transaction", async () => {
    mockSuccessfulWrite("deposit-hash");

    const { result } = renderHook(() => useVault(), { wrapper });

    await waitFor(() => expect(result.current.balance).toBe("5"));

    await act(async () => {
      await result.current.deposit("10");
    });

    expect(mockedSignWalletTransaction).toHaveBeenCalledWith(
      "freighter",
      "UNSIGNED_XDR",
      {
        networkPassphrase: "Test SDF Network ; September 2015",
        accountToSign: WALLET,
      },
    );

    expect(result.current.depositStatus).toBe("success");
    expect(result.current.depositHash).toBe("deposit-hash");
  });

  test("withdraw prepares, signs, and submits a real transaction", async () => {
    mockSuccessfulWrite("withdraw-hash");

    const { result } = renderHook(() => useVault(), { wrapper });

    await waitFor(() => expect(result.current.balance).toBe("5"));

    await act(async () => {
      await result.current.withdraw("3");
    });

    expect(mockedSignWalletTransaction).toHaveBeenCalled();

    expect(result.current.withdrawStatus).toBe("success");
    expect(result.current.withdrawHash).toBe("withdraw-hash");
  });

  test("withdraw rejects an amount above the available balance", async () => {
    const { result } = renderHook(() => useVault(), { wrapper });

    await waitFor(() => expect(result.current.balance).toBe("5"));

    await act(async () => {
      await result.current.withdraw("10");
    });

    expect(result.current.withdrawStatus).toBe("error");
    expect(result.current.withdrawError).toMatch(
      /exceeds your available vault balance/i,
    );

    expect(mockedSignWalletTransaction).not.toHaveBeenCalled();
  });

  test("deposit surfaces transaction preparation errors", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : String(input);

      if (url === "/api/vault/prepare-write") {
        return {
          ok: false,
          json: async () => ({
            ok: false,
            error: "Unable to prepare transaction",
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    }) as jest.Mock;

    const { result } = renderHook(() => useVault(), { wrapper });

    await waitFor(() => expect(result.current.balance).toBe("5"));

    await act(async () => {
      await result.current.deposit("10");
    });

    expect(result.current.depositStatus).toBe("error");
    expect(result.current.depositError).toMatch(
      /unable to prepare transaction/i,
    );

    expect(mockedSignWalletTransaction).not.toHaveBeenCalled();
  });

  test("claim rewards uses the wallet signing flow", async () => {
    mockSuccessfulWrite("claim-hash");

    const { result } = renderHook(() => useVault(), { wrapper });

    await waitFor(() => expect(result.current.balance).toBe("5"));

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(mockedSignWalletTransaction).toHaveBeenCalledWith(
      "freighter",
      "UNSIGNED_XDR",
      expect.objectContaining({
        accountToSign: WALLET,
      }),
    );

    expect(result.current.isClaiming).toBe(false);
  });
});
