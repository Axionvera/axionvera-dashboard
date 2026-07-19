"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_DB_NAME,
  IndexedDBSessionStore,
  Masker,
  SessionEvent,
  SessionMetadata,
  SessionRecorder,
  type MaskOptions,
} from "@/session";

/**
 * Default options for the React hook. Centralized so consumers can spot
 * configuration surface in one place.
 */
const DEFAULT_MASK: MaskOptions = {
  blockSelectors: [],
  maskSensitiveInputs: true,
  replaceWith: "•",
};

export interface UseSessionReplayOptions {
  /** Optional pre-instantiated store. Useful for tests. */
  store?: IndexedDBSessionStore;
  /** Initial label to attach to newly created sessions. */
  label?: string;
  /** Initial mask options. */
  mask?: MaskOptions;
  /** Auto-start recording on mount. Defaults to `true`. */
  autoStart?: boolean;
}

export interface UseSessionReplayResult {
  isRecording: boolean;
  isReady: boolean;
  currentSessionId: string | null;
  eventCount: number;
  sessions: SessionMetadata[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  exportSession: (sessionId: string) => Promise<Blob | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Returns the recorded events for a given session, or `null` when the store is unavailable. */
  loadSessionEvents: (sessionId: string) => Promise<SessionEvent[] | null>;
}

/**
 * Browser-only React hook that exposes a recording lifecycle backed by an
 * `IndexedDBSessionStore`. The hook manages a singleton recorder so that
 * re-renders and React Strict-Mode double mounts do not clobber state.
 */
export function useSessionReplay(options: UseSessionReplayOptions = {}): UseSessionReplayResult {
  const autoStart = options.autoStart ?? true;

  const storeRef = useRef<IndexedDBSessionStore | null>(options.store ?? null);
  if (!storeRef.current && typeof indexedDB !== "undefined") {
    storeRef.current = new IndexedDBSessionStore({ dbName: DEFAULT_DB_NAME });
  }
  const recorderRef = useRef<SessionRecorder | null>(null);
  const eventsRef = useRef<SessionEvent[]>([]);
  const pendingMetadataRef = useRef<SessionMetadata | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const store = storeRef.current;
    if (!store) {
      setSessions([]);
      return;
    }
    try {
      const list = await store.listMetadata();
      setSessions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const persistPendingMetadata = useCallback(async () => {
    const store = storeRef.current;
    const metadata = pendingMetadataRef.current;
    if (!store || !metadata) return;
    const pending = eventsRef.current.splice(0);
    metadata.events = pending.length;
    metadata.endedAt = Date.now();
    await store.saveMetadata(metadata);
    if (pending.length > 0) {
      await store.saveEvents(pending);
    }
    pendingMetadataRef.current = null;
  }, []);

  const start = useCallback(async () => {
    const store = storeRef.current;
    if (!store || recorderRef.current?.isActive()) return;
    if (!isReady) {
      try {
        await store.init();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const metadata: SessionMetadata = {
      id: sessionId,
      startedAt: Date.now(),
      url: typeof location !== "undefined" ? location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      label: options.label,
      events: 0,
    };
    pendingMetadataRef.current = metadata;
    eventsRef.current = [];
    setEventCount(0);
    setCurrentSessionId(sessionId);

    const recorder = new SessionRecorder({
      sessionId,
      mask: options.mask ?? DEFAULT_MASK,
      emit: (event) => {
        eventsRef.current.push(event);
        setEventCount(eventsRef.current.length);
      },
    });
    recorderRef.current = recorder;
    try {
      recorder.start();
      setIsRecording(true);
      // Snapshot empty metadata so the session appears in listings immediately.
      await store.saveMetadata({ ...metadata });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, [isReady, options.label, options.mask, refresh]);

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.stop();
    recorderRef.current = null;
    setIsRecording(false);
    await persistPendingMetadata();
    await refresh();
  }, [persistPendingMetadata, refresh]);

  const exportSession = useCallback(
    async (sessionId: string) => {
      const store = storeRef.current;
      if (!store) return null;
      return store.exportSessionBlob(sessionId);
    },
    [],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const store = storeRef.current;
      if (!store) return;
      await store.deleteSession(sessionId);
      await refresh();
    },
    [refresh],
  );

  const loadSessionEvents = useCallback(async (sessionId: string): Promise<SessionEvent[] | null> => {
    const store = storeRef.current;
    if (!store) return null;
    try {
      return await store.getEvents(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!storeRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        await storeRef.current!.init();
        if (cancelled) return;
        setIsReady(true);
        await refresh();
        if (autoStart) await start();
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
      const recorder = recorderRef.current;
      if (recorder?.isActive()) {
        recorder.stop();
        // Persist any in-flight events so a tab unload (Strict Mode
        // double-mount, route change, etc.) doesn't drop the recording.
        void persistPendingMetadata();
      }
      recorderRef.current = null;
    };
    // The recorder is a singleton managed via `recorderRef.current`, so the
    // mount effect must NOT re-run when consumer-supplied callbacks change:
    // that would tear down a live recording mid-session. We disable the
    // exhaustive-deps warning knowingly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(
    () => ({
      isRecording,
      isReady,
      currentSessionId,
      eventCount,
      sessions,
      error,
      start,
      stop,
      exportSession,
      deleteSession,
      refresh,
      loadSessionEvents,
    }),
    [
      isRecording,
      isReady,
      currentSessionId,
      eventCount,
      sessions,
      error,
      start,
      stop,
      exportSession,
      deleteSession,
      refresh,
      loadSessionEvents,
    ],
  );
}

/**
 * Convenient static accessor for the masker so consumers can poke at the
 * default rules without instantiating the recorder.
 */
export const sessionMasker = new Masker();
