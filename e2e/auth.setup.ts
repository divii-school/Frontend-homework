import { expect, test as setup } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";
import { login } from "./helpers";

// Runs before the other projects: one real login, saved to a file, so every test starts signed in.
setup("log in as the QA admin", async ({ page }) => {
  setup.setTimeout(300_000);
  await page.goto("/auth/login");
  await login(page);
  await expect(page.getByRole("heading", { level: 1, name: "상품 관리" })).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });

  // The dev server compiles a page the first time it is opened, which can take longer than a test waits.
  // Opening every route once here means no later test pays for that. (A production build needs no warm-up.)
  const details = (await page.locator(".p-datatable-tbody .data-table-link").first().getAttribute("href")) ?? "/products/20000";
  for (const [url, heading] of [
    ["/categories", "상품 카테고리 관리"],
    ["/products/create", "상품 등록"],
    [details, "상품 상세"],
    [`${details}/edit`, "상품 수정"],
  ]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible({ timeout: 90_000 });
  }
});
