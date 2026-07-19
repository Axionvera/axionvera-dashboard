import { SyncManager } from "../../src/collaboration/syncManager";
import { WorkspaceStore } from "../../src/workspaces/store";

describe("SyncManager", () => {
  let manager: SyncManager;

  beforeEach(() => {
    manager = new SyncManager(new WorkspaceStore());
  });

  it("publishes workspace operations", () => {
    const listener = jest.fn();

    manager.subscribe(listener);

    manager.publish({
      workspaceId: "workspace-1",
      userId: "alice",
      operation: "update",
      timestamp: Date.now(),
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns workspace snapshot", () => {
    expect(manager.getWorkspaceSnapshot()).toBeDefined();
  });

  it("returns active workspace", () => {
    expect(manager.getActiveWorkspace()).toBeDefined();
  });
});