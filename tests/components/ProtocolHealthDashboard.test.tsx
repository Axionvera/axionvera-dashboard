import { act, render, screen, waitFor } from "@testing-library/react";

import ProtocolHealthDashboard from "@/features/monitoring/components/ProtocolHealthDashboard";
import { getProtocolHealthSnapshot, type ProtocolHealthSnapshot } from "@/services/protocolHealth";

jest.mock("@/services/protocolHealth", () => ({
  DEFAULT_PROTOCOL_HEALTH_POLL_MS: 30000,
  getProtocolHealthSnapshot: jest.fn(),
}));

const mockedGetSnapshot = getProtocolHealthSnapshot as jest.MockedFunction<typeof getProtocolHealthSnapshot>;

function createSnapshot(status: ProtocolHealthSnapshot["status"], checkedAt: string): ProtocolHealthSnapshot {
  return {
    status,
    checkedAt,
    nextCheckInMs: 30000,
    summary: status === "operational" ? "All monitored protocol dependencies are healthy." : "One or more protocol dependencies need attention.",
    metrics: [
      {
        id: "soroban-rpc",
        label: "Soroban RPC",
        description: "Protocol write/read path.",
        value: "200 OK",
        status,
        latencyMs: 125,
        checkedAt,
      },
      {
        id: "contract-config",
        label: "Contract Configuration",
        description: "Vault and token contract IDs.",
        value: "Vault and token contracts configured",
        status: "operational",
        checkedAt,
      },
    ],
    latencyTrend: [{ label: "RPC", latencyMs: 125, status }],
  };
}

describe("ProtocolHealthDashboard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedGetSnapshot.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders protocol health metrics", async () => {
    mockedGetSnapshot.mockResolvedValue(createSnapshot("operational", "2026-06-23T20:00:00.000Z"));

    render(<ProtocolHealthDashboard />);

    expect(await screen.findByRole("heading", { name: /protocol monitoring/i })).toBeInTheDocument();
    expect(await screen.findByText(/all monitored protocol dependencies are healthy/i)).toBeInTheDocument();
    expect(screen.getByText("Soroban RPC")).toBeInTheDocument();
    expect(screen.getByText("Contract Configuration")).toBeInTheDocument();
    expect(screen.getByText(/125 ms latency/i)).toBeInTheDocument();
  });

  test("polls automatically for updated health status", async () => {
    mockedGetSnapshot
      .mockResolvedValueOnce(createSnapshot("operational", "2026-06-23T20:00:00.000Z"))
      .mockResolvedValueOnce(createSnapshot("degraded", "2026-06-23T20:00:30.000Z"));

    render(<ProtocolHealthDashboard />);

    expect(await screen.findByText(/all monitored protocol dependencies are healthy/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => expect(mockedGetSnapshot).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/one or more protocol dependencies need attention/i)).toBeInTheDocument();
  });
});
