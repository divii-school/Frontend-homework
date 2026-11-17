import { test, expect, type Page } from "@playwright/test";
import { injectSession, mockApi } from "./helpers";

// Role-based menu + URL guard, driven by src/config/navigation.ts. Each test injects a session
// (unsigned JWT + user in localStorage) into a fresh browser and mocks the API, so no real
// account or QA server is needed.

const SHOPPING = "shopping_mall";
const mainMenu = (page: Page) => page.getByRole("navigation", { name: "Main menu" });

test.describe("Role-based access", () => {
  test("SUPER_ADMIN sees both pages and can open categories", async ({ page, context, baseURL }) => {
    await injectSession(context, baseURL ?? "http://localhost:3000", { role: "SUPER_ADMIN" });
    await mockApi(page);

    await page.goto("/shopping-mall/categories");
    await expect(page.getByRole("heading", { name: "Product Category Management", level: 1 })).toBeVisible();
    await expect(mainMenu(page).getByRole("link", { name: "Product Management" })).toBeVisible();
    await expect(mainMenu(page).getByRole("link", { name: "Product Category Management" })).toBeVisible();
  });

  test("GENERAL_ADMIN with product permission: products yes, categories hidden and 403", async ({ page, context, baseURL }) => {
    await injectSession(context, baseURL ?? "http://localhost:3000", {
      role: "GENERAL_ADMIN",
      permissions: [{ module: SHOPPING, subModules: ["product_management"] }],
    });
    await mockApi(page);

    await page.goto("/shopping-mall/products");
    await expect(page.getByRole("heading", { name: "Product Management", level: 1 })).toBeVisible();
    await expect(mainMenu(page).getByRole("link", { name: "Product Management" })).toBeVisible();
    await expect(mainMenu(page).getByRole("link", { name: "Product Category Management" })).toHaveCount(0);

    await page.goto("/shopping-mall/categories");
    await expect(page).toHaveURL(/\/403\?from=/);
    await expect(page.getByRole("heading", { name: "No permission" })).toBeVisible();
  });

  test("GENERAL_ADMIN without the shopping permission: menu hidden, direct URL is 403", async ({ page, context, baseURL }) => {
    await injectSession(context, baseURL ?? "http://localhost:3000", {
      role: "GENERAL_ADMIN",
      permissions: [{ module: "user_management", subModules: ["student_management"] }],
    });
    await mockApi(page);

    await page.goto("/shopping-mall/products");
    await expect(page).toHaveURL(/\/403\?from=%2Fshopping-mall%2Fproducts/);
    await expect(page.getByRole("heading", { name: "No permission" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Product Management" })).toHaveCount(0);
  });

  test("TEACHER: no admin menu, every admin URL is 403", async ({ page, context, baseURL }) => {
    await injectSession(context, baseURL ?? "http://localhost:3000", { role: "TEACHER" });
    await mockApi(page);

    for (const url of ["/shopping-mall/products", "/shopping-mall/products/create", "/shopping-mall/categories"]) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/403\?from=/);
      await expect(page.getByRole("heading", { name: "No permission" })).toBeVisible();
    }
    await expect(page.getByRole("navigation", { name: "Main menu" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Log in with another account" })).toBeVisible();
  });
});
