import type { NextApiRequest, NextApiResponse } from "next";

type AxionveraCoreModule = typeof import("@axionvera/core");

function loadStellarVaultReader(): AxionveraCoreModule["StellarVaultReader"] {
  const runtimeRequire = eval("require") as NodeRequire;
  const core = runtimeRequire("@axionvera/core") as AxionveraCoreModule;

  return core.StellarVaultReader;
}

const CACHE_TTL_MS = 15_000;

type LiveVaultState = {
  contractId: string;
  network: string;
  totalDeposits: string;
  userBalance: string | null;
  pendingRewards: string | null;
  cached?: boolean;
  fetchedAt: string;
};

type CachedState = {
  expiresAt: number;
  value: LiveVaultState;
};

const cache = new Map<string, CachedState>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveVaultState | { error: string }>,
) {
  try {
    const contractId = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
    const rpcUrl = (process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org").replace(/^\[|\]$/g, "");
    const user = typeof req.query.user === "string" ? req.query.user : "";

    const sourcePublicKey =
      user ||
      process.env.NEXT_PUBLIC_AXIONVERA_TEST_WALLET_ADDRESS ||
      process.env.AXIONVERA_SOURCE_PUBLIC_KEY;

    if (!contractId) {
      return res.status(400).json({ error: "Missing NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID" });
    }

    if (!sourcePublicKey) {
      return res.status(400).json({ error: "Missing source public key for live Soroban reads" });
    }

    const cacheKey = `${network}:${contractId}:${user}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({
        ...cached.value,
        cached: true,
      });
    }

    const StellarVaultReader = loadStellarVaultReader();

    const reader = new StellarVaultReader({
      contractId,
      sourcePublicKey,
      rpcUrl,
    });

    const totalDepositsPromise = reader.totalDeposits();

    const userBalancePromise = user
      ? reader.userBalance(user)
      : Promise.resolve(null);

    const pendingRewardsPromise = user
      ? reader.pendingRewards(user)
      : Promise.resolve(null);

    const [totalDeposits, userBalance, pendingRewards] = await Promise.all([
      totalDepositsPromise,
      userBalancePromise,
      pendingRewardsPromise,
    ]);

    const value: LiveVaultState = {
      contractId,
      network,
      totalDeposits,
      userBalance,
      pendingRewards,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value,
    });

    return res.status(200).json(value);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown live vault state error",
    });
  }
}
