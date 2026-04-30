import { useCallback, useEffect, useState } from "react";

import type { StellarNetwork } from "@/utils/networkConfig";
import type { VaultAsset } from "@/utils/vaultAssets";

type UseWalletAssetBalanceArgs = {
  walletAddress: string | null;
  network: StellarNetwork;
  asset: VaultAsset;
};

function getHorizonUrl(network: StellarNetwork) {
  return network === "mainnet" ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org";
}

async function fetchWalletAssetBalance(walletAddress: string, network: StellarNetwork, asset: VaultAsset) {
  const response = await fetch(`${getHorizonUrl(network)}/accounts/${walletAddress}`);
  if (!response.ok) {
    throw new Error("Failed to fetch wallet balance.");
  }

  const data = await response.json();
  const balances = Array.isArray(data.balances) ? data.balances : [];

  if (asset.isNative) {
    const nativeBalance = balances.find((entry: { asset_type?: string; balance?: string }) => entry.asset_type === "native");
    return nativeBalance?.balance ?? "0";
  }

  if (!asset.assetCode || !asset.assetIssuer) {
    return "0";
  }

  const trustline = balances.find(
    (entry: { asset_code?: string; asset_issuer?: string; balance?: string }) =>
      entry.asset_code === asset.assetCode && entry.asset_issuer === asset.assetIssuer
  );

  return trustline?.balance ?? "0";
}

export function useWalletAssetBalance({ walletAddress, network, asset }: UseWalletAssetBalanceArgs) {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextBalance = await fetchWalletAssetBalance(walletAddress, network, asset);
      setBalance(nextBalance);
    } catch {
      setBalance("0");
    } finally {
      setIsLoading(false);
    }
  }, [asset, network, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    balance,
    isLoading,
    refresh
  };
}
