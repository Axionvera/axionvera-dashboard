import { defineConfig, devices } from '@playwright/test';
import {
  applyEnvDefaults,
  loadPlaywrightTestEnv,
} from './tests/e2e/helpers/testEnv';

const isCI = !!process.env.CI;
const visualEnv = loadPlaywrightTestEnv();
applyEnvDefaults(process.env, visualEnv);

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-visual-report', open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    timezoneId: 'UTC',
    locale: 'en-US',
  },
  expect: {
    toHaveScreenshot: {
      pathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    env: {
      ...visualEnv,
      ...process.env,
    },
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
