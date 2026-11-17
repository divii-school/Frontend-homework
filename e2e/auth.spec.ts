import { test, expect } from "@playwright/test";
import { sanitizeReturnTo } from "../src/utils/session";
import { loginForm, loginThroughUi, requireAdminCredentials } from "./helpers";

// Login, protected routes, returnTo and logout (design 1.1.0). Runs in the "guest" project:
// a fresh browser without a saved session. Tests marked "QA API" need the QA server + .env.local login.

test.describe("Login page (no API)", () => {
  test("shows the design fields; Login stays disabled until ID and password are filled", async ({ page }) => {
    await page.goto("/login");
    const form = loginForm(page);
    await expect(page.getByRole("heading", { name: "TalkingClub Admin login" })).toBeAttached();
    await expect(form.id).toBeVisible();
    await expect(form.password).toHaveAttribute("type", "password");
    await expect(form.remember).toBeChecked();
    await expect(form.submit).toBeDisabled();

    await form.id.fill("someone");
    await expect(form.submit).toBeDisabled();
    await form.password.fill("secret");
    await expect(form.submit).toBeEnabled();

    // An ID of only spaces does not count
    await form.id.fill("   ");
    await expect(form.submit).toBeDisabled();
  });

  test("touched empty fields show validation messages", async ({ page }) => {
    await page.goto("/login");
    const form = loginForm(page);
    await form.id.click();
    await form.password.click();
    await expect(page.getByText("Please enter your ID.")).toBeVisible();
    await expect(form.id).toHaveAttribute("aria-invalid", "true");

    await form.id.click();
    await expect(page.getByText("Please enter your password.")).toBeVisible();

    await form.id.fill("someone");
    await expect(page.getByText("Please enter your ID.")).toHaveCount(0);
  });

  test("the eye button shows and hides the password", async ({ page }) => {
    await page.goto("/login");
    const form = loginForm(page);
    await form.password.fill("secret");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(form.password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(form.password).toHaveAttribute("type", "password");
  });

  test("a protected route redirects to /login with returnTo (path + query)", async ({ page }) => {
    await page.goto("/shopping-mall/products?page=2");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping-mall%2Fproducts%3Fpage%3D2$/);
    await expect(loginForm(page).id).toBeVisible();
  });

  test("returnTo only accepts same-site relative paths", () => {
    expect(sanitizeReturnTo("/shopping-mall/products?page=2")).toBe("/shopping-mall/products?page=2");
    expect(sanitizeReturnTo("//evil.example.com")).toBeNull();
    expect(sanitizeReturnTo("%2F%2Fevil.example.com")).toBeNull();
    expect(sanitizeReturnTo("https://evil.example.com")).toBeNull();
    expect(sanitizeReturnTo("/\\evil.example.com")).toBeNull();
    expect(sanitizeReturnTo("/login?returnTo=/x")).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
  });
});

test.describe("Login with the QA API", () => {
  test.setTimeout(120_000);

  test("an unknown ID shows the API message", async ({ page }) => {
    await page.goto("/login");
    await loginThroughUi(page, { id: "HW3-Neeraj-no-such-user", password: "not-a-real-password" });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("This account is not registered.");
    await dialog.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("This ID is not registered.")).toBeVisible();
  });

  test("a wrong password shows the API message", async ({ page }) => {
    const { id } = requireAdminCredentials();
    await page.goto("/login");
    await loginThroughUi(page, { id, password: "HW3-Neeraj-wrong-password" });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("The ID and password do not match");
    await dialog.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("The password does not match.")).toBeVisible();
    await expect(loginForm(page).password).toBeFocused();
  });

  test("after login the user comes back to the protected URL (returnTo)", async ({ page }) => {
    const credentials = requireAdminCredentials();
    await page.goto("/shopping-mall/products?page=2");
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await loginThroughUi(page, credentials);
    await expect(page).toHaveURL(/\/shopping-mall\/products\?page=2$/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Product Management", level: 1 })).toBeVisible();
  });

  test("logout clears the session and protects routes again", async ({ page }) => {
    const credentials = requireAdminCredentials();
    await page.goto("/login");
    await loginThroughUi(page, credentials);
    await expect(page).toHaveURL(/\/shopping-mall\//, { timeout: 60_000 });

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/shopping-mall/products");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping-mall%2Fproducts$/);
  });
});
