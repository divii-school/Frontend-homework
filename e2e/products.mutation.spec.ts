import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  API_BASE,
  CREATE_URL,
  apiHeaders,
  clickNext,
  completeStep2,
  completeStep3,
  expectStep,
  field,
  fillStep1,
  fillStep4,
  findCategoryPath,
  readSavedToken,
  watchConsole,
  type CategoryPath,
} from "./product-form.helpers";

// Full product lifecycle on the SHARED QA DB — runs only with E2E_ALLOW_MUTATIONS=1 (see playwright.config.ts).
// Every record is named HW3-Neeraj-e2e-<timestamp>; only those are edited / deleted.
//   1. register through all 4 steps with a real small PNG (signed URL → this app's /api/upload route → S3)
//   2. it shows up in the list search
//   3. edit: change name + selling price, save, check the API
//   4. delete it with the list's bulk delete
// afterAll deletes anything left with this run's name through the API, even when a test failed.

const RUN_NAME = `HW3-Neeraj-e2e-${Date.now()}`;
const EDITED_NAME = `${RUN_NAME}-edited`;

let token = "";
let categoryPath: CategoryPath;
let productId: number | null = null;

interface ListRow {
  id: number;
  productName: string;
}

/** Products whose name starts with `prefix` (our own records only). */
async function findOwnProducts(api: APIRequestContext, prefix: string): Promise<ListRow[]> {
  const response = await api.get(`${API_BASE}/products/get-products-by-category?page=1&limit=50&search=${encodeURIComponent(prefix)}`, {
    headers: apiHeaders(token),
  });
  if (!response.ok()) return [];
  const rows = ((await response.json()) as { data: ListRow[] }).data ?? [];
  return rows.filter((row) => row.productName.startsWith(prefix) && row.productName.startsWith("HW3-Neeraj-"));
}

let consoleWatch: ReturnType<typeof watchConsole>;

test.describe.configure({ mode: "serial" });

test.describe("Product register → list → edit → delete (shared QA DB)", { tag: "@mutation" }, () => {
  test.skip(process.env.E2E_ALLOW_MUTATIONS !== "1", "Mutations need E2E_ALLOW_MUTATIONS=1");

  test.beforeAll(async ({ playwright }) => {
    token = readSavedToken();
    const api = await playwright.request.newContext();
    categoryPath = await findCategoryPath(api, token);
    await api.dispose();
  });

  test.beforeEach(async ({ page }) => {
    consoleWatch = watchConsole(page);
    page.on("dialog", (dialog) => void dialog.accept());
  });

  test.afterEach(() => {
    expect(consoleWatch.problems, "console errors / warnings").toEqual([]);
  });

  // Cleanup through the API — runs even if a test above failed
  test.afterAll(async ({ playwright }) => {
    const api = await playwright.request.newContext();
    const leftovers = await findOwnProducts(api, RUN_NAME);
    if (leftovers.length > 0) {
      const response = await api.delete(`${API_BASE}/products/delete`, {
        headers: { ...apiHeaders(token), "Content-Type": "application/json" },
        data: { ids: leftovers.map((row) => row.id) },
      });
      console.log(`cleanup: deleted ${leftovers.map((row) => `${row.id} ${row.productName}`).join(", ")} → ${response.status()}`);
    }
    await api.dispose();
  });

  test("register through all 4 steps with a real image, then find it in the list", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(CREATE_URL);
    await expect(field(page, "상품코드")).not.toHaveValue("", { timeout: 30_000 });

    await fillStep1(page, { name: RUN_NAME, unit: "15000", selling: "20000" });
    await clickNext(page);
    await expectStep(page, 2);
    await completeStep2(page); // real upload: POST /utils/upload-file-urls → POST /api/upload → the server PUTs to S3
    await clickNext(page);
    await expectStep(page, 3);
    await completeStep3(page, categoryPath);
    await clickNext(page);
    await expectStep(page, 4);
    await fillStep4(page, `${RUN_NAME} ERP`);
    await page.getByRole("button", { name: "등록", exact: true }).click();

    await expect(page).toHaveURL(/\/shopping-mall\/products(\?|$)/, { timeout: 30_000 });
    await expect(page.locator(".p-toast-message")).toContainText("상품이 성공적으로 등록되었습니다.");
    expect(await page.evaluate(() => window.sessionStorage.getItem("hw3-product-draft-create")), "draft cleared after save").toBeNull();

    // List search by name
    await page.goto(`/shopping-mall/products?q=${encodeURIComponent(RUN_NAME)}`);
    await expect(page.getByRole("checkbox", { name: `${RUN_NAME} 선택`, exact: true })).toBeVisible({ timeout: 30_000 });

    const rows = await findOwnProducts(page.request, RUN_NAME);
    expect(rows.map((row) => row.productName)).toContain(RUN_NAME);
    productId = rows.find((row) => row.productName === RUN_NAME)?.id ?? null;
    expect(productId).not.toBeNull();
  });

  test("edit: change the name and selling price, save, check the API", async ({ page }) => {
    test.skip(productId === null, "Nothing was created");
    await page.goto(`/shopping-mall/products/edit/${productId}`);
    await expect(field(page, "상품명")).toHaveValue(RUN_NAME, { timeout: 30_000 });
    await expect(field(page, "상품코드")).toHaveAttribute("readonly", "");

    await field(page, "상품명").fill(EDITED_NAME);
    await field(page, "판매가").fill("25000");
    await page.getByRole("button", { name: /4단계: ERP 정보 및 확인/ }).click();
    await expectStep(page, 4);
    await page.getByRole("button", { name: "저장", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/shopping-mall/products/details/${productId}`), { timeout: 30_000 });
    await expect(page.locator(".p-toast-message")).toContainText("상품 정보가 성공적으로 수정되었습니다.");

    const response = await page.request.get(`${API_BASE}/products/details/${productId}`, { headers: apiHeaders(token) });
    const details = ((await response.json()) as { data: { productName: string; unitPrice: number; price: number; images: string[] } }).data;
    expect(details.productName).toBe(EDITED_NAME);
    expect(Number(details.price)).toBe(25000); // 판매가 = price
    expect(Number(details.unitPrice)).toBe(15000); // 단가 = unitPrice, unchanged
    expect(details.images).toHaveLength(1);
  });

  test("delete it with the list's bulk delete", async ({ page }) => {
    test.skip(productId === null, "Nothing was created");
    await page.goto(`/shopping-mall/products?q=${encodeURIComponent(EDITED_NAME)}`);
    const rowCheckbox = page.getByRole("checkbox", { name: `${EDITED_NAME} 선택`, exact: true });
    await expect(rowCheckbox).toBeVisible({ timeout: 30_000 });
    await rowCheckbox.check();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await page.locator(".p-confirm-dialog").getByRole("button", { name: "삭제" }).click();

    await expect(rowCheckbox).toHaveCount(0, { timeout: 30_000 });
    // The shared QA API sometimes needs more than the default 5 s before its list no longer returns the deleted
    // product (seen on 18 Nov; the row was already gone from the screen and the product was deleted). Same check,
    // longer wait for the server.
    await expect.poll(async () => (await findOwnProducts(page.request, RUN_NAME)).length, { timeout: 30_000 }).toBe(0);
    productId = null;
  });
});
