import {
  emit,
  getEvents,
  getEventsByType,
  getErrorEvents,
  getWarningEvents,
  clear,
  configureDiagnostics,
  getStats,
  DiagnosticEventType,
} from '@/diagnostics';

describe('Diagnostics', () => {
  afterEach(() => {
    clear();
    configureDiagnostics({ enabled: true });
  });

  it('should emit and retrieve events in LIFO order', () => {
    emit('test.event', { data: { key: 'value' } });
    emit('another.event');

    const events = getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('another.event');
    expect(events[1].type).toBe('test.event');
    expect(events[1].data).toEqual({ key: 'value' });
  });

  it('should include a timestamp', () => {
    emit('ping');
    const events = getEvents();
    expect(events[0].timestamp).toBeDefined();
    expect(() => new Date(events[0].timestamp)).not.toThrow();
  });

  it('should clear all events', () => {
    emit('a');
    emit('b');
    expect(getEvents()).toHaveLength(2);
    clear();
    expect(getEvents()).toHaveLength(0);
  });

  it('should cap at maxEvents', () => {
    configureDiagnostics({ maxEvents: 50 });
    for (let i = 0; i < 100; i++) {
      emit(`event-${i}`);
    }
    expect(getEvents()).toHaveLength(50);
    expect(getEvents()[0].type).toBe('event-99');
  });

  it('should filter events by type', () => {
    emit(DiagnosticEventType.API_REQUEST, { source: 'test' });
    emit(DiagnosticEventType.API_SUCCESS, { source: 'test' });
    emit(DiagnosticEventType.API_ERROR, { source: 'test', level: 'error' });

    const apiErrors = getEventsByType(DiagnosticEventType.API_ERROR);
    expect(apiErrors).toHaveLength(1);
    expect(apiErrors[0].type).toBe(DiagnosticEventType.API_ERROR);
  });

  it('should filter events with getEvents filter', () => {
    emit('type.a', { level: 'info' });
    emit('type.b', { level: 'error' });
    emit('type.a', { level: 'error' });

    const errors = getEvents({ level: 'error' });
    expect(errors).toHaveLength(2);
    expect(errors.every(e => e.level === 'error')).toBe(true);

    const typeAErrors = getEvents({ type: 'type.a', level: 'error' });
    expect(typeAErrors).toHaveLength(1);
  });

  it('should filter events since a date', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      emit('old');
      const since = new Date('2026-01-01T00:00:00.001Z');
      jest.setSystemTime(new Date('2026-01-01T00:00:00.002Z'));
      emit('new');

      const recent = getEvents({ since });
      expect(recent).toHaveLength(1);
      expect(recent[0].type).toBe('new');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should return error and warning events', () => {
    emit('info-event', { level: 'info' });
    emit('warn-event', { level: 'warn' });
    emit('error-event', { level: 'error' });

    expect(getErrorEvents()).toHaveLength(1);
    expect(getErrorEvents()[0].type).toBe('error-event');

    expect(getWarningEvents()).toHaveLength(1);
    expect(getWarningEvents()[0].type).toBe('warn-event');
  });

  it('should include source and duration in events', () => {
    emit('measured', { source: 'MyComponent', duration: 42, data: { detail: 'test' } });
    const events = getEvents();
    expect(events[0].source).toBe('MyComponent');
    expect(events[0].duration).toBe(42);
    expect(events[0].data).toEqual({ detail: 'test' });
  });

  it('should support standard DiagnosticEventType enum values', () => {
    Object.values(DiagnosticEventType).forEach(type => {
      emit(type, { source: 'test' });
    });
    const events = getEvents();
    expect(events).toHaveLength(Object.values(DiagnosticEventType).length);
  });

  it('should return stats', () => {
    emit('a', { level: 'info' });
    emit('a', { level: 'info' });
    emit('b', { level: 'error' });
    emit('c', { level: 'warn' });

    const stats = getStats();
    expect(stats.total).toBe(4);
    expect(stats.byType['a']).toBe(2);
    expect(stats.byType['b']).toBe(1);
    expect(stats.byLevel['info']).toBe(2);
    expect(stats.byLevel['error']).toBe(1);
    expect(stats.byLevel['warn']).toBe(1);
  });

  it('should not emit events when disabled', () => {
    configureDiagnostics({ enabled: false });
    emit('hidden');
    expect(getEvents()).toHaveLength(0);
  });
});
