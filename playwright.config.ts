import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The QA login for the tests is read from .env.local (never committed). See .env.example.
// A value already set in the shell wins. Read by hand so it works on every Node 20 release.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

// Test your local code by default. Set PLAYWRIGHT_BASE_URL to point the suite at the deployed build.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
export const STORAGE_STATE = "playwright/.auth/admin.json";

const signedIn = { ...devices["Desktop Chrome"], storageState: STORAGE_STATE };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // The shared QA API now and then gives no answer. Read-only tests get one more attempt (see `retries` on the
  // projects below); the tests that write data never repeat, because a repeat would create records twice.
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 30_000 },
  // The JSON file is read by `npm run report:check`, which says whether the HTML report may be attached.
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    reducedMotion: "reduce",
    // The dev server compiles a page on its first visit, which can take a while.
    navigationTimeout: 90_000,
  },
  projects: [
    // Logs in once through the real login screen and saves the session for the other projects.
    { name: "setup", testMatch: /auth\.setup\.ts/, retries: 2 },
    // Default run: read-only tests. They never create, change or delete data on the shared QA server.
    {
      name: "chromium",
      use: signedIn,
      retries: 1,
      dependencies: ["setup"],
      testIgnore: ["**/*.mutation.spec.ts", "**/screenshots.spec.ts"],
    },
    // The same read-only tests on WebKit, the engine of Safari (npm run test:e2e:webkit).
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], storageState: STORAGE_STATE },
      retries: 1,
      dependencies: ["setup"],
      testIgnore: ["**/*.mutation.spec.ts", "**/screenshots.spec.ts"],
    },
    // Create / edit / delete tests (npm run test:e2e:mutation). They only touch records named HW3-Sachin-…
    // and remove what they created. Tell the team before running them on the shared QA server.
    { name: "mutation", use: signedIn, dependencies: ["setup"], testMatch: ["**/*.mutation.spec.ts"] },
    // Screens at 1920 / 1440 / 1366 / 768 / 375 in light and dark for the submission (npm run screenshots). Read-only.
    { name: "screenshots", use: signedIn, retries: 1, dependencies: ["setup"], testMatch: ["**/screenshots.spec.ts"] },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000/auth/login", reuseExistingServer: true, timeout: 180_000 },
});
