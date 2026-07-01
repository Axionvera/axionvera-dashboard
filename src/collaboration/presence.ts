import type { CollaborationUser } from "./types";

export class PresenceManager {
  private readonly users = new Map<string, CollaborationUser>();

  join(user: CollaborationUser): void {
    this.users.set(user.id, {
      ...user,
      active: true,
      lastSeen: Date.now(),
    });
  }

  leave(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    this.users.set(userId, {
      ...user,
      active: false,
      lastSeen: Date.now(),
    });
  }

  heartbeat(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    this.users.set(userId, {
      ...user,
      lastSeen: Date.now(),
    });
  }

  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  getActiveUsers(): CollaborationUser[] {
    return this.getUsers().filter((user) => user.active);
  }

  clear(): void {
    this.users.clear();
  }
}