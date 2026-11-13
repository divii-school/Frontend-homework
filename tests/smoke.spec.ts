import { test, expect } from "@playwright/test";

test("root sends a logged-out user to the login page with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2Fshopping%2Fproducts$/);
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  expect(errors).toEqual([]);
});
