import type { AxionveraVaultSdk } from "@/utils/contractHelpers";
import type { StellarNetwork } from "@/utils/networkConfig";

export class TransactionTimeoutError extends Error {
  constructor(hash: string, timeoutMs: number) {
    super(`Transaction ${hash} was not confirmed within ${timeoutMs / 1000}s`);
    this.name = "TransactionTimeoutError";
  }
}

export type TxStep = "signed" | "submitted" | "confirming" | "confirmed";

type PollOptions = {
  walletAddress: string;
  network: StellarNetwork;
  hash: string;
  sdk: AxionveraVaultSdk;
  onStep?: (step: TxStep) => void;
  intervalMs?: number;
  timeoutMs?: number;
};

/**
 * Polls the SDK's getTransactions until the transaction with the given hash
 * reaches "success" or "failed" status, or the timeout is exceeded.
 */
export async function pollTransaction({
  walletAddress,
  network,
  hash,
  sdk,
  onStep,
  intervalMs = 2000,
  timeoutMs = 60_000,
}: PollOptions): Promise<void> {
  onStep?.("submitted");

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    onStep?.("confirming");

    const txs = await sdk.getTransactions({ walletAddress, network });
    const tx = txs.find((t) => t.hash === hash);

    if (tx?.status === "success") {
      onStep?.("confirmed");
      return;
    }

    if (tx?.status === "failed") {
      throw new Error(`Transaction ${hash} failed on-chain`);
    }

    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new TransactionTimeoutError(hash, timeoutMs);
}
