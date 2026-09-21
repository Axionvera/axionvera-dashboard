import type { NextApiRequest, NextApiResponse } from "next";
import { xdr, scValToNative } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

type VaultTx = {
  id: string;
  type: "deposit" | "withdraw" | "claim";
  amount: string;
  status: "success";
  createdAt: string;
  hash?: string;
};

type ResponseBody =
  | {
      transactions: VaultTx[];
      count: number;
    }
  | {
      error: string;
    };

const HISTORY_WINDOW = 120_000;
const EVENT_PAGE_LIMIT = 1000;
const MAX_EVENT_PAGES = 20;

function queryString(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodeScVal(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    try {
      return scValToNative(
        xdr.ScVal.fromXDR(value, "base64"),
      );
    } catch {
      return value;
    }
  }

  if (typeof value === "object") {
    try {
      return scValToNative(
        value as unknown as xdr.ScVal,
      );
    } catch {
      return value;
    }
  }

  return value;
}

function eventToVaultTx(
  event: any,
  walletAddress: string,
): VaultTx | null {
  const topics = (event.topic ?? []).map(decodeScVal);
  const value = decodeScVal(event.value);


  const action =
    topics[0] === "vault" && topics.length > 1
      ? topics[1]
      : topics[0];


  let type: VaultTx["type"];

  if (action === "deposit") {
    type = "deposit";
  } else if (action === "withdraw") {
    type = "withdraw";
  } else if (
    action === "claim_rewards" ||
    action === "claim"
  ) {
    type = "claim";
  } else {
    return null;
  }

  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const [eventWallet, rawAmount] = value;

  console.log(
    typeof eventWallet,
  );

  if (eventWallet !== walletAddress) {
    return null;
  }

  const amount =
    typeof rawAmount === "bigint"
      ? rawAmount.toString()
      : String(rawAmount);

  return {
    id: event.txHash ?? event.id,
    type,
    amount,
    status: "success",
    createdAt:
      event.ledgerClosedAt ?? new Date().toISOString(),
    hash: event.txHash,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const walletAddress = queryString(req.query.user);

  if (!walletAddress) {
    res.status(400).json({
      error: "user query parameter is required",
    });
    return;
  }

  const contractId =
    process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;

  if (!contractId) {
    res.status(500).json({
      error:
        "NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID is not configured",
    });
    return;
  }

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
    "https://soroban-testnet.stellar.org";

  try {
    const server = new Server(rpcUrl);

    const latest = await server.getLatestLedger();

    const filters = [
      {
        type: "contract" as const,
        contractIds: [contractId],
      },
    ];

    const events: any[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < MAX_EVENT_PAGES; page += 1) {
      const result = await server.getEvents(
        cursor
          ? {
              cursor,
              filters,
              limit: EVENT_PAGE_LIMIT,
            }
          : {
              startLedger: Math.max(
                1,
                Number(latest.sequence) - HISTORY_WINDOW,
              ),
              filters,
              limit: EVENT_PAGE_LIMIT,
            },
      );

      events.push(...result.events);

      if (!result.cursor || result.cursor === cursor) {
        break;
      }

      cursor = result.cursor;
    }

    const transactions = events
      .map((event) =>
        eventToVaultTx(event, walletAddress),
      )
      .filter((tx): tx is VaultTx => tx !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );

    res.status(200).json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to load vault transaction history",
    });
  }
}
