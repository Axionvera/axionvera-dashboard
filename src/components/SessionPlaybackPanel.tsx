"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SessionPlayer, type SessionEvent, type SessionMetadata } from "@/session";
import {
  eventDescriptor,
  formatDuration,
  formatOffset,
  PlaybackControls,
  PlaybackInspector,
  PlaybackTimeline,
} from "./playback";

export interface SessionPlaybackPanelProps {
  metadata: SessionMetadata;
  events: SessionEvent[];
  onBack: () => void;
}

/**
 * `SessionPlaybackPanel` walks a recorded session via the `SessionPlayer`
 * engine. It is intentionally lightweight: rather than replaying a full
 * visual DOM, it surfaces each captured event in a scrubbable timeline and
 * shows the masked payload in an inspector.
 */
export default function SessionPlaybackPanel({ metadata, events, onBack }: SessionPlaybackPanelProps) {
  const sandboxRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<SessionPlayer | null>(null);
  const wasPlayingOnPointerDown = useRef(false);
  const currentIndexRef = useRef(0);
  const rafRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);

  const total = events.length;
  const safeIndex = total === 0 ? 0 : Math.min(currentIndex, total - 1);
  const currentEvent = total === 0 ? null : events[safeIndex];
  const firstTimestamp = events[0]?.timestamp ?? metadata.startedAt;
  const lastTimestamp = events[events.length - 1]?.timestamp ?? metadata.startedAt;
  const totalDurationMs = Math.max(1, lastTimestamp - firstTimestamp);

  const cancelPendingFrame = useCallback((): void => {
    const handle = rafRef.current;
    if (handle === null) return;
    rafRef.current = null;
    if (
      typeof window !== "undefined" &&
      typeof window.cancelAnimationFrame === "function" &&
      typeof handle === "number"
    ) {
      window.cancelAnimationFrame(handle);
      return;
    }
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  }, []);

  const scheduleFrame = useCallback((cb: () => void): void => {
    if (rafRef.current !== null) return;
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        cb();
      });
      return;
    }
    rafRef.current = setTimeout(() => {
      rafRef.current = null;
      cb();
    }, 16);
  }, []);

  useEffect(() => {
    if (!sandboxRef.current) return undefined;
    cancelPendingFrame();
    currentIndexRef.current = 0;
    setCurrentIndex(0);

    const player = new SessionPlayer({
      events,
      sandbox: sandboxRef.current,
      speed,
      onStep: (event, index) => {
        currentIndexRef.current = index;
        scheduleFrame(() => {
          setCurrentIndex(currentIndexRef.current);
        });
      },
      onComplete: () => setIsPlaying(false),
    });
    playerRef.current = player;
    return () => {
      player.stop();
      playerRef.current = null;
      cancelPendingFrame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const handlePlay = useCallback(() => {
    if (!playerRef.current || total === 0) return;
    if (playerRef.current.currentIndex >= total - 1) {
      playerRef.current.seek(0);
      cancelPendingFrame();
      currentIndexRef.current = 0;
      setCurrentIndex(0);
    }
    playerRef.current.play();
    setIsPlaying(true);
  }, [total, cancelPendingFrame]);

  const handlePause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
    cancelPendingFrame();
    currentIndexRef.current = 0;
    setCurrentIndex(0);
  }, [cancelPendingFrame]);

  const handleSeek = useCallback(
    (index: number) => {
      if (!playerRef.current) return;
      const clamped = Math.max(0, Math.min(index, total - 1));
      playerRef.current.seek(clamped);
      cancelPendingFrame();
      currentIndexRef.current = clamped;
      setCurrentIndex(clamped);
    },
    [total, cancelPendingFrame],
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
    if (!playerRef.current) return;
    playerRef.current.flush();
    cancelPendingFrame();
    const finalIndex = total > 0 ? total - 1 : 0;
    currentIndexRef.current = finalIndex;
    setCurrentIndex(finalIndex);
    setIsPlaying(false);
  }, [cancelPendingFrame, total]);

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

      <PlaybackControls
        isPlaying={isPlaying}
        speed={speed}
        transportDisabled={transportDisabled}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onFlush={handleFlush}
        onSpeedSelect={handleSpeedSelect}
      />

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
        <PlaybackTimeline timeline={timeline} safeIndex={safeIndex} />
        <PlaybackInspector currentEvent={currentEvent} />
      </div>

      <div ref={sandboxRef} aria-hidden className="h-0 w-0 overflow-hidden" data-testid="playback-sandbox" />
    </section>
  );
}
