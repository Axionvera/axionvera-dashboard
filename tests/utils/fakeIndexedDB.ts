/**
 * Minimal in-memory IndexedDB shim. Implements only the subset used by
 * `IndexedDBSessionStore`. The shim lives inside the test bundle so we can
 * avoid adding a runtime dependency on `fake-indexeddb` while keeping the
 * production code path against the native browser API.
 */

type AnyValue = unknown;

class FakeIDBKeyRange {
  constructor(
    public readonly lower: AnyValue,
    public readonly upper: AnyValue,
    public readonly lowerOpen: boolean,
    public readonly upperOpen: boolean,
  ) {}
  static only(value: AnyValue): FakeIDBKeyRange {
    return new FakeIDBKeyRange(value, value, false, false);
  }
  static bound(lower: AnyValue, upper: AnyValue, lowerOpen = false, upperOpen = false): FakeIDBKeyRange {
    return new FakeIDBKeyRange(lower, upper, lowerOpen, upperOpen);
  }
}

class FakeIDBRequest<T = AnyValue> {
  result: T = undefined as unknown as T;
  error: Error | null = null;
  onsuccess: ((this: FakeIDBRequest<T>, ev: Event) => unknown) | null = null;
  onerror: ((this: FakeIDBRequest<T>, ev: Event) => unknown) | null = null;
  private listeners = new Map<string, Set<(...args: unknown[]) => unknown>>();

  addEventListener(type: string, listener: (...args: unknown[]) => unknown): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: (...args: unknown[]) => unknown): void {
    this.listeners.get(type)?.delete(listener);
  }
  fire(type: "success" | "error"): void {
    const propName = type === "success" ? "onsuccess" : "onerror";
    const handler = this[propName];
    if (typeof handler === "function") (handler as (this: FakeIDBRequest<T>, ev: Event) => unknown).call(this, {} as Event);
    const set = this.listeners.get(type);
    if (set) for (const listener of set) listener({} as Event);
  }
}

interface FakeCursorEntry {
  primary: AnyValue;
  value: AnyValue;
}

class FakeCursor {
  public readonly request: FakeIDBRequest<FakeCursor | null>;
  public readonly entries: FakeCursorEntry[];
  public readonly storage: Map<AnyValue, AnyValue>;
  /**
   * Key path of the index the cursor was opened with, or `null` when the
   * cursor belongs to a plain object store. Determines how `key` is reported
   * and which primary key is used for `delete()`.
   */
  public readonly indexKeyPath: string | null;
  public pointer: number;
  public key: AnyValue = undefined as unknown as AnyValue;
  public primaryKey: AnyValue = undefined as unknown as AnyValue;
  public value: AnyValue = undefined as unknown as AnyValue;

  constructor(
    request: FakeIDBRequest<FakeCursor | null>,
    entries: FakeCursorEntry[],
    storage: Map<AnyValue, AnyValue>,
    indexKeyPath: string | null,
    initialIndex = 0,
  ) {
    this.request = request;
    this.entries = entries;
    this.storage = storage;
    this.indexKeyPath = indexKeyPath;
    this.pointer = initialIndex;
    this.hydrate();
  }

  continue(): void {
    this.pointer += 1;
    if (this.pointer < this.entries.length) {
      this.hydrate();
      this.request.result = this;
    } else {
      this.request.result = null;
    }
    queueMicrotask(() => this.request.fire("success"));
  }

  delete(): void {
    if (this.indexKeyPath !== null) {
      const id = (this.value as { id?: AnyValue } | null)?.id;
      if (id !== undefined) this.storage.delete(id);
    } else if (this.primaryKey !== undefined) {
      this.storage.delete(this.primaryKey);
    }
  }

  private hydrate(): void {
    const entry = this.entries[this.pointer];
    this.primaryKey = entry.primary;
    this.value = entry.value;
    this.key = this.indexKeyPath !== null
      ? (getPathValue(entry.value, this.indexKeyPath) ?? entry.primary)
      : entry.primary;
  }
}

interface FakeObjectStoreInit {
  keyPath?: string | string[];
  autoIncrement?: boolean;
}

class FakeObjectStore {
  private storage = new Map<AnyValue, AnyValue>();
  private indexes = new Map<string, FakeIDBIndex>();

  constructor(public readonly name: string, public readonly init: FakeObjectStoreInit = {}) {}

  createIndex(name: string, keyPath: string, _options?: { unique?: boolean }): FakeIDBIndex {
    const index = new FakeIDBIndex(name, keyPath, this.storage);
    this.indexes.set(name, index);
    return index;
  }

  index(name: string): FakeIDBIndex {
    const idx = this.indexes.get(name);
    if (!idx) throw new Error(`Unknown index ${name}`);
    return idx;
  }

  getIndexNames(): string[] {
    return Array.from(this.indexes.keys());
  }

  put(value: AnyValue): FakeIDBRequest<AnyValue> {
    const key = this.resolveKey(value);
    this.storage.set(key, deepClone(value));
    return makeSuccess(key);
  }

  add(value: AnyValue): FakeIDBRequest<AnyValue> {
    const key = this.resolveKey(value);
    if (this.storage.has(key)) {
      const req = new FakeIDBRequest<AnyValue>();
      queueMicrotask(() => {
        req.error = new Error("Constraint error: duplicate key");
        req.fire("error");
      });
      return req;
    }
    this.storage.set(key, deepClone(value));
    return makeSuccess(key);
  }

  get(key: AnyValue): FakeIDBRequest<AnyValue> {
    return makeSuccess(deepClone(this.storage.get(key)));
  }

  getAll(): FakeIDBRequest<AnyValue[]> {
    return makeSuccess(Array.from(this.storage.values()).map(deepClone));
  }

  delete(key: AnyValue): FakeIDBRequest<undefined> {
    this.storage.delete(key);
    return makeSuccess(undefined);
  }

  clear(): FakeIDBRequest<undefined> {
    this.storage.clear();
    return makeSuccess(undefined);
  }

  openCursor(range?: FakeIDBKeyRange | null): FakeIDBRequest<FakeCursor | null> {
    const entries = sortPrimaryEntries(Array.from(this.storage.entries()))
      .map(([primary, value]) => ({ primary, value }))
      .filter((entry) => matchPrimaryRange(entry.primary, range));
    return this.createCursorRequest(entries);
  }

  indexOpenCursor(name: string, range: FakeIDBKeyRange): FakeIDBRequest<FakeCursor | null> {
    const index = this.indexes.get(name);
    if (!index) throw new Error(`Unknown index ${name}`);
    return index.openCursor(range);
  }

  private createCursorRequest(entries: FakeCursorEntry[]): FakeIDBRequest<FakeCursor | null> {
    const req = new FakeIDBRequest<FakeCursor | null>();
    queueMicrotask(() => {
      if (entries.length === 0) {
        req.result = null;
      } else {
        req.result = new FakeCursor(req, entries, this.storage, null);
      }
      req.fire("success");
    });
    return req;
  }

  private resolveKey(value: AnyValue): AnyValue {
    if (!this.init.keyPath) return value as AnyValue;
    const keyPath = Array.isArray(this.init.keyPath)
      ? this.init.keyPath
      : [this.init.keyPath as string];
    let current = value as Record<string, unknown>;
    for (const path of keyPath) {
      if (current === null || current === undefined) return undefined as unknown as AnyValue;
      current = current[path] as Record<string, unknown>;
    }
    return current as AnyValue;
  }
}

class FakeIDBIndex {
  constructor(public readonly name: string, public readonly keyPath: string, private storage: Map<AnyValue, AnyValue>) {}

  getAll(value: AnyValue): FakeIDBRequest<AnyValue[]> {
    const matches: AnyValue[] = [];
    for (const entry of this.storage.values()) {
      if (getPathValue(entry as AnyValue, this.keyPath) === value) matches.push(deepClone(entry));
    }
    return makeSuccess(matches);
  }

  openCursor(range: FakeIDBKeyRange): FakeIDBRequest<FakeCursor | null> {
    const matches: FakeCursorEntry[] = [];
    for (const [primary, value] of this.storage.entries()) {
      const indexKey = getPathValue(value, this.keyPath);
      if (keyInRange(indexKey, range)) matches.push({ primary, value });
    }
    matches.sort((a, b) => compareKeys(getPathValue(a.value, this.keyPath), getPathValue(b.value, this.keyPath)));
    const req = new FakeIDBRequest<FakeCursor | null>();
    queueMicrotask(() => {
      if (matches.length === 0) {
        req.result = null;
      } else {
        req.result = new FakeCursor(req, matches, this.storage, this.keyPath);
      }
      req.fire("success");
    });
    return req;
  }

  findFirst(range: FakeIDBKeyRange): [AnyValue, AnyValue] | null {
    for (const [primary, value] of this.storage.entries()) {
      const key = getPathValue(value, this.keyPath);
      if (keyInRange(key, range)) return [primary, value];
    }
    return null;
  }
}

class FakeIDBTransaction {
  oncomplete: ((this: FakeIDBTransaction, ev: Event) => unknown) | null = null;
  onerror: ((this: FakeIDBTransaction, ev: Event) => unknown) | null = null;
  onabort: ((this: FakeIDBTransaction, ev: Event) => unknown) | null = null;
  error: Error | null = null;
  constructor(public readonly db: FakeIDBDatabase, public readonly storeNames: string[], public readonly mode: "readonly" | "readwrite") {
    // Real IDB fires `oncomplete` once the microtask queue drains. We use
    // setTimeout(0) so the consumer's synchronous writes finish first; if
    // the transaction contains zero writes the listener still fires, which
    // matches IDB's behavior for empty read-only transactions.
    if (typeof setTimeout !== "undefined") {
      setTimeout(() => {
        if (this.oncomplete) this.oncomplete({} as Event);
      }, 0);
    }
  }

  objectStore(name: string): FakeObjectStore {
    const store = this.db.stores.get(name);
    if (!store) throw new Error(`Unknown store ${name}`);
    // Wrap delegates so they participate in the same transaction queue.
    return wrapStoreForTransaction(store, this);
  }
}

function wrapStoreForTransaction(store: FakeObjectStore, txn: FakeIDBTransaction): FakeObjectStore {
  return {
    name: store.name,
    init: store.init,
    createIndex: (...args: Parameters<FakeObjectStore["createIndex"]>) => store.createIndex(...args),
    index: (...args: Parameters<FakeObjectStore["index"]>) => store.index(...args),
    put: (value) => {
      store.put(value);
      return makeSuccess(undefined);
    },
    add: (value) => {
      store.add(value);
      return makeSuccess(undefined);
    },
    get: (key) => store.get(key),
    getAll: () => store.getAll(),
    delete: (key) => {
      store.delete(key);
      return makeSuccess(undefined);
    },
    clear: () => {
      store.clear();
      return makeSuccess(undefined);
    },
    openCursor: (range) => store.openCursor(range ?? null),
  } as FakeObjectStore;
}

class FakeIDBDatabase {
  // Note: ts-jest with `target: ES2022` emits `Object.defineProperty` for
  // `readonly` class fields with `writable: false`, so subsequent assignment
  // in the constructor body throws or no-ops. We keep state mutation-friendly
  // by avoiding the `readonly` modifier and assigning plain properties.
  name!: string;
  version!: number;
  stores!: Map<string, FakeObjectStore>;
  objectStoreNames!: { contains(name: string): boolean };
  listeners!: Map<string, Set<(...args: unknown[]) => unknown>>;
  onversionchange: ((this: FakeIDBDatabase, ev: Event) => unknown) | null = null;

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
    this.stores = new Map<string, FakeObjectStore>();
    this.listeners = new Map<string, Set<(...args: unknown[]) => unknown>>();
    this.objectStoreNames = {
      contains: (n: string) => this.stores.has(n),
    };
    this.onversionchange = null;
  }

  createObjectStore(name: string, init: FakeObjectStoreInit): FakeObjectStore {
    const store = new FakeObjectStore(name, init);
    this.stores.set(name, store);
    return store;
  }

  transaction(names: string | string[], mode: "readonly" | "readwrite"): FakeIDBTransaction {
    const list = Array.isArray(names) ? names : [names];
    return new FakeIDBTransaction(this, list, mode);
  }

  close(): void {
    this.trigger("close");
  }

  addEventListener(type: string, listener: (...args: unknown[]) => unknown): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: (...args: unknown[]) => unknown): void {
    this.listeners.get(type)?.delete(listener);
  }
  private trigger(type: string): void {
    const set = this.listeners.get(type);
    if (set) for (const listener of set) listener({} as Event);
  }
}

class FakeIDBOpenDBRequest extends FakeIDBRequest<FakeIDBDatabase | null> {
  onupgradeneeded: ((this: FakeIDBOpenDBRequest, ev: Event) => unknown) | null = null;
  onblocked: ((this: FakeIDBOpenDBRequest, ev: Event) => unknown) | null = null;
}

export class FakeIDBFactory {
  private databases = new Map<string, FakeIDBDatabase>();

  open(name: string, version: number): FakeIDBOpenDBRequest {
    const req = new FakeIDBOpenDBRequest();
    let db = this.databases.get(name);
    queueMicrotask(() => {
      if (!db) {
        db = new FakeIDBDatabase(name, version);
        this.databases.set(name, db);
      }
      // Mimic the browser: `upgradeneeded` fires once `request.result` is
      // populated, so consumers can call `db.createObjectStore(...)` from
      // inside their handler.
      req.result = db;
      if (req.onupgradeneeded) {
        try {
          (req.onupgradeneeded as (ev: Event) => unknown)({} as Event);
        } catch {
          // ignore handler errors so open() still resolves
        }
      }
      req.fire("success");
    });
    return req;
  }

  deleteDatabase(name: string): FakeIDBRequest<undefined> {
    this.databases.delete(name);
    return makeSuccess(undefined);
  }
}

function makeSuccess<T>(value: T): FakeIDBRequest<T> {
  const req = new FakeIDBRequest<T>();
  queueMicrotask(() => {
    req.result = value;
    req.fire("success");
  });
  return req;
}

function deepClone(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function getPathValue(record: unknown, path: string): unknown {
  let current = record as Record<string, unknown> | undefined;
  for (const segment of path.split(".")) {
    if (current === null || current === undefined) return undefined;
    current = current[segment] as Record<string, unknown> | undefined;
  }
  return current;
}

function compareKeys(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function sortPrimaryEntries(entries: Array<[unknown, unknown]>): Array<[unknown, unknown]> {
  return entries.slice().sort((a, b) => compareKeys(a[0], b[0]));
}

function matchPrimaryRange(primary: AnyValue, range: FakeIDBKeyRange | null | undefined): boolean {
  if (!range) return true;
  return keyInRange(primary, range);
}

function keyInRange(key: unknown, range: FakeIDBKeyRange | null): boolean {
  if (range === null) return true;
  if (range.lower !== undefined) {
    if (compareKeys(key, range.lower) < 0) return false;
    if (!range.lowerOpen && compareKeys(key, range.lower) === 0 && key !== range.lower) return false;
  }
  if (range.upper !== undefined) {
    if (compareKeys(key, range.upper) > 0) return false;
    if (!range.upperOpen && compareKeys(key, range.upper) === 0 && key !== range.upper) return false;
  }
  return true;
}

export const fakeIndexedDB = new FakeIDBFactory();
export const fakeIDBKeyRange = FakeIDBKeyRange;
