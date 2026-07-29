import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, ReactElement } from "react";

import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceProvider, WorkspaceStore } from "@/workspaces";


jest.mock("@/features/search", () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    filter: { category: "all", read: "all" },
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    dismiss: jest.fn(),
    dismissAllVisible: jest.fn(),
    setFilter: jest.fn(),
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    priority: _priority,
    ...props
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    [k: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(props as object)} />
  ),
}));

/** Minimal wallet metas for test usage */
const mockAvailableWallets = [
  {
    id: "freighter" as const,
    label: "Freighter",
    description: "Browser extension wallet",
    installUrl: "https://freighter.app",
    icon: "<svg></svg>",
    capabilities: { publicKey: true, signTransaction: true, signAuthEntry: false },
  },
  {
    id: "albedo" as const,
    label: "Albedo",
    description: "Web-based wallet",
    installUrl: "https://albedo.link",
    icon: "<svg></svg>",
    capabilities: { publicKey: true, signTransaction: false, signAuthEntry: false },
  },
];

describe("Navbar", () => {
  function renderNavbar(ui: ReactElement) {
    const storage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const store = new WorkspaceStore(storage);

    return render(
      <WorkspaceProvider store={store}>
        <ThemeProvider>{ui}</ThemeProvider>
      </WorkspaceProvider>
    );
  }

  test("shows connect button when disconnected", async () => {
    const user = userEvent.setup();
    const onConnect = jest.fn(async () => undefined);
    renderNavbar(
      <Navbar
        publicKey={null}
        isConnecting={false}
        walletType={null}
        availableWallets={mockAvailableWallets}
        onConnect={onConnect}
        onDisconnect={jest.fn()}
        onSwitch={jest.fn(async () => undefined)}
      />
    );

    await user.click(screen.getByRole("button", { name: /connect stellar wallet/i }));
    expect(onConnect).toHaveBeenCalledTimes(0); // Picker opens on first click with multiple wallets
  });

  test("shows disconnect button when connected", async () => {
    const user = userEvent.setup();
    const onDisconnect = jest.fn();
    renderNavbar(
      <Navbar
        publicKey="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        isConnecting={false}
        walletType="freighter"
        availableWallets={mockAvailableWallets}
        onConnect={jest.fn(async () => undefined)}
        onDisconnect={onDisconnect}
        onSwitch={jest.fn(async () => undefined)}
      />
    );

    // Open the wallet menu first
    await user.click(screen.getByRole("button", { name: /wallet options/i }));
    
    // Then click disconnect
    await user.click(screen.getByRole("menuitem", { name: /disconnect stellar wallet/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
