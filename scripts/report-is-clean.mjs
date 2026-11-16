// Says whether the HTML report of the last Playwright run may be handed to QA (npm run report:check).
//
// A failed attempt stores a snapshot of the page and a trace of the network calls. If that attempt was on the
// login screen, they contain the typed login. So a report is attached only when every test passed at the
// first attempt: such a report has no snapshot and no trace in it.
import { existsSync, readFileSync } from "node:fs";

const RESULTS = "test-results/results.json";

if (!existsSync(RESULTS)) {
  console.error(`No ${RESULTS}. Run the tests first (npm run test:e2e).`);
  process.exit(1);
}

const { stats } = JSON.parse(readFileSync(RESULTS, "utf8"));
const clean = stats.unexpected === 0 && stats.flaky === 0;

if (clean) {
  console.log(`Report is clean: ${stats.expected} passed, none failed, none needed a retry. It may be attached.`);
} else {
  console.error(
    `Do NOT attach this report: ${stats.unexpected} failed, ${stats.flaky} passed only on a retry. ` +
      "A failed attempt can store the typed login. Run the tests again until this check passes.",
  );
}
process.exit(clean ? 0 : 1);
