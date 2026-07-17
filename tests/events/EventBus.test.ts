import { EventBus, EventLoopPreventedError } from "@/events";

type TestEvents = {
  alpha: { value: number };
  beta: { message: string };
  gamma: { ok: boolean };
};

const createBus = () => new EventBus<TestEvents>({ idFactory: () => "event-id", now: () => 1000 });

describe("EventBus", () => {
  it("delivers events to subscribers with immutable envelopes", async () => {
    const bus = createBus();
    const received: unknown[] = [];

    bus.subscribe("alpha", (event) => {
      received.push(event);
    });

    const envelope = await bus.publish("alpha", { value: 42 }, { source: "test" });

    expect(received).toEqual([envelope]);
    expect(envelope).toMatchObject({ id: "event-id", type: "alpha", payload: { value: 42 }, source: "test", depth: 0, path: ["alpha"] });
    expect(Object.isFrozen(envelope)).toBe(true);
  });

  it("runs higher priority subscriptions first and preserves insertion order for ties", async () => {
    const bus = createBus();
    const calls: string[] = [];

    bus.subscribe("alpha", () => { calls.push("normal-1"); });
    bus.subscribe("alpha", () => { calls.push("high"); }, { priority: 10 });
    bus.subscribe("alpha", () => { calls.push("normal-2"); });

    await bus.publish("alpha", { value: 1 });

    expect(calls).toEqual(["high", "normal-1", "normal-2"]);
  });

  it("cleans up subscriptions when unsubscribe is called", async () => {
    const bus = createBus();
    const handler = jest.fn();

    const unsubscribe = bus.subscribe("alpha", handler);
    expect(bus.listenerCount("alpha")).toBe(1);

    unsubscribe();
    unsubscribe();
    await bus.publish("alpha", { value: 1 });

    expect(handler).not.toHaveBeenCalled();
    expect(bus.listenerCount("alpha")).toBe(0);
  });

  it("supports nested publish for different event types", async () => {
    const bus = createBus();
    const calls: string[] = [];

    bus.subscribe("alpha", async () => {
      calls.push("alpha");
      await bus.publish("beta", { message: "nested" });
    });
    bus.subscribe("beta", (event) => {
      calls.push(`${event.type}:${event.depth}:${event.path.join(">")}`);
    });

    await bus.publish("alpha", { value: 1 });

    expect(calls).toEqual(["alpha", "beta:1:alpha>beta"]);
  });

  it("prevents recursive event loops", async () => {
    const onLoopPrevented = jest.fn();
    const bus = new EventBus<TestEvents>({ idFactory: () => "event-id", now: () => 1000, onLoopPrevented });

    bus.subscribe("alpha", async () => {
      await bus.publish("alpha", { value: 2 });
    });

    await expect(bus.publish("alpha", { value: 1 })).rejects.toBeInstanceOf(EventLoopPreventedError);
    expect(onLoopPrevented).toHaveBeenCalledWith(expect.objectContaining({ type: "alpha", path: ["alpha", "alpha"] }), "Event loop detected for alpha");
  });

  it("prevents publish chains that exceed the configured depth", async () => {
    const bus = new EventBus<TestEvents>({ maxPublishDepth: 1, idFactory: () => "event-id", now: () => 1000 });

    bus.subscribe("alpha", async () => {
      await bus.publish("beta", { message: "nested" });
    });
    bus.subscribe("beta", async () => {
      await bus.publish("gamma", { ok: true });
    });

    await expect(bus.publish("alpha", { value: 1 })).rejects.toThrow("Maximum publish depth of 1 exceeded");
  });
});
