import type { WorkspaceStore } from "../workspaces/store";
import { PresenceManager } from "./presence";
import { ConflictResolver } from "./conflictResolver";
import type {
  CollaborationSnapshot,
  WorkspaceOperation,
} from "./types";

type SyncListener = (operation: WorkspaceOperation) => void;

export class SyncManager {
  private readonly listeners = new Set<SyncListener>();
  private readonly operations: WorkspaceOperation[] = [];
  private readonly presence = new PresenceManager();
  private readonly conflictResolver = new ConflictResolver();

  constructor(private readonly workspaceStore: WorkspaceStore) {}

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(operation: WorkspaceOperation): void {
    this.operations.push(operation);

    this.listeners.forEach((listener) => listener(operation));
  }

  resolveConflict(
    local: WorkspaceOperation,
    remote: WorkspaceOperation,
  ): WorkspaceOperation {
    return this.conflictResolver.resolve(local, remote);
  }

  getPresenceManager(): PresenceManager {
    return this.presence;
  }

  getSnapshot(): CollaborationSnapshot {
    return {
      users: this.presence.getUsers(),
      operations: [...this.operations],
    };
  }

  getWorkspaceSnapshot() {
    return this.workspaceStore.getSnapshot();
  }

  getActiveWorkspace() {
    return this.workspaceStore.getActiveWorkspace();
  }
}