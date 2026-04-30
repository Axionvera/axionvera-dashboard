import { xdr, scValToBigInt } from "stellar-sdk";

/**
 * Decodes a base64 XDR-encoded scvI128 value to a decimal string.
 * Avoids BigInt JSON serialization errors by returning a string.
 * Returns null if the input is not a valid scvI128.
 */
export function scvI128ToString(base64Xdr: string): string | null {
  try {
    const scVal = xdr.ScVal.fromXDR(base64Xdr, "base64");
    if (scVal.switch().name !== "scvI128") return null;
    return scValToBigInt(scVal).toString();
  } catch {
    return null;
  }
}

/**
 * Extracts a human-readable error message from a Soroban simulation result.
 * Handles Revert and Trap statuses. Returns null if no error is present.
 */
export function extractSimulationError(sim: { error?: string }): string | null {
  if (!sim.error) return null;
  // The error field is a plain string from the RPC; surface it directly.
  return sim.error;
}
