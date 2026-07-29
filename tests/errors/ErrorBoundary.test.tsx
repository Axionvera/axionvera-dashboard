import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { clearRecoveryDiagnostics, getRecoveryDiagnostics } from '@/errors';

function Exploder({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('render exploded');
  }
  return <div>Dashboard restored</div>;
}

describe('ErrorBoundary recovery', () => {
  beforeEach(() => {
    clearRecoveryDiagnostics();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('isolates runtime errors and captures diagnostics', () => {
    render(
      <ErrorBoundary name="TestBoundary">
        <Exploder shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('We isolated a dashboard error');
    expect(screen.getByText(/Diagnostic ID:/)).toBeInTheDocument();
    expect(getRecoveryDiagnostics()).toHaveLength(1);
    expect(getRecoveryDiagnostics()[0].error.message).toBe('render exploded');
  });

  it('recovers by remounting children without reloading the page', () => {

    const { rerender } = render(
      <ErrorBoundary name="TestBoundary">
        <Exploder shouldThrow />
      </ErrorBoundary>
    );

    rerender(
      <ErrorBoundary name="TestBoundary">
        <Exploder shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /retry failed section/i }));

    expect(screen.getByText('Dashboard restored')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reload application/i })).not.toBeInTheDocument();
    expect(getRecoveryDiagnostics()[0].lifecycle).toContain('retry');
  });
});
