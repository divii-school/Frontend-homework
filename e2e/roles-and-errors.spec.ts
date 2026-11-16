import { expect, test } from "@playwright/test";
import { actAs, expectProductRows, login } from "./helpers";

// Read-only. Only one real account exists (SUPER_ADMIN), so other roles are simulated by replacing the stored
// user (see actAs), and API failures by answering the request inside the test.
test.describe("roles: menu, route guard and buttons follow one config", () => {
  test("SUPER_ADMIN sees both menus and every action", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    await expect(page.getByRole("link", { name: "상품 관리" })).toBeVisible();
    await expect(page.getByRole("link", { name: "상품 카테고리 관리" })).toBeVisible();
    await expect(page.getByRole("link", { name: "등록" })).toBeVisible();
    await expect(page.getByRole("button", { name: "삭제" })).toBeVisible();
  });

  test("a user with only the category permission: product menu hidden, product URLs answer 403", async ({ page }) => {
    await actAs(page, "ADMIN", ["category_management"]);
    await page.goto("/categories");
    await expect(page.getByRole("heading", { level: 1, name: "상품 카테고리 관리" })).toBeVisible();
    await expect(page.getByRole("link", { name: "상품 관리", exact: true })).toHaveCount(0);

    for (const url of ["/products", "/products/create", "/products/20000", "/products/20000/edit"]) {
      await page.goto(url);
      await expect(page.getByText("접근 권한이 없습니다. (403)")).toBeVisible();
      // The page's own heading is not drawn: the only h1 is the 403 message
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("접근 권한이 없습니다. (403)");
    }
    // The 403 block offers the first page this user may open
    await page.getByRole("link", { name: "상품 카테고리 관리로 이동" }).click();
    await expect(page).toHaveURL(/\/categories$/);
  });

  test("a non-admin role with the product permission can edit but gets no delete", async ({ page }) => {
    await actAs(page, "TEACHER", ["product_management"]);
    await page.goto("/products");
    await expectProductRows(page);
    await expect(page.getByRole("link", { name: "등록" })).toBeVisible();
    await expect(page.getByRole("button", { name: "삭제" })).toHaveCount(0);
    await expect(page.locator(".p-datatable-tbody .p-checkbox")).toHaveCount(0);
  });

  test("a user with no permission sees an empty menu and 403", async ({ page }) => {
    await actAs(page, "ADMIN", []);
    await page.goto("/products");
    await expect(page.getByText("접근 권한이 없습니다. (403)")).toBeVisible();
    await expect(page.getByText("사용할 수 있는 메뉴가 없습니다.")).toBeVisible();
  });
});

test.describe("error handling", () => {
  test("500 shows the error state and 'try again' reloads the list", async ({ page }) => {
    let fail = true;
    await page.route("**/api/v1/products?*", (route) =>
      fail
        ? route.fulfill({ status: 500, json: { success: false, message: "Something went wrong", data: null, statusCode: 500 } })
        : route.continue(),
    );
    await page.goto("/products");
    await expect(page.getByRole("alert").filter({ hasText: "서버에서 오류가 발생했습니다." })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "다시 시도" }).click();
    await expectProductRows(page);
  });

  test("a network failure shows the connection message", async ({ page }) => {
    await page.route("**/api/v1/product-category/list*", (route) => route.abort("connectionfailed"));
    await page.goto("/categories");
    await expect(page.getByText("서버에 연결할 수 없습니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  });

  test("401 (token expired) goes to login and comes back to the same page after login", async ({ page }) => {
    await page.route("**/api/v1/products?*", (route) =>
      route.fulfill({ status: 401, json: { success: false, message: "Unauthorized", data: null, statusCode: 401 } }),
    );
    await page.goto("/products?page=2&limit=20");
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fproducts%3Fpage%3D2%26limit%3D20/);
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();

    // Logging in again returns to the same page with the same query
    await page.unroute("**/api/v1/products?*");
    await login(page);
    await expect(page).toHaveURL(/\/products\?page=2&limit=20$/);
    await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(20);
  });

  test("403 from the API shows the API's refusal, not a blank page", async ({ page }) => {
    await page.route("**/api/v1/products?*", (route) =>
      route.fulfill({ status: 403, json: { success: false, message: "Forbidden", data: null, statusCode: 403 } }),
    );
    await page.goto("/products");
    await expect(page.getByText("이 작업을 할 권한이 없습니다.")).toBeVisible();
  });

  test("a signed-in browser that lost its stored user is sent to login once, not into a redirect loop", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("tc_admin_user"));
    await page.goto("/categories");
    await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fcategories$/);
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("an unknown URL shows the 404 page", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없습니다. (404)" })).toBeVisible();
    await expect(page.getByRole("link", { name: "상품 관리로 이동" })).toBeVisible();
  });

  test("dark mode is applied through the theme attribute and remembered", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.getByRole("button", { name: "다크 모드로 전환" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  });
});
