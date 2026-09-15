import type { NextApiRequest, NextApiResponse } from "next";

type AxionveraCoreModule = typeof import("@axionvera/core");

type PrepareWriteAction = "deposit" | "withdraw" | "claim_rewards";

type PrepareWriteResponse =
  | {
      ok: true;
      action: PrepareWriteAction;
      method: string;
      contractId: string;
      accountToSign: string;
      signerPublicKey: string;
      networkPassphrase: string;
      unsignedXdr: string;
      unsignedXdrLength: number;
      args: unknown[];
    }
  | {
      ok: false;
      error: string;
    };

function loadStellarVaultWriter(): AxionveraCoreModule["StellarVaultWriter"] {
  const runtimeRequire = eval("require") as NodeRequire;
  const core = runtimeRequire("@axionvera/core") as AxionveraCoreModule;
  return core.StellarVaultWriter;
}

function getBody(req: NextApiRequest): Record<string, unknown> {
  return req.body && typeof req.body === "object" ? req.body : {};
}

function readString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readAction(body: Record<string, unknown>): PrepareWriteAction | undefined {
  const action = readString(body, "action");

  if (action === "deposit" || action === "withdraw" || action === "claim_rewards") {
    return action;
  }

  return undefined;
}

function readAmount(body: Record<string, unknown>): string | number | undefined {
  const value = body.amount;

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return value;
  }

  return undefined;
}

function serialiseArg(value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrepareWriteResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = getBody(req);
  const action = readAction(body);

  if (!action) {
    res.status(400).json({
      ok: false,
      error: "action must be one of: deposit, withdraw, claim_rewards",
    });
    return;
  }

  const sourcePublicKey =
    readString(body, "sourcePublicKey") ??
    readString(body, "walletAddress") ??
    readString(body, "address");

  if (!sourcePublicKey) {
    res.status(400).json({
      ok: false,
      error: "sourcePublicKey is required",
    });
    return;
  }

  const contractId = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;
  const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const networkPassphrase =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

  if (!contractId) {
    res.status(500).json({
      ok: false,
      error: "NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID is not configured",
    });
    return;
  }

  try {
    const StellarVaultWriter = loadStellarVaultWriter();

    const writer = new StellarVaultWriter({
      contractId,
      sourcePublicKey,
      rpcUrl,
      networkPassphrase,
    });

    const prepared =
      action === "deposit"
        ? await writer.prepareDeposit({
            from: readString(body, "from") ?? sourcePublicKey,
            amount: readAmount(body),
          })
        : action === "withdraw"
          ? await writer.prepareWithdraw({
              to: readString(body, "to") ?? sourcePublicKey,
              amount: readAmount(body),
            })
          : await writer.prepareClaimRewards({
              address: readString(body, "address") ?? sourcePublicKey,
            });

    res.status(200).json({
      ok: true,
      action,
      method: prepared.method,
      contractId: prepared.contractId,
      accountToSign: prepared.accountToSign,
      signerPublicKey: prepared.signerPublicKey,
      networkPassphrase: prepared.networkPassphrase,
      unsignedXdr: prepared.unsignedXdr,
      unsignedXdrLength: prepared.unsignedXdr.length,
      args: prepared.args.map(serialiseArg),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to prepare write transaction",
    });
  }
}
