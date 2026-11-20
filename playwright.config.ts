import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// E2E_LOGIN_ID / E2E_PASSWORD for the *.real.spec.ts files come from .env.local (never committed).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3003;
// PLAYWRIGHT_BASE_URL=https://… runs the suites against a deployed app instead of the dev server.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const IS_LOCAL = BASE_URL.includes("localhost");

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    // Default run: read-only specs. Mutation specs (create / edit / delete) run only on request.
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: ["**/*.mutation.spec.ts"] },
    { name: "mutation", use: { ...devices["Desktop Chrome"] }, testMatch: ["**/*.mutation.spec.ts"] },
  ],
  webServer: IS_LOCAL
    ? { command: "npm run dev", url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 180_000 }
    : undefined,
});
