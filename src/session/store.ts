import type {
  IndexedDBSessionStoreOptions,
  SessionEvent,
  SessionMetadata,
  SessionRecordFilter,
} from "./types";
import {
  DEFAULT_DB_NAME,
  DEFAULT_META_NAME,
  DEFAULT_STORE_NAME,
} from "./types";

const DEFAULT_VERSION = 1;
const DEFAULT_MAX_RETAINED = 25;
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Promise wrapper around an `IDBRequest` so callers can use async/await.
 */
const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });

const promisifyTransaction = (transaction: IDBTransaction): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });

/**
 * `IndexedDBSessionStore` persists `SessionMetadata` and `SessionEvent`
 * records to IndexedDB. The store is responsible for retention (LRU + age
 * cap) and JSON export so callers don't have to grow their own retention
 * scaffolding.
 *
 * The class is intentionally browser-only. Tests inject an in-memory mock
 * `IDBFactory` via the `indexedDBFactory` option.
 */
export class IndexedDBSessionStore {
  private readonly options: Required<Omit<IndexedDBSessionStoreOptions, "indexedDBFactory">> & {
    indexedDBFactory: IDBFactory;
  };
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(options: IndexedDBSessionStoreOptions = {}) {
    this.options = {
      dbName: options.dbName ?? DEFAULT_DB_NAME,
      version: options.version ?? DEFAULT_VERSION,
      maxRetainedSessions: options.maxRetainedSessions ?? DEFAULT_MAX_RETAINED,
      maxRetainedAgeMs: options.maxRetainedAgeMs ?? DEFAULT_MAX_AGE_MS,
      indexedDBFactory: options.indexedDBFactory ?? globalThis.indexedDB,
      idFactory: options.idFactory ?? (() => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
      now: options.now ?? (() => Date.now()),
    };
  }

  /** Open (or create) the database and run idempotent retention. */
  async init(): Promise<void> {
    await this.open();
    await this.rotate();
  }

  /** Persist a metadata record; idempotent on `id`. */
  async saveMetadata(metadata: SessionMetadata): Promise<void> {
    const db = await this.open();
    const txn = db.transaction(DEFAULT_META_NAME, "readwrite");
    const store = txn.objectStore(DEFAULT_META_NAME);
    store.put(metadata);
    await promisifyTransaction(txn);
  }

  /** Append a single event to the events object store. */
  async saveEvent(event: SessionEvent): Promise<void> {
    const db = await this.open();
    const txn = db.transaction(DEFAULT_STORE_NAME, "readwrite");
    const store = txn.objectStore(DEFAULT_STORE_NAME);
    store.add(event);
    await promisifyTransaction(txn);
  }

  /** Bulk save events into the events store using a single transaction. */
  async saveEvents(events: SessionEvent[]): Promise<void> {
    if (events.length === 0) return;
    const db = await this.open();
    const txn = db.transaction(DEFAULT_STORE_NAME, "readwrite");
    const store = txn.objectStore(DEFAULT_STORE_NAME);
    for (const event of events) store.add(event);
    await promisifyTransaction(txn);
  }

  /** Returns the metadata for a single session or `null` when missing. */
  async getMetadata(sessionId: string): Promise<SessionMetadata | null> {
    const db = await this.open();
    const txn = db.transaction(DEFAULT_META_NAME, "readonly");
    const store = txn.objectStore(DEFAULT_META_NAME);
    const result = await promisifyRequest<SessionMetadata | undefined>(store.get(sessionId));
    return result ?? null;
  }

  /** Returns all metadata records sorted by `startedAt` (newest first). */
  async listMetadata(): Promise<SessionMetadata[]> {
    const db = await this.open();
    const txn = db.transaction(DEFAULT_META_NAME, "readonly");
    const store = txn.objectStore(DEFAULT_META_NAME);
    const result = await promisifyRequest<SessionMetadata[]>(store.getAll());
    return result.sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Returns the events for a session, optionally filtered. The events are
   * always returned sorted by `timestamp` ascending so consumers can replay
   * them in order.
   */
  async getEvents(sessionId: string, filter: SessionRecordFilter = {}): Promise<SessionEvent[]> {
    const db = await this.open();
    const txn = db.transaction(DEFAULT_STORE_NAME, "readonly");
    const store = txn.objectStore(DEFAULT_STORE_NAME);
    const index = store.index("sessionId");
    const all = await promisifyRequest<SessionEvent[]>(index.getAll(sessionId));
    const filtered = all
      .filter((event) => filter.type === undefined || event.type === filter.type)
      .filter((event) => filter.fromTimestamp === undefined || event.timestamp >= filter.fromTimestamp)
      .filter((event) => filter.toTimestamp === undefined || event.timestamp <= filter.toTimestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
    return filter.limit !== undefined ? filtered.slice(0, filter.limit) : filtered;
  }

  /** Remove all events and metadata for a single session. */
  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.open();
    const txn = db.transaction([DEFAULT_META_NAME, DEFAULT_STORE_NAME], "readwrite");
    txn.objectStore(DEFAULT_META_NAME).delete(sessionId);
    const events = txn.objectStore(DEFAULT_STORE_NAME);
    const index = events.index("sessionId");
    const range = IDBKeyRange.only(sessionId);
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Cursor failed"));
    });
    await promisifyTransaction(txn);
  }

  /**
   * Drain all events older than `maxRetainedAgeMs` and evict the oldest
   * sessions past `maxRetainedSessions`. Safe to call on every page load.
   */
  async rotate(): Promise<void> {
    const db = await this.open();
    const ageThreshold = this.options.now() - this.options.maxRetainedAgeMs;
    const txn = db.transaction([DEFAULT_META_NAME, DEFAULT_STORE_NAME], "readwrite");
    const meta = txn.objectStore(DEFAULT_META_NAME);
    const events = txn.objectStore(DEFAULT_STORE_NAME);
    const index = events.index("sessionId");

    const allMeta = await promisifyRequest<SessionMetadata[]>(meta.getAll());
    const stale = allMeta
      .filter((record) => (record.endedAt ?? record.startedAt) < ageThreshold)
      .map((record) => record.id);

    const survivors = allMeta
      .filter((record) => !stale.includes(record.id))
      .sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt));
    const evictedSurvivors = survivors.slice(this.options.maxRetainedSessions).map((r) => r.id);
    const evictList = Array.from(new Set([...stale, ...evictedSurvivors]));

    for (const id of evictList) {
      meta.delete(id);
      const cursorRequest = index.openCursor(IDBKeyRange.only(id));
      await new Promise<void>((resolve, reject) => {
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error ?? new Error("Cursor failed"));
      });
    }
    await promisifyTransaction(txn);
  }

  /** Convert a stored session into a downloadable JSON blob. */
  async exportSessionJSON(sessionId: string): Promise<{
    metadata: SessionMetadata;
    events: SessionEvent[];
    exportedAt: number;
  } | null> {
    const metadata = await this.getMetadata(sessionId);
    if (!metadata) return null;
    const events = await this.getEvents(sessionId);
    return {
      metadata,
      events,
      exportedAt: this.options.now(),
    };
  }

  /** Build a `Blob` URL the caller can hand to `URL.createObjectURL`. */
  async exportSessionBlob(sessionId: string): Promise<Blob | null> {
    const payload = await this.exportSessionJSON(sessionId);
    if (!payload) return null;
    return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  }

  private async open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    const { dbName, version, indexedDBFactory } = this.options;
    if (!indexedDBFactory) {
      throw new Error("IndexedDB is unavailable; pass `indexedDBFactory` for tests or run in a browser");
    }
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDBFactory.open(dbName, version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DEFAULT_META_NAME)) {
          db.createObjectStore(DEFAULT_META_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(DEFAULT_STORE_NAME)) {
          const store = db.createObjectStore(DEFAULT_STORE_NAME, { keyPath: "id" });
          store.createIndex("sessionId", "sessionId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
      request.onblocked = () => reject(new Error("IndexedDB open blocked by another connection"));
    });
    return this.dbPromise;
  }

  /** Close the open connection. Mainly used in tests. */
  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }
}
