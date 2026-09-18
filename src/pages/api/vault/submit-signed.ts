import type { NextApiRequest, NextApiResponse } from "next";

type AxionveraCoreModule = typeof import("@axionvera/core");

type SubmitSignedResponse =
  | {
      ok: true;
      contractId: string;
      status: string;
      hash: string;
      ledger?: number;
      error?: string;
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

function readBoolean(body: Record<string, unknown>, key: string): boolean | undefined {
  const value = body[key];

  return typeof value === "boolean" ? value : undefined;
}

function readPositiveInteger(
  body: Record<string, unknown>,
  key: string
): number | undefined {
  const value = body[key];

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return undefined;
  }

  return value;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitSignedResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = getBody(req);
  const signedXdr = readString(body, "signedXdr");

  if (!signedXdr) {
    res.status(400).json({
      ok: false,
      error: "signedXdr is required",
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
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const networkPassphrase =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
    "Test SDF Network ; September 2015";

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

    const result = await writer.submitSignedTransaction(signedXdr, {
      poll: readBoolean(body, "poll") ?? true,
      pollIntervalMs: readPositiveInteger(body, "pollIntervalMs"),
      maxPollAttempts: readPositiveInteger(body, "maxPollAttempts"),
    });

    res.status(200).json({
      ok: true,
      contractId,
      status: result.status,
      hash: result.hash,
      ledger: result.ledger,
      error: result.error,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit signed transaction",
    });
  }
}
