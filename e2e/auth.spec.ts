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

  test("a wrong password shows the API's error in an alert closed with 확인, and keeps the typed ID", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await typeSecret(page, "아이디", credentials().loginId);
    await page.getByLabel("비밀번호", { exact: true }).fill("wrong-password-1!");
    await page.getByRole("button", { name: "로그인" }).click();
    const alert = page.getByRole("dialog", { name: "알림" });
    await expect(alert).toContainText("아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.");
    await alert.getByRole("button", { name: "확인" }).click();
    await expect(alert).toBeHidden();
    // Compared inside the page so the ID is not printed in the report
    expect(await page.getByLabel("아이디", { exact: true }).evaluate((element, id) => (element as HTMLInputElement).value === id, credentials().loginId)).toBe(true);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("an ID that does not exist shows '등록되지 않은 계정입니다.' (API key invalidCredentials), never the key", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await page.getByLabel("아이디", { exact: true }).fill("HW3-Sachin-no-such-user");
    await page.getByLabel("비밀번호", { exact: true }).fill("wrong-password-1!");
    await page.getByRole("button", { name: "로그인" }).click();
    const alert = page.getByRole("dialog", { name: "알림" });
    await expect(alert).toContainText("등록되지 않은 계정입니다.");
    await expect(page.getByText("invalidCredentials")).toHaveCount(0);
  });

  test("an account without admin rights gets the '관리자 권한이 없습니다.' popup and stays signed out", async ({ page }) => {
    // 1. The API refuses it (key userSuspended, as the live admin handles it)
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({ status: 400, json: { success: false, message: "userSuspended", data: null, statusCode: 400 } }),
    );
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
    await page.getByLabel("아이디", { exact: true }).fill("HW3-Sachin-not-admin");
    await page.getByLabel("비밀번호", { exact: true }).fill("any-password-1!");
    await page.getByRole("button", { name: "로그인" }).click();
    const alert = page.getByRole("dialog", { name: "알림" });
    await expect(alert).toContainText("관리자 권한이 없습니다.");
    await expect(alert).toContainText("고객센터로 문의해 주세요.");
    await alert.getByRole("button", { name: "확인" }).click();

    // 2. The API lets it in, but it may open no page of this admin: same popup, no session kept
    await page.unroute("**/api/v1/auth/login");
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 200,
        json: { success: true, message: "Success", data: { token: "x.eyJleHAiOjk5OTk5OTk5OTl9.y", user: { id: 9, uuid: "u", fullName: "HW3-Sachin", userId: "hw3", role: "GENERAL_ADMIN", permissions: [] } } },
      }),
    );
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(alert).toContainText("관리자 권한이 없습니다.");
    await alert.getByRole("button", { name: "확인" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    expect((await page.context().cookies()).some((cookie) => cookie.name === "tc_admin_token")).toBe(false);
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

test("the eye button shows and hides the typed password (design 1.1.0), and is a real button", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: "로그인" })).toBeEnabled();
  const field = page.locator("#login-password");
  const eye = page.getByRole("button", { name: "비밀번호 보기" });
  await field.fill("HW3-not-a-real-password");
  await expect(field).toHaveAttribute("type", "password");
  await expect(eye).toHaveAttribute("aria-pressed", "false");

  // Reachable with Tab right after the field, and works with the keyboard
  await field.focus();
  await page.keyboard.press("Tab");
  await expect(eye).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(field).toHaveAttribute("type", "text");
  await expect(eye).toHaveAttribute("aria-pressed", "true");
  await expect(field).toHaveValue("HW3-not-a-real-password");

  await eye.click();
  await expect(field).toHaveAttribute("type", "password");
});
