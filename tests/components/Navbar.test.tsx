import React from "react";
import { render, screen } from "@testing-library/react";
import Navbar from "@/components/layout/Navbar";
import type { WalletMeta } from "@/types/wallet";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OfflineProvider } from "@/pwa/OfflineProvider";
import { WorkspaceProvider } from "@/workspaces";
import { VaultProvider } from "@/contexts/VaultContext";
import { GovernanceProvider } from "@/contexts/GovernanceContext";

jest.mock("@/features/search", () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

jest.mock("@/features/notifications", () => ({
  NotificationCenter: () => <div data-testid="notification-center" />,
}));

jest.mock("@/hooks/useSidebar", () => ({
  useSidebar: () => ({ isOpen: false, toggle: jest.fn() }),
}));

const mockWallets: WalletMeta[] = [
  {
    id: "freighter",
    label: "Freighter",
    icon: "<svg></svg>",
    description: "Freighter Wallet",
    installUrl: "https://freighter.app",
    capabilities: { publicKey: true, signTransaction: true, signAuthEntry: true },
  },
  {
    id: "albedo",
    label: "Albedo",
    icon: "<svg></svg>",
    description: "Albedo Link",
    installUrl: "https://albedo.link",
    capabilities: { publicKey: true, signTransaction: true, signAuthEntry: true },
  },
];

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ThemeProvider>
      <OfflineProvider>
        <WorkspaceProvider>
          <VaultProvider walletAddress={null}>
            <GovernanceProvider walletAddress={null}>{ui}</GovernanceProvider>
          </VaultProvider>
        </WorkspaceProvider>
      </OfflineProvider>
    </ThemeProvider>
  );

describe("Navbar Component", () => {
  const defaultProps = {
    publicKey: null,
    isConnecting: false,
    walletType: null,
    availableWallets: mockWallets,
    onConnect: jest.fn().mockResolvedValue(undefined),
    onDisconnect: jest.fn(),
    onSwitch: jest.fn().mockResolvedValue(undefined),
  };

  test("renders logo and brand title", () => {
    renderWithProviders(<Navbar {...defaultProps} />);
    expect(screen.getByText("Axionvera")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("renders disconnected state with Connect Wallet button", () => {
    renderWithProviders(<Navbar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Connect Stellar wallet/i })).toBeInTheDocument();
  });

  test("renders connected state with short address when publicKey is provided", () => {
    renderWithProviders(
      <Navbar
        {...defaultProps}
        publicKey="GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY5CHHEBDCYIZUYVRW6EV3M35L"
        walletType="freighter"
      />
    );
    expect(screen.getByRole("button", { name: /Wallet options/i })).toBeInTheDocument();
    expect(screen.getByText(/GBRPYH\.\.\.V3M35L/i)).toBeInTheDocument();
  });
});
