/**
 * Utility to access environment variables.
 * In production/deployment, these are injected into window._env_ by env.sh.
 * In local dev, they come from process.env.
 */
export const getEnv = (key: string): string | undefined => {
  // Check window._env_ first (injected at runtime in Docker/containers)
  if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_[key]) {
    return (window as any)._env_[key];
  }

  // Fall back to process.env (build-time variables, local development)
  if (typeof process !== 'undefined' && (process as any).env) {
    return (process as any).env[key];
  }

  return undefined;
};

/**
 * Strict boolean check on a `NEXT_PUBLIC_*` env var. Only `"true"` enables the
 * feature; everything else (including missing/empty/undefined) leaves it off.
 * Use this pattern for non-secret opt-in dev tooling so a missed flag
 * defaults to safer behavior.
 */
export const isEnvFlagEnabled = (key: string): boolean => getEnv(key) === "true";

/**
 * Session Replay is a developer-facing recorder. It must be explicitly enabled
 * via `NEXT_PUBLIC_ENABLE_SESSION_REPLAY=true` (typically in `.env.local` for
 * dev or `.env.production` for staging). Default is OFF in all environments.
 */
export const isSessionReplayEnabled = (): boolean =>
  isEnvFlagEnabled("NEXT_PUBLIC_ENABLE_SESSION_REPLAY");
