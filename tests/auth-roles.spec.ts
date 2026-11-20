import { test, expect } from "@playwright/test";
import { envelope, fakeSession } from "./helpers/session";

// Read-only: login / logout / API calls are mocked with the response shapes captured from the QA server (2026-11-16).

const loginOk = (role: string) =>
  envelope({ token: "test-token", user: { id: 7, fullName: "HW3 Tester", role, permissions: [] } }, 201, "loginSuccess");

test.describe("login, roles and session expiry", () => {
  test("successful login stores the session and returns to ?next", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => route.fulfill({ status: 201, contentType: "application/json", body: loginOk("SUPER_ADMIN") }));
    await page.route("**/api/v1/product-category/list**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: envelope([]) }));

    await page.goto("/shopping/categories?search=abc");
    await expect(page).toHaveURL("/login?next=%2Fshopping%2Fcategories%3Fsearch%3Dabc");
    await page.getByLabel("ID").fill("someone");
    await page.getByLabel("Password", { exact: true }).fill("secret");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/shopping/categories?search=abc");
    await expect(page.getByRole("banner")).toContainText("HW3 Tester");
  });

  test("an account without an admin role gets the no-permission popup and stays logged out", async ({ page }) => {
    let loggedOutServerSide = false;
    await page.route("**/api/v1/auth/login", (route) => route.fulfill({ status: 201, contentType: "application/json", body: loginOk("STUDENT") }));
    await page.route("**/api/v1/auth/logout", (route) => {
      loggedOutServerSide = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: envelope({}) });
    });

    await page.goto("/login");
    await page.getByLabel("ID").fill("student");
    await page.getByLabel("Password", { exact: true }).fill("secret");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("dialog")).toContainText("You don't have admin permission.");
    await expect(page).toHaveURL("/login");
    expect(loggedOutServerSide).toBe(true);
    expect(await page.evaluate(() => sessionStorage.getItem("tc-admin-auth") ?? localStorage.getItem("tc-admin-auth"))).toBeNull();
  });

  test("GENERAL_ADMIN: category page is not in the menu and its URL shows 403", async ({ page }) => {
    await fakeSession(page, "GENERAL_ADMIN");
    await page.goto("/shopping/products");
    const menu = page.getByRole("complementary", { name: "Main menu" });
    await expect(menu.getByRole("link", { name: "Product Management", exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Product Category Management" })).toHaveCount(0);

    await page.goto("/shopping/categories");
    await expect(page.getByRole("heading", { name: "You don't have permission to open this page." })).toBeVisible();
    await page.getByRole("link", { name: "Go to my admin home" }).click();
    await expect(page).toHaveURL("/shopping/products");
  });

  test("a 401 from the API ends the session and login brings the user back", async ({ page }) => {
    await fakeSession(page);
    await page.route("**/api/v1/product-category/list**", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: envelope(null, 401, "Unauthorized") }),
    );
    await page.goto("/shopping/categories?search=x");

    await expect(page).toHaveURL("/login?next=%2Fshopping%2Fcategories%3Fsearch%3Dx&expired=1");
    await expect(page.getByRole("status").filter({ hasText: "로그인이 만료되었습니다" })).toBeVisible();
  });

  test("an expired token in storage counts as logged out", async ({ page }) => {
    await page.addInitScript(() => {
      const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
      const expired = `${b64({ alg: "HS256" })}.${b64({ exp: Math.floor(Date.now() / 1000) - 60 })}.sig`;
      sessionStorage.setItem("tc-admin-auth", JSON.stringify({ accessToken: expired, user: { id: 1, fullName: "x", role: "SUPER_ADMIN" } }));
    });
    await page.goto("/shopping/products");
    await expect(page).toHaveURL("/login?next=%2Fshopping%2Fproducts");
  });

  test("logout calls the API, clears the session and goes to login", async ({ page }) => {
    let called = false;
    await fakeSession(page);
    await page.route("**/api/v1/auth/logout", (route) => {
      called = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: envelope({}, 200, "adminLogout") });
    });
    await page.goto("/shopping/products");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");
    expect(called).toBe(true);
  });
});
