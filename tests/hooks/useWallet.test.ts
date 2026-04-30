import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';

import { useWallet } from '@/hooks/useWallet';

jest.mock('@stellar/freighter-api', () => ({
  isConnected: jest.fn(async () => true),
  isAllowed: jest.fn(async () => true),
  setAllowed: jest.fn(async () => undefined),
  getPublicKey: jest.fn(async () => 'GCONNECTEDPUBLICKEY'),
}));

describe('useWallet', () => {
  function wrapper({ children }: { children: ReactNode }) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const walletContextModule = require('@/contexts/WalletContext') as {
        WalletProvider?: ({ children }: { children: ReactNode }) => JSX.Element;
      };

      if (walletContextModule.WalletProvider) {
        const WalletProvider = walletContextModule.WalletProvider;
        return React.createElement(WalletProvider, null, children);
      }
    } catch {
      // Some branches expose useWallet directly without a provider-backed context.
    }

    return React.createElement(React.Fragment, null, children);
  }

  test('connect sets address', async () => {
import React, { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import * as freighterApi from "@stellar/freighter-api";
import { useWallet } from "@/hooks/useWallet";

jest.mock("@/utils/networkConfig", () => ({
  NETWORK: "mainnet",
  SOROBAN_RPC_URL: "https://soroban-rpc.mainnet.stellar.org",
  HORIZON_URL: "https://horizon.stellar.org",
  AXIONVERA_VAULT_CONTRACT_ID: "REPLACE_WITH_VAULT_CONTRACT_ID",
  AXIONVERA_TOKEN_CONTRACT_ID: "REPLACE_WITH_TOKEN_CONTRACT_ID",
}));

jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn(async () => true),
  isAllowed: jest.fn(async () => true),
  setAllowed: jest.fn(async () => undefined),
  getPublicKey: jest.fn(async () => "GCONNECTEDPUBLICKEY"),
  getNetwork: jest.fn(async () => "TESTNET"),
}));

describe("useWallet", () => {
  const mockedFreighter = freighterApi as jest.Mocked<typeof freighterApi>;

  function wrapper({ children }: { children: ReactNode }) {
    const { WalletProvider } = require("@/contexts/WalletContext") as {
      WalletProvider: ({ children }: { children: ReactNode }) => JSX.Element;
    };

    return React.createElement(WalletProvider, null, children);
  }

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockedFreighter.isConnected.mockResolvedValue(true);
    mockedFreighter.isAllowed.mockResolvedValue(true);
    mockedFreighter.getPublicKey.mockResolvedValue("GCONNECTEDPUBLICKEY");
    mockedFreighter.getNetwork.mockResolvedValue("TESTNET");
  });

  test("connect defaults to freighter and sets address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect('freighter');
    });

    expect(result.current.address).toBe('GCONNECTEDPUBLICKEY');
    expect(result.current.isConnected).toBe(true);
    expect(localStorage.getItem("axionvera:wallet:was_connected")).toBe("true");
    expect(localStorage.getItem("axionvera:wallet:last_type")).toBe(
      "freighter",
    );
  });

  test('disconnect clears address', async () => {
  test("disconnect clears persisted wallet flags", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect('freighter');
    });

    await waitFor(() => expect(result.current.address).toBe("GCONNECTEDPUBLICKEY"));

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => expect(result.current.address).toBeNull());
    expect(result.current.isConnected).toBe(false);
    expect(localStorage.getItem("axionvera:wallet:was_connected")).toBeNull();
    expect(localStorage.getItem("axionvera:wallet:last_type")).toBeNull();
  });

  test("does not attempt silent reconnect without persisted flag", () => {
    renderHook(() => useWallet(), { wrapper });

    expect(mockedFreighter.isAllowed).not.toHaveBeenCalled();
    expect(mockedFreighter.getPublicKey).not.toHaveBeenCalled();
  });

  test("silently reconnects when persisted freighter session is present", async () => {
    localStorage.setItem("axionvera:wallet:was_connected", "true");
    localStorage.setItem("axionvera:wallet:last_type", "freighter");

    const { result } = renderHook(() => useWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.address).toBe("GCONNECTEDPUBLICKEY");
    });

    expect(mockedFreighter.isAllowed).toHaveBeenCalledTimes(1);
    expect(result.current.walletType).toBe("freighter");
  });

  test("exposes isNetworkMismatch when connected network differs from expected", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.network).toBe("testnet");
    expect(result.current.isNetworkMismatch).toBe(true);
  });
});
