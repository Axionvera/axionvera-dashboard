import { type SessionEvent } from "@/session";

export const SPEED_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
  { label: "MAX", value: 16 },
];

export const formatOffset = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const formatDuration = (startedAt: number, endedAt?: number) => {
  const end = endedAt ?? Date.now();
  return formatOffset(end - startedAt);
};

export const readString = (value: unknown, fallback: string = "<unknown>"): string =>
  typeof value === "string" ? value : (fallback ?? "<unknown>");

export const eventDescriptor = (
  event: SessionEvent
): {
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
