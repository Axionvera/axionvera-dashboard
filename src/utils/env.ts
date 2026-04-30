/**
 * Utility to access environment variables.
 * In production/deployment, these are injected into window._env_ by env.sh.
 * In local dev, they come from process.env.
 */
interface EnvWindow extends Window {
  _env_?: Record<string, string>;
}

export const getEnv = (key: string): string | undefined => {
  // Check window._env_ first (injected at runtime in Docker/containers)
  if (typeof window !== 'undefined') {
    const envWindow = window as unknown as EnvWindow;
    if (envWindow._env_ && envWindow._env_[key]) {
      return envWindow._env_[key];
    }
  }

  // Fall back to process.env (build-time variables, local development)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }

  return undefined;
};
