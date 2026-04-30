import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionSuccess from '../../src/components/TransactionSuccess';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => ({
  default: {
    create: jest.fn(() => jest.fn()),
  },
}));

// Mock the useConfetti hook
jest.mock('@/hooks/useConfetti', () => ({
  useConfetti: () => ({
    triggerConfetti: jest.fn(),
  }),
}));

// Mock the utilities
jest.mock('@/utils/contractHelpers', () => ({
  formatAmount: (amount: string) => `${parseFloat(amount).toFixed(2)}`,
  shortenAddress: (address: string, chars: number) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  },
}));

jest.mock('@/utils/networkConfig', () => ({
  NETWORK: 'testnet',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
}));

describe('TransactionSuccess', () => {
  const defaultProps = {
    amount: '100.5',
    assetSymbol: 'AXNV',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: 'deposit' as const,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the success modal with deposit title', () => {
    render(<TransactionSuccess {...defaultProps} />);

    expect(screen.getByText('Deposit Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Your transaction has been successfully processed on the blockchain.')).toBeInTheDocument();
  });

  it('renders the success modal with withdraw title', () => {
    render(<TransactionSuccess {...defaultProps} type="withdraw" />);

    expect(screen.getByText('Withdrawal Confirmed!')).toBeInTheDocument();
  });

  it('displays the transaction amount', () => {
    render(<TransactionSuccess {...defaultProps} />);

    expect(screen.getByText('Deposited Amount')).toBeInTheDocument();
    expect(screen.getByText('100.50')).toBeInTheDocument();
    expect(screen.getByText('AXNV')).toBeInTheDocument();
  });

  it('displays the transaction hash (shortened)', () => {
    render(<TransactionSuccess {...defaultProps} />);

    const hashElement = screen.getByText(/0x1234567890abcde\.\.\.1234567890abcdef/);
    expect(hashElement).toBeInTheDocument();
  });

  it('displays the network information (testnet)', () => {
    render(<TransactionSuccess {...defaultProps} />);

    expect(screen.getByText('testnet')).toBeInTheDocument();
  });

  it('renders View on Explorer button with correct link', () => {
    const { container } = render(<TransactionSuccess {...defaultProps} />);

    const explorerLink = container.querySelector('a[target="_blank"]') as HTMLAnchorElement;
    expect(explorerLink).toBeInTheDocument();
    expect(explorerLink).toHaveAttribute('target', '_blank');
    expect(explorerLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(explorerLink).toHaveAttribute(
      'href',
      expect.stringContaining(defaultProps.transactionHash)
    );
    expect(explorerLink.textContent).toContain('View on Explorer');
  });

  it('renders Return to Dashboard button', () => {
    render(<TransactionSuccess {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Return to Dashboard/i })).toBeInTheDocument();
  });

  it('calls onClose when Return to Dashboard button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionSuccess {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /Return to Dashboard/i });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders Esc key hint', () => {
    render(<TransactionSuccess {...defaultProps} />);

    expect(screen.getByText(/press/i)).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('renders animated checkmark SVG', () => {
    const { container } = render(<TransactionSuccess {...defaultProps} />);

    const svg = container.querySelector('svg[viewBox="0 0 100 100"]');
    expect(svg).toBeInTheDocument();
  });

  it('displays different action text for withdraw', () => {
    render(<TransactionSuccess {...defaultProps} type="withdraw" amount="50" />);

    expect(screen.getByText('Withdrawn Amount')).toBeInTheDocument();
  });

  it('renders modal with backdrop blur and overlay', () => {
    const { container } = render(<TransactionSuccess {...defaultProps} />);

    const backdrop = container.querySelector('.backdrop-blur-sm');
    expect(backdrop).toBeInTheDocument();

    const overlay = container.querySelector('.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('applies correct styling to modal content', () => {
    const { container } = render(<TransactionSuccess {...defaultProps} />);

    const modal = container.querySelector('.z-50.w-full.max-w-sm');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('rounded-2xl', 'border', 'bg-background-primary');
  });

  it('renders canvas element for confetti', () => {
    const { container } = render(<TransactionSuccess {...defaultProps} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });
});
