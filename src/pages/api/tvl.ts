import type { NextApiRequest, NextApiResponse } from "next";
import { SorobanRpc, Networks, Contract, xdr } from "@stellar/stellar-sdk";

let cache: { value: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({ tvl: cache.value });
  }

  try {
    const server = new SorobanRpc.Server(
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!
    );
    const contractId = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID!;

    // Simulate calling get_total_balance() on the vault contract
    const contract = new Contract(contractId);
    const tx = await server.simulateTransaction(
      // Minimal simulation — adjust method name to match your actual contract
      contract.call("get_total_balance")
    );

    let tvlRaw = "0";
    if ("result" in tx && tx.result?.retval) {
      const val = tx.result.retval;
      // Soroban returns i128 for token amounts
      if (val.switch().name === "scvI128") {
        const i128 = val.i128();
        tvlRaw = (BigInt(i128.hi()) * BigInt(2 ** 64) + BigInt(i128.lo())).toString();
      }
    }

    cache = { value: tvlRaw, timestamp: Date.now() };
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({ tvl: tvlRaw });
  } catch (err) {
    console.error("TVL fetch error:", err);
    return res.status(500).json({ tvl: "0", error: "Failed to fetch TVL" });
  }
}