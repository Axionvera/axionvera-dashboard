import { MigrationError } from './errors';
import type { MigrationMap, VersionedState } from './types';

export function migrateState<T extends VersionedState>(
  state: T,
  targetVersion: number,
  migrations: MigrationMap<T>,
): T {
  if (state.version > targetVersion) {
    throw new MigrationError(
      `Cannot migrate from future version ${state.version} to ${targetVersion}.`,
    );
  }

  let currentState = state;

  while (currentState.version < targetVersion) {
    const fromVersion = currentState.version;
    const toVersion = fromVersion + 1;

    const migration = migrations[fromVersion];

    if (!migration) {
      throw new MigrationError(
        `Missing migration from version ${fromVersion} to ${toVersion}.`,
      );
    }

    const nextState = migration(currentState);

    if (!nextState || typeof nextState !== 'object') {
      throw new MigrationError(
        `Migration ${fromVersion} → ${toVersion} returned invalid state.`,
      );
    }

    if (nextState.version !== toVersion) {
      throw new MigrationError(
        `Migration must advance from version ${fromVersion} to ${toVersion}, got ${nextState.version}.`,
      );
    }

    currentState = nextState;
  }

  return currentState;
}