import { defineConfig, devices } from '@playwright/test';
import {
  applyEnvDefaults,
  loadPlaywrightTestEnv,
} from './tests/e2e/helpers/testEnv';

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 *
 * NOTE: WebKit is excluded on Windows because the Playwright WebKit engine
 * is unstable on Windows (worker crashes, page creation timeouts).
 * It runs on CI (ubuntu-latest) where it is fully supported.
 */

const isWindows = process.platform === 'win32';
const e2eEnv = loadPlaywrightTestEnv();
applyEnvDefaults(process.env, e2eEnv);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit crashes on Windows — skip locally, runs on CI (Linux)
    ...(!isWindows ? [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }] : []),
  ],

  webServer: {
    command: 'npm run build && npm run start',
    env: {
      ...e2eEnv,
      ...process.env,
    },
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
