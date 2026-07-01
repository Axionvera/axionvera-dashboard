import type { WorkspaceOperation } from "./types";

export class ConflictResolver {
  resolve(
    local: WorkspaceOperation,
    remote: WorkspaceOperation,
  ): WorkspaceOperation {
    return local.timestamp >= remote.timestamp ? local : remote;
  }
}