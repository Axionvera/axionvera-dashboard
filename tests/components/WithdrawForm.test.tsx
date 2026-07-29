import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WithdrawForm from "@/features/vault/components/WithdrawForm";

// Mock the SDK barrel — this is the path useSimulation imports from
jest.mock("@/services/sdk", () => ({
  simulateWithdraw: jest.fn(async () => ({
    type: "withdraw",
    amount: "12.5",
    currentBalance: "50",
    projectedBalance: "37.5",
    projectedRewards: "0",
    estimatedFee: "0.00001",
    netChange: "-12.5",
    steps: [
      { label: "Validate amount", detail: "12.5 XLM", status: "ok" },
      { label: "Fetch current balance", detail: "50 XLM available", status: "ok" },
      { label: "Check sufficient funds", detail: "50 XLM available", status: "ok" },
      { label: "Project outcome", detail: "37.5 XLM after transaction", status: "ok" },
    ],
    warnings: [],
  })),
  simulateDeposit: jest.fn(),
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

describe("WithdrawForm", () => {
  test("submits amount via two-step preview → confirm flow", async () => {
    const user = userEvent.setup();
    const onWithdraw = jest.fn(async () => undefined);

    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={onWithdraw}
        status="idle"
        walletAddress={MOCK_WALLET}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");

    const previewButton = await screen.findByRole("button", { name: /preview withdrawal/i });
    expect(previewButton).toBeEnabled();
    await user.click(previewButton);

    const confirmButton = await screen.findByRole("button", { name: /confirm withdrawal/i }, { timeout: 5000 });
    await user.click(confirmButton);

    await waitFor(() => expect(onWithdraw).toHaveBeenCalledWith("12.5"));
  });

  test("renders transaction feedback and balance", () => {
    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully withdrew 12.5 tokens."
        transactionHash="SIM-1234567890ABCDEF"
      />
    );

    expect(screen.getByText(/available balance:/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/withdrawal completed/i);
    expect(screen.getByText(/successfully withdrew 12.5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });
});
