import React from "react";
import { type SessionEvent } from "@/session";
import { formatOffset } from "./playbackUtils";

export type TimelineEntry = {
  event: SessionEvent;
  index: number;
  descriptor: {
    icon: string;
    label: string;
    selector?: string;
    preview?: string;
  };
  offset: number;
};

export type PlaybackTimelineProps = {
  timeline: TimelineEntry[];
  safeIndex: number;
};

export function PlaybackTimeline({ timeline, safeIndex }: PlaybackTimelineProps) {
  return (
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
              <span aria-hidden className="w-4 text-center">
                {entry.descriptor.icon}
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums">
                {formatOffset(entry.offset)}
              </span>
              <span className="truncate">
                <span className="font-semibold text-foreground">
                  {entry.descriptor.label}
                </span>
                {entry.descriptor.selector ? (
                  <>
                    {" "}
                    <code className="rounded bg-muted px-1 text-[10px]">
                      {entry.descriptor.selector}
                    </code>
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
  );
}

export default PlaybackTimeline;
