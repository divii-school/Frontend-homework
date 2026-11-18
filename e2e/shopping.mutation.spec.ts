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

// Writes to the shared QA server happen only when asked for: `npm run test:e2e:mutation` sets this variable,
// so a plain `npx playwright test` skips this file.
test.skip(process.env.E2E_ALLOW_WRITES !== "yes", "Writes to the shared QA server: run with npm run test:e2e:mutation");

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
  // The panel of the previous select may still be closing; with the same option texts (예 / 아니오) its items
  // would be clicked instead of this select's, so wait until no panel is left.
  await expect(page.locator(".p-dropdown-panel")).toHaveCount(0);
  await expect(async () => {
    if (!(await item.isVisible())) await select.click();
    await expect(item).toBeVisible({ timeout: 2_000 });
  }).toPass();
  await item.click();
  await expect(select).toContainText(option);
}

/** Choose an item of one column of the category picker (a list, design 8.1.1); its options may still be loading. */
async function pickCategory(page: Page, field: string, option: string): Promise<void> {
  const item = page.locator(`#product-${field} .p-listbox-item`).filter({ hasText: option }).first();
  await expect(item).toBeVisible({ timeout: 15_000 });
  await item.click();
  await expect(item).toHaveClass(/p-highlight/);
}

/** Walk from step 1 to step 4, waiting for each step to appear (the step is in the URL). */
async function toLastStep(page: Page): Promise<void> {
  for (const step of ["price", "category", "media"]) {
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page).toHaveURL(new RegExp(`step=${step}`));
  }
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
  await pick(page, "taxType", "과세");
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByLabel("수량").fill("2");
  await page.getByLabel("단가(원)", { exact: true }).fill("1500");
  await page.getByLabel("ERP 단가(원)").fill("1000");
  await page.getByRole("button", { name: "다음" }).click();

  await pickCategory(page, "categoryId", PARENT_CATEGORY);
  await pickCategory(page, "subCategoryId", FIXTURE_SUB);
  await pickCategory(page, "childCategoryId", FIXTURE_CHILD);
  await page.getByRole("button", { name: "다음" }).click();

  // Saving without an image, a description, 노출상태 or 판매상태 is refused on the last step
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByText("이미지를 1장 이상 등록해 주세요.")).toBeVisible();
  await expect(page.getByText("노출상태를 선택해 주세요.")).toBeVisible();
  await pick(page, "isVisible", "예");
  await pick(page, "onSale", "예");

  await page.locator("#product-images").setInputFiles({ name: "HW3-Sachin-test.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("img", { name: "HW3-Sachin-test.png" })).toBeVisible();
  // Remove, then add again: the preview goes and comes back
  await page.getByRole("button", { name: "HW3-Sachin-test.png 삭제" }).click();
  await expect(page.getByRole("img", { name: "HW3-Sachin-test.png" })).toHaveCount(0);
  // A comma in the file name would split the API's comma-separated image list: the upload removes it
  await page.locator("#product-images").setInputFiles({ name: "HW3-Sachin, test.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("img", { name: "HW3-Sachin test.png" })).toBeVisible();

  await page.getByLabel("상세설명").fill("HW3 Playwright test product");
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByText("등록 완료")).toBeVisible();
  await expect(page).toHaveURL(/\/products$/);

  await page.goto(`/products?search=${PRODUCT}`);
  await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(1);
  await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText(PRODUCT);
  await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText("3,000원");
  // The saved image, uploaded with a comma in its name, still loads after saving
  const thumbnail = page.locator(".p-datatable-tbody > tr").first().locator("img");
  await expect.poll(() => thumbnail.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
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
  // When editing, 저장 is in the page heading (design 8.1.2) and the last step has no button of its own
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "서버에서 오류가 발생했습니다." })).toBeVisible();
  await expect(page.getByLabel("상세설명")).toHaveValue("HW3 Playwright test product");
  // Every earlier step still holds its values
  await page.getByRole("button", { name: "이전" }).click();
  await expect(page).toHaveURL(/step=category/);
  // The category cannot be changed after registration (design 8.1.2): the saved path is shown read-only
  await expect(page.locator("#product-childCategoryId .p-highlight")).toContainText(FIXTURE_CHILD);
  await expect(page.locator("#product-childCategoryId")).toHaveClass(/p-disabled/);
  await expect(page.getByText("등록 후 변경 불가")).toBeVisible();
  await page.getByRole("button", { name: "이전" }).click();
  await expect(page).toHaveURL(/step=price/);
  await expect(page.getByLabel("수량")).toHaveValue("2");
  await page.getByRole("button", { name: "이전" }).click();
  await expect(page).not.toHaveURL(/step=/);
  await expect(page.getByLabel("상품명")).toHaveValue(PRODUCT_RENAMED);

  // The real save now goes through, straight from step 1 with the heading's 저장 (the whole form is checked first)
  await page.unroute("**/api/v1/products/edit/*");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("수정 완료")).toBeVisible();
  await page.goto(`/products?search=${PRODUCT_RENAMED}`);
  await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(1);
  // Only the name was changed, so the saved price is unchanged
  await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText("3,000원");
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
  await page.getByRole("button", { name: "선택한 상품 1개 삭제" }).click();
  await expect(page.getByRole("dialog")).toContainText(PRODUCT_RENAMED);
  await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText("삭제 완료")).toBeVisible();
  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
});
