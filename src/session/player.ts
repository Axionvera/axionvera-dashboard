import type { SessionEvent, SessionPlayerOptions } from "./types";

const DEFAULT_SPEED = 1;

/**
 * Normalize the schedule for a list of events so playback always advances
 * without negative delays (and never tight-loops on simultaneous records).
 */
const computeDelays = (events: SessionEvent[], speed: number): number[] => {
  const delays: number[] = [];
  let previous = events[0]?.timestamp ?? 0;
  for (let i = 0; i < events.length; i += 1) {
    const current = events[i].timestamp;
    const delta = Math.max(0, current - previous);
    delays.push(delta / Math.max(0.01, speed));
    previous = current;
  }
  // The first delay is meaningless (we have nothing to wait for), drop it
  // from the schedule so playback starts immediately.
  if (delays.length > 0) delays[0] = 0;
  return delays;
};

/**
 * `SessionPlayer` walks an array of `SessionEvent` records and re-expresses
 * them against a caller-supplied sandbox container. The player is offline by
 * design: it never touches the live document, never replays navigation, and
 * never executes recorded scripts.
 *
 * Use this to drive a timeline UI, drive a regression test fixture, or pipe
 * the stream into a downstream visualizer.
 */
export class SessionPlayer {
  private readonly options: Required<
    Pick<SessionPlayerOptions, "sandbox" | "events" | "speed" | "now">
  > & SessionPlayerOptions;
  private index = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private playing = false;
  private aborted = false;
  private readonly delays: number[];

  constructor(options: SessionPlayerOptions) {
    if (!options.events) throw new Error("SessionPlayer requires an events array");
    if (!options.sandbox) throw new Error("SessionPlayer requires a sandbox container");
    this.options = {
      ...options,
      speed: options.speed ?? DEFAULT_SPEED,
      now: options.now ?? (() => Date.now()),
    };
    this.delays = computeDelays(this.options.events, this.options.speed);
  }

  /** Number of events that have already been processed. */
  get currentIndex(): number {
    return this.index;
  }

  /** Total number of events the player has been scheduled to walk. */
  get totalEvents(): number {
    return this.options.events.length;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  /** Begin (or resume) playing from the current index. */
  play(): void {
    if (this.playing || this.aborted) return;
    this.playing = true;
    this.scheduleNext();
  }

  /** Pause the timer without losing place. */
  pause(): void {
    this.playing = false;
    this.clearTimer();
  }

  /** Stop and reset to the beginning. */
  stop(): void {
    this.playing = false;
    this.aborted = false;
    this.clearTimer();
    this.index = 0;
  }

  /**
   * Move to a specific index. Resets the timer to honor the new schedule.
   */
  seek(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.options.events.length));
    const wasPlaying = this.playing;
    this.pause();
    this.index = clamped;
    if (wasPlaying) this.play();
  }

  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new Error("SessionPlayer.setSpeed requires a positive number");
    }
    const wasPlaying = this.playing;
    this.pause();
    this.options.speed = speed;
    this.delays.length = 0;
    this.delays.push(...computeDelays(this.options.events, speed));
    if (wasPlaying) this.play();
  }

  /**
   * Apply every event synchronously in order. Useful in tests or when the
   * caller wants to render the entire timeline in one paint.
   */
  flush(): void {
    while (this.index < this.options.events.length) {
      this.processEvent(this.options.events[this.index], this.index);
      this.index += 1;
    }
    this.options.onComplete?.();
  }

  private scheduleNext(): void {
    if (!this.playing || this.aborted) return;
    if (this.index >= this.options.events.length) {
      this.playing = false;
      this.options.onComplete?.();
      return;
    }
    const delay = this.delays[this.index] ?? 0;
    const setTimer = this.options.setTimeout ?? setTimeout;
    this.timer = setTimer(() => {
      this.timer = null;
      this.processEvent(this.options.events[this.index], this.index);
      this.index += 1;
      this.scheduleNext();
    }, delay);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      const clear = this.options.clearTimeout ?? clearTimeout;
      clear(this.timer);
      this.timer = null;
    }
  }

  private processEvent(event: SessionEvent, index: number): void {
    this.options.onStep?.(event, index);
    this.applyMutation(event);
  }

  private applyMutation(event: SessionEvent): void {
    if (event.type !== "mutation") return;
    if (typeof this.options.onMutationApply === "function") {
      this.options.onMutationApply(event);
      return;
    }
    // Default behavior: dispatch a synthetic CustomEvent so the host UI can
    // apply the diff against its sandbox. This avoids giving the player any
    // implicit DOM authority on the live document.
    try {
      this.options.sandbox.dispatchEvent(
        new CustomEvent("session-replay:apply", { detail: event }),
      );
    } catch {
      // CustomEvent is unavailable in some test shims — swallow.
    }
  }
}
