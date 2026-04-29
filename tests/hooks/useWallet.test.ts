import React, { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import * as freighter from "@stellar/freighter-api";
import { useWallet, WalletProvider } from "@/hooks/useWallet";

jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn(async () => true),
  isAllowed: jest.fn(async () => true),
  setAllowed: jest.fn(async () => undefined),
  getPublicKey: jest.fn(async () => "GCONNECTEDPUBLICKEY"),
  getNetwork: jest.fn(async () => "TESTNET")
}));

describe("useWallet", () => {
  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(WalletProvider, null, children);
  }

  test("connect sets address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect("freighter");
    });

    await waitFor(() => expect(result.current.address).toBe("GCONNECTEDPUBLICKEY"));
    expect(result.current.isConnected).toBe(true);
  });

  test("disconnect clears address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect("freighter");
    });

    await waitFor(() => expect(result.current.address).toBe("GCONNECTEDPUBLICKEY"));

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => expect(result.current.address).toBeNull());
    expect(result.current.isConnected).toBe(false);
  });
});
