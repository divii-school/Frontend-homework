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
    let searchesWhileTyping = 0;
    page.on("request", (item) => {
      if (item.url().includes("/product-category/list") && item.url().includes("search=")) searchesWhileTyping += 1;
    });
    // Design 8.2.0: the search runs on Enter (or the magnifier), not while typing
    await page.getByLabel("카테고리 검색").pressSequentially("Phonics", { delay: 80 });
    await page.waitForTimeout(600);
    expect(searchesWhileTyping).toBe(0);
    const request = page.waitForRequest((item) => item.url().includes("/product-category/list") && item.url().includes("search=Phonics"));
    await page.getByLabel("카테고리 검색").press("Enter");
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

  test("대분류 등록 is enabled only when the API allows another 대분류, and says why when not", async ({ page }) => {
    // The real QA answer says isCreatable: false: the button is shown disabled, with the reason (design review)
    await page.goto("/categories");
    await expect(page.locator(".category-row-category").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "대분류 등록" })).toBeDisabled();
    await expect(page.getByText("대분류는 더 이상 추가할 수 없습니다.")).toBeVisible();

    // An answer with the flag turned on shows it (answered by the test: one category, no call to the server)
    const category = { id: 1, name: "HW3-Sachin-Mock", sortOrder: 1, createdAt: "2026-11-16T00:00:00.000Z", updatedAt: "2026-11-16T00:00:00.000Z", subCategories: [] };
    await page.route("**/api/v1/product-category/list*", (route) =>
      route.fulfill({ json: { success: true, message: "Success", data: [category], totalRecords: 1, isCreatable: true } }),
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "대분류 등록" })).toBeEnabled();
    await expect(page.getByText("대분류는 더 이상 추가할 수 없습니다.")).toHaveCount(0);
  });

  test("paging: 대분류 rows are paged and the page is kept in the URL", async ({ page }) => {
    // 25 대분류 answered by the test (the QA server has only 3), so there is a second and a third page
    const categories = Array.from({ length: 25 }, (_, index) => ({
      id: 1000 + index,
      name: `HW3-Sachin-Mock-${String(index + 1).padStart(2, "0")}`,
      sortOrder: index + 1,
      createdAt: "2026-11-16T00:00:00.000Z",
      updatedAt: "2026-11-16T00:00:00.000Z",
      subCategories: [],
    }));
    await page.route("**/api/v1/product-category/list*", (route) =>
      route.fulfill({ json: { success: true, message: "Success", data: categories, totalRecords: 25, isCreatable: false } }),
    );
    await page.goto("/categories");
    await expect(page.locator(".category-row-category")).toHaveCount(10);
    await page.getByRole("button", { name: "3 페이지" }).click();
    await expect(page).toHaveURL(/page=3/);
    await expect(page.locator(".category-row-category")).toHaveCount(5);
    await expect(page.locator(".category-row-category").first()).toContainText("HW3-Sachin-Mock-21");

    await page.reload();
    await expect(page.locator(".category-row-category").first()).toContainText("HW3-Sachin-Mock-21");

    // A page past the end shows the last page that exists
    await page.goto("/categories?page=9");
    await expect(page.locator(".category-row-category").first()).toContainText("HW3-Sachin-Mock-21");
  });

  test("the name is required in the dialog and nothing is sent when it is empty", async ({ page }) => {
    let writes = 0;
    page.on("request", (request) => {
      if (request.url().includes("/product-category/") && request.method() !== "GET") writes += 1;
    });
    await page.goto("/categories");
    await page.locator(".category-row-category").first().getByRole("button", { name: /중분류 추가/ }).click();
    await expect(page.getByRole("dialog")).toContainText("중분류 등록");
    await page.getByRole("dialog").getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("중분류 이름을 입력해 주세요.")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "취소" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toBe(0);
  });

  test("a name longer than 50 characters is refused with a Korean message, in add and in rename (QA, 18 Nov)", async ({ page }) => {
    // Any write is stopped here, so the shared data stays untouched even if the rule were broken
    let writes = 0;
    await page.route("**/api/v1/product-category/**", (route) => {
      if (route.request().method() === "GET") return route.continue();
      writes += 1;
      return route.abort();
    });
    await page.goto("/categories");
    const firstRow = page.locator(".category-row-category").first();
    const dialog = page.getByRole("dialog");

    await firstRow.getByRole("button", { name: /중분류 추가/ }).click();
    await expect(dialog).toContainText("50자 이내");
    await page.getByLabel("카테고리 이름").fill("가".repeat(50));
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    // The message shows as soon as the 51st character is typed, and 등록 sends nothing
    await page.getByLabel("카테고리 이름").press("End");
    await page.getByLabel("카테고리 이름").pressSequentially("a");
    await expect(dialog.getByText("중분류 이름은 50자 이내로 입력해 주세요.")).toBeVisible();
    await expect(page.getByLabel("카테고리 이름")).toHaveAttribute("aria-invalid", "true");
    await dialog.getByRole("button", { name: "등록" }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "취소" }).click();

    await firstRow.getByRole("button", { name: /수정$/ }).click();
    await page.getByLabel("카테고리 이름").fill("나".repeat(51));
    await expect(dialog.getByText("대분류 이름은 50자 이내로 입력해 주세요.")).toBeVisible();
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "취소" }).click();
    expect(writes).toBe(0);
  });

  test("a category with lower categories cannot be deleted: the dialog asks to delete them first (QA, 18 Nov)", async ({ page }) => {
    let writes = 0;
    await page.route("**/api/v1/product-category/**", (route) => {
      if (route.request().method() === "GET") return route.continue();
      writes += 1;
      return route.abort();
    });
    await page.goto("/categories");
    // The first 대분류 of the QA data (주교재) has 중분류 under it
    const firstRow = page.locator(".category-row-category").first();
    await expect(firstRow.locator(".category-row-count")).not.toContainText("(0개");
    await firstRow.getByRole("button", { name: /삭제$/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("하위 카테고리를 먼저 삭제해 주세요.");
    // Only 확인: there is no button that would delete
    await expect(dialog.getByRole("button", { name: "삭제" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "확인" }).click();
    await expect(dialog).toHaveCount(0);
    expect(writes).toBe(0);
  });
});
