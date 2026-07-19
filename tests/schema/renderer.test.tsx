import { fireEvent, render, screen } from "@testing-library/react";

import { DashboardSchemaRenderer } from "@/components/schema/DashboardSchemaRenderer";
import { protocolDashboardSchema } from "@/schema";

describe("DashboardSchemaRenderer", () => {
  it("renders widgets, nested form fields, and tables from schema", () => {
    render(<DashboardSchemaRenderer schema={protocolDashboardSchema} />);
    expect(screen.getByRole("heading", { name: "Protocol Overview" })).toBeInTheDocument();
    expect(screen.getByText("$2.4M")).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Balance" })).toBeInTheDocument();
  });

  it("validates form rules before submit", () => {
    const onSubmit = jest.fn();
    render(<DashboardSchemaRenderer schema={protocolDashboardSchema} onSubmit={onSubmit} />);
    const form = screen.getByRole("button", { name: "Simulate" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByText("Amount is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders parser errors for invalid schemas", () => {
    render(<DashboardSchemaRenderer schema={{ version: 1, id: "broken", title: "Broken", root: {} }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid dashboard schema");
    expect(screen.getByRole("alert")).toHaveTextContent("$schema.root");
  });
});
