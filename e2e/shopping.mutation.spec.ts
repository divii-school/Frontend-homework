import { expect, test, type Page } from "@playwright/test";

/**
 * Create / edit / delete on the shared QA server. Not part of the default run (npm run test:e2e:mutation).
 * Rules of the homework: only records named HW3-Sachin-… are created, changed or deleted, and everything
 * created here is removed again, with one exception: the QA API answers 500 when a category that has ever held
 * a product is deleted (even after the product is gone), so products are created under one permanent fixture
 * category of ours (HW3-Sachin-Fixture-…), which the test creates when it is missing and never deletes.
 * The steps depend on each other, so they run in order and stop at the first failure.
 */
test.describe.configure({ mode: "serial" });

const stamp = Date.now().toString().slice(-6);
const PARENT_CATEGORY = "학원 Shop"; // existing 대분류; our 중분류 is added under it and removed again
const SUB = `HW3-Sachin-Sub-${stamp}`;
const CHILD = `HW3-Sachin-Child-${stamp}`;
const CHILD_RENAMED = `HW3-Sachin-Child-${stamp}-edited`;
const FIXTURE_SUB = "HW3-Sachin-Fixture-Sub";
const FIXTURE_CHILD = "HW3-Sachin-Fixture-Child";
const PRODUCT = `HW3-Sachin-Product-${stamp}`;
const PRODUCT_RENAMED = `HW3-Sachin-Product-${stamp}-edited`;

// A valid 1x1 PNG, so the test needs no image file in the repo.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const row = (page: Page, name: string) => page.locator(".category-row").filter({ has: page.getByText(name, { exact: true }) });

async function openParent(page: Page): Promise<void> {
  await page.goto(`/categories?search=${encodeURIComponent("HW3-Sachin")}`);
  // With our records present the search shows the parent; before the first create it shows nothing, so search the parent itself.
  if (!(await page.getByText(PARENT_CATEGORY, { exact: true }).isVisible().catch(() => false))) {
    await page.goto(`/categories?search=${encodeURIComponent(PARENT_CATEGORY)}`);
  }
  await expect(row(page, PARENT_CATEGORY)).toBeVisible();
  await page.getByRole("button", { name: "모두 펼치기" }).click();
}

/** Choose an option of a form select. The select does not open while its options are still loading, so the click is retried. */
async function pick(page: Page, label: string, option: string): Promise<void> {
  const select = page.locator(".form-field", { has: page.locator(`#product-${label}`) }).locator(".p-dropdown");
  const item = page.locator(".p-dropdown-panel .p-dropdown-item").filter({ hasText: option }).first();
  await expect(async () => {
    if (!(await item.isVisible())) await select.click();
    await expect(item).toBeVisible({ timeout: 2_000 });
  }).toPass();
  await item.click();
  await expect(select).toContainText(option);
}

/** Walk from step 1 to step 4, waiting for each step to appear (the step is in the URL). */
async function toLastStep(page: Page): Promise<void> {
  for (const step of ["price", "category", "media"]) {
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page).toHaveURL(new RegExp(`step=${step}`));
  }
}

async function toFirstStep(page: Page): Promise<void> {
  for (const step of ["category", "price"]) {
    await page.getByRole("button", { name: "이전" }).click();
    await expect(page).toHaveURL(new RegExp(`step=${step}`));
  }
  await page.getByRole("button", { name: "이전" }).click();
  await expect(page).not.toHaveURL(/step=/);
}

test("category: create a 중분류 and a 소분류, rename the 소분류", async ({ page }) => {
  await openParent(page);
  await row(page, PARENT_CATEGORY).getByRole("button", { name: /중분류 추가/ }).click();
  await page.getByLabel("카테고리 이름").fill(SUB);
  await page.getByRole("dialog").getByRole("button", { name: "등록" }).click();
  await expect(page.getByText("등록 완료")).toBeVisible();

  await openParent(page);
  await row(page, SUB).getByRole("button", { name: /소분류 추가/ }).click();
  await page.getByLabel("카테고리 이름").fill(CHILD);
  await page.getByRole("dialog").getByRole("button", { name: "등록" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await openParent(page);
  await row(page, CHILD).getByRole("button", { name: /수정/ }).click();
  await expect(page.getByLabel("카테고리 이름")).toHaveValue(CHILD);
  await page.getByLabel("카테고리 이름").fill(CHILD_RENAMED);
  await page.getByRole("dialog").getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("수정 완료")).toBeVisible();
  await openParent(page);
  await expect(row(page, CHILD_RENAMED)).toBeVisible();
});

test("category: delete the 소분류 and the 중분류 created by this run (confirm dialog names the record)", async ({ page }) => {
  for (const name of [CHILD_RENAMED, SUB]) {
    await openParent(page);
    await row(page, name).getByRole("button", { name: /삭제/ }).click();
    await expect(page.getByRole("dialog")).toContainText(name);
    await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();
    await expect(page.getByText("삭제 완료")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.goto(`/categories?search=${SUB}`);
  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
});

test("fixture: our permanent category for products exists (created once)", async ({ page }) => {
  await openParent(page);
  if ((await row(page, FIXTURE_SUB).count()) === 0) {
    await row(page, PARENT_CATEGORY).getByRole("button", { name: /중분류 추가/ }).click();
    await page.getByLabel("카테고리 이름").fill(FIXTURE_SUB);
    await page.getByRole("dialog").getByRole("button", { name: "등록" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await openParent(page);
  }
  if ((await row(page, FIXTURE_CHILD).count()) === 0) {
    await row(page, FIXTURE_SUB).getByRole("button", { name: /소분류 추가/ }).click();
    await page.getByLabel("카테고리 이름").fill(FIXTURE_CHILD);
    await page.getByRole("dialog").getByRole("button", { name: "등록" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await openParent(page);
  }
  await expect(row(page, FIXTURE_CHILD)).toBeVisible();
});

test("product: create through the four steps with an image, and it shows in the list", async ({ page }) => {
  await page.goto("/products/create");
  await page.getByLabel("상품명").fill(PRODUCT);
  await page.getByLabel("상품 ERP명").fill(`${PRODUCT}-ERP`);
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByLabel("수량").fill("2");
  await page.getByLabel("단가(원)", { exact: true }).fill("1500");
  await page.getByLabel("ERP 단가(원)").fill("1000");
  await page.getByRole("button", { name: "다음" }).click();

  await pick(page, "categoryId", PARENT_CATEGORY);
  await pick(page, "subCategoryId", FIXTURE_SUB);
  await pick(page, "childCategoryId", FIXTURE_CHILD);
  await page.getByRole("button", { name: "다음" }).click();

  // Saving without an image or a description is refused on the last step
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByText("이미지를 1장 이상 등록해 주세요.")).toBeVisible();

  await page.locator("#product-images").setInputFiles({ name: "HW3-Sachin-test.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("img", { name: "HW3-Sachin-test.png" })).toBeVisible();
  // Remove, then add again: the preview goes and comes back
  await page.getByRole("button", { name: "HW3-Sachin-test.png 삭제" }).click();
  await expect(page.getByRole("img", { name: "HW3-Sachin-test.png" })).toHaveCount(0);
  await page.locator("#product-images").setInputFiles({ name: "HW3-Sachin-test.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("img", { name: "HW3-Sachin-test.png" })).toBeVisible();

  await page.getByLabel("상세설명").fill("HW3 Playwright test product");
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByText("등록 완료")).toBeVisible();
  await expect(page).toHaveURL(/\/products$/);

  await page.goto(`/products?search=${PRODUCT}`);
  await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(1);
  await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText(PRODUCT);
  await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText("3,000원");
});

test("product: an API error on save keeps every value", async ({ page }) => {
  await page.goto(`/products?search=${PRODUCT}`);
  await page.locator(".p-datatable-tbody .data-table-link").first().click();
  await page.getByRole("link", { name: "수정" }).click();
  await expect(page.getByLabel("상품명")).toHaveValue(PRODUCT);

  // Make the save fail once, as the server would
  await page.route("**/api/v1/products/edit/*", (route) =>
    route.fulfill({ status: 500, json: { success: false, message: "Something went wrong", data: null, statusCode: 500 } }),
  );
  await page.getByLabel("상품명").fill(PRODUCT_RENAMED);
  await toLastStep(page);
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "서버에서 오류가 발생했습니다." })).toBeVisible();
  await expect(page.getByLabel("상세설명")).toHaveValue("HW3 Playwright test product");
  await toFirstStep(page);
  await expect(page.getByLabel("상품명")).toHaveValue(PRODUCT_RENAMED);

  // The real save now goes through
  await page.unroute("**/api/v1/products/edit/*");
  await toLastStep(page);
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("수정 완료")).toBeVisible();
  await page.goto(`/products?search=${PRODUCT_RENAMED}`);
  await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(1);
});

test("product: visibility switch, then bulk delete of our own record only", async ({ page }) => {
  await page.goto(`/products?search=${PRODUCT_RENAMED}`);
  const tableRow = page.locator(".p-datatable-tbody > tr").first();
  await expect(tableRow).toContainText(PRODUCT_RENAMED);

  const toggle = tableRow.getByRole("switch");
  const before = await toggle.isChecked();
  await tableRow.locator(".p-inputswitch").click();
  await expect(toggle).toBeChecked({ checked: !before });

  await tableRow.locator(".p-checkbox").click();
  await page.getByRole("button", { name: "삭제 (1)" }).click();
  await expect(page.getByRole("dialog")).toContainText(PRODUCT_RENAMED);
  await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText("삭제 완료")).toBeVisible();
  await expect(page.getByText("조건에 맞는 상품이 없습니다.")).toBeVisible();
});
