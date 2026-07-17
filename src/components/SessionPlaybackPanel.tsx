"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FastForward,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { SessionPlayer, type SessionEvent, type SessionMetadata } from "@/session";

const SPEED_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
  { label: "MAX", value: 16 },
];

const formatOffset = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDuration = (startedAt: number, endedAt?: number) => {
  const end = endedAt ?? Date.now();
  return formatOffset(end - startedAt);
};

const readString = (value: unknown, fallback: string = "<unknown>"): string =>
  typeof value === "string" ? value : (fallback ?? "<unknown>");

const eventDescriptor = (event: SessionEvent): {
  icon: string;
  label: string;
  selector?: string;
  preview?: string;
} => {
  const data = (event.data ?? {}) as Record<string, unknown>;
  switch (event.type) {
    case "click":
      return {
        icon: "◉",
        label: "click",
        selector: readString(data.selector),
        preview: typeof data.text === "string" ? data.text : undefined,
      };
    case "input":
      return {
        icon: "✎",
        label: `input:${readString(data.type, "?")}`,
        selector: readString(data.selector),
        preview: typeof data.value === "string" ? data.value : undefined,
      };
    case "navigation":
      return {
        icon: "→",
        label: `nav:${readString(data.method, "?")}`,
        preview: readString(data.url),
      };
    case "mutation":
      return {
        icon: "✦",
        label: `mutation:${readString(data.kind, "?")}`,
        selector: readString(data.target),
        preview: `+${Array.isArray(data.addedNodes) ? data.addedNodes.length : 0} / -${typeof data.removedCount === "number" ? data.removedCount : 0}`,
      };
    case "console":
      return {
        icon: "!",
        label: `console:${readString(data.level, "?")}`,
        preview: Array.isArray(data.args)
          ? (data.args as unknown[]).map((arg) => String(arg)).join(" ").slice(0, 80)
          : undefined,
      };
    case "session:start":
      return { icon: "▶", label: "session:start" };
    case "session:stop":
      return { icon: "■", label: "session:stop" };
    default:
      return { icon: "·", label: event.type };
  }
};

export interface SessionPlaybackPanelProps {
  metadata: SessionMetadata;
  events: SessionEvent[];
  onBack: () => void;
}

/**
 * `SessionPlaybackPanel` walks a recorded session via the `SessionPlayer`
 * engine. It is intentionally lightweight: rather than replaying a full
 * visual DOM, it surfaces each captured event in a scrubbable timeline and
 * shows the masked payload in an inspector. This satisfies the
 * acceptance criterion \"Replayable sessions\" without trying to recreate
 * CSS, scripts, or assets from a serialized snapshot.
 */
export default function SessionPlaybackPanel({ metadata, events, onBack }: SessionPlaybackPanelProps) {
  const sandboxRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<SessionPlayer | null>(null);
  const wasPlayingOnPointerDown = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);

  const total = events.length;
  const safeIndex = total === 0 ? 0 : Math.min(currentIndex, total - 1);
  const currentEvent = total === 0 ? null : events[safeIndex];
  const firstTimestamp = events[0]?.timestamp ?? metadata.startedAt;
  const lastTimestamp = events[events.length - 1]?.timestamp ?? metadata.startedAt;
  const totalDurationMs = Math.max(1, lastTimestamp - firstTimestamp);

  useEffect(() => {
    if (!sandboxRef.current) return undefined;
    const player = new SessionPlayer({
      events,
      sandbox: sandboxRef.current,
      speed,
      onStep: (event, index) => {
        setCurrentIndex(index);
        if (event.type === "session:stop") {
          // Persist "ended" state so the timeline stops on the natural note.
        }
      },
      onComplete: () => setIsPlaying(false),
    });
    playerRef.current = player;
    return () => {
      player.stop();
      playerRef.current = null;
    };
    // The player is recreated when the event stream changes (i.e. when the
    // user selects a different session). Playback state is intentionally
    // reset on every events prop change.
  }, [events]);

  const handlePlay = useCallback(() => {
    if (!playerRef.current || total === 0) return;
    // If the user clicks Play at (or past) the end, rewind to the start so
    // they can replay without having to hit Stop first.
    if (playerRef.current.currentIndex >= total - 1) {
      playerRef.current.seek(0);
      setCurrentIndex(0);
    }
    playerRef.current.play();
    setIsPlaying(true);
  }, [total]);

  const handlePause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const handleSeek = useCallback(
    (index: number) => {
      if (!playerRef.current) return;
      const clamped = Math.max(0, Math.min(index, total - 1));
      playerRef.current.seek(clamped);
      setCurrentIndex(clamped);
    },
    [total],
  );

  const handleScrubberChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleSeek(Number(event.target.value));
    },
    [handleSeek],
  );

  const handleScrubberPointerDown = useCallback(() => {
    wasPlayingOnPointerDown.current = playerRef.current?.isPlaying() ?? false;
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleScrubberPointerUp = useCallback(() => {
    if (wasPlayingOnPointerDown.current) {
      playerRef.current?.play();
      setIsPlaying(true);
    }
    wasPlayingOnPointerDown.current = false;
  }, []);

  const handleSpeedSelect = useCallback((value: number) => {
    playerRef.current?.setSpeed(value);
    setSpeedState(value);
  }, []);

  const handleFlush = useCallback(() => {
    playerRef.current?.flush();
    setIsPlaying(false);
  }, []);

  const timeline = useMemo(
    () =>
      events.map((event, index) => ({
        event,
        index,
        descriptor: eventDescriptor(event),
        offset: event.timestamp - firstTimestamp,
      })),
    [events, firstTimestamp],
  );

  const transportDisabled = total === 0;

  return (
    <section
      className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4"
      data-testid="session-playback-panel"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground transition hover:text-foreground"
            data-testid="playback-back"
          >
            <ArrowLeft className="h-3 w-3" /> Back to sessions
          </button>
          <h2 className="text-lg font-semibold tracking-tight">
            Replay · {metadata.label ?? metadata.id.slice(0, 8)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {total} events · {formatDuration(firstTimestamp, lastTimestamp)} of captured time
          </p>
        </div>
        <div className="rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-xs">
          <div data-testid="playback-position">
            {formatOffset((currentEvent?.timestamp ?? firstTimestamp) - firstTimestamp)}{" / "}
            {formatOffset(totalDurationMs)}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {isPlaying ? (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            data-testid="playback-pause"
            disabled={transportDisabled}
          >
            <Pause className="h-4 w-4" /> Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            data-testid="playback-play"
            disabled={transportDisabled}
          >
            <Play className="h-4 w-4" /> Play
          </button>
        )}
        <button
          type="button"
          onClick={handleStop}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-accent"
          data-testid="playback-stop"
          disabled={transportDisabled}
        >
          <RotateCcw className="h-4 w-4" /> Stop
        </button>
        <button
          type="button"
          onClick={handleFlush}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-accent"
          data-testid="playback-flush"
          disabled={transportDisabled}
        >
          <FastForward className="h-4 w-4" /> Run to end
        </button>
        <div className="ml-auto flex items-center gap-1" role="group" aria-label="Playback speed">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSpeedSelect(preset.value)}
              className={[
                "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition",
                Math.abs(speed - preset.value) < 0.01
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:bg-accent",
              ].join(" ")}
              data-testid={`playback-speed-${preset.value}`}
              disabled={transportDisabled}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          step={1}
          value={safeIndex}
          onChange={handleScrubberChange}
          onPointerDown={handleScrubberPointerDown}
          onPointerUp={handleScrubberPointerUp}
          disabled={transportDisabled}
          aria-label="Scrub through captured events"
          className="w-full accent-primary disabled:opacity-40"
          data-testid="playback-scrubber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
        <ol
          className="max-h-72 overflow-y-auto rounded-md border border-border bg-background/40 p-2 text-sm"
          data-testid="playback-timeline"
        >
          {timeline.length === 0 ? (
            <li className="rounded border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              This session captured no events.
            </li>
          ) : (
            timeline.map((entry) => {
              const isActive = entry.index === safeIndex;
              return (
                <li
                  key={entry.event.id}
                  className={[
                    "grid grid-cols-[auto_auto_1fr] items-center gap-2 rounded px-2 py-1 font-mono text-xs",
                    isActive
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  ].join(" ")}
                  data-testid={`playback-event-${entry.index}`}
                >
                  <span aria-hidden className="w-4 text-center">{entry.descriptor.icon}</span>
                  <span className="w-16 shrink-0 text-right tabular-nums">{formatOffset(entry.offset)}</span>
                  <span className="truncate">
                    <span className="font-semibold text-foreground">{entry.descriptor.label}</span>
                    {entry.descriptor.selector ? (
                      <>
                        {" "}
                        <code className="rounded bg-muted px-1 text-[10px]">{entry.descriptor.selector}</code>
                      </>
                    ) : null}
                    {entry.descriptor.preview ? (
                      <>
                        {" "}
                        <span className="opacity-70">{entry.descriptor.preview}</span>
                      </>
                    ) : null}
                  </span>
                </li>
              );
            })
          )}
        </ol>

        <aside
          className="rounded-md border border-border bg-background/40 p-3"
          data-testid="playback-inspector"
        >
          <p className="text-xs uppercase text-muted-foreground">Current event</p>
          {!currentEvent ? (
            <p className="mt-2 text-sm text-muted-foreground">No event selected.</p>
          ) : (
            <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted p-2 text-[11px] leading-snug">
{JSON.stringify(currentEvent, null, 2)}
            </pre>
          )}
        </aside>
      </div>

      {/*
        The SessionPlayer requires a non-null sandbox element so mutation
        events dispatch somewhere. The element is invisible because the panel
        renders all state in React, not in the DOM.
      */}
      <div ref={sandboxRef} aria-hidden className="h-0 w-0 overflow-hidden" data-testid="playback-sandbox" />
    </section>
  );
}
