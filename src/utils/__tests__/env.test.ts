import { getEnv } from '../env';

describe('env utility', () => {
  const originalProcessEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalProcessEnv };
  });

  afterAll(() => {
    process.env = originalProcessEnv;
  });

  it('should return value from process.env if window._env_ is not present', () => {
    process.env.TEST_KEY = 'test_value';
    // Ensure window._env_ is not interfering
    if (typeof window !== 'undefined') {
        (window as any)._env_ = undefined;
    }
    expect(getEnv('TEST_KEY')).toBe('test_value');
  });

  it('should return value from window._env_ if present', () => {
    if (typeof window !== 'undefined') {
        (window as any)._env_ = { TEST_KEY: 'window_value' };
        expect(getEnv('TEST_KEY')).toBe('window_value');
        (window as any)._env_ = undefined;
    }
  });

  it('should return undefined if key is not found', () => {
    expect(getEnv('NON_EXISTENT_KEY')).toBeUndefined();
  });
});

describe("isEnvFlagEnabled / isSessionReplayEnabled", () => {
  const originalWindowEnv = typeof window !== "undefined" ? (window as { _env_?: Record<string, string> })._env_ : undefined;
  const originalSessionReplay = process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY;

  // We re-evaluate the module under `jest.isolateModules` per test so that any
  // memoization at module-evaluation time is reset and our process.env / window._env_
  // mutations are actually visible to getEnv. Without this, a bare
  // `require("../env")` would return the module-level capture (which in this case
  // is fine because getEnv reads env at call time, but the pattern is fragile
  // for future additions).
  const loadInIsolation = <T>(reader: (mod: typeof import("../env")) => T): T => {
    let result!: T;
    jest.isolateModules(() => {
      const mod = require("../env") as typeof import("../env");
      result = reader(mod);
    });
    return result;
  };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY;
    if (typeof window !== "undefined") {
      (window as { _env_?: Record<string, string> })._env_ = undefined;
    }
  });

  afterAll(() => {
    if (typeof window !== "undefined") {
      (window as { _env_?: Record<string, string> })._env_ = originalWindowEnv;
    }
    if (originalSessionReplay === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY = originalSessionReplay;
    }
  });

  it("returns false when the env var is unset", () => {
    const enabled = loadInIsolation(({ isSessionReplayEnabled }) => isSessionReplayEnabled());
    expect(enabled).toBe(false);
  });

  it("returns true only when the env var is exactly the string \"true\"", () => {
    process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY = "true";
    const enabled = loadInIsolation(({ isSessionReplayEnabled }) => isSessionReplayEnabled());
    expect(enabled).toBe(true);
  });

  it("returns false for any value other than \"true\" (incl. 1, on, TRUE)", () => {
    const values = ["TRUE", "1", "on", "yes", " enabled ", "false", ""];
    for (const value of values) {
      process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY = value;
      const enabled = loadInIsolation(({ isSessionReplayEnabled }) => isSessionReplayEnabled());
      expect(enabled).toBe(false);
    }
  });

  it("reads window._env_ when available (production runtime injection)", () => {
    if (typeof window === "undefined") return;
    (window as { _env_?: Record<string, string> })._env_ = {
      NEXT_PUBLIC_ENABLE_SESSION_REPLAY: "true",
    };
    const enabled = loadInIsolation(({ isSessionReplayEnabled }) => isSessionReplayEnabled());
    expect(enabled).toBe(true);
  });
});
