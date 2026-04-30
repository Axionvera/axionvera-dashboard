import { render, screen } from "@testing-library/react";
import { TransactionStepper } from "@/components/TransactionStepper";

describe("TransactionStepper", () => {
  test("shows all three step labels", () => {
    render(<TransactionStepper txStep="signed" />);
    expect(screen.getByText("Signed")).toBeInTheDocument();
    expect(screen.getByText("Submitted to Network")).toBeInTheDocument();
    expect(screen.getByText("Confirmed in Ledger")).toBeInTheDocument();
  });

  test("marks first step active when txStep is signed", () => {
    render(<TransactionStepper txStep="signed" />);
    const step = screen.getByRole("list").querySelector("[aria-current='step']");
    expect(step).toBeInTheDocument();
  });

  test("marks second step active when txStep is confirming", () => {
    const { container } = render(<TransactionStepper txStep="confirming" />);
    const activeSteps = container.querySelectorAll("[aria-current='step']");
    expect(activeSteps).toHaveLength(1);
  });

  test("has accessible label", () => {
    render(<TransactionStepper txStep="confirmed" />);
    expect(screen.getByRole("list", { name: /transaction progress/i })).toBeInTheDocument();
  });
});
