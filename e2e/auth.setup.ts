import { expect, test as setup } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";
import { login } from "./helpers";

// Runs before the other projects: one real login, saved to a file, so every test starts signed in.
setup("log in as the QA admin", async ({ page }) => {
  await page.goto("/auth/login");
  await login(page);
  await expect(page.getByRole("heading", { level: 1, name: "상품 관리" })).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
