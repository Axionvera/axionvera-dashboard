import React from "react";
import { FastForward, Pause, Play, RotateCcw } from "lucide-react";
import { SPEED_PRESETS } from "./playbackUtils";

export type PlaybackControlsProps = {
  isPlaying: boolean;
  speed: number;
  transportDisabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onFlush: () => void;
  onSpeedSelect: (speed: number) => void;
};

export function PlaybackControls({
  isPlaying,
  speed,
  transportDisabled,
  onPlay,
  onPause,
  onStop,
  onFlush,
  onSpeedSelect,
}: PlaybackControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPlaying ? (
        <button
          type="button"
          onClick={onPause}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          data-testid="playback-pause"
          disabled={transportDisabled}
        >
          <Pause className="h-4 w-4" /> Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={onPlay}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          data-testid="playback-play"
          disabled={transportDisabled}
        >
          <Play className="h-4 w-4" /> Play
        </button>
      )}
      <button
        type="button"
        onClick={onStop}
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-accent"
        data-testid="playback-stop"
        disabled={transportDisabled}
      >
        <RotateCcw className="h-4 w-4" /> Stop
      </button>
      <button
        type="button"
        onClick={onFlush}
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
            onClick={() => onSpeedSelect(preset.value)}
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
  );
}

export default PlaybackControls;
