import type { NextApiRequest, NextApiResponse } from "next";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type LiveVaultState = {
  contractId: string;
  network: string;
  totalDeposits: string;
  userBalance: string | null;
  pendingRewards: string | null;
};

function cleanCliValue(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

async function invokeRead(contractId: string, network: string, method: string, args: string[] = []) {
  const { stdout } = await execFileAsync("stellar", [
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
  ]);

  return cleanCliValue(stdout);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LiveVaultState | { error: string }>) {
  try {
    const contractId = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
    const user = typeof req.query.user === "string" ? req.query.user : "";

    if (!contractId) {
      return res.status(400).json({ error: "Missing NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID" });
    }

    const totalDeposits = await invokeRead(contractId, network, "total_deposits");

    let userBalance: string | null = null;
    let pendingRewards: string | null = null;

    if (user) {
      userBalance = await invokeRead(contractId, network, "user_balance", ["--user", user]);
      pendingRewards = await invokeRead(contractId, network, "pending_rewards", ["--user", user]);
    }

    return res.status(200).json({
      contractId,
      network,
      totalDeposits,
      userBalance,
      pendingRewards,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown live vault state error",
    });
  }
}
