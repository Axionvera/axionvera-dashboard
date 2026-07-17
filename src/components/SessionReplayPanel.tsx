"use client";

import { useCallback, useMemo, useState } from "react";
import { Disc, Download, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSessionReplay } from "@/hooks/useSessionReplay";
import type { SessionEvent, SessionMetadata } from "@/session";
import SessionPlaybackPanel from "@/components/SessionPlaybackPanel";

const formatTimestamp = (ms: number) => new Date(ms).toLocaleString();

const formatDuration = (startedAt: number, endedAt: number | undefined) => {
  if (!endedAt) return "in progress";
  const seconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
};

interface SessionReplayPanelProps {
  className?: string;
  /**
   * Whether `useSessionReplay` should auto-start a recording on mount.
   * Pass `false` to require an explicit click of the "Record" button — useful
   * when mounting inside a developer toolbox you only open occasionally.
   * Defaults to `true` for backward compatibility with existing call sites.
   */
  autoStart?: boolean;
}

type ViewMode = "list" | "playback";

/**
 * `SessionReplayPanel` is a developer-facing UI that lists every recording
 * captured by the `useSessionReplay` hook. It never renders inside the public
 * app: dashboard operators gate it behind an environment variable.
 *
 * The panel switches between a "list" view (recordings + per-session
 * metadata + export/delete) and a "playback" view (the
 * `SessionPlaybackPanel` timeline).
 */
export default function SessionReplayPanel({ className, autoStart = false }: SessionReplayPanelProps) {
  const replay = useSessionReplay({ autoStart });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [loadedEvents, setLoadedEvents] = useState<SessionEvent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selectedSession = useMemo<SessionMetadata | null>(
    () => replay.sessions.find((session) => session.id === selectedId) ?? null,
    [replay.sessions, selectedId],
  );

  const handleStart = useCallback(async () => {
    try {
      await replay.start();
      toast.success("Session recording started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start session recording");
    }
  }, [replay]);

  const handleStop = useCallback(async () => {
    try {
      await replay.stop();
      toast.success("Session recording saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to stop session recording");
    }
  }, [replay]);

  const handleExport = useCallback(
    async (sessionId: string) => {
      const blob = await replay.exportSession(sessionId);
      if (!blob) {
        toast.error("Session not found");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sessionId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Session exported");
    },
    [replay],
  );

  const handleDelete = useCallback(
    async (sessionId: string) => {
      try {
        await replay.deleteSession(sessionId);
        if (selectedId === sessionId) {
          setSelectedId(null);
          setLoadedEvents(null);
          setView("list");
        }
        toast.success("Session deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete session");
      }
    },
    [replay, selectedId],
  );

  const handleReplay = useCallback(
    async (sessionId: string) => {
      setLoadError(null);
      const events = await replay.loadSessionEvents(sessionId);
      if (events === null) {
        setLoadError(replay.error ?? "Failed to load session events");
        return;
      }
      setLoadedEvents(events);
      setSelectedId(sessionId);
      setView("playback");
    },
    [replay],
  );

  const handleBackToList = useCallback(() => {
    setView("list");
    setLoadedEvents(null);
  }, []);

  return (
    <section
      className={[
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        "p-5 flex flex-col gap-5",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="session-replay-panel"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Session recordings</h2>
          <p className="text-sm text-muted-foreground">
            Recordings stay on this device. See{" "}
            <a className="underline" href="/docs/SESSION_REPLAY">
              privacy controls
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          {replay.isRecording ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90"
              data-testid="session-stop"
            >
              <Pause className="h-4 w-4" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              data-testid="session-start"
            >
              <Disc className="h-4 w-4" /> Record
            </button>
          )}
        </div>
      </header>

      {replay.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {replay.error}
        </div>
      ) : null}

      {view === "playback" && selectedSession && loadedEvents ? (
        <SessionPlaybackPanel
          metadata={selectedSession}
          events={loadedEvents}
          onBack={handleBackToList}
        />
      ) : null}

      {view === "list" ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
        <ul className="flex flex-col gap-2" data-testid="session-list">
          {replay.sessions.length === 0 ? (
            <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              No recorded sessions yet.
            </li>
          ) : (
            replay.sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(session.id)}
                  className={[
                    "flex w-full flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition",
                    session.id === selectedId
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-accent",
                  ].join(" ")}
                >
                  <span className="font-medium">{session.label ?? session.id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(session.startedAt)} · {session.events} events · {formatDuration(session.startedAt, session.endedAt)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="rounded-lg border border-border bg-background/50 p-4" data-testid="session-detail">
          {!selectedSession ? (
            <p className="text-sm text-muted-foreground">Select a session to see its metadata.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-semibold">Session ID</h3>
                <code className="block break-all rounded bg-muted px-2 py-1 text-xs">{selectedSession.id}</code>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Started at</p>
                  <p>{formatTimestamp(selectedSession.startedAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Ended at</p>
                  <p>{selectedSession.endedAt ? formatTimestamp(selectedSession.endedAt) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Events</p>
                  <p>{selectedSession.events}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">URL</p>
                  <p className="break-all text-xs">{selectedSession.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExport(selectedSession.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-accent"
                  data-testid="session-export"
                >
                  <Download className="h-4 w-4" /> Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedSession.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
                  data-testid="session-delete"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleReplay(selectedSession.id)}
                  className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-accent"
                  data-testid="session-replay"
                >
                  <Play className="h-4 w-4" /> Replay session
                </button>
              </div>
              {loadError ? (
                <p className="text-xs text-destructive">{loadError}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
      ) : null}
    </section>
  );
}
