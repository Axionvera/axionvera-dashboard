import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, ReactElement } from "react";

import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/contexts/ThemeContext";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe("Navbar", () => {
  function renderNavbar(ui: ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  }

  test("shows connect button when disconnected", async () => {
    const user = userEvent.setup();
    const onConnect = jest.fn(async () => undefined);
    renderNavbar(
      <Navbar address={null} isConnecting={false} onConnect={onConnect} onDisconnect={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /connect stellar wallet/i }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  test("shows disconnect button when connected", async () => {
    const user = userEvent.setup();
    const onDisconnect = jest.fn();
    renderNavbar(
      <Navbar
        address="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        isConnecting={false}
        onConnect={jest.fn(async () => undefined)}
        onDisconnect={onDisconnect}
      />
    );

    await user.click(screen.getByRole("button", { name: /disconnect stellar wallet/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
