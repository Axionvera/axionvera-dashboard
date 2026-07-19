# Collaboration Framework

## Overview

The collaboration framework provides the foundation for collaborative dashboard editing by introducing a synchronization layer, conflict resolution strategy, and user presence management. It is designed to work alongside the existing workspace management system without modifying its core behavior.

This implementation focuses on the client-side collaboration architecture. Backend networking and authentication are intentionally out of scope.

## Architecture

The collaboration framework consists of the following components:

### SyncManager

`SyncManager` coordinates collaboration events.

Responsibilities include:

* Publishing workspace operations
* Notifying subscribed listeners
* Providing access to the current workspace snapshot
* Exposing the active workspace

### PresenceManager

`PresenceManager` tracks users participating in a collaboration session.

Supported operations include:

* User join
* User leave
* Heartbeat updates
* Retrieving active collaborators

### ConflictResolver

`ConflictResolver` provides deterministic conflict handling using a **Last Write Wins (LWW)** strategy.

When multiple operations modify the same workspace, the operation with the newest timestamp is selected as the authoritative update.

### Collaboration Protocol

The collaboration protocol defines a shared message format for workspace operations.

Each operation records:

* Workspace identifier
* User identifier
* Operation type
* Timestamp

This structure provides a consistent representation for synchronization events.

## Synchronization Lifecycle

A typical collaboration flow follows these steps:

1. A user performs a workspace operation.
2. The operation is published through `SyncManager`.
3. Subscribers receive the operation.
4. If conflicting operations exist, `ConflictResolver` determines the authoritative update.
5. Workspace state remains synchronized across participants.

## Testing

The collaboration framework includes dedicated unit tests covering:

* Presence management
* Conflict resolution
* Synchronization event publishing
* Workspace snapshot access

These tests validate the core collaboration workflow independently from the rest of the application.

## Future Enhancements

Possible future improvements include:

* Real-time transport using WebSocket or Server-Sent Events
* Operational Transformation (OT) or CRDT-based conflict resolution
* Shared cursor and live editing indicators
* Workspace locking and edit permissions
* Persistent collaboration sessions
