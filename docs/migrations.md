# State Migration System

This document explains the state migration system used in the Axionvera Dashboard for versioned persistence in localStorage.

---

## Overview

The migration system ensures that persisted client-side state (notifications, settings, etc.) remains compatible across application updates.

When the application schema evolves, older stored states are automatically migrated to the latest version.

---

## Core Concept

Each persisted state includes a version field:

interface VersionedState {
  version: number;
}

The system migrates state incrementally until it reaches the latest version defined by the application.

---

## Migration Engine

The migration engine is located at:

src/migrations/engine.ts

---

## How it works

- Reads persisted state from storage
- Checks current version vs target version
- Applies migrations sequentially:
  - v0 → v1 → v2 → v3 ...
- Validates each step strictly

---

## Migration Rules

Each migration MUST:

- Increment version by exactly 1
- Return a valid state object
- Be pure (no side effects)
- Never skip versions

---

## Example Migration Map

const migrations = {
  0: (state) => ({
    ...state,
    version: 1,
    filter: DEFAULT_FILTER,
  }),

  1: (state) => ({
    ...state,
    version: 2,
    // new fields here
  }),
};

---

## Using the Migration Engine

const migrated = migrateState(
  parsedState,
  CURRENT_VERSION,
  migrations
);

---

## Persistence Integration

The system is integrated into localStorage loaders:

- Notifications state
- Future: user settings, workspace state

Example:

const parsed = JSON.parse(raw);

const migrated = migrateState(
  parsed,
  NOTIFICATION_STORAGE_VERSION,
  notificationMigrations
);

---

## Safety Guarantees

The engine prevents:

- skipping versions
- invalid state transitions
- regression to older versions
- missing migration handlers

---

## Adding a New Migration

When updating state structure:

1. Increment version constant
2. Add migration function
3. Update type definitions
4. Add unit tests

---

## Example Workflow

v0 (old state)
  ↓
migration 0 → 1
  ↓
v1 (current app state)

---

## Testing

All migrations must include tests in:

tests/migrations/

---

## Summary

The migration system ensures safe evolution of persisted state without breaking existing users' data.