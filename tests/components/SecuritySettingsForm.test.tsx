import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SecuritySettingsForm from "@/components/SecuritySettingsForm";
import { SECURITY_PREFS_KEY } from "@/utils/validation";

// Mock sonner so notify calls don't error
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => localStorageMock.clear());

describe("SecuritySettingsForm", () => {
  test("renders security preference toggles", () => {
    render(<SecuritySettingsForm />);
    expect(screen.getByRole("switch", { name: /require confirmation/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /email notifications/i })).toBeInTheDocument();
  });

  test("toggles are checked based on defaults", () => {
    render(<SecuritySettingsForm />);
    // requireConfirmationModal defaults to true
    expect(screen.getByRole("switch", { name: /require confirmation/i })).toHaveAttribute("aria-checked", "true");
    // emailNotifications defaults to false
    expect(screen.getByRole("switch", { name: /email notifications/i })).toHaveAttribute("aria-checked", "false");
  });

  test("toggling a preference updates state and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(<SecuritySettingsForm />);

    const emailToggle = screen.getByRole("switch", { name: /email notifications/i });
    await user.click(emailToggle);

    expect(emailToggle).toHaveAttribute("aria-checked", "true");
    const saved = JSON.parse(localStorageMock.getItem(SECURITY_PREFS_KEY)!);
    expect(saved.emailNotifications).toBe(true);
  });

  test("loads persisted preferences from localStorage", () => {
    localStorageMock.setItem(
      SECURITY_PREFS_KEY,
      JSON.stringify({ requireConfirmationModal: false, emailNotifications: true, trustedAddresses: [] })
    );
    render(<SecuritySettingsForm />);

    expect(screen.getByRole("switch", { name: /require confirmation/i })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: /email notifications/i })).toHaveAttribute("aria-checked", "true");
  });

  test("adds a trusted address", async () => {
    const user = userEvent.setup();
    render(<SecuritySettingsForm />);

    await user.type(screen.getByLabelText(/new trusted address/i), "GABC123");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByText("GABC123")).toBeInTheDocument();
    const saved = JSON.parse(localStorageMock.getItem(SECURITY_PREFS_KEY)!);
    expect(saved.trustedAddresses).toContain("GABC123");
  });

  test("shows error when adding a duplicate address", async () => {
    const user = userEvent.setup();
    render(<SecuritySettingsForm />);

    await user.type(screen.getByLabelText(/new trusted address/i), "GABC123");
    await user.click(screen.getByRole("button", { name: /^add$/i }));
    await user.type(screen.getByLabelText(/new trusted address/i), "GABC123");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByText(/already added/i)).toBeInTheDocument();
  });

  test("removes a trusted address", async () => {
    const user = userEvent.setup();
    localStorageMock.setItem(
      SECURITY_PREFS_KEY,
      JSON.stringify({ requireConfirmationModal: true, emailNotifications: false, trustedAddresses: ["GABC123"] })
    );
    render(<SecuritySettingsForm />);

    await user.click(screen.getByRole("button", { name: /remove GABC123/i }));

    expect(screen.queryByText("GABC123")).not.toBeInTheDocument();
    const saved = JSON.parse(localStorageMock.getItem(SECURITY_PREFS_KEY)!);
    expect(saved.trustedAddresses).toHaveLength(0);
  });

  test("adds address on Enter key", async () => {
    const user = userEvent.setup();
    render(<SecuritySettingsForm />);

    await user.type(screen.getByLabelText(/new trusted address/i), "GXYZ789{Enter}");

    expect(screen.getByText("GXYZ789")).toBeInTheDocument();
  });

  test("submits password form and calls onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(async () => undefined);
    render(<SecuritySettingsForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/current password/i), "OldPass1!");
    await user.type(screen.getByLabelText(/^new password/i), "NewPass1!");
    await user.type(screen.getByLabelText(/confirm new password/i), "NewPass1!");

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ currentPassword: "OldPass1!", newPassword: "NewPass1!" })
      )
    );
  });
});
