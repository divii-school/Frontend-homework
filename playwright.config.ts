import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { ADMIN_STORAGE_STATE } from "./e2e/helpers";

// Same conventions as HW2 / the Talking Club admin repo:
//  - .env.local is loaded here (NEXT_PUBLIC_API_BASE_URL, E2E_ADMIN_ID, E2E_ADMIN_PASSWORD) — never printed
//  - PLAYWRIGHT_BASE_URL overrides the target (default: local dev server, auto-started)
//  - login happens once in e2e/auth.setup.ts; specs in the "chromium" project start signed in
//  - auth.spec.ts / roles.spec.ts run in "guest" (fresh browser, no saved session)
//  - *.mutation.spec.ts (create / edit / delete on the shared QA DB) only run with E2E_ALLOW_MUTATIONS=1
loadEnv({ path: ".env.local", quiet: true });

// Opt-in E2E_MAP_3000_TO=<port>. It is NOT needed for the image upload any more: the browser posts the file to the
// app's own route /api/upload and the server sends it to S3, so the S3 bucket CORS (which allows only the origin
// http://localhost:3000) does not matter. The option is kept for the case that a test needs the origin
// http://localhost:3000 while port 3000 is busy: start the app yourself on <port>; the browser opens
// http://localhost:3000 but Chromium connects to 127.0.0.1:<port>, so the app on the real port 3000 is never
// contacted. No webServer is started. Only browser traffic is mapped: never call `request` / `page.request` with
// a relative URL in this mode (that runs in Node and would reach port 3000).
const MAP_3000_TO = (process.env.E2E_MAP_3000_TO ?? "").trim();
if (MAP_3000_TO && !/^\d{2,5}$/.test(MAP_3000_TO)) {
  throw new Error("E2E_MAP_3000_TO must be a port number, for example 3100.");
}
const MAPPED_LAUNCH = MAP_3000_TO
  ? { launchOptions: { args: [`--host-resolver-rules=MAP localhost:3000 127.0.0.1:${MAP_3000_TO}`] } }
  : {};

const BASE_URL = MAP_3000_TO ? "http://localhost:3000" : process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ALLOW_MUTATIONS = process.env.E2E_ALLOW_MUTATIONS === "1";
const GUEST_SPECS = /(auth|roles)\.spec\.ts$/;
// *-states.spec.ts mock every API call and inject their own session → no real login needed,
// so they still run (and stay green) when the QA API is down.
const MOCKED_SPECS = /-states\.spec\.ts$/;
const MUTATION_SPECS = /\.mutation\.spec\.ts$/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...MAPPED_LAUNCH,
  },
  // Start `npm run dev` automatically when testing locally (not with PLAYWRIGHT_BASE_URL or E2E_MAP_3000_TO)
  webServer: process.env.PLAYWRIGHT_BASE_URL || MAP_3000_TO
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000/login",
        reuseExistingServer: true,
        timeout: 180_000,
      },
  projects: [
    // setup depends on guest: the QA API keeps ONE live session per account and the guest "QA API" tests
    // log in / out with the same admin, which revokes any token saved earlier. Order = guest, setup, chromium,
    // so a plain `npm run test:e2e` stays green (running --project=setup alone now runs guest first).
    { name: "setup", testMatch: /auth\.setup\.ts$/, use: { ...devices["Desktop Chrome"] }, dependencies: ["guest"] },
    {
      name: "guest",
      testMatch: GUEST_SPECS,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mocked",
      testMatch: MOCKED_SPECS,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts$/,
      testIgnore: ALLOW_MUTATIONS
        ? [GUEST_SPECS, MOCKED_SPECS]
        : [GUEST_SPECS, MOCKED_SPECS, MUTATION_SPECS],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
});
