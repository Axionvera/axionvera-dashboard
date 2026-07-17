import { SessionPlayer } from "@/session";
import type { SessionEvent } from "@/session";

const makeEvent = (index: number, type: SessionEvent["type"] = "click", timestamp = 1000 + index * 100): SessionEvent => ({
  id: `e${index}`,
  sessionId: "s1",
  type,
  timestamp,
  data: { selector: "a", text: "x", x: 0, y: 0, button: 0, modifiers: { alt: false, ctrl: false, meta: false, shift: false } },
});

describe("SessionPlayer", () => {
  it("processes every event in order via flush()", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const steps: number[] = [];
    const player = new SessionPlayer({
      events: [makeEvent(0), makeEvent(1), makeEvent(2)],
      sandbox,
      onStep: (event) => steps.push(event.timestamp),
    });
    player.flush();
    expect(steps).toEqual([1000, 1100, 1200]);
  });

  it("invokes onComplete after all events are flushed", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const onComplete = jest.fn();
    const player = new SessionPlayer({
      events: [makeEvent(0)],
      sandbox,
      onComplete,
    });
    player.flush();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("schedules events using injected setTimeout/clearTimeout", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const calls: Array<{ fn: () => void; delay: number }> = [];
    const player = new SessionPlayer({
      events: [makeEvent(0), makeEvent(1)],
      sandbox,
      onStep: () => {},
      setTimeout: ((fn: () => void, delay: number) => {
        calls.push({ fn, delay });
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }) as unknown as typeof setTimeout,
      clearTimeout: (() => undefined) as unknown as typeof clearTimeout,
    });
    player.play();
    expect(calls.length).toBeGreaterThanOrEqual(1);
    // Run queued ticks
    while (calls.length > 0) {
      const next = calls.shift()!;
      if (!player.isPlaying()) break;
      next.fn();
    }
    expect(player.isPlaying()).toBe(false);
  });

  it("honors speed multiplier when recomputing the schedule", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const delays: number[] = [];
    const player = new SessionPlayer({
      events: [makeEvent(0, "click", 1000), makeEvent(1, "click", 1500)],
      sandbox,
      setTimeout: ((fn: () => void, delay: number) => {
        delays.push(delay);
        fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }) as unknown as typeof setTimeout,
      clearTimeout: (() => undefined) as unknown as typeof clearTimeout,
    });
    player.setSpeed(2);
    player.play();
    // First delay is dropped to allow immediate playback; second should be 500/2 = 250.
    expect(delays[delays.length - 1]).toBeCloseTo(250, 5);
  });

  it("seek() clamps out-of-range indices", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const player = new SessionPlayer({
      events: [makeEvent(0), makeEvent(1), makeEvent(2)],
      sandbox,
    });
    player.seek(-5);
    expect(player.currentIndex).toBe(0);
    player.seek(999);
    expect(player.currentIndex).toBe(3);
    player.seek(1);
    expect(player.currentIndex).toBe(1);
  });

  it("setSpeed rejects non-positive numbers", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const player = new SessionPlayer({ events: [makeEvent(0)], sandbox });
    expect(() => player.setSpeed(0)).toThrow();
    expect(() => player.setSpeed(-1)).toThrow();
  });

  it("dispatches CustomEvent on sandbox for mutation events", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const listener = jest.fn();
    sandbox.addEventListener("session-replay:apply", listener);
    const player = new SessionPlayer({
      events: [
        {
          id: "mut",
          sessionId: "s1",
          type: "mutation",
          timestamp: 1000,
          data: { target: "body", kind: "characterData", addedNodes: [], removedCount: 0 },
        },
      ],
      sandbox,
    });
    player.flush();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("skips mutation event dispatch when onMutationApply is provided", () => {
    const sandbox = document.createElement("div");
    document.body.appendChild(sandbox);
    const onMutationApply = jest.fn();
    const sandboxListener = jest.fn();
    sandbox.addEventListener("session-replay:apply", sandboxListener);
    const player = new SessionPlayer({
      events: [
        {
          id: "mut",
          sessionId: "s1",
          type: "mutation",
          timestamp: 1000,
          data: { target: "body", kind: "characterData", addedNodes: [], removedCount: 0 },
        },
      ],
      sandbox,
      onMutationApply,
    });
    player.flush();
    expect(onMutationApply).toHaveBeenCalledTimes(1);
    expect(sandboxListener).not.toHaveBeenCalled();
  });

  it("throws when constructed without events or sandbox", () => {
    expect(() => new SessionPlayer({ events: undefined as unknown as SessionEvent[], sandbox: document.createElement("div") })).toThrow(/events/);
    expect(() => new SessionPlayer({ events: [], sandbox: undefined as unknown as HTMLElement })).toThrow(/sandbox/);
  });
});
