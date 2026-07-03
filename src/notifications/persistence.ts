import type { AppNotification, NotificationFilter } from './types';
import { DEFAULT_NOTIFICATION_FILTER, NOTIFICATION_STORAGE_VERSION } from './types';
import { migrateState } from '@/migrations/engine';
import type { MigrationMap, VersionedState } from '@/migrations/types';

const STORAGE_KEY = `axionvera:notifications:v${NOTIFICATION_STORAGE_VERSION

  }`;

const notificationMigrations: MigrationMap<PersistedNotificationState> = {
  0: (state) => {
    return {
      ...state,
      version: 1,
      filter: DEFAULT_NOTIFICATION_FILTER,
    };
  },
};

export interface PersistedNotificationState extends VersionedState {
  items: AppNotification[];
  filter: NotificationFilter;
}

function isPersistedNotificationState(
  value: unknown,
): value is PersistedNotificationState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const state = value as Partial<PersistedNotificationState>;

  return (
    typeof state.version === 'number' &&
    Array.isArray(state.items)
  );
}

export function loadNotificationState(): PersistedNotificationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isPersistedNotificationState(parsed)) {
      return null;
    }

    const migrated = migrateState(
      parsed,
      NOTIFICATION_STORAGE_VERSION,
      notificationMigrations,
    );

    return {
      version: NOTIFICATION_STORAGE_VERSION,
      items: migrated.items,
      filter: migrated.filter ?? DEFAULT_NOTIFICATION_FILTER,
    };
  } catch {
    return null;
  }
}

export function saveNotificationState(state: PersistedNotificationState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[NotificationPersistence] Failed to save state:', error);
  }
}

export function clearNotificationStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}


