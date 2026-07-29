import { act, render, screen } from '@testing-library/react';
import ActivityFeed from '@/features/activity/components/ActivityFeed';
import { resetSharedEventStreamForTests } from '@/services/events/sharedStreamLifecycle';
import { activityStore } from '@/store/activityStore';
import type {
  ActivityEvent,
  ConnectionStatus,
  EventSubscriptionService,
} from '@/services/events';

function makeActivityEvent(id: string, type: ActivityEvent['type'] = 'deposit'): ActivityEvent {
  return {
    id,
    type,
    name: type,
    contractId: 'CVAULT',
    ledger: 88,
    timestamp: '2026-01-01T00:00:00Z',
    topics: [type],
    value: '1',
  };
}

function createMockService(): EventSubscriptionService & {
  start: jest.Mock;
  stop: jest.Mock;
  onEvent: jest.Mock;
  onStatusChange: jest.Mock;
  emitEvent: (event: ActivityEvent) => void;
  emitStatus: (status: ConnectionStatus) => void;
} {
  const eventHandlers = new Set<(event: ActivityEvent) => void>();
  const statusHandlers = new Set<(status: ConnectionStatus) => void>();

  return {
    start: jest.fn(),
    stop: jest.fn(),
    getStatus: jest.fn(() => 'idle'),
    onEvent: jest.fn((handler: (event: ActivityEvent) => void) => {
      eventHandlers.add(handler);
      return () => eventHandlers.delete(handler);
    }),
    onStatusChange: jest.fn((handler: (status: ConnectionStatus) => void) => {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    }),
    emitEvent: (event: ActivityEvent) => {
      eventHandlers.forEach((handler) => handler(event));
    },
    emitStatus: (status: ConnectionStatus) => {
      statusHandlers.forEach((handler) => handler(status));
    },
  } as unknown as EventSubscriptionService & {
    start: jest.Mock;
    stop: jest.Mock;
    onEvent: jest.Mock;
    onStatusChange: jest.Mock;
    emitEvent: (event: ActivityEvent) => void;
    emitStatus: (status: ConnectionStatus) => void;
  };
}

describe('ActivityFeed streaming', () => {
  beforeEach(() => {
    resetSharedEventStreamForTests();
    activityStore.clear();
    activityStore.setStatus('idle');
  });

  it('auto-updates when stream emits events and deduplicates duplicates', () => {
    const service = createMockService();
    const { unmount } = render(<ActivityFeed service={service} limit={10} />);

    expect(service.start).toHaveBeenCalledTimes(1);

    act(() => {
      service.emitStatus('reconnecting');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Reconnecting');

    act(() => {
      service.emitStatus('connected');
      service.emitEvent(makeActivityEvent('evt-1', 'deposit'));
      service.emitEvent(makeActivityEvent('evt-1', 'deposit'));
    });

    expect(screen.getByRole('status')).toHaveTextContent('Live');
    expect(screen.getByText(/Deposit/)).toBeInTheDocument();
    expect(screen.getAllByText('Ledger #88')).toHaveLength(1);

    unmount();
    expect(service.stop).toHaveBeenCalledTimes(1);
  });
});
