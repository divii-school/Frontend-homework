import { test, expect } from "@playwright/test";
import {
  API_BASE,
  CREATE_URL,
  MAX_IMAGE_MB,
  apiHeaders,
  chooseOption,
  clickNext,
  expectStep,
  field,
  fillStep1,
  isFailedResourceLog,
  readSavedToken,
  watchConsole,
} from "./product-form.helpers";

// Product form against the REAL QA API with the saved admin session — READ-ONLY: nothing is ever
// registered or saved here (create / edit / delete live in products.mutation.spec.ts).
//   1. step 1 rules: required messages, selling ≥ unit price, Next blocked until valid, focus on the field
//   2. going back keeps every value; the step lives in the URL (also browser Back)
//   3. image type / size checked before any upload request (.txt + a fake PNG 1 MB above the limit)
//   4. edit page of an existing product: code + category read-only (no save)

let consoleWatch: ReturnType<typeof watchConsole>;

test.beforeEach(async ({ page }) => {
  consoleWatch = watchConsole(page);
  page.on("dialog", (dialog) => void dialog.accept());
});

test.afterEach(() => {
  expect(consoleWatch.problems, "console errors / warnings").toEqual([]);
});

test.describe("Product form (live QA API, read-only)", () => {
  test("step 1: required messages, selling ≥ unit price, Next blocked until valid", async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(field(page, "상품코드")).not.toHaveValue("", { timeout: 30_000 });

    // Empty step → four messages, focus on the first invalid field, still step 1
    await clickNext(page);
    await expect(page.locator("#product-name-error")).toHaveText("상품명을 입력해 주세요.");
    await expect(page.locator("#product-price-error")).toHaveText("단가를 입력해 주세요.");
    await expect(page.locator("#product-unit-price-error")).toHaveText("판매가를 입력해 주세요.");
    await expect(page.locator("#product-description-error")).toHaveText("상세설명을 입력해 주세요.");
    await expect(field(page, "상품명")).toBeFocused();
    await expect(page).not.toHaveURL(/step=2/);

    // Selling price not lower than the unit price
    await fillStep1(page, { name: "HW3-Neeraj-live-check", price: "10000", selling: "10000" });
    await expect(field(page, "단가")).toHaveValue("₩10,000");
    await clickNext(page);
    await expect(page.locator("#product-unit-price-error")).toHaveText("판매가는 단가보다 낮아야 합니다.");
    await expect(field(page, "판매가")).toBeFocused();
    await expect(page).not.toHaveURL(/step=2/);

    // Fixed → Next works
    await field(page, "판매가").fill("9000");
    await clickNext(page);
    await expectStep(page, 2);
  });

  test("going back keeps every value and the step is in the URL", async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(field(page, "상품코드")).not.toHaveValue("", { timeout: 30_000 });
    await fillStep1(page, { name: "HW3-Neeraj-live-back", price: "25000", selling: "20000", description: "Line one\nLine two" });
    await clickNext(page);
    await expectStep(page, 2);
    await chooseOption(page, "product-is-visible", "아니오");

    await page.getByRole("button", { name: "이전", exact: true }).click();
    await expectStep(page, 1);
    await expect(field(page, "상품명")).toHaveValue("HW3-Neeraj-live-back");
    await expect(field(page, "단가")).toHaveValue("₩25,000");
    await expect(field(page, "판매가")).toHaveValue("₩20,000");
    await expect(field(page, "상세설명")).toHaveValue("Line one\nLine two");

    await clickNext(page);
    await expectStep(page, 2);
    await expect(page.locator(".p-dropdown").filter({ has: page.locator("#product-is-visible") })).toContainText("아니오");

    // Browser Back = previous step (the step is a real history entry)
    await page.goBack();
    await expectStep(page, 1);
    await expect(field(page, "상품명")).toHaveValue("HW3-Neeraj-live-back");
  });

  test("image type and size are checked before any upload request", async ({ page }) => {
    const uploadCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/utils/upload-file-urls")) uploadCalls.push(request.url());
    });

    await page.goto(CREATE_URL);
    await expect(field(page, "상품코드")).not.toHaveValue("", { timeout: 30_000 });
    await fillStep1(page, { name: "HW3-Neeraj-live-files", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);

    await page.locator("#product-images-input").setInputFiles([
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
      { name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc((MAX_IMAGE_MB + 1) * 1024 * 1024, 1) },
    ]);
    const rejected = page.getByRole("alert", { name: "추가되지 않은 파일" });
    await expect(rejected).toContainText('"notes.txt" 파일은 지원하지 않는 이미지 형식입니다.');
    await expect(rejected).toContainText(`"huge.png" 파일의 용량이 ${MAX_IMAGE_MB}MB를 초과합니다.`);
    await expect(page.getByText("0 / 4장")).toBeVisible();

    await clickNext(page);
    await expectStep(page, 2);
    await expect(page.locator("#product-images-error")).toHaveText("이미지를 1장 이상 등록해 주세요.");
    expect(uploadCalls, "no upload request for rejected files").toEqual([]);
  });

  test("edit page of an existing product: code and category are read-only (no save)", async ({ page }) => {
    // Old product images on S3 may be missing → the thumbnail shows a placeholder, the browser logs a 403/404
    consoleWatch.allow((message) => isFailedResourceLog(message) && !message.location().url.startsWith(API_BASE));

    // Pick a product: one of ours (HW3-Neeraj-) if there is one, otherwise the newest
    const token = readSavedToken();
    type Row = { id: number; productName: string; productCode: string };
    const search = async (term?: string) => {
      const query = term ? `&search=${encodeURIComponent(term)}` : "";
      const response = await page.request.get(`${API_BASE}/products/get-products-by-category?page=1&limit=1${query}`, { headers: apiHeaders(token) });
      expect(response.ok(), `product list → ${response.status()}`).toBeTruthy();
      return ((await response.json()) as { data: Row[] }).data[0];
    };
    const row = (await search("HW3-Neeraj-")) ?? (await search());
    test.skip(!row, "No product on the QA server to open.");

    const detailsResponse = await page.request.get(`${API_BASE}/products/details/${row.id}`, { headers: apiHeaders(token) });
    const details = ((await detailsResponse.json()) as {
      data: { productName: string; productCode: string; category: { name: string } | null; subCategory: { name: string } | null; childCategory: { name: string } | null };
    }).data;

    await page.goto(`/shopping-mall/products/edit/${row.id}`);
    const code = field(page, "상품코드");
    await expect(code).toHaveValue(details.productCode, { timeout: 30_000 });
    await expect(code).toHaveAttribute("readonly", "");
    await expect(field(page, "상품명")).toHaveValue(details.productName);

    await page.getByRole("button", { name: /3단계: 카테고리 및 옵션/ }).click();
    await expectStep(page, 3);
    if (details.category && details.subCategory && details.childCategory) {
      await expect(field(page, "대분류")).toHaveValue(details.category.name);
      await expect(field(page, "대분류")).toHaveAttribute("readonly", "");
      await expect(field(page, "중분류")).toHaveValue(details.subCategory.name);
      await expect(field(page, "소분류")).toHaveValue(details.childCategory.name);
    } else {
      test.info().annotations.push({ type: "note", description: "This product has no full category, so the pickers are editable." });
    }
    // Leave without saving (the form is not dirty, so no confirm)
  });
});
