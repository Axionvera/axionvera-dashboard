import { migrateState } from '@/migrations/engine';
import { MigrationError } from '@/migrations/errors';
import type { VersionedState, MigrationMap } from '@/migrations/types';

interface TestState extends VersionedState {
  value: number;
}

const v1toV2 = (state: TestState): TestState => ({
  version: 2,
  value: state.value + 1,
});

const v2toV3 = (state: TestState): TestState => ({
  version: 3,
  value: state.value + 1,
});

const migrations: MigrationMap<TestState> = {
  1: v1toV2,
  2: v2toV3,
};

describe('Migration Engine', () => {
  it('should return state when already at target version', () => {
    const state: TestState = {
      version: 1,
      value: 10,
    };

    const result = migrateState(state, 1, migrations);

    expect(result).toEqual(state);
  });

    it('should migrate state from v1 to v2', () => {
    const state: TestState = {
      version: 1,
      value: 10,
    };

    const result = migrateState(state, 2, migrations);

    expect(result.version).toBe(2);
    expect(result.value).toBe(11);
  });

    it('should migrate state through multiple versions', () => {
    const state: TestState = {
      version: 1,
      value: 10,
    };

    const result = migrateState(state, 3, migrations);

    expect(result.version).toBe(3);
    expect(result.value).toBe(12);
  });

    it('should throw when migration is missing', () => {
    const state: TestState = {
      version: 2,
      value: 10,
    };

    const brokenMigrations: MigrationMap<TestState> = {
      1: v1toV2,
      // missing 2 -> 3
    };

    expect(() => {
      migrateState(state, 3, brokenMigrations);
    }).toThrow(MigrationError);
  });

    it('should throw when state version is higher than target', () => {
    const state: TestState = {
      version: 3,
      value: 10,
    };

    expect(() => {
      migrateState(state, 1, migrations);
    }).toThrow(MigrationError);
  });

    it('should throw when migration does not advance version', () => {
    const badMigration: MigrationMap<TestState> = {
      1: (state) => ({
        ...state,
        version: 1, // invalid
      }),
    };

    const state: TestState = {
      version: 1,
      value: 10,
    };

    expect(() => {
      migrateState(state, 2, badMigration);
    }).toThrow(MigrationError);
  });
});