import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./helpers";

// Read-only. Two rules that hold for every screen: the browser console stays clean, and the page never
// scrolls sideways at any WM width.
const WM_WIDTHS = [1920, 1600, 1440, 1366, 1280, 1024, 991, 768, 640, 480, 375];

/** How many pixels the page is wider than the window. 0 means no sideways scroll. */
const sidewaysOverflow = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.locator(".state-block-loading").waitFor({ state: "detached" }).catch(() => undefined);
}

/**
 * Open a URL. WebKit sometimes reports "interrupted by another navigation" when the page being left is still
 * finishing a client-side URL update; the second attempt starts from a quiet page.
 */
async function visit(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url);
  } catch (error) {
    if (!String(error).includes("interrupted by another navigation")) throw error;
    await page.waitForLoadState("networkidle");
    await page.goto(url);
  }
  await settle(page);
}

/** The signed-in screens, with one real product id taken from the list. */
async function signedInScreens(page: Page): Promise<string[]> {
  await page.goto("/products");
  await settle(page);
  const details = (await page.locator(".p-datatable-tbody .data-table-link").first().getAttribute("href")) ?? "/products/20000";
  return [
    "/products",
    "/products?search=zzzz-no-such-product-qq",
    details,
    `${details}?tab=category`,
    `${details}?tab=related`,
    `${details}/edit`,
    "/products/create",
    "/products/create?step=price",
    "/products/create?step=category",
    "/products/create?step=media",
    "/categories",
  ];
}

test("no console error or warning on any signed-in screen", async ({ page }) => {
  test.setTimeout(240_000);
  const problems = watchConsole(page);
  for (const url of await signedInScreens(page)) {
    await visit(page, url);
  }
  // Open every category row: the largest amount of markup the app draws
  await page.getByRole("button", { name: "모두 펼치기" }).click();
  expect(problems).toEqual([]);
});

test("no sideways page scroll on any signed-in screen from 1920 to 375", async ({ page }) => {
  test.setTimeout(300_000);
  const failures: string[] = [];
  for (const url of await signedInScreens(page)) {
    await visit(page, url);
    for (const width of WM_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await sidewaysOverflow(page);
      if (overflow > 0) failures.push(`${url} at ${width}px: ${overflow}px too wide`);
    }
  }
  expect(failures).toEqual([]);
});

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login screen: clean console and no sideways scroll, with the error messages showing", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByText("아이디를 입력해 주세요.")).toBeVisible();
    for (const width of WM_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      expect(await sidewaysOverflow(page), `login at ${width}px`).toBe(0);
    }
    expect(problems).toEqual([]);
  });
});
