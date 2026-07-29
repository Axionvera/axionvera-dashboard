import { act, fireEvent, render, screen } from "@testing-library/react";
import SessionPlaybackPanel from "@/features/diagnostics/components/SessionPlaybackPanel";
import type { SessionEvent, SessionMetadata } from "@/session";

const makeEvent = (overrides: Partial<SessionEvent> = {}): SessionEvent => ({
  id: overrides.id ?? `evt-${Math.random()}`,
  sessionId: "session-a",
  type: "click",
  timestamp: 1000,
  data: { selector: "button", text: "Submit", x: 0, y: 0, button: 0, modifiers: { alt: false, ctrl: false, meta: false, shift: false } },
  ...overrides,
});

const makeMetadata = (overrides: Partial<SessionMetadata> = {}): SessionMetadata => ({
  id: "session-a",
  startedAt: 1000,
  endedAt: 2000,
  url: "https://example.com",
  userAgent: "Jest",
  events: 3,
  ...overrides,
});

describe("SessionPlaybackPanel", () => {
  it("renders the timeline with one row per event and the inspector with the first event", () => {
    const events = [
      makeEvent({ id: "e1", timestamp: 1000, type: "session:start", data: {} }),
      makeEvent({ id: "e2", timestamp: 1100, type: "click" }),
      makeEvent({ id: "e3", timestamp: 1300, type: "navigation", data: { url: "/x", method: "pushState" } }),
    ];
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: events.length })} events={events} onBack={() => {}} />);
    expect(screen.getByTestId("playback-timeline").querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByTestId("playback-inspector").textContent).toContain("\"id\": \"e1\"");
  });

  it("disables the play button when there are no events", () => {
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 0 })} events={[]} onBack={() => {}} />);
    expect(screen.getByTestId("playback-play")).toBeDisabled();
    expect(screen.getByTestId("playback-timeline").textContent).toContain("captured no events");
  });

  it("renders the playback-positions bar with offset / total", () => {
    const events = [
      makeEvent({ id: "e1", timestamp: 1000 }),
      makeEvent({ id: "e2", timestamp: 4000 }),
    ];
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 2 })} events={events} onBack={() => {}} />);
    expect(screen.getByTestId("playback-position").textContent).toContain("0:00");
    expect(screen.getByTestId("playback-position").textContent).toContain("/");
  });

  it("scrubbing to an index highlights the matching timeline entry", () => {
    const events = [
      makeEvent({ id: "e1", timestamp: 1000 }),
      makeEvent({ id: "e2", timestamp: 2000 }),
      makeEvent({ id: "e3", timestamp: 3000 }),
    ];
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 3 })} events={events} onBack={() => {}} />);
    const scrubber = screen.getByTestId("playback-scrubber") as HTMLInputElement;
    act(() => {
      fireEvent.change(scrubber, { target: { value: "1" } });
    });
    expect(screen.getByTestId("playback-event-1").className).toContain("bg-primary/15");
    expect(screen.getByTestId("playback-event-0").className).not.toContain("bg-primary/15");
  });

  it("selecting a speed preset swaps the active button styling", () => {
    const events = [makeEvent({ id: "e1", timestamp: 1000 })];
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 1 })} events={events} onBack={() => {}} />);
    const speed2 = screen.getByTestId("playback-speed-2");
    act(() => {
      fireEvent.click(speed2);
    });
    expect(speed2.className).toContain("bg-primary/10");
  });

  it("invokes onBack when the back button is clicked", () => {
    const onBack = jest.fn();
    render(
      <SessionPlaybackPanel
        metadata={makeMetadata({ events: 1 })}
        events={[makeEvent({ id: "e1" })]}
        onBack={onBack}
      />,
    );
    act(() => {
      fireEvent.click(screen.getByTestId("playback-back"));
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows the masked serialized mutation payload in the inspector", () => {
    const events = [
      makeEvent({
        id: "mut",
        type: "mutation",
        timestamp: 1000,
        data: {
          target: "div.secret",
          kind: "characterData",
          addedNodes: [
            { tag: "div", attrs: {}, children: [], text: "••••••••••", masked: true },
          ],
          removedCount: 0,
        },
      }),
    ];
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 1 })} events={events} onBack={() => {}} />);
    const inspector = screen.getByTestId("playback-inspector");
    expect(inspector.textContent).toContain("mutation");
    expect(inspector.textContent).toContain("div.secret");
    expect(inspector.textContent).toContain("••••••••••");
  });

  it("clicking Play rewinds to the start when already at the end", () => {
    const events = [
      makeEvent({ id: "e1", timestamp: 1000 }),
      makeEvent({ id: "e2", timestamp: 2000 }),
    ];
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 2 })} events={events} onBack={() => {}} />);
    const scrubber = screen.getByTestId("playback-scrubber") as HTMLInputElement;
    act(() => {
      fireEvent.change(scrubber, { target: { value: "1" } });
    });
    expect(scrubber.value).toBe("1");
    act(() => {
      fireEvent.click(screen.getByTestId("playback-play"));
    });
    expect(scrubber.value).toBe("0");
  });

  it("renders <unknown> placeholders when event data is missing fields", () => {
    const malformed = makeEvent({
      id: "bad",
      type: "click",
      timestamp: 1000,
      data: { selector: undefined as unknown as string } as unknown as SessionEvent["data"],
    });
    render(<SessionPlaybackPanel metadata={makeMetadata({ events: 1 })} events={[malformed]} onBack={() => {}} />);
    const entry = screen.getByTestId("playback-event-0");
    expect(entry.textContent).toContain("<unknown>");
  });

  describe("rAF batching", () => {
    /**
     * Install a fake `requestAnimationFrame` / `cancelAnimationFrame` pair so
     * the tests can assert exactly how many frames are scheduled and which
     * ones get cancelled. Returns a handle with cleanup to run in `finally`.
     */
    const installRafMock = () => {
      const callbacks: Array<() => void> = [];
      const cancelledIds: number[] = [];
      let nextId = 1;
      const realRaf = window.requestAnimationFrame;
      const realCancel = window.cancelAnimationFrame;
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        writable: true,
        value: (cb: FrameRequestCallback) => {
          callbacks.push(() => cb(0));
          return nextId++;
        },
      });
      Object.defineProperty(window, "cancelAnimationFrame", {
        configurable: true,
        writable: true,
        value: (id: number) => {
          cancelledIds.push(id);
        },
      });
      return {
        callbacks,
        cancelledIds,
        restore: () => {
          Object.defineProperty(window, "requestAnimationFrame", {
            configurable: true,
            writable: true,
            value: realRaf,
          });
          Object.defineProperty(window, "cancelAnimationFrame", {
            configurable: true,
            writable: true,
            value: realCancel,
          });
        },
      };
    };

    it("coalesces a burst of onStep callbacks from flush() into a single rAF", () => {
      const mock = installRafMock();
      try {
        const events = Array.from({ length: 50 }, (_, i) =>
          makeEvent({ id: `e${i}`, timestamp: 1000 + i * 100 }),
        );
        render(
          <SessionPlaybackPanel metadata={makeMetadata({ events: 50 })} events={events} onBack={() => {}} />,
        );

        // `flush()` runs every event synchronously and fires onStep for each.
        // The renderer should coalesce those 50 events into ONE rAF.
        act(() => {
          fireEvent.click(screen.getByTestId("playback-flush"));
        });
        expect(mock.callbacks).toHaveLength(1);

        // handleFlush defensively cancels the pending rAF after flush() and
        // writes the final index synchronously. The scrubber therefore reflects
        // the last event without any manual drain required.
        const scrubber = screen.getByTestId("playback-scrubber") as HTMLInputElement;
        expect(scrubber.value).toBe("49");
        expect(mock.cancelledIds).toEqual([1]);
      } finally {
        mock.restore();
      }
    });

    it("cancels any pending rAF when the user scrubs so feedback wins over playback", () => {
      const mock = installRafMock();
      try {
        const events = Array.from({ length: 50 }, (_, i) =>
          makeEvent({ id: `e${i}`, timestamp: 1000 + i * 100 }),
        );
        render(
          <SessionPlaybackPanel metadata={makeMetadata({ events: 50 })} events={events} onBack={() => {}} />,
        );

        // Schedule a pending rAF via flush.
        act(() => {
          fireEvent.click(screen.getByTestId("playback-flush"));
        });
        expect(mock.callbacks).toHaveLength(1);

        // User scrubs to position 7. handleSeek must cancel the pending frame
        // and write the new index synchronously.
        const scrubber = screen.getByTestId("playback-scrubber") as HTMLInputElement;
        act(() => {
          fireEvent.change(scrubber, { target: { value: "7" } });
        });
        expect(scrubber.value).toBe("7");
        expect(mock.cancelledIds).toContain(1);

        // The original rAF callback is still in the array (the mock does not
        // splice it on cancel) but invoking it now must NOT overwrite the
        // scrubber because rafRef.current was reset.
        act(() => {
          mock.callbacks[0]();
        });
        // The scrubber stays where the user dropped it.
        expect((screen.getByTestId("playback-scrubber") as HTMLInputElement).value).toBe("7");
      } finally {
        mock.restore();
      }
    });

    it("cancels a pending rAF when the panel unmounts mid-playback", () => {
      const mock = installRafMock();
      try {
        const events = Array.from({ length: 10 }, (_, i) =>
          makeEvent({ id: `e${i}`, timestamp: 1000 + i }),
        );
        const { unmount } = render(
          <SessionPlaybackPanel metadata={makeMetadata({ events: 10 })} events={events} onBack={() => {}} />,
        );
        act(() => {
          fireEvent.click(screen.getByTestId("playback-flush"));
        });
        expect(mock.callbacks).toHaveLength(1);

        unmount();
        expect(mock.cancelledIds).toContain(1);
      } finally {
        mock.restore();
      }
    });
  });
});
