// Runs one guarded Playwright project:
//   npm run test:e2e:mutation  ->  node scripts/run-guarded.mjs mutation E2E_ALLOW_WRITES
//   npm run screenshots        ->  node scripts/run-guarded.mjs screenshots E2E_SCREENSHOTS
// The mutation tests write to the shared QA server and the screenshot run rewrites docs/screenshots, so both skip
// themselves unless their variable is "yes". A plain `npx playwright test` therefore does neither by accident.
// This script sets the variable for one run, the same way on Windows, macOS and Linux, and passes on extra arguments.
import { spawnSync } from "node:child_process";

const [project, variable, ...rest] = process.argv.slice(2);
if (!project || !variable) {
  console.error("Usage: node scripts/run-guarded.mjs <project> <VARIABLE> [playwright arguments]");
  process.exit(2);
}

const result = spawnSync("npx", ["playwright", "test", `--project=${project}`, ...rest], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, [variable]: "yes" },
});
process.exit(result.status ?? 1);
