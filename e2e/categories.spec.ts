import { test, expect } from "@playwright/test";
import { watchConsole } from "./categories.helpers";
import { checkDeleteBlocked, checkExpandCollapse, checkFormValidation, checkSearch, checkTreeRenders, countWrites } from "./categories.flows";

// 8.2.0 Product Category Management against the REAL QA API, READ-ONLY.
// Starts signed in (saved admin session from auth.setup.ts). Nothing is saved: every test checks
// that no POST / PUT / DELETE reached the category API, and fails on console errors / warnings.
// The same steps also run against the in-memory API in categories-states.spec.ts.

let problems: string[] = [];
let writes: { count: number } = { count: 0 };

test.beforeEach(async ({ page }) => {
  problems = watchConsole(page);
  writes = countWrites(page);
});

test.afterEach(() => {
  expect(writes.count, "category writes sent by a read-only test").toBe(0);
  expect(problems, "console errors / warnings").toEqual([]);
});

test.describe("Product categories — QA API (read-only)", () => {
  test("page title, breadcrumb and the tree render", async ({ page }) => {
    await checkTreeRenders(page);
  });

  test("search finds an existing name; gibberish shows 'No search results found'", async ({ page }) => {
    await checkSearch(page);
  });

  test("Expand all / Collapse all and a single chevron", async ({ page }) => {
    await checkExpandCollapse(page);
  });

  test("add dialog refuses empty / spaces-only / 51-character names without saving", async ({ page }) => {
    await checkFormValidation(page);
  });

  test("deleting a category that has subcategories is blocked before any request", async ({ page }) => {
    await checkDeleteBlocked(page);
  });
});
