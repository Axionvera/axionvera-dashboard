import { ConflictResolver } from "../../src/collaboration/conflictResolver";

describe("ConflictResolver", () => {
  const resolver = new ConflictResolver();

  it("returns the newest operation", () => {
    const local = {
      workspaceId: "1",
      userId: "alice",
      operation: "update" as const,
      timestamp: 10,
    };

    const remote = {
      workspaceId: "1",
      userId: "bob",
      operation: "update" as const,
      timestamp: 20,
    };

    expect(resolver.resolve(local, remote)).toEqual(remote);
  });

  it("keeps local when timestamps are equal", () => {
    const local = {
      workspaceId: "1",
      userId: "alice",
      operation: "update" as const,
      timestamp: 20,
    };

    const remote = {
      workspaceId: "1",
      userId: "bob",
      operation: "update" as const,
      timestamp: 20,
    };

    expect(resolver.resolve(local, remote)).toEqual(local);
  });
});