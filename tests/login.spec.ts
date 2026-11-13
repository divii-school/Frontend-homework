import { test, expect } from "@playwright/test";

// Read-only: these tests never log in successfully and never change QA data.

test.describe("login", () => {
  test("protected page redirects to login and keeps the full return path", async ({ page }) => {
    await page.goto("/shopping/products?page=2&sort=name");
    await expect(page).toHaveURL("/login?next=%2Fshopping%2Fproducts%3Fpage%3D2%26sort%3Dname");
  });

  test("login button stays disabled until ID and password are both filled", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByRole("button", { name: "Log in" });
    await expect(submit).toBeDisabled();

    await page.getByLabel("ID").fill("someone");
    await expect(submit).toBeDisabled();

    await page.getByLabel("Password", { exact: true }).fill("x");
    await expect(submit).toBeEnabled();

    await page.getByLabel("ID").fill("   ");
    await expect(submit).toBeDisabled();
  });

  test("password visibility toggle", async ({ page }) => {
    await page.goto("/login");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("secret");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("wrong ID/password shows the API error and keeps the user on the form", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("ID").fill("HW3-Sandip-no-such-user");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-1");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("The ID and password do not match. Please check and try again.");
    await expect(page.getByLabel("ID")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/login/);

    // Typing again clears the error.
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-2");
    await expect(page.locator("form").getByRole("alert")).toHaveText("");
  });
});
