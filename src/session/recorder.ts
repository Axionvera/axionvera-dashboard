import { Masker } from "./masker";
import type {
  ClickEventData,
  ConsoleEventData,
  InputEventData,
  InputType,
  MutationEventData,
  NavigationEventData,
  RecorderOptions,
  SessionEvent,
} from "./types";
import { DEFAULT_MAX_EVENTS } from "./types";

const HISTORY_PATCH_FLAG = "__sessionRecorderPatched" as const;

type HistoryMethod = "pushState" | "replaceState";
type HistoryPatchState = {
  pushState: typeof history.pushState;
  replaceState: typeof history.replaceState;
};

const keyboardModifierFromEvent = (event: MouseEvent | KeyboardEvent) => ({
  alt: event.altKey,
  ctrl: event.ctrlKey,
  meta: event.metaKey,
  shift: event.shiftKey,
});

const classifyInputType = (element: HTMLInputElement): InputType => {
  const raw = (element.type || "text").toLowerCase();
  switch (raw) {
    case "checkbox":
      return "checkbox";
    case "radio":
      return "radio";
    case "password":
      return "password";
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "number":
      return "number";
    case "text":
      return "text";
    default:
      return "other";
  }
};

/**
 * `SessionRecorder` captures browser interactions and emits a stream of
 * `SessionEvent`s to the caller-supplied `emit` sink.
 *
 * The recorder is intentionally side-effect free at construction time. Call
 * `start()` to attach listeners; call `stop()` to release them. `stop()`
 * emits a final `session:stop` event so downstream consumers can flip the
 * session into the "ended" state.
 */
export class SessionRecorder {
  private readonly mask: Masker;
  private readonly emit: (event: SessionEvent) => void;
  private readonly now: () => number;
  private readonly idFactory: () => string;
  private readonly onLimitReached?: () => void;
  private readonly maxEvents: number;

  private readonly sessionId: string;
  private platform: Required<RecorderOptions["platform"]>;
  private active = false;
  private listeners: Array<() => void> = [];
  private observer: MutationObserver | null = null;
  private historyPatch: HistoryPatchState | null = null;
  private pendingMutationEvents: SessionEvent[] = [];
  private mutationFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private consolePatch: Partial<Record<"log" | "info" | "warn" | "error", (...args: unknown[]) => void>> = {};
  private emittedCount = 0;

  constructor(options: RecorderOptions) {
    if (!options.sessionId) {
      throw new Error("SessionRecorder requires a sessionId");
    }
    if (typeof options.emit !== "function") {
      throw new Error("SessionRecorder requires an emit() sink");
    }
    this.sessionId = options.sessionId;
    this.mask = new Masker(options.mask);
    this.emit = options.emit;
    this.now = options.now ?? (() => Date.now());
    this.idFactory = options.idFactory ?? (() => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    this.onLimitReached = options.onLimitReached;
    this.maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
    this.platform = this.resolvePlatform(options.platform);
  }

  private resolvePlatform(
    override: Partial<RecorderOptions["platform"]> | undefined,
  ): Required<RecorderOptions["platform"]> {
    const fallback = typeof window !== "undefined" ? window : undefined;
    return {
      window: override?.window ?? fallback ?? null,
      document: override?.document ?? fallback?.document ?? null,
      MutationObserver: override?.MutationObserver ?? fallback?.MutationObserver ?? null,
    };
  }

  isActive(): boolean {
    return this.active;
  }

  eventCount(): number {
    return this.emittedCount;
  }

  start(): void {
    if (this.active) return;
    if (!this.platform.window || !this.platform.document || !this.platform.MutationObserver) {
      throw new Error(
        "SessionRecorder cannot start without a browser platform. Pass a `platform` override in non-browser environments.",
      );
    }
    this.active = true;
    this.attachListeners();
    this.attachMutationObserver();
    this.attachHistoryHooks();
    this.attachConsolePatch();
    this.record({ type: "session:start", data: {} });
  }

  stop(): void {
    if (!this.active) return;
    this.flushMutations();
    this.detachListeners();
    this.detachMutationObserver();
    this.detachHistoryHooks();
    this.detachConsolePatch();
    this.active = false;
    this.record({ type: "session:stop", data: {} });
  }

  private attachListeners(): void {
    const document = this.platform.document!;
    const window = this.platform.window!;

    const clickHandler = (rawEvent: Event) => {
      const event = rawEvent as MouseEvent;
      const target = event.target as Element | null;
      if (!target) return;
      const payload: ClickEventData = {
        selector: this.mask.buildSelector(target),
        text: this.mask.shouldMaskElement(target) ? this.mask.maskedText(target) : (target.textContent ?? "").trim().slice(0, 120),
        x: event.clientX,
        y: event.clientY,
        button: event.button,
        modifiers: keyboardModifierFromEvent(event),
      };
      this.record({ type: "click", data: payload });
    };
    document.addEventListener("click", clickHandler, { capture: true });
    this.listeners.push(() => document.removeEventListener("click", clickHandler, { capture: true }));

    const inputHandler = (rawEvent: Event) => {
      const event = rawEvent as InputEvent;
      const target = event.target;
      if (
        !target ||
        !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)
      ) {
        return;
      }
      const payload: InputEventData = {
        selector: this.mask.buildSelector(target),
        name: target.name,
        value: this.mask.maskInputValue(target, target.value ?? ""),
        type:
          target instanceof HTMLSelectElement
            ? "select"
            : target instanceof HTMLTextAreaElement
            ? "textarea"
            : classifyInputType(target),
        source: "input",
      };
      this.record({ type: "input", data: payload });
    };
    document.addEventListener("input", inputHandler, { capture: true });
    this.listeners.push(() => document.removeEventListener("input", inputHandler, { capture: true }));

    const changeHandler = (rawEvent: Event) => {
      const event = rawEvent as Event;
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }
      const payload: InputEventData = {
        selector: this.mask.buildSelector(target),
        name: target.name,
        value: this.mask.maskInputValue(target, target.value ?? ""),
        type:
          target instanceof HTMLSelectElement
            ? "select"
            : target instanceof HTMLTextAreaElement
            ? "textarea"
            : classifyInputType(target),
        source: "change",
      };
      this.record({ type: "input", data: payload });
    };
    document.addEventListener("change", changeHandler, { capture: true });
    this.listeners.push(() => document.removeEventListener("change", changeHandler, { capture: true }));

    const popstateHandler = () => this.recordNavigation("popstate");
    window.addEventListener("popstate", popstateHandler);
    this.listeners.push(() => window.removeEventListener("popstate", popstateHandler));

    const hashchangeHandler = () => this.recordNavigation("popstate");
    window.addEventListener("hashchange", hashchangeHandler);
    this.listeners.push(() => window.removeEventListener("hashchange", hashchangeHandler));
  }

  private attachMutationObserver(): void {
    const document = this.platform.document!;
    const Observer = this.platform.MutationObserver!;
    this.observer = new Observer((mutations) => {
      for (const mutation of mutations) {
        const event = this.buildMutationEvent(mutation);
        if (event) this.pendingMutationEvents.push(event);
      }
      this.scheduleMutationFlush();
    });
    this.observer.observe(document.documentElement, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: false,
    });
  }

  private detachMutationObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.mutationFlushTimer) {
      clearTimeout(this.mutationFlushTimer);
      this.mutationFlushTimer = null;
    }
    this.pendingMutationEvents = [];
  }

  private scheduleMutationFlush(): void {
    if (this.mutationFlushTimer || !this.platform.window) return;
    this.mutationFlushTimer = setTimeout(() => {
      this.mutationFlushTimer = null;
      this.flushMutations();
    }, 100);
  }

  private flushMutations(): void {
    const drained = this.pendingMutationEvents.splice(0);
    for (const event of drained) this.emitIfUnderLimit(event);
  }

  private buildMutationEvent(mutation: MutationRecord): SessionEvent | null {
    const target = mutation.target;
    const targetEl = target.nodeType === 1 ? (target as Element) : target.parentElement;
    if (!targetEl) return null;
    const payload: MutationEventData = {
      target: this.mask.buildSelector(targetEl),
      kind:
        mutation.type === "attributes"
          ? "attributes"
          : mutation.type === "characterData"
          ? "characterData"
          : "childList",
      addedNodes: mutation.addedNodes
        ? Array.from(mutation.addedNodes)
            .map((node) => this.mask.serializeNode(node))
            .filter((node): node is NonNullable<typeof node> => Boolean(node))
        : [],
      removedCount: mutation.removedNodes?.length ?? 0,
      attributeName: mutation.attributeName ?? undefined,
    };
    return {
      id: this.idFactory(),
      sessionId: this.sessionId,
      type: "mutation",
      timestamp: this.now(),
      data: payload,
    };
  }

  private recordNavigation(method: NavigationEventData["method"]): void {
    const window = this.platform.window;
    if (!window) return;
    const payload: NavigationEventData = {
      url: window.location.href,
      method,
      title: typeof document !== "undefined" ? document.title : undefined,
    };
    this.record({ type: "navigation", data: payload });
  }

  private attachHistoryHooks(): void {
    const window = this.platform.window!;
    type HistoryWithFlag = History & { [HISTORY_PATCH_FLAG]?: boolean };
    const historyRef = window.history as HistoryWithFlag;
    if (historyRef[HISTORY_PATCH_FLAG]) {
      this.historyPatch = {
        pushState: historyRef.pushState.bind(historyRef),
        replaceState: historyRef.replaceState.bind(historyRef),
      };
      return;
    }
    const originalPush = historyRef.pushState.bind(historyRef);
    const originalReplace = historyRef.replaceState.bind(historyRef);
    const tap = (method: HistoryMethod) => (...args: Parameters<typeof originalPush>) => {
      const result = (originalPush as (...a: unknown[]) => unknown).apply(historyRef, args);
      this.recordNavigation(method);
      return result;
    };
    historyRef.pushState = tap("pushState") as typeof originalPush;
    historyRef.replaceState = tap("replaceState") as typeof originalReplace;
    historyRef[HISTORY_PATCH_FLAG] = true;
    this.historyPatch = { pushState: originalPush, replaceState: originalReplace };
  }

  private detachHistoryHooks(): void {
    const window = this.platform.window;
    if (!window || !this.historyPatch) return;
    const historyRef = window.history as { [HISTORY_PATCH_FLAG]?: boolean };
    historyRef.pushState = this.historyPatch.pushState;
    historyRef.replaceState = this.historyPatch.replaceState;
    delete historyRef[HISTORY_PATCH_FLAG];
    this.historyPatch = null;
  }

  private attachConsolePatch(): void {
    const window = this.platform.window!;
    const consoleRef = window.console;
    if (!consoleRef) return;
    const levels: Array<"log" | "info" | "warn" | "error"> = ["log", "info", "warn", "error"];
    for (const level of levels) {
      const original = consoleRef[level]?.bind(consoleRef);
      if (typeof original !== "function") continue;
      this.consolePatch[level] = original as (...args: unknown[]) => void;
      consoleRef[level] = (...args: unknown[]) => {
        const payload: ConsoleEventData = {
          level,
          args: args.map((arg) => this.stringify(arg)).slice(0, 8),
        };
        this.record({ type: "console", data: payload });
        original(...args);
      };
    }
  }

  private detachConsolePatch(): void {
    const consoleRef = this.platform.window?.console;
    if (!consoleRef) return;
    for (const [level, original] of Object.entries(this.consolePatch) as Array<[
      "log" | "info" | "warn" | "error",
      (...args: unknown[]) => void,
    ]>) {
      consoleRef[level] = original;
    }
    this.consolePatch = {};
  }

  private stringify(arg: unknown): string {
    if (typeof arg === "string") return arg.slice(0, 240);
    if (typeof arg === "number" || typeof arg === "boolean" || typeof arg === "bigint") {
      return String(arg);
    }
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
      return JSON.stringify(arg).slice(0, 240);
    } catch {
      return String(arg);
    }
  }

  private record(partial: { type: SessionEvent["type"]; data: SessionEvent["data"] }): void {
    const event: SessionEvent = {
      id: this.idFactory(),
      sessionId: this.sessionId,
      type: partial.type,
      timestamp: this.now(),
      data: partial.data,
    };
    this.emitIfUnderLimit(event);
  }

  private emitIfUnderLimit(event: SessionEvent): void {
    if (this.emittedCount >= this.maxEvents) {
      this.onLimitReached?.();
      return;
    }
    try {
      this.emit(event);
      this.emittedCount += 1;
    } catch (err) {
      // Sinks must never bring down the recorder. Errors are logged at debug
      // level so they show up in browser devtools without polluting app logs.
      if (typeof console !== "undefined" && console.debug) {
        console.debug("SessionRecorder emit failed:", err);
      }
    }
  }

  private detachListeners(): void {
    for (const off of this.listeners) off();
    this.listeners = [];
  }
}
