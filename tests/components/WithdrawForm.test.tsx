import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WithdrawForm from "@/components/WithdrawForm";
import { getDefaultVaultAsset } from "@/utils/vaultAssets";

const defaultAsset = getDefaultVaultAsset();

describe("WithdrawForm", () => {
  test("submits amount", async () => {
    const user = userEvent.setup();
    const onWithdraw = jest.fn(async () => undefined);

    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={onWithdraw}
        status="idle"
        selectedAsset={defaultAsset}
        assets={[defaultAsset]}
        onAssetChange={jest.fn()}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");
    await waitFor(() => expect(screen.getByRole("button", { name: /withdraw/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /withdraw/i }));

    await waitFor(() => expect(onWithdraw).toHaveBeenCalledWith("12.5"));
  });

  test("shows TransactionStepper when status=pending and txStep is set", () => {
    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={true}
        balance="50"
        onWithdraw={jest.fn(async () => undefined)}
        status="pending"
        txStep="confirming"
      />
    );

    expect(screen.getByRole("list", { name: /transaction progress/i })).toBeInTheDocument();
  });

  test("renders balance and success feedback", () => {
    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully withdrew 12.5 XLM."
        transactionHash="SIM-1234567890ABCDEF"
        selectedAsset={defaultAsset}
        assets={[defaultAsset]}
        onAssetChange={jest.fn()}
      />
    );

    expect(screen.getByText(/available balance:/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/withdrawal completed/i);
    expect(screen.getByText(/successfully withdrew 12.5 xlm/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });

  test("renders a disabled asset selector for a single configured asset", () => {
    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={jest.fn(async () => undefined)}
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
