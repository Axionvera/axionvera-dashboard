import { parseSorobanEvents, type ParsedSorobanEvent } from '@/utils/parseEvents';
import type { ActivityEvent, ActivityType, RawSorobanEvent } from './types';

/**
 * Maps a raw event name (first topic) to a high-level activity category.
 * Matching is case-insensitive and tolerant of common naming variants so the
 * feed stays meaningful across slightly different contract event names.
 */
export function classifyActivity(name: string): ActivityType {
  const n = (name ?? '').toLowerCase();

  // Check withdrawal first: "unstake" contains "stake", so it must win over the
  // deposit heuristic below.
  if (
    n.includes('withdraw') ||
    n.includes('redeem') ||
    n.includes('burn') ||
    n.includes('unstake')
  ) {
    return 'withdrawal';
  }
  if (n.includes('deposit') || n.includes('mint') || n.includes('stake')) {
    return 'deposit';
  }
  if (n.includes('reward') || n.includes('claim') || n.includes('yield')) {
    return 'reward';
  }
  if (
    n.includes('proposal') ||
    n.includes('vote') ||
    n.includes('govern') ||
    n.includes('execute')
  ) {
    return 'governance';
  }
  return 'unknown';
}

/**
 * Converts a parsed Soroban event into a UI-ready {@link ActivityEvent}.
 */
export function toActivityEvent(parsed: ParsedSorobanEvent): ActivityEvent {
  return {
    id: parsed.id,
    type: classifyActivity(parsed.type),
    name: parsed.type,
    contractId: parsed.contractId,
    ledger: parsed.ledger,
    timestamp: parsed.ledgerClosedAt,
    txHash: parsed.txHash,
    topics: parsed.topics,
    value: parsed.value,
  };
}

/**
 * Parses and maps a batch of raw events into activity events, reusing the
 * shared {@link parseSorobanEvents} decoder for consistency with the rest of
 * the app.
 */
export function mapRawEvents(rawEvents: RawSorobanEvent[]): ActivityEvent[] {
  return parseSorobanEvents(rawEvents).map(toActivityEvent);
}
