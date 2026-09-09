import type { NextApiRequest, NextApiResponse } from "next";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 15_000;
const CLI_TIMEOUT_MS = 30_000;

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

function cleanCliValue(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

async function invokeRead(
  contractId: string,
  network: string,
  method: string,
  args: string[] = [],
): Promise<string> {
  const { stdout } = await execFileAsync(
    "stellar",
    [
      "contract",
      "invoke",
      "--id",
      contractId,
      "--source",
      process.env.AXIONVERA_DEPLOYER_SOURCE ?? "deployer",
      "--network",
      network,
      "--send",
      "no",
      "--",
      method,
      ...args,
    ],
    {
      timeout: CLI_TIMEOUT_MS,
    },
  );

  return cleanCliValue(stdout);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveVaultState | { error: string }>,
) {
  try {
    const contractId = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
    const user = typeof req.query.user === "string" ? req.query.user : "";

    if (!contractId) {
      return res.status(400).json({ error: "Missing NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID" });
    }

    const cacheKey = `${network}:${contractId}:${user}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({
        ...cached.value,
        cached: true,
      });
    }

    const totalDepositsPromise = invokeRead(contractId, network, "total_deposits");

    const userBalancePromise = user
      ? invokeRead(contractId, network, "user_balance", ["--user", user])
      : Promise.resolve(null);

    const pendingRewardsPromise = user
      ? invokeRead(contractId, network, "pending_rewards", ["--user", user])
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
