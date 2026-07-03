import { MigrationError } from './errors';
import type { MigrationMap, VersionedState } from './types';

export function migrateState<T extends VersionedState>(
    state: T,
    targetVersion: number,
    migrations: MigrationMap<T>,
): T {

    if (state.version > targetVersion) {
        throw new MigrationError(
            `Cannot migrate from future version ${state.version} to ${targetVersion}.`
        );
    }

    if (state.version === targetVersion) {
        return state;
    }

    let currentState = state;

    while (currentState.version < targetVersion) {

        const migration = migrations[currentState.version];

        if (!migration) {
            throw new MigrationError(
                `Missing migration from version ${currentState.version} to ${currentState.version + 1}.`
            );
        }

        const previousVersion = currentState.version;
        currentState = migration(currentState);

        if (currentState.version <= previousVersion) {
            throw new MigrationError(
                `Migration from version ${previousVersion} did not advance the state version.`
            );
        }

        if (currentState.version !== previousVersion + 1) {
            throw new MigrationError(
                `Migration must advance from version ${previousVersion} to ${previousVersion + 1}, received ${currentState.version}.`
            );
        }
    }

    return currentState;

}