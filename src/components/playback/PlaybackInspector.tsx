import React from "react";
import { type SessionEvent } from "@/session";

export type PlaybackInspectorProps = {
  currentEvent: SessionEvent | null;
};

export function PlaybackInspector({ currentEvent }: PlaybackInspectorProps) {
  return (
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
  );
}

export default PlaybackInspector;
