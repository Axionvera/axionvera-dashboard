import { act, fireEvent, render, screen } from "@testing-library/react";
import SessionReplayPanel from "@/components/SessionReplayPanel";

/**
 * This suite focuses on the **panel layer**: prop forwarding, conditional
 * Record/Stop rendering, and click-to-start/stop wiring.
 *
 * The mock keeps the suite independent of `useSessionReplay`'s real
 * IndexedDB / SessionRecorder setup. The user's three explicit asks are
 * covered here:
 *   (a) `autoStart` defaults to `false` and the mount effect does not call
 *       `replay.start()`.
 *   (b) `autoStart={true}` is forwarded to the hook unchanged.
 *   (c) Record / Stop controls render correctly in both `isRecording` states.
 *
 * End-to-end behavior (does `autoStart={true}` actually drive
 * `SessionRecorder.start()`?) lives in
 * `tests/components/SessionReplayPanel.integration.test.tsx`, which does NOT
 * mock the hook.
 */
jest.mock("@/hooks/useSessionReplay", () => ({
  __esModule: true,
  useSessionReplay: jest.fn(),
}));

import { useSessionReplay } from "@/hooks/useSessionReplay";
import type { UseSessionReplayResult } from "@/hooks/useSessionReplay";

const mockUseSessionReplay = useSessionReplay as jest.MockedFunction<
  typeof useSessionReplay
>;

/**
 * Build a default-friendly `UseSessionReplayResult` with all callbacks as
 * `jest.fn()` mocks. Tests override individual fields to exercise the panel's
 * behavior in each recording state.
 */
const buildMockReplay = (
  overrides: Partial<UseSessionReplayResult> = {},
): UseSessionReplayResult => ({
  isRecording: false,
  isReady: true,
  currentSessionId: null,
  eventCount: 0,
  sessions: [],
  error: null,
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  exportSession: jest.fn().mockResolvedValue(null),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  refresh: jest.fn().mockResolvedValue(undefined),
  loadSessionEvents: jest.fn().mockResolvedValue([]),
  ...overrides,
});

describe("SessionReplayPanel — autoStart gating", () => {
  beforeEach(() => {
    mockUseSessionReplay.mockReset();
  });

  it("passes { autoStart: false } to the hook when no prop is supplied (default behavior)", () => {
    mockUseSessionReplay.mockReturnValue(buildMockReplay());

    render(<SessionReplayPanel />);

    expect(mockUseSessionReplay).toHaveBeenCalledTimes(1);
    expect(mockUseSessionReplay).toHaveBeenCalledWith({ autoStart: false });
  });

  it("does not invoke replay.start() as a side effect of mount when autoStart defaults to false", async () => {
    const start = jest.fn().mockResolvedValue(undefined);
    mockUseSessionReplay.mockReturnValue(buildMockReplay({ start }));

    render(<SessionReplayPanel />);
    // Drain any post-mount microtasks so a hidden async start() would have run.
    await act(async () => {
      await Promise.resolve();
    });

    expect(start).not.toHaveBeenCalled();
  });

  it("forwards autoStart={true} to the hook as an explicit override", () => {
    mockUseSessionReplay.mockReturnValue(
      buildMockReplay({ isRecording: true, currentSessionId: "session-override" }),
    );

    render(<SessionReplayPanel autoStart />);

    expect(mockUseSessionReplay).toHaveBeenCalledWith({ autoStart: true });
  });

});

describe("SessionReplayPanel — Record / Stop rendering", () => {
  beforeEach(() => {
    mockUseSessionReplay.mockReset();
  });

  it("renders the Record control (not Stop) when isRecording is false", () => {
    mockUseSessionReplay.mockReturnValue(buildMockReplay({ isRecording: false }));

    render(<SessionReplayPanel />);

    expect(screen.getByTestId("session-start")).toBeInTheDocument();
    expect(screen.queryByTestId("session-stop")).not.toBeInTheDocument();
  });

  it("renders the Stop control (not Record) when isRecording is true", () => {
    mockUseSessionReplay.mockReturnValue(buildMockReplay({ isRecording: true }));

    render(<SessionReplayPanel autoStart />);

    expect(screen.getByTestId("session-stop")).toBeInTheDocument();
    expect(screen.queryByTestId("session-start")).not.toBeInTheDocument();
  });

  it("clicking Record in the inactive state invokes replay.start()", async () => {
    const start = jest.fn().mockResolvedValue(undefined);
    mockUseSessionReplay.mockReturnValue(buildMockReplay({ start }));

    render(<SessionReplayPanel />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("session-start"));
    });

    expect(start).toHaveBeenCalledTimes(1);
  });

  it("clicking Stop in the active state invokes replay.stop()", async () => {
    const stop = jest.fn().mockResolvedValue(undefined);
    mockUseSessionReplay.mockReturnValue(
      buildMockReplay({ isRecording: true, stop }),
    );

    render(<SessionReplayPanel autoStart />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("session-stop"));
    });

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
