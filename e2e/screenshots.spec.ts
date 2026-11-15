import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";

// Read-only. Takes every screen at 1440 / 768 / 375 in light and dark for the submission page
// (npm run screenshots). Files land in docs/screenshots/<theme>/<width>-<screen>.png.
const WIDTHS = [1440, 768, 375];
const THEMES = ["day", "night"] as const;
const OUT = "docs/screenshots";

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
      const shot = async (name: string) => {
        await settle(page);
        await page.screenshot({ path: `${OUT}/${theme}/${width}-${name}.png`, fullPage: true });
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
      await page.getByRole("button", { name: "대분류 등록" }).click();
      await shot("category-dialog");

      await page.goto("/no-such-page");
      await shot("404");

      // Login screen: needs a signed-out context
      const guest = await page.context().browser()!.newContext({ viewport: { width, height: 900 }, storageState: { cookies: [], origins: [] } });
      await guest.addInitScript((value) => window.localStorage.setItem("tc_admin_theme", value), theme);
      const loginPage = await guest.newPage();
      await loginPage.goto(`${test.info().project.use.baseURL}/auth/login`);
      await loginPage.getByRole("button", { name: "로그인" }).click();
      await loginPage.screenshot({ path: `${OUT}/${theme}/${width}-login.png`, fullPage: true });
      await guest.close();
    });
  }
}
