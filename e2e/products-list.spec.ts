import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import { LIST_URL, readTotal, watchConsole } from "./products-helpers";

// 8.1.0 Product list against the REAL QA API, signed in with the saved admin session (auth.setup.ts).
// READ-ONLY: nothing is created, edited or deleted here (bulk delete is covered by the form agent's
// *.mutation.spec.ts on its own HW3-Neeraj- records). Fails on any console error / warning.

let assertCleanConsole: () => void;

test.beforeEach(({ page }) => {
  assertCleanConsole = watchConsole(page);
});

test.afterEach(() => assertCleanConsole());

const rows = (page: Page) => page.locator(".product-table tbody tr");
const noResults = (page: Page) => page.getByRole("heading", { name: "No products found" });

/** Opens the list and waits until the first rows (or the empty state) are on screen. */
async function openList(page: Page, query = "") {
  await page.goto(`${LIST_URL}${query}`);
  await expect(page.getByRole("heading", { name: "Product Management", level: 1 })).toBeVisible();
  await expect(rows(page).first().or(noResults(page))).toBeVisible({ timeout: 30_000 });
}

/** Waits until the table shows the new result (the old rows stay dimmed while the next one loads). */
async function waitForSettled(page: Page) {
  await expect(page.locator(".product-table-box.is-busy")).toHaveCount(0, { timeout: 30_000 });
  await expect(rows(page).first().or(noResults(page))).toBeVisible({ timeout: 30_000 });
}

test.describe("Product list (live QA API, read-only)", () => {
  test("shows the title, the total and up to 10 rows", async ({ page }) => {
    await openList(page);
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    expect(await readTotal(page)).toBeGreaterThan(0);
    const count = await rows(page).count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);
    await expect(rows(page).first().getByRole("link")).toHaveAttribute("href", /\/shopping-mall\/products\/details\/\d+$/);
  });

  test("search narrows the result; gibberish shows the empty state", async ({ page }) => {
    await openList(page);
    const totalBefore = await readTotal(page);
    const term = ((await rows(page).first().getByRole("link").textContent()) ?? "").trim();
    expect(term.length).toBeGreaterThan(0);

    await page.getByLabel("Search term").fill(term);
    await page.getByLabel("Search term").press("Enter");
    await expect(page).toHaveURL(/[?&]q=/);
    await waitForSettled(page);
    expect(await readTotal(page)).toBeLessThanOrEqual(totalBefore);
    await expect(rows(page).first().getByRole("link")).toContainText(term, { ignoreCase: true });

    await page.getByLabel("Search term").fill(`zzqx-hw3-no-such-product-${Date.now()}`);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(noResults(page)).toBeVisible({ timeout: 30_000 });
    expect(await readTotal(page)).toBe(0);
  });

  test("paging, page size and a filter live in the URL and survive a reload", async ({ page }) => {
    await openList(page);
    test.skip((await readTotal(page)) <= 10, "needs more than one page of products");

    await page.getByRole("button", { name: "Page 2", exact: true }).click();
    await expect(page).toHaveURL(/\?page=2$/);
    await waitForSettled(page);
    await page.reload();
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(page.getByRole("button", { name: "Page 2", exact: true })).toHaveClass(/p-highlight/);

    // A filter change starts again at page 1
    await page.getByLabel("Product type").selectOption("MAIN");
    await expect(page).toHaveURL(/\?productType=MAIN$/);
    await page.getByLabel("Rows per page").selectOption("20");
    await expect(page).toHaveURL(/\?limit=20&productType=MAIN$/);
    await waitForSettled(page);
    expect(await rows(page).count()).toBeLessThanOrEqual(20);

    await page.reload();
    await expect(page.getByLabel("Product type")).toHaveValue("MAIN");
    await expect(page.getByLabel("Rows per page")).toHaveValue("20");
  });

  test("sort header sets aria-sort and the URL (current page only)", async ({ page }) => {
    await openList(page);
    const header = page.getByRole("columnheader", { name: "Product Name" });
    await expect(header).toHaveAttribute("aria-sort", "none");

    await header.getByRole("button").click();
    await expect(page).toHaveURL(/sort=name&order=asc/);
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect(page.getByText("Sorted within this page")).toBeVisible();
    const names = (await rows(page).locator(".col-name").allTextContents()).map((name) => name.trim());
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "ko", { numeric: true, sensitivity: "base" }));
    expect(names).toEqual(sorted);

    await header.getByRole("button").click();
    await expect(page).toHaveURL(/sort=name&order=desc/);
    await page.reload();
    await expect(page.getByRole("columnheader", { name: "Product Name" })).toHaveAttribute("aria-sort", "descending");
  });

  test("ticking rows shows the selection bar; Clear empties it", async ({ page }) => {
    await openList(page);
    const bar = page.locator(".product-selection-bar");
    const firstName = ((await rows(page).first().getByRole("link").textContent()) ?? "").trim();

    await page.getByRole("checkbox", { name: `Select ${firstName}` }).first().check();
    await expect(bar).toContainText("1 selected");

    const count = await rows(page).count();
    await page.getByRole("checkbox", { name: "Select all products on this page" }).check();
    await expect(bar).toContainText(`${count} selected`);

    await bar.getByRole("button", { name: "Clear" }).click();
    await expect(bar).not.toContainText("selected");
    await expect(page.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  test("Export CSV downloads the filtered result with the right header", async ({ page }) => {
    await openList(page);
    // Narrow the result to keep the export to one or two requests
    const term = ((await rows(page).first().getByRole("link").textContent()) ?? "").trim();
    await page.getByLabel("Search term").fill(term);
    await page.getByLabel("Search term").press("Enter");
    // The table only turns busy once the URL holds the term (router.replace is async); without this
    // wait the unfiltered total was read on the live API (2026-11-16: expected 1711, CSV had 1 row)
    await expect(page).toHaveURL(/[?&]q=/);
    await waitForSettled(page);
    const total = await readTotal(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^products-\d{8}-\d{4}\.csv$/);

    const text = await readFile(await download.path(), "utf8");
    expect(text.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM for Excel
    const lines = text.slice(1).trim().split("\r\n");
    expect(lines[0]).toBe("ID,Product code,Product name,List price,Selling price,Category path,Visible,On sale,Registered at");
    expect(lines.length - 1).toBe(total);
  });
});
