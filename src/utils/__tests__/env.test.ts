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
