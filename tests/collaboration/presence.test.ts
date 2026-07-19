import { PresenceManager } from "../../src/collaboration/presence";

describe("PresenceManager", () => {
  let manager: PresenceManager;

  beforeEach(() => {
    manager = new PresenceManager();
  });

  it("adds a user when joining", () => {
    manager.join({
      id: "user-1",
      name: "Alice",
      active: true,
      lastSeen: 0,
    });

    expect(manager.getUsers()).toHaveLength(1);
    expect(manager.getActiveUsers()).toHaveLength(1);
  });

  it("marks a user inactive when leaving", () => {
    manager.join({
      id: "user-1",
      name: "Alice",
      active: true,
      lastSeen: 0,
    });

    manager.leave("user-1");

    expect(manager.getActiveUsers()).toHaveLength(0);
  });

  it("clears all users", () => {
    manager.join({
      id: "user-1",
      name: "Alice",
      active: true,
      lastSeen: 0,
    });

    manager.clear();

    expect(manager.getUsers()).toHaveLength(0);
  });
});