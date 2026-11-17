import { test, expect, type Page } from "@playwright/test";
import { LIST_URL, watchConsole } from "./products-helpers";

// Product details (tabs) against the REAL QA API, signed in with the saved admin session.
// READ-ONLY. Fails on any console error / warning.

const firstRowLink = (page: Page) => page.locator(".product-table tbody tr").first().getByRole("link");
const panel = (page: Page) => page.getByRole("tabpanel");

/** Opens the list (optionally with a query) and returns the first product's name + details URL. */
async function firstProduct(page: Page, query = ""): Promise<{ name: string; href: string }> {
  await page.goto(`${LIST_URL}${query}`);
  await expect(firstRowLink(page)).toBeVisible({ timeout: 30_000 });
  const name = ((await firstRowLink(page).textContent()) ?? "").trim();
  const href = (await firstRowLink(page).getAttribute("href")) ?? "";
  expect(href).toMatch(/\/shopping-mall\/products\/details\/\d+$/);
  return { name, href };
}

test.describe("Product details (live QA API, read-only)", () => {
  let assertCleanConsole: () => void;
  test.beforeEach(({ page }) => {
    assertCleanConsole = watchConsole(page);
  });
  test.afterEach(() => assertCleanConsole());

  test("opens from the list on the Overview tab", async ({ page }) => {
    const { name } = await firstProduct(page);
    await firstRowLink(page).click();
    await expect(page).toHaveURL(/\/details\/\d+$/);
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: "상품 정보" })).toHaveAttribute("aria-selected", "true");
    await expect(panel(page).getByRole("heading", { name: "기본 정보" })).toBeVisible();
    await expect(panel(page).getByText(name).first()).toBeVisible();
  });

  test("tabs switch, update ?tab= and survive a reload; arrow keys move between tabs", async ({ page }) => {
    const { href } = await firstProduct(page);
    await page.goto(href);
    await expect(panel(page).getByRole("heading", { name: "기본 정보" })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("tab", { name: "옵션" }).click();
    await expect(page).toHaveURL(/\?tab=options$/);
    await expect(page.getByRole("tab", { name: "옵션" })).toHaveAttribute("aria-selected", "true");
    await expect(
      panel(page).getByRole("heading", { name: /옵션 \d+번|옵션 없음/ }).first(),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("tab", { name: "동일 카테고리 상품" }).click();
    await expect(page).toHaveURL(/\?tab=related$/);
    await expect(
      panel(page).locator(".related-products").or(panel(page).getByRole("heading", { name: /다른 상품이 없습니다|소분류가 지정되지 않았습니다/ })),
    ).toBeVisible({ timeout: 30_000 });

    await page.reload();
    await expect(page.getByRole("tab", { name: "동일 카테고리 상품" })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("tab", { name: "동일 카테고리 상품" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(/\?tab=options$/);
    await expect(page.getByRole("tab", { name: "옵션" })).toBeFocused();
  });

  test("Back to list returns to the list the user came from", async ({ page }) => {
    await firstProduct(page, "?limit=20");
    await firstRowLink(page).click();
    await expect(page).toHaveURL(/\/details\/\d+$/);
    await page.getByRole("link", { name: "목록으로" }).first().click();
    await expect(page).toHaveURL(/\/shopping-mall\/products\?limit=20$/);
  });
});

test.describe("Product details — not found (live QA API)", () => {
  let assertCleanConsole: () => void;
  // The API answers 400 productNotFound on purpose here; the browser logs that failed request
  test.beforeEach(({ page }) => {
    assertCleanConsole = watchConsole(page, { allowFailedApiCalls: true });
  });
  test.afterEach(() => assertCleanConsole());

  test("an unknown id and a non-numeric id show the not-found state", async ({ page }) => {
    await page.goto("/shopping-mall/products/details/999999999");
    await expect(page.getByRole("heading", { name: "상품을 찾을 수 없습니다" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "목록으로" })).toBeVisible();

    await page.goto("/shopping-mall/products/details/abc");
    await expect(page.getByRole("heading", { name: "상품을 찾을 수 없습니다" })).toBeVisible();
    await expect(page.getByRole("link", { name: "수정", exact: true })).toHaveCount(0);
  });
});
