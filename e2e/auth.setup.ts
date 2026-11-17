import { test as setup, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, loginThroughUi, requireAdminCredentials } from "./helpers";

// Logs in once through the real login page (shared QA admin from .env.local) and saves the session
// (cookie + localStorage, "Auto login" ticked) so every "chromium" spec starts signed in.
setup("admin login", async ({ page }) => {
  setup.setTimeout(180_000);
  const credentials = requireAdminCredentials();

  await page.goto("/login");
  await loginThroughUi(page, credentials);

  await expect(page.getByText("관리자 권한이 없습니다."), "the E2E account is not an HQ admin").toHaveCount(0);
  await expect(page).toHaveURL(/\/shopping-mall\//, { timeout: 60_000 });
  await expect(page.getByRole("navigation", { name: "주 메뉴" })).toBeVisible({ timeout: 60_000 });

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
