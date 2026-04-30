import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmTransactionModal } from '@/components/ConfirmTransactionModal';

describe('ConfirmTransactionModal', () => {
  const mockSimulation = {
    cpuInstructions: 150000,
    ramBytes: 4096,
    ledgerEntries: 3,
    maxFee: '0.005',
    estimatedFee: '0.001'
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    action: 'deposit' as const,
    amount: '100',
    simulation: mockSimulation,
    isConfirming: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmTransactionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders simulation details correctly', () => {
    render(<ConfirmTransactionModal {...defaultProps} />);
    expect(screen.getByText('Confirm deposit')).toBeInTheDocument();
    expect(screen.getByText('100 XLM')).toBeInTheDocument();
    expect(screen.getByText('0.005 XLM')).toBeInTheDocument();
    expect(screen.getByText('0.001 XLM')).toBeInTheDocument();
  });

  it('toggles technical details accordion', () => {
    render(<ConfirmTransactionModal {...defaultProps} />);
    
    // Details should be hidden initially
    expect(screen.queryByText('150,000')).not.toBeInTheDocument();
    
    // Click accordion
    const toggleButton = screen.getByRole('button', { name: /Technical Details/i });
    fireEvent.click(toggleButton);
    
    // Details should be visible
    expect(screen.getByText('150,000')).toBeInTheDocument();
    expect(screen.getByText('4,096')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Click accordion again
    fireEvent.click(toggleButton);
    
    // Details should be hidden again
    expect(screen.queryByText('150,000')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(<ConfirmTransactionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm is clicked', () => {
    render(<ConfirmTransactionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isConfirming is true', () => {
    render(<ConfirmTransactionModal {...defaultProps} isConfirming={true} />);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Confirming.../i })).toBeDisabled();
  });

  it('shows loading state when simulation is null', () => {
    render(<ConfirmTransactionModal {...defaultProps} simulation={null} />);
    expect(screen.getByText('Simulating transaction...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeDisabled();
  });
});
