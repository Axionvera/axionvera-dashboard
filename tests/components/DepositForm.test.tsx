import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DepositForm from "@/components/DepositForm";
import { getDefaultVaultAsset } from "@/utils/vaultAssets";

const defaultAsset = getDefaultVaultAsset();

describe("DepositForm", () => {
  test("submits amount", async () => {
    const user = userEvent.setup();
    const onDeposit = jest.fn(async () => undefined);

    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={onDeposit}
        status="idle"
        selectedAsset={defaultAsset}
        assets={[defaultAsset]}
        onAssetChange={jest.fn()}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");
    await waitFor(() => expect(screen.getByRole("button", { name: /deposit/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /deposit/i }));

    await waitFor(() => expect(onDeposit).toHaveBeenCalledWith("12.5"));
  });

  test("shows TransactionStepper when status=pending and txStep is set", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={true}
        onDeposit={jest.fn(async () => undefined)}
        status="pending"
        txStep="submitted"
      />
    );

    expect(screen.getByRole("list", { name: /transaction progress/i })).toBeInTheDocument();
    expect(screen.getByText("Submitted to Network")).toBeInTheDocument();
  });

  test("renders success feedback", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully deposited 12.5 XLM."
        transactionHash="SIM-1234567890ABCDEF"
        selectedAsset={defaultAsset}
        assets={[defaultAsset]}
        onAssetChange={jest.fn()}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(/deposit completed/i);
    expect(screen.getByText(/successfully deposited 12.5 xlm/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });

  test("renders a disabled asset selector for a single configured asset", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={jest.fn(async () => undefined)}
        status="idle"
        selectedAsset={defaultAsset}
        assets={[defaultAsset]}
        onAssetChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText(/asset/i)).toBeDisabled();
    expect(screen.getByDisplayValue("XLM")).toBeInTheDocument();
  });
});

