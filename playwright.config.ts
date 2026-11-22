import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

/**
 * Playwright configuration.
 *
 * Projects:
 *  - "setup"    logs in once and saves the session to .auth/admin.json
 *  - "chromium" runs every spec with that saved session (no per test login)
 *
 * The public OrangeHRM demo is shared and sometimes slow, so timeouts are
 * generous but bounded, and retries are enabled only in CI.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The public demo is shared and slow; a few workers keep it responsive.
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: env.authFile,
      },
      dependencies: ['setup'],
    },
  ],
});
