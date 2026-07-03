export interface VersionedState {
  version: number;
}

export type Migration<T extends VersionedState> = (state: T) => T;

export type MigrationMap<T extends VersionedState> = Record<
  number,
  Migration<T>
>;