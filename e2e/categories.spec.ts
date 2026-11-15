import { expect, test } from "@playwright/test";
import { watchConsole } from "./helpers";

// Read-only: nothing here creates, changes or deletes data.
test.describe("category management", () => {
  test("opens with the tree, and a row opens to show its 중분류", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/categories");
    await expect(page.getByRole("heading", { level: 1, name: "상품 카테고리 관리" })).toBeVisible();
    await expect(page).toHaveTitle(/상품 카테고리 관리/);
    const firstRow = page.locator(".category-row-category").first();
    await expect(firstRow).toBeVisible();

    await firstRow.getByRole("button", { name: /펼치기/ }).click();
    await expect(page.locator(".category-row-sub, .category-tree-empty").first()).toBeVisible();
    await page.getByRole("button", { name: "모두 접기" }).click();
    await expect(page.locator(".category-row-sub")).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test("search is sent to the server, kept in the URL, and shows the empty state for no match", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.locator(".category-row-category").first()).toBeVisible();
    const request = page.waitForRequest((item) => item.url().includes("/product-category/list") && item.url().includes("search=Phonics"));
    await page.getByLabel("카테고리 검색").fill("Phonics");
    await request;
    await expect(page).toHaveURL(/search=Phonics/);
    await expect(page.locator(".category-row-category").first()).toBeVisible();

    await page.goto("/categories?search=zzzz-no-such-category-qq");
    await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
  });

  test("sort is kept in the URL and orders the 대분류 rows", async ({ page }) => {
    await page.goto("/categories?sort=name-desc&limit=50");
    await expect(page.locator(".category-row-category").first()).toBeVisible();
    const names = await page.locator(".category-row-category .category-row-name").allTextContents();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a, "ko")));
  });

  test("the name is required in the dialog and nothing is sent when it is empty", async ({ page }) => {
    let writes = 0;
    page.on("request", (request) => {
      if (request.url().includes("/product-category/") && request.method() !== "GET") writes += 1;
    });
    await page.goto("/categories");
    await page.getByRole("button", { name: "대분류 등록" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("대분류 이름을(를) 입력해 주세요.")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "취소" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toBe(0);
  });
});
