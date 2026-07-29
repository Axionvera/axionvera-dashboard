import { render, screen } from "@testing-library/react";
import { MetricCard } from "@/design-system";

describe("MetricCard", () => {
  it("renders a shared dashboard metric pattern", () => {
    render(
      <MetricCard
        label="Total Rewards Earned"
        value="123.45 AXV"
        description="Average rate: 4%"
        icon={<svg data-testid="metric-icon" />}
      />
    );

    expect(screen.getByText("Total Rewards Earned")).toBeInTheDocument();
    expect(screen.getByText("123.45 AXV")).toBeInTheDocument();
    expect(screen.getByText("Average rate: 4%")).toBeInTheDocument();
    expect(screen.getByTestId("metric-icon")).toBeInTheDocument();
  });

  it("supports compact metric cards for dense dashboard summaries", () => {
    const { container } = render(<MetricCard label="Active Proposals" value="3" compact />);

    expect(screen.getByText("Active Proposals")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("p-4");
  });
});
