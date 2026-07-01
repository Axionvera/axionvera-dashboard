import type { WorkspaceOperation } from "./types";

export interface CollaborationMessage {
  type: "workspace-operation";
  payload: WorkspaceOperation;
}

export function createMessage(
  operation: WorkspaceOperation,
): CollaborationMessage {
  return {
    type: "workspace-operation",
    payload: operation,
  };
}