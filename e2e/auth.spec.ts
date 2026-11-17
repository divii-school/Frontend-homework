import { expect, test } from "@playwright/test";
import { credentials, login, typeSecret } from "./helpers";

// These tests are about signing in, so they start with no session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login and protected routes", () => {
  test("a protected page sends a signed-out visitor to login and remembers the page", async ({ page }) => {
    await page.goto("/products?page=2&search=FLY");
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fproducts%3Fpage%3D2%26search%3DFLY/);
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(page).toHaveTitle(/로그인/);
  });

  test("empty fields show a message under each field and call no API", async ({ page }) => {
    let loginCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/auth/login") && request.method() === "POST") loginCalls += 1;
    });
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByText("아이디를 입력해 주세요.")).toBeVisible();
    await expect(page.getByText("비밀번호를 입력해 주세요.")).toBeVisible();
    expect(loginCalls).toBe(0);
  });

  test("a wrong password shows the API's error and keeps the typed ID", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await typeSecret(page, "아이디", credentials().loginId);
    await page.getByLabel("비밀번호", { exact: true }).fill("wrong-password-1!");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "아이디 또는 비밀번호가 올바르지 않습니다." })).toBeVisible();
    // Compared inside the page so the ID is not printed in the report
    expect(await page.getByLabel("아이디", { exact: true }).evaluate((element, id) => (element as HTMLInputElement).value === id, credentials().loginId)).toBe(true);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login returns to the page that was asked for, and logout ends the session", async ({ page }) => {
    await page.goto("/categories?sort=name-asc");
    await expect(page).toHaveURL(/\/auth\/login/);
    await login(page);
    await expect(page).toHaveURL(/\/categories\?sort=name-asc$/);
    await expect(page.getByRole("heading", { level: 1, name: "상품 카테고리 관리" })).toBeVisible();
    await expect(page.locator(".app-topbar-user")).not.toBeEmpty();

    // The QA API's logout ends EVERY session of the shared QA admin account (checked by hand on 15 Nov), which
    // would sign out the other developers. So the test answers this one call itself and never sends it.
    let logoutCalls = 0;
    await page.route("**/api/v1/auth/logout", (route) => {
      logoutCalls += 1;
      return route.fulfill({ json: { success: true, message: "adminLogout", data: {} } });
    });
    await page.getByRole("button", { name: "로그아웃" }).click();
    // Exactly the login page, with no ?redirect=: the next person to log in does not land on this user's page
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(logoutCalls).toBe(1);
    await page.goto("/products");
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fproducts/);
  });

  test("자동 로그인 decides whether the session outlives the browser", async ({ page, context }) => {
    const tokenCookie = async () => (await context.cookies()).find((cookie) => cookie.name === "tc_admin_token");

    // Not ticked: a session cookie (no expiry date)
    await page.goto("/auth/login");
    await login(page);
    await expect(page).toHaveURL(/\/products$/);
    expect((await tokenCookie())?.expires).toBe(-1);

    // Ticked: the cookie lives as long as the token (the QA API issues 24-hour tokens)
    await context.clearCookies();
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await page.getByLabel("자동 로그인").check();
    await login(page);
    await expect(page).toHaveURL(/\/products$/);
    const expires = (await tokenCookie())?.expires ?? 0;
    expect(expires).toBeGreaterThan(Date.now() / 1000 + 60 * 60);
  });

  // Both land on /products of this app (local or deployed), never on example.com
  test("a redirect written as /\\host is ignored too (browsers read it as another site)", async ({ page, baseURL }) => {
    await page.goto("/auth/login?redirect=%2F%5Cexample.com");
    await login(page);
    await expect(page).toHaveURL(new URL("/products", baseURL).href);
  });

  test("a redirect to another site is ignored", async ({ page, baseURL }) => {
    await page.goto("/auth/login?redirect=https%3A%2F%2Fexample.com");
    await login(page);
    await expect(page).toHaveURL(new URL("/products", baseURL).href);
  });
});
