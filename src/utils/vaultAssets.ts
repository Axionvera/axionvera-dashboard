import { getEnv } from "./env";

export type VaultAsset = {
  id: string;
  symbol: string;
  label: string;
  tokenContractId: string | null;
  assetCode?: string;
  assetIssuer?: string;
  isNative: boolean;
};

const PLACEHOLDER_TOKEN_CONTRACT_ID = "REPLACE_WITH_TOKEN_CONTRACT_ID";

function readEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function hasConfiguredTokenContractId(tokenContractId: string | undefined) {
  return Boolean(tokenContractId && tokenContractId !== PLACEHOLDER_TOKEN_CONTRACT_ID);
}

export function getVaultAssets(): VaultAsset[] {
  const tokenContractId = readEnv(getEnv("NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID"));
  const customSymbol = readEnv(getEnv("NEXT_PUBLIC_AXIONVERA_CUSTOM_TOKEN_SYMBOL")) ?? "AXV";
  const customIssuer = readEnv(getEnv("NEXT_PUBLIC_AXIONVERA_CUSTOM_TOKEN_ISSUER"));
  const customCode = readEnv(getEnv("NEXT_PUBLIC_AXIONVERA_CUSTOM_TOKEN_CODE")) ?? customSymbol;

  const assets: VaultAsset[] = [
    {
      id: "native-xlm",
      symbol: "XLM",
      label: "XLM",
      tokenContractId: null,
      assetCode: "XLM",
      isNative: true
    }
  ];

  if (hasConfiguredTokenContractId(tokenContractId)) {
    assets.push({
      id: customSymbol.toLowerCase(),
      symbol: customSymbol,
      label: customSymbol,
      tokenContractId: tokenContractId ?? null,
      assetCode: customCode,
      assetIssuer: customIssuer,
      isNative: false
    });
  }

  return assets;
}

export function getDefaultVaultAsset() {
  return getVaultAssets()[0];
}

export function findVaultAsset(assetId: string | null | undefined) {
  const assets = getVaultAssets();
  return assets.find((asset) => asset.id === assetId) ?? assets[0];
}
