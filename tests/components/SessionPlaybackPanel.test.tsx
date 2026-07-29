import React from "react";
import { render, screen } from "@testing-library/react";
import SessionPlaybackPanel from "@/components/SessionPlaybackPanel";
import { SessionEvent, SessionMetadata } from "@/session";

const mockMetadata: SessionMetadata = {
  id: "test-session-12345",
  startedAt: 1700000000000,
  label: "Test Recording",
  url: "https://axionvera.network/dashboard",
  userAgent: "Mozilla/5.0",
  events: 2,
};

const mockEvents: SessionEvent[] = [
  {
    id: "evt-1",
    sessionId: "test-session-12345",
    timestamp: 1700000001000,
    type: "click",
    data: {
      selector: "#submit-btn",
      text: "Submit",
      x: 10,
      y: 20,
      button: 0,
      modifiers: { alt: false, ctrl: false, meta: false, shift: false },
    },
  },
  {
    id: "evt-2",
    sessionId: "test-session-12345",
    timestamp: 1700000005000,
    type: "navigation",
    data: { url: "/dashboard", method: "pushState" },
  },
];

describe("SessionPlaybackPanel Component", () => {
  const defaultProps = {
    metadata: mockMetadata,
    events: mockEvents,
    onBack: jest.fn(),
  };

  test("renders playback panel header and controls", () => {
    render(<SessionPlaybackPanel {...defaultProps} />);
    expect(screen.getByText(/Replay · Test Recording/i)).toBeInTheDocument();
    expect(screen.getByTestId("playback-play")).toBeInTheDocument();
    expect(screen.getByTestId("playback-stop")).toBeInTheDocument();
    expect(screen.getByTestId("playback-flush")).toBeInTheDocument();
  });

  test("renders captured timeline events", () => {
    render(<SessionPlaybackPanel {...defaultProps} />);
    expect(screen.getByTestId("playback-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("playback-event-0")).toBeInTheDocument();
    expect(screen.getByTestId("playback-event-1")).toBeInTheDocument();
  });

  test("renders event detail inspector", () => {
    render(<SessionPlaybackPanel {...defaultProps} />);
    expect(screen.getByTestId("playback-inspector")).toBeInTheDocument();
  });
});
