export type CollaborationOperation =
  | "create"
  | "update"
  | "delete"
  | "switch";

export interface CollaborationUser {
  id: string;
  name: string;
  active: boolean;
  lastSeen: number;
}

export interface WorkspaceOperation {
  workspaceId: string;
  userId: string;
  operation: CollaborationOperation;
  timestamp: number;
}

export interface CollaborationSnapshot {
  users: CollaborationUser[];
  operations: WorkspaceOperation[];
}