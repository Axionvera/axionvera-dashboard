import { migrateState } from '@/migrations/engine';
import { NOTIFICATION_STORAGE_VERSION } from '@/notifications/types';

test('should migrate v0 notification state to v1', () => {
  const oldState = {
    version: 0,
    items: [],
  };

  const result = migrateState(
    oldState as any,
    NOTIFICATION_STORAGE_VERSION,
    {
      0: (s) => ({
        ...s,
        version: 1,
        filter: { category: 'all', read: 'all' },
      }),
    }
  );

  expect(result.version).toBe(1);
  expect(result.filter).toBeDefined();
});