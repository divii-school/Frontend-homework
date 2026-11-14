import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// Reads .env.local the same way Next.js does (E2E_LOGIN_ID / E2E_PASSWORD live there, never in git).
loadEnvConfig(process.cwd());

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
export const AUTH_FILE = 'e2e/.auth/admin.json';

/**
 * Projects:
 *  setup     – logs in once through the real login screen and saves the session.
 *  readonly  – default (`npm run test:e2e`): reads data, never changes it.
 *  mutation  – `npm run test:e2e:mutation`: creates/edits/deletes ONLY HW3-Pranesh-* records, then cleans up.
 *  screenshots – `npm run screenshots`: read-only, every screen at 1920/1440/1366/768/375, light and dark.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'readonly',
      testIgnore: /\.mutation\.spec\.ts$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: AUTH_FILE },
    },
    {
      name: 'screenshots',
      testMatch: /.capture.ts$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
    },
    {
      name: 'mutation',
      testMatch: /\.mutation\.spec\.ts$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: AUTH_FILE },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
