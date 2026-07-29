import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DepositForm from "@/features/vault/components/DepositForm";

// Mock the SDK barrel — this is the path useSimulation imports from
jest.mock("@/services/sdk", () => ({
  simulateDeposit: jest.fn(async () => ({
    type: "deposit",
    amount: "12.5",
    currentBalance: "100",
    projectedBalance: "112.5",
    projectedRewards: "0.125",
    estimatedFee: "0.00001",
    netChange: "12.5",
    steps: [
      { label: "Validate amount", detail: "12.5 XLM", status: "ok" },
      { label: "Fetch current balance", detail: "100 XLM available", status: "ok" },
      { label: "Project outcome", detail: "112.5 XLM after transaction", status: "ok" },
    ],
    warnings: [],
  })),
  simulateWithdraw: jest.fn(),
  SimulationError: class SimulationError extends Error {
    code: string;
    suggestedFix: string;
    constructor(message: string, code: string, suggestedFix: string) {
      super(message);
      this.code = code;
      this.suggestedFix = suggestedFix;
    }
  },
}));

// Prevent notification side-effects in tests
jest.mock("@/utils/notifications", () => ({
  notify: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const MOCK_WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("DepositForm", () => {
  test("submits amount via two-step preview → confirm flow", async () => {
    const user = userEvent.setup();
    const onDeposit = jest.fn(async () => undefined);

    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={onDeposit}
        status="idle"
        walletAddress={MOCK_WALLET}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");

    const previewButton = await screen.findByRole("button", { name: /preview deposit/i });
    expect(previewButton).toBeEnabled();
    await user.click(previewButton);

    const confirmButton = await screen.findByRole("button", { name: /confirm deposit/i }, { timeout: 5000 });
    await user.click(confirmButton);

    await waitFor(() => expect(onDeposit).toHaveBeenCalledWith("12.5"));
  });

  test("renders transaction feedback", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully deposited 12.5 tokens."
        transactionHash="SIM-1234567890ABCDEF"
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(/deposit completed/i);
    expect(screen.getByText(/successfully deposited 12.5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });
});
