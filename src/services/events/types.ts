import type { ParsedSorobanEvent } from '@/utils/parseEvents';

/**
 * High-level category a protocol event maps to for the activity feed.
 */
export type ActivityType =
  | 'deposit'
  | 'withdrawal'
  | 'reward'
  | 'governance'
  | 'unknown';

/**
 * Connection state of the real-time event subscription.
 */
export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

/**
 * A normalized, UI-ready protocol event derived from a raw Soroban event.
 */
export interface ActivityEvent {
  /** Stable unique id (used for deduplication and React keys). */
  id: string;
  /** Category used to render and group the event. */
  type: ActivityType;
  /** Raw event name (first topic), e.g. "deposit", "withdraw", "vote". */
  name: string;
  /** Contract that emitted the event. */
  contractId: string;
  /** Ledger sequence the event was included in. */
  ledger: number;
  /** ISO timestamp the ledger closed (best-effort). */
  timestamp: string;
  /** Hash of the Stellar transaction that emitted the event. */
  txHash?: string;
  /** Decoded event topics. */
  topics: string[];
  /** Decoded event value payload. */
  value: unknown;
}

/** Raw event shape as returned by Soroban RPC `getEvents` / Horizon. */
export type RawSorobanEvent = Record<string, unknown>;

/**
 * Fetches protocol events from a data source (Soroban RPC by default).
 * Injectable so the subscription service can be unit-tested without a network.
 */
export interface EventFetcher {
  /** Returns the latest ledger sequence, used as the streaming start cursor. */
  getLatestLedger(): Promise<number>;
  /** Returns events at/after `startLedger` for the given contracts. */
  getEvents(params: {
    startLedger: number;
    contractIds: string[];
    limit: number;
  }): Promise<{ events: RawSorobanEvent[]; latestLedger: number }>;
}

export type EventListener = (event: ActivityEvent) => void;
export type StatusListener = (status: ConnectionStatus) => void;

export type { ParsedSorobanEvent };
