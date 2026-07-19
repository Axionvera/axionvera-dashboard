import { Masker, SessionRecorder } from "@/session";
import type { RecorderOptions, SessionEvent } from "@/session";

/**
 * Hand-rolled MutationObserver mock. We pass the *class* to the recorder's
 * platform so it can construct observers normally, then pull them out via the
 * `created` stack to drive the mutation pipeline deterministically.
 */
class FakeMutationObserver implements MutationObserver {
  public readonly callback: MutationCallback;
  public observedTargets: Array<{ target: Node; init: MutationObserverInit }> = [];
  public disconnected = false;
  static readonly created: FakeMutationObserver[] = [];

  constructor(callback: MutationCallback) {
    this.callback = callback;
    FakeMutationObserver.created.push(this);
  }

  observe(target: Node, init: MutationObserverInit): void {
    this.observedTargets.push({ target, init });
  }
  disconnect(): void {
    this.disconnected = true;
  }
  takeRecords(): MutationRecord[] {
    return [];
  }
  trigger(records: MutationRecord[]): void {
    this.callback(records, this);
  }
}

const buildPlatform = (overrides: Partial<{ MutationObserver: typeof MutationObserver }> = {}) => {
  const window = globalThis.window!;
  const document = window.document;
  return {
    window,
    document,
    MutationObserver: (overrides.MutationObserver ?? FakeMutationObserver) as typeof MutationObserver,
  } as Required<RecorderOptions["platform"]>;
};

const createRecorder = (overrides: Partial<RecorderOptions> = {}) => {
  const events: SessionEvent[] = [];
  FakeMutationObserver.created.length = 0;
  const platform = buildPlatform();
  const recorder = new SessionRecorder({
    sessionId: "session-x",
    emit: (event) => events.push(event),
    ...overrides,
    platform,
  });
  return { recorder, events, platform };
};

const makeMutationRecord = (target: Node, additions: Node[] = []): MutationRecord => ({
  type: "childList",
  target,
  addedNodes: additions as unknown as NodeList,
  removedNodes: [] as unknown as NodeList,
  previousSibling: null,
  nextSibling: null,
  attributeName: null,
  attributeNamespace: null,
  oldValue: null,
});

describe("SessionRecorder", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    FakeMutationObserver.created.length = 0;
  });

  it("throws when constructed without sessionId or emit", () => {
    expect(() => new SessionRecorder({ sessionId: "", emit: () => {} } as RecorderOptions)).toThrow(/sessionId/);
    expect(() => new SessionRecorder({ sessionId: "abc", emit: undefined as unknown as (event: SessionEvent) => void })).toThrow(/emit/);
  });

  it("emits a session:start and session:stop pair around its lifetime", () => {
    const { recorder, events } = createRecorder();
    recorder.start();
    recorder.start(); // idempotent
    recorder.stop();
    recorder.stop(); // idempotent
    const types = events.map((e) => e.type);
    expect(types[0]).toBe("session:start");
    expect(types[types.length - 1]).toBe("session:stop");
  });

  it("captures click events with selector and masked text", () => {
    const { recorder, events } = createRecorder();
    const button = document.createElement("button");
    button.textContent = "Submit";
    document.body.appendChild(button);
    recorder.start();
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, clientX: 10, clientY: 20 }));
    recorder.stop();
    const clicks = events.filter((e) => e.type === "click");
    expect(clicks).toHaveLength(1);
    expect(clicks[0].data).toMatchObject({
      selector: "button",
      text: "Submit",
      x: 10,
      y: 20,
      button: 0,
      modifiers: { alt: false, ctrl: false, meta: false, shift: false },
    });
  });

  it("masks click targets that match a block selector", () => {
    const { recorder, events } = createRecorder({
      mask: { blockSelectors: [".secret"] },
    });
    const secretBtn = document.createElement("button");
    secretBtn.classList.add("secret");
    secretBtn.textContent = "secret action";
    document.body.appendChild(secretBtn);
    recorder.start();
    secretBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    recorder.stop();
    const click = events.find((e) => e.type === "click");
    expect(click).toBeDefined();
    expect(click!.data).toMatchObject({ text: "•••••• ••••••" });
  });

  it("captures input events with masked password values", () => {
    const { recorder, events } = createRecorder();
    const input = document.createElement("input");
    input.type = "password";
    input.name = "pwd";
    document.body.appendChild(input);
    recorder.start();
    input.value = "hunter2";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    recorder.stop();
    const inputs = events.filter((e) => e.type === "input");
    expect(inputs).toHaveLength(1);
    expect(inputs[0].data).toMatchObject({ value: "•••••••", source: "input", name: "pwd" });
  });

  it("maskes email inputs even when not explicitly blocked", () => {
    const { recorder, events } = createRecorder();
    const input = document.createElement("input");
    input.type = "email";
    input.name = "email";
    document.body.appendChild(input);
    recorder.start();
    input.value = "user@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    recorder.stop();
    const captured = events.find((e) => e.type === "input");
    expect(captured).toBeDefined();
    expect(captured!.data).toMatchObject({ value: "••••••••••••••••" });
  });

  it("captures change events for select elements with empty value", () => {
    const { recorder, events } = createRecorder();
    const select = document.createElement("select");
    select.name = "country";
    select.innerHTML = "<option value='us'>US</option><option value='de'>DE</option>";
    document.body.appendChild(select);
    recorder.start();
    select.value = "de";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    recorder.stop();
    const changes = events.filter((e) => e.type === "input");
    expect(changes).toHaveLength(1);
    expect(changes[0].data).toMatchObject({ value: "", type: "select", source: "change" });
  });

  it("patches history.pushState and emits navigation events", () => {
    const { recorder, events } = createRecorder();
    const original = window.history.pushState.bind(window.history);
    recorder.start();
    try {
      window.history.pushState({}, "", "/page-b");
    } finally {
      window.history.pushState = original;
    }
    recorder.stop();
    const nav = events.find((e) => e.type === "navigation");
    expect(nav).toBeDefined();
    expect(nav!.data).toMatchObject({ method: "pushState" });
  });

  it("buffers mutation events flushed on stop()", () => {
    const { recorder, events } = createRecorder();
    recorder.start();
    expect(FakeMutationObserver.created).toHaveLength(1);
    const observer = FakeMutationObserver.created[0];
    const target = document.createElement("div");
    observer.trigger([makeMutationRecord(target, [target])]);
    recorder.stop();
    const mutations = events.filter((e) => e.type === "mutation");
    expect(mutations.length).toBeGreaterThanOrEqual(1);
    expect(observer.disconnected).toBe(true);
  });

  it("respects maxEvents and triggers onLimitReached", () => {
    const onLimit = jest.fn();
    const { recorder } = createRecorder({ maxEvents: 2, onLimitReached: onLimit });
    recorder.start();
    expect(recorder.eventCount()).toBe(1); // session:start
    const div = document.createElement("div");
    document.body.appendChild(div);
    div.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    div.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    div.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onLimit).toHaveBeenCalled();
    expect(recorder.eventCount()).toBeLessThanOrEqual(2);
    recorder.stop();
  });

  it("emits session:start and session:stop with the configured sessionId", () => {
    const { recorder, events } = createRecorder();
    recorder.start();
    recorder.stop();
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.every((e) => e.sessionId === "session-x")).toBe(true);
  });

  it("swallows sink errors without crashing", () => {
    const recorder = new SessionRecorder({
      sessionId: "swallow",
      emit: () => {
        throw new Error("sink boom");
      },
      platform: buildPlatform(),
    });
    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => undefined);
    try {
      expect(() => recorder.start()).not.toThrow();
      expect(() => recorder.stop()).not.toThrow();
      expect(debugSpy).toHaveBeenCalled();
    } finally {
      debugSpy.mockRestore();
    }
  });

  it("supports multiple start/stop cycles", () => {
    const { recorder, events } = createRecorder();
    recorder.start();
    recorder.stop();
    recorder.start();
    recorder.stop();
    const starts = events.filter((e) => e.type === "session:start").length;
    const stops = events.filter((e) => e.type === "session:stop").length;
    expect(starts).toBe(2);
    expect(stops).toBe(2);
  });

  it("keeps Masker.guards working on detached elements", () => {
    const masker = new Masker({ blockSelectors: ["##bogus", ".ghost"] });
    const detached = document.createElement("span");
    expect(masker.shouldMaskElement(detached)).toBe(false);
    expect(() => masker.shouldMaskElement(null)).not.toThrow();
  });
});
