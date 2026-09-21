import { decodeSorobanScVal } from './sorobanDecoder';

/**
 * Interface for a parsed Soroban event
 */
export interface ParsedSorobanEvent {
  id: string;
  type: string;
  contractId: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash?: string;
  topics: string[];
  value: any;
}

/**
 * Generic utility to parse raw Soroban events into a human-readable format.
 * Integrates decodeSorobanSymbol to ensure symbols, strings, and bytes 
 * are correctly converted to UTF-8 strings.
 * 
 * @param rawEvents - Array of raw events from Horizon or Soroban RPC
 * @returns Array of ParsedSorobanEvent objects
 */
export function parseSorobanEvents(rawEvents: any[]): ParsedSorobanEvent[] {
  if (!Array.isArray(rawEvents)) return [];

  return rawEvents.map((event) => {
    // 1. Decode topics (usually symbols or IDs)
    const decodedTopics = Array.isArray(event.topic) 
      ? event.topic.map((t: any) => String(decodeSorobanScVal(t)))
      : Array.isArray(event.topics) // Some RPC responses use 'topics'
        ? event.topics.map((t: any) => String(decodeSorobanScVal(t)))
        : [];

    // 2. Determine event type.
    // Axionvera vault events use ["vault", "<action>"] topics,
    // e.g. ["vault", "deposit"] or ["vault", "withdraw"].
    const eventType =
      decodedTopics[0] === "vault" && decodedTopics.length > 1
        ? decodedTopics[1]
        : decodedTopics.length > 0
          ? decodedTopics[0]
          : "unknown";

    // 3. Decode event value
    // If it's a simple type, decode it; if complex, we might need more specific logic
    // but for now we use the robust decoder to avoid [Object object]
    const decodedValue = event.value?.xdr 
      ? decodeSorobanScVal(event.value.xdr) // Handle Horizon format
      : event.value 
        ? decodeSorobanScVal(event.value) // Handle RPC format
        : null;

    return {
      id: event.id || 'unknown',
      type: eventType,
      contractId: event.contractId || event.contract_id || 'unknown',
      ledger: Number(event.ledger || event.ledger_sequence || 0),
      ledgerClosedAt: event.ledgerClosedAt || event.ledger_closed_at || new Date().toISOString(),
      txHash:
        typeof event.txHash === "string"
          ? event.txHash
          : typeof event.transaction_hash === "string"
            ? event.transaction_hash
            : undefined,
      topics: decodedTopics,
      value: decodedValue
    };
  });
}
