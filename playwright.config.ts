import { defineConfig, devices } from '@playwright/test';

/**
 * Logins come from env only (never committed):
 *   E2E_LOGIN_ID=... E2E_PASSWORD=... npm run test:e2e
 * Read-only specs: npm run test:e2e
 * Mutation specs (*.mutation.spec.ts, create + delete own HW3-Saswat- records): npm run test:e2e:mutation
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: { baseURL, trace: 'retain-on-failure', locale: 'ko-KR' },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-375', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } }, grep: /@responsive/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm run start -- -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
