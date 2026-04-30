/**
 * DepositForm — integration tests
 *
 * Uses WalletContextMock so the real Freighter extension is never imported.
 * DepositForm receives wallet state as direct props, so each test simply
 * passes the relevant prop values; the mock provider is included so that
 * any child component that reads WalletContext also works without crashing.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import DepositForm from '@/components/DepositForm';
import { WalletContextMock } from '@/tests/mocks/WalletContextMock';

// ── Shared props ──────────────────────────────────────────────────────────────

const baseProps = {
  isConnected:    true,
  isSubmitting:   false,
  onDeposit:      jest.fn().mockResolvedValue(undefined),
  status:         'idle' as const,
  statusMessage:  null,
  transactionHash: null,
  walletBalance:  100,
};

function renderDepositForm(overrides: Partial<typeof baseProps> = {}) {
  const props = { ...baseProps, ...overrides };
  return render(
    <WalletContextMock>
      <DepositForm {...props} />
    </WalletContextMock>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DepositForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Core acceptance-criteria test (issue #97):
   * The submit button must be disabled when the amount field is empty / zero
   * so the user cannot submit a no-op deposit.
   */
  it('submit button is disabled when amount input is empty (zero)', () => {
    renderDepositForm();

    // The amount field starts empty — no value has been typed yet.
    const submitButton = screen.getByRole('button', { name: /deposit/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is disabled when wallet is not connected', () => {
    renderDepositForm({ isConnected: false });

    const submitButton = screen.getByRole('button', { name: /deposit/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button shows "Submitting…" and is disabled while a deposit is in flight', () => {
    renderDepositForm({ isSubmitting: true });

    const submitButton = screen.getByRole('button', { name: /submitting deposit/i });
    expect(submitButton).toBeDisabled();
  });

  it('renders the amount input field', () => {
    renderDepositForm();

    const input = screen.getByPlaceholderText('0.0');
    expect(input).toBeInTheDocument();
  });

  it('shows a pending status message when status is pending', () => {
    renderDepositForm({
      status: 'pending',
      statusMessage: 'Awaiting confirmation…',
    });

    expect(screen.getByRole('status')).toHaveTextContent('Deposit transaction pending');
    expect(screen.getByRole('status')).toHaveTextContent('Awaiting confirmation…');
  });

  it('shows an error status message when status is error', () => {
    renderDepositForm({
      status: 'error',
      statusMessage: 'Transaction rejected by the network.',
    });

    expect(screen.getByRole('status')).toHaveTextContent('Deposit failed');
    expect(screen.getByRole('status')).toHaveTextContent('Transaction rejected by the network.');
  });

  it('does not call onDeposit when the form is submitted with an empty amount', async () => {
    renderDepositForm();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /deposit/i });
    // Button should be disabled — click should have no effect
    await user.click(submitButton);

    expect(baseProps.onDeposit).not.toHaveBeenCalled();
  });
});