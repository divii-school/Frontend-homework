import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The QA login for the tests is read from .env.local (never committed). See .env.example.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Test your local code by default. Set PLAYWRIGHT_BASE_URL to point the suite at the deployed build.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
export const STORAGE_STATE = "playwright/.auth/admin.json";

const signedIn = { ...devices["Desktop Chrome"], storageState: STORAGE_STATE };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    reducedMotion: "reduce",
    // The dev server compiles a page on its first visit, which can take a while.
    navigationTimeout: 90_000,
  },
  projects: [
    // Logs in once through the real login screen and saves the session for the other projects.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Default run: read-only tests. They never create, change or delete data on the shared QA server.
    {
      name: "chromium",
      use: signedIn,
      dependencies: ["setup"],
      testIgnore: ["**/*.mutation.spec.ts", "**/screenshots.spec.ts"],
    },
    // Create / edit / delete tests (npm run test:e2e:mutation). They only touch records named HW3-Sachin-…
    // and remove what they created. Tell the team before running them on the shared QA server.
    { name: "mutation", use: signedIn, dependencies: ["setup"], testMatch: ["**/*.mutation.spec.ts"] },
    // Screens at 1440 / 768 / 375 in light and dark for the submission (npm run screenshots). Read-only.
    { name: "screenshots", use: signedIn, dependencies: ["setup"], testMatch: ["**/screenshots.spec.ts"] },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000/auth/login", reuseExistingServer: true, timeout: 180_000 },
});
