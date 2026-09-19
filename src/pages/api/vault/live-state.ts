import type { NextApiRequest, NextApiResponse } from "next";

type AxionveraCoreModule = typeof import("@axionvera/core");

type LiveStateResponse =
  | {
      contractId: string;
      network: string;
      totalDeposits: string;
      userBalance: string;
      pendingRewards: string;
      claimableRewards: string;
      cached: boolean;
      fetchedAt: string;
    }
  | {
      error: string;
    };

type CacheEntry = {
  key: string;
  value: Extract<LiveStateResponse, { contractId: string }>;
  expiresAt: number;
};

let cache: CacheEntry | undefined;

function loadStellarVaultReader(): AxionveraCoreModule["StellarVaultReader"] {
  const runtimeRequire = eval("require") as NodeRequire;
  const core = runtimeRequire("@axionvera/core") as AxionveraCoreModule;
  return core.StellarVaultReader;
}

function readQueryString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveStateResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const contractId = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const userAddress =
    readQueryString(req.query.user) ??
    process.env.NEXT_PUBLIC_AXIONVERA_TEST_WALLET_ADDRESS;

  const sourcePublicKey = userAddress;

  if (!contractId) {
    res.status(500).json({
      error: "NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID is not configured",
    });
    return;
  }

  if (!userAddress) {
    res.status(400).json({
      error: "user query param or NEXT_PUBLIC_AXIONVERA_TEST_WALLET_ADDRESS is required",
    });
    return;
  }

  if (!sourcePublicKey) {
    res.status(400).json({
      error: "A user address is required as the read source account",
    });
    return;
  }

  const cacheKey = `${contractId}:${network}:${sourcePublicKey}:${userAddress}`;
  const now = Date.now();

  if (cache?.key === cacheKey && cache.expiresAt > now) {
    res.status(200).json({
      ...cache.value,
      cached: true,
    });
    return;
  }

  try {
    const StellarVaultReader = loadStellarVaultReader();

    const reader = new StellarVaultReader({
      contractId,
      sourcePublicKey,
      rpcUrl,
    });

    const [totalDeposits, userBalance, pendingRewards, claimableRewards] =
      await Promise.all([
        reader.totalDeposits(),
        reader.userBalance(userAddress),
        reader.pendingRewards(userAddress),
        reader.claimableRewards(userAddress),
      ]);

    const value = {
      contractId,
      network,
      totalDeposits,
      userBalance,
      pendingRewards,
      claimableRewards,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };

    cache = {
      key: cacheKey,
      value,
      expiresAt: now + 15_000,
    };

    res.status(200).json(value);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to read live vault state",
    });
  }
}
