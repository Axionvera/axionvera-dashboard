# Session Replay & User Journey Recorder

The Session Replay subsystem (delivering issue #264) gives dashboard
operators an opt-in way to record and replay a user's journey through the
Axionvera dashboard. Recordings are used for debugging, UX analysis, and
issue reproduction.

This document describes what the subsystem does, the privacy controls it
honors, and the responsibilities developers carry when adding new
sensitive surfaces.

## Scope

* **Capture**: navigation, clicks, form input changes, DOM mutations, and
  console calls. Recordings are emitted as a typed `SessionEvent` stream.
* **Storage**: IndexedDB only. Each session is keyed by an opaque UUID and
  rotated by both age (default 7 days) and slot count (default 25 sessions).
* **Replay**: a single `SessionPlayer` walks the recorded stream. The
  player never mutates the live document; it dispatches synthetic
  CustomEvents against the caller-supplied sandbox container.
* **Out of scope**: third-party analytics services, hidden backend
  collection, identity-bound telemetry.

## Privacy controls

The recorder masks sensitive data **before** any value leaves the page.
The default masker applies to:

* Every element marked `[data-session-mask]`, `[data-private]` (string or
  numeric), `.session-mask`, or `input[type=password|email|tel]`.
* The value of `password`, `email`, `tel`, `credit-card`, and `ssn`
  inputs even when not explicitly flagged by a class or attribute.
* `script` tags, `inline event handlers`, and `style` attributes are
  never serialized.
* `href` and `src` attributes are dropped from the serialized DOM to
  defeat token-leak tricks via query strings.
* Masked subtrees collapse to a single masked text node — their children,
  titles, alt text, and `data-*` attributes are intentionally omitted from
  recordings.

Developers can extend the blocker list at runtime:

```ts
import { useSessionReplay } from "@/hooks/useSessionReplay";

useSessionReplay({
  mask: {
    blockSelectors: [".my-secret", "[data-pii]"],
    maskSensitiveInputs: true,
    replaceWith: "•",
  },
});
```

The hook exposes `error`, `eventCount`, `sessions`, `start`, `stop`,
`exportSession`, and `deleteSession`. Sessions can be deleted at any
time, and the panel only renders inside dashboards gated by the
`ENABLE_SESSION_REPLAY` flag (off by default).

## Threat model

| Risk | Mitigation |
| --- | --- |
| Recording stored un-redacted | Masker runs at capture time, not on export. |
| Sensitive URL parameters leak | `href` and `src` attributes are dropped before serialization. |
| Password values captured | Password input values are always replaced with `•`. |
| Long-lived recordings grow indefinitely | `IndexedDBSessionStore.rotate()` evicts by age and LRU on every `init()`. |
| Captured script execution during replay | The player only dispatches CustomEvents against the sandbox container; no scripts from the recording ever run. |
| Cross-origin references | `script` tags and all `event handler` attributes are excluded from serialization. |
| Backwards compatibility | Recordings older than the configured retention window are removed automatically. |

## Configuration

The default `IndexedDBSessionStore` is constructed with:

| Option | Default | Meaning |
| --- | --- | --- |
| `dbName` | `axionvera_sessions` | The IndexedDB database name. |
| `version` | `1` | Schema version; bump on migration. |
| `maxRetainedSessions` | `25` | Number of sessions kept after rotation. |
| `maxRetainedAgeMs` | `7 * 24 * 60 * 60 * 1000` | Age-based eviction window. |

Override these in the hook options when integrating into environments
with tighter or looser constraints (e.g. CI smoke tests that should not
write to disk).

## How to test

The recorder is fully testable in jsdom:

```bash
npm run typecheck
npm test -- tests/session
```

Tests run with a mock `MutationObserver`, a fake `IndexedDBFactory`,
and synthetic DOM events — no browser automation required.
