/**
 * Domain types for the Session Replay & User Journey Recorder.
 *
 * The recorder captures browser interactions into a stream of `SessionEvent`
 * records. Each event is consumed by a pluggable sink (the IndexedDB store by
 * default) and can later be replayed by `SessionPlayer`.
 *
 * The package is fully SSR-safe: every module accepts the platform globals
 * (`window`, `document`, `MutationObserver`, `IDBFactory`) via dependency
 * injection so it can run inside jsdom tests, Next.js server builds, and any
 * sandboxed iframe.
 */

export type SessionEventType =
  | "session:start"
  | "session:stop"
  | "session:meta"
  | "navigation"
  | "click"
  | "input"
  | "mutation"
  | "console";

export interface SerializedNode {
  /** Tag name lower-cased (e.g. `"div"`). */
  tag: string;
  /** Serialized attributes keyed by attribute name. */
  attrs: Record<string, string>;
  /** Visible text after masking. */
  text?: string;
  /** Recursive children in document order (max depth is enforced by caller). */
  children: SerializedNode[];
  /** Set when the node matched a block selector and was redacted. */
  masked?: boolean;
}

export interface NavigationEventData {
  url: string;
  method: "pushState" | "replaceState" | "popstate" | "load";
  title?: string;
}

export interface ClickEventData {
  /** Best-effort CSS selector unique within the document at capture time. */
  selector: string;
  /** Visible text content of the target (already masked). */
  text?: string;
  /** Coordinates relative to the viewport. */
  x: number;
  y: number;
  /** Mouse button. 0 = primary, 2 = secondary. */
  button: number;
  /** Extra modifiers encoded for compactness. */
  modifiers: { alt: boolean; ctrl: boolean; meta: boolean; shift: boolean };
}

export type InputType =
  | "text"
  | "checkbox"
  | "radio"
  | "select"
  | "textarea"
  | "password"
  | "email"
  | "tel"
  | "number"
  | "other";

export interface InputEventData {
  selector: string;
  name?: string;
  /** Value after masking. Empty for `password` inputs even if not masked. */
  value: string;
  type: InputType;
  /** Whether this came from a live `input` event or a `change` event. */
  source: "input" | "change";
}

export interface MutationEventData {
  target: string;
  kind: "attributes" | "characterData" | "childList";
  addedNodes: SerializedNode[];
  removedCount: number;
  attributeName?: string;
}

export interface ConsoleEventData {
  level: "log" | "info" | "warn" | "error";
  /** Stringified arguments, masked if they look like secrets. */
  args: string[];
}

export type SessionEventData =
  | NavigationEventData
  | ClickEventData
  | InputEventData
  | MutationEventData
  | ConsoleEventData
  | Record<string, never>;

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  /** Milliseconds since the Unix epoch. */
  timestamp: number;
  data: SessionEventData;
}

export interface SessionMetadata {
  id: string;
  startedAt: number;
  endedAt?: number;
  url: string;
  userAgent: string;
  label?: string;
  events: number;
  truncated?: boolean;
}

export interface MaskOptions {
  /** Elements matching any of these selectors are redacted. */
  blockSelectors?: string[];
  /** Mask the value of password-like inputs even if not explicitly blocked. */
  maskSensitiveInputs?: boolean;
  /** The replacement character used when masking text. Defaults to `"•"`. */
  replaceWith?: string;
  /** Maximum depth when serializing DOM subtrees. Defaults to 6. */
  maxDepth?: number;
}

export interface RecorderPlatform {
  window: Window | null;
  document: Document | null;
  MutationObserver: typeof MutationObserver | null;
}

export interface RecorderOptions {
  sessionId: string;
  mask?: MaskOptions;
  /** Maximum number of events emitted before the recorder stops. */
  maxEvents?: number;
  /** Sink for each captured event. The recorder never throws to the sink. */
  emit: (event: SessionEvent) => void;
  /** Optional override for the browser globals (used by tests). */
  platform?: Partial<RecorderPlatform>;
  /** Override for `Date.now` (used by tests). */
  now?: () => number;
  /** Override for UID generation (used by tests). */
  idFactory?: () => string;
  /** Hook fired when a record is dropped because `maxEvents` was reached. */
  onLimitReached?: () => void;
}

export interface IndexedDBSessionStoreOptions {
  dbName?: string;
  version?: number;
  /** How many sessions to retain after `rotate()` (LRU by `endedAt`). */
  maxRetainedSessions?: number;
  /** Sessions older than this are deleted by `rotate()`. */
  maxRetainedAgeMs?: number;
  /** Override the IndexedDB factory (tests inject a mock). */
  indexedDBFactory?: IDBFactory;
  /** Override the cryptographically-strong UID factory for metadata ids. */
  idFactory?: () => string;
  /** Override `Date.now` for tests. */
  now?: () => number;
}

export type SessionRecordFilter = {
  type?: SessionEventType;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
};

export interface SessionPlayerOptions {
  /** All events to play. The player never mutates this array. */
  events: SessionEvent[];
  /** Container element where DOM mutations are applied. */
  sandbox: HTMLElement;
  /** Playback multiplier. Default 1. */
  speed?: number;
  /** Called for every processed event (also during navigation jumps). */
  onStep?: (event: SessionEvent, index: number) => void;
  /** Called once playback completes. */
  onComplete?: () => void;
  /** Called before each DOM mutation is applied (for test inspection). */
  onMutationApply?: (event: SessionEvent) => void;
  /** Overrides for test environments. */
  now?: () => number;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
  cancelAnimationFrame?: typeof cancelAnimationFrame;
  requestAnimationFrame?: typeof requestAnimationFrame;
}

export const DEFAULT_DB_NAME = "axionvera_sessions";
export const DEFAULT_STORE_NAME = "events";
export const DEFAULT_META_NAME = "sessions";
export const DEFAULT_REPLACE_WITH = "•";
export const DEFAULT_MAX_DEPTH = 6;
export const DEFAULT_MAX_EVENTS = 5_000;
