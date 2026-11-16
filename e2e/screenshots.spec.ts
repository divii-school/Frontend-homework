import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";

// Read-only. Takes every screen at 1920 / 1440 / 1366 / 768 / 375 in light and dark for the submission page
// (npm run screenshots). Files land in docs/screenshots/<theme>/<width>-<screen>.png.
const WIDTHS = [1920, 1440, 1366, 768, 375];
const THEMES = ["day", "night"] as const;
const OUT = "docs/screenshots";

// Rewrites docs/screenshots, so it runs only through `npm run screenshots`, never with a plain `npx playwright test`.
test.skip(process.env.E2E_SCREENSHOTS !== "yes", "Rewrites docs/screenshots: run with npm run screenshots");

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.locator(".state-block-loading").waitFor({ state: "detached" }).catch(() => undefined);
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`screens at ${width}px, ${theme}`, async ({ page, context }) => {
      test.setTimeout(240_000);
      mkdirSync(`${OUT}/${theme}`, { recursive: true });
      await context.addInitScript((value) => window.localStorage.setItem("tc_admin_theme", value), theme);
      await page.setViewportSize({ width, height: 900 });
      // Whole page by default. A dialog is taken as the window shows it: its dimmed backdrop covers the window, not the page.
      const shot = async (name: string, fullPage = true) => {
        await settle(page);
        await page.screenshot({ path: `${OUT}/${theme}/${width}-${name}.png`, fullPage });
      };

      await page.goto("/products");
      await shot("product-list");
      const firstId = await page.locator(".p-datatable-tbody .data-table-link").first().getAttribute("href");

      await page.goto("/products?search=zzzz-no-such-product-qq");
      await shot("product-list-empty");

      await page.goto(firstId ?? "/products/20000");
      await shot("product-details");
      await page.goto(`${firstId ?? "/products/20000"}?tab=related`);
      await shot("product-details-related");

      await page.goto("/products/create");
      await shot("product-form-step1");
      await page.getByRole("button", { name: "다음" }).click();
      await shot("product-form-step1-errors");
      await page.goto("/products/create?step=media");
      await shot("product-form-step4");

      await page.goto("/categories");
      await settle(page);
      await page.getByRole("button", { name: "모두 펼치기" }).click();
      await shot("category-list");
      await page.getByRole("button", { name: "모두 접기" }).click();
      await page.locator(".category-row-category").first().getByRole("button", { name: /중분류 추가/ }).click();
      await shot("category-dialog", false);

      await page.goto("/no-such-page");
      await shot("404");

      // Login screen: needs a signed-out context
      const guest = await page.context().browser()!.newContext({ viewport: { width, height: 900 }, storageState: { cookies: [], origins: [] } });
      await guest.addInitScript((value) => window.localStorage.setItem("tc_admin_theme", value), theme);
      const loginPage = await guest.newPage();
      await loginPage.goto(`${test.info().project.use.baseURL}/auth/login`);
      await loginPage.getByRole("button", { name: "로그인" }).click({ timeout: 60_000 });
      await loginPage.screenshot({ path: `${OUT}/${theme}/${width}-login.png`, fullPage: true });
      await guest.close();
    });
  }
}
