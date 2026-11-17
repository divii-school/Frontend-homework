import { test, expect, type Page, type Route } from "@playwright/test";
import { injectSession } from "./helpers";
import {
  API_BASE,
  CREATE_URL,
  PNG_FIXTURE,
  clickNext,
  completeStep2,
  completeStep3,
  expectStep,
  field,
  fillStep1,
  fillStep4,
  isFailedResourceLog,
  watchConsole,
} from "./product-form.helpers";

// Product form error / draft states with a MOCKED API (page.route), so this spec passes while the QA
// server is down. Each test starts in a fresh browser with an injected SUPER_ADMIN session (no real login).
//   1. submit → 400 unitPriceMustBeLessThanPrice → back on the selling price (step 1), values kept
//   2. submit → 500 → still on step 4, error box + toast, values kept
//   3. submit → network error → same, with the connection message
//   4. draft restored after reload (+ Discard)
//   5. ?step=3 typed into the URL with an empty form → sent back to step 1
//   6. image type / size rejected before any upload request
//   7. edit: read-only code + category; image keys + other option sets go back unchanged in the PUT body
//   8. 375 px: compact stepper, Enter = Next, no horizontal page scroll
//   9. Cancel asks first (design #21): No stays, Yes clears the draft and opens the list
//  10. edit of a missing product → not-found state

test.use({ storageState: { cookies: [], origins: [] } });

const API_ORIGIN = API_BASE ? new URL(API_BASE).origin : "http://api.invalid";
const S3_ORIGIN = "https://hw3-s3-mock.test";
const DRAFT_KEY = "hw3-product-draft-create";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,accept-language,x-talking-club-platform,x-talking-club-version",
};
const CATEGORY_PATH = { category: "E2E Major", subCategory: "E2E Medium", childCategory: "E2E Minor" };
const IMAGE = {
  filePath: "products/e2e-mock/hw3-product-small.png",
  preview: `${S3_ORIGIN}/products/e2e-mock/hw3-product-small.png`,
  name: "hw3-product-small.png",
};

/** A complete, valid form (what a draft holds) — lets tests 2 and 3 start on step 4. */
const VALID_DRAFT_VALUES = {
  productName: "HW3-Neeraj-mock-product",
  productCode: "PRD-E2E-0001",
  price: 27000,
  unitPrice: 17000,
  description: "Mocked product",
  images: [IMAGE],
  isVisible: "yes",
  onSale: "yes",
  categoryId: 11,
  subCategoryId: 21,
  childCategoryId: 31,
  options: [],
  optionsRequired: false,
  erpName: "HW3 mock ERP",
  quantity: 1,
  taxType: "tax",
  erpUnitPrice: 9000,
};

type SubmitHandler = (route: Route) => Promise<void>;

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", headers: CORS, body: JSON.stringify(body) });
}

const ok = (data: unknown) => ({ success: true, message: "", data });

/** Answers every API call the form makes; POST /products/add goes to `onSubmit`. */
async function mockApi(page: Page, onSubmit: SubmitHandler) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const { pathname } = new URL(request.url());
    if (pathname.endsWith("/products/generate-code")) return json(route, 200, ok("PRD-E2E-0001"));
    if (pathname.endsWith("/products/categories")) return json(route, 200, ok([{ id: 11, name: CATEGORY_PATH.category }]));
    if (/\/products\/subcategories\/\d+$/.test(pathname)) return json(route, 200, ok([{ id: 21, name: CATEGORY_PATH.subCategory }]));
    if (/\/products\/childcategories\/\d+$/.test(pathname)) return json(route, 200, ok([{ id: 31, name: CATEGORY_PATH.childCategory }]));
    if (pathname.endsWith("/utils/upload-file-urls")) {
      return json(route, 200, ok({ urls: [{ url: `${S3_ORIGIN}/upload/${IMAGE.filePath}?X-Amz-Signature=e2e`, preview: IMAGE.preview, filePath: IMAGE.filePath }] }));
    }
    if (pathname.endsWith("/products/add")) return onSubmit(route);
    return json(route, 200, { success: true, message: "", data: [], totalRecords: 0, totalPage: 0, page: 1 });
  });
  // Fake S3: the signed PUT succeeds, the preview URL returns the PNG
  await page.route(`${S3_ORIGIN}/**`, (route) => {
    const method = route.request().method();
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (method === "PUT") return route.fulfill({ status: 200, headers: CORS, body: "" });
    return route.fulfill({ status: 200, contentType: "image/png", headers: CORS, path: PNG_FIXTURE });
  });
}

/** Puts a complete draft into sessionStorage before the app loads. */
async function seedDraft(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        // about:blank has no storage
      }
    },
    [DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), values: VALID_DRAFT_VALUES })] as const,
  );
}

let consoleWatch: ReturnType<typeof watchConsole>;

test.beforeEach(async ({ page, context, baseURL }) => {
  consoleWatch = watchConsole(page);
  await injectSession(context, baseURL ?? "http://localhost:3000", { role: "SUPER_ADMIN" });
  // The leave guard (beforeunload) may ask on reload — accept it like a user would
  page.on("dialog", (dialog) => void dialog.accept());
});

test.afterEach(() => {
  expect(consoleWatch.problems, "console errors / warnings").toEqual([]);
});

test.describe("Product form — API error and draft states (mocked API)", () => {
  test("400 unitPriceMustBeLessThanPrice → back on the selling price, every value kept", async ({ page }) => {
    consoleWatch.allow(isFailedResourceLog);
    let submitted: Record<string, unknown> | null = null;
    await mockApi(page, async (route) => {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      await json(route, 400, { success: false, message: "unitPriceMustBeLessThanPrice", statusCode: 400, data: null });
    });

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-400", price: "27000", selling: "17000" });
    await expect(field(page, "Unit price")).toHaveValue("₩27,000");
    await clickNext(page);
    await expectStep(page, 2);
    await completeStep2(page);
    await clickNext(page);
    await expectStep(page, 3);
    await completeStep3(page, CATEGORY_PATH);
    await clickNext(page);
    await expectStep(page, 4);
    await fillStep4(page, "HW3 mock ERP 400");
    await page.getByRole("button", { name: "Register", exact: true }).click();

    // The body that went out
    await expect.poll(() => submitted).not.toBeNull();
    expect(submitted).toMatchObject({
      productName: "HW3-Neeraj-mock-400",
      productCode: "PRD-E2E-0001",
      price: 27000,
      unitPrice: 17000,
      images: [IMAGE.filePath],
      isVisible: "yes",
      onSale: "yes",
      isOptions: "no",
      categoryId: 11,
      subCategoryId: 21,
      childCategoryId: 31,
      erpName: "HW3 mock ERP 400",
      quantity: 1,
      taxType: "tax",
      erpUnitPrice: 9000,
    });

    // Back on step 1, selling price focused with the API message, nothing lost
    await expectStep(page, 1);
    const selling = field(page, "Selling price");
    await expect(selling).toBeFocused();
    await expect(selling).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#product-unit-price-error")).toHaveText("The selling price must be lower than the unit price.");
    await expect(page.getByRole("button", { name: /Step 1: Basic info \(has errors\)/ })).toBeVisible();
    await expect(field(page, "Product name")).toHaveValue("HW3-Neeraj-mock-400");
    await expect(field(page, "Unit price")).toHaveValue("₩27,000");
    await expect(selling).toHaveValue("₩17,000");
    await expect(page.locator(".p-toast-message")).toContainText("The product was not registered");

    // The other steps still hold their values
    await page.getByRole("button", { name: /Step 4: ERP & review/ }).click();
    await expectStep(page, 4);
    await expect(field(page, "ERP product name")).toHaveValue("HW3 mock ERP 400");
    await expect(page.locator("[data-submit-error]")).toContainText("The selling price must be lower than the unit price.");
  });

  test("500 on submit → stays on review with the error box + toast, values kept", async ({ page }) => {
    consoleWatch.allow(isFailedResourceLog);
    await seedDraft(page);
    await mockApi(page, (route) => json(route, 500, { success: false, message: "Internal server error", statusCode: 500, data: null }));

    await page.goto(`${CREATE_URL}?step=4`);
    await expectStep(page, 4);
    await expect(page.getByText("Draft restored")).toBeVisible();
    await page.getByRole("button", { name: "Register", exact: true }).click();

    const alert = page.locator("[data-submit-error]");
    await expect(alert).toContainText("Something went wrong on the server. Please try again.");
    await expect(alert).toBeFocused();
    await expect(page.locator(".p-toast-message")).toContainText("The product was not registered");
    await expectStep(page, 4);
    await expect(field(page, "ERP product name")).toHaveValue("HW3 mock ERP");
    await expect(page.locator(".product-review")).toContainText("HW3-Neeraj-mock-product");
    await expect(page.getByRole("button", { name: "Register", exact: true })).toBeEnabled();
  });

  test("network error on submit → connection message, values kept", async ({ page }) => {
    consoleWatch.allow(isFailedResourceLog);
    await seedDraft(page);
    await mockApi(page, (route) => route.abort("internetdisconnected"));

    await page.goto(`${CREATE_URL}?step=4`);
    await expectStep(page, 4);
    await page.getByRole("button", { name: "Register", exact: true }).click();

    await expect(page.locator("[data-submit-error]")).toContainText("Cannot reach the server. Check your connection and try again.");
    await expect(page.locator(".p-toast-message")).toContainText("The product was not registered");
    await page.getByRole("button", { name: /Step 1: Basic info/ }).click();
    await expectStep(page, 1);
    await expect(field(page, "Product name")).toHaveValue("HW3-Neeraj-mock-product");
    await expect(field(page, "Selling price")).toHaveValue("₩17,000");
  });

  test("draft is restored after a reload, Discard empties the form", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await field(page, "Product name").fill("HW3-Neeraj-draft-check");
    await field(page, "Unit price").fill("15000");
    await expect
      .poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY))
      .toContain("HW3-Neeraj-draft-check");

    await page.reload();
    await expect(page.getByText("Draft restored")).toBeVisible();
    await expect(field(page, "Product name")).toHaveValue("HW3-Neeraj-draft-check");
    await expect(field(page, "Unit price")).toHaveValue("₩15,000");

    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Draft restored")).toHaveCount(0);
    await expect(field(page, "Product name")).toHaveValue("");
    expect(await page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY)).toBeNull();
  });

  test("?step=3 typed into the URL with an empty form goes back to step 1", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));

    await page.goto(`${CREATE_URL}?step=3`);
    await expectStep(page, 1);
    await expect(page.locator("#product-name-error")).toHaveText("Enter the product name.");
    await expect(page.getByRole("button", { name: /Step 3: Category & options/ })).toBeDisabled();
  });

  test("image type / size rejected before upload (.txt and 11 MB) — no upload request", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));
    const uploadCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/utils/upload-file-urls")) uploadCalls.push(request.url());
    });

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-files", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);
    await page.locator("#product-images-input").setInputFiles([
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
      { name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024, 1) },
    ]);

    const rejected = page.getByRole("alert", { name: "Files not added" });
    await expect(rejected).toContainText('"notes.txt" is not a supported image.');
    await expect(rejected).toContainText('"huge.png" is larger than 10 MB.');
    await expect(page.getByText("0 / 4 images")).toBeVisible();
    await clickNext(page);
    await expectStep(page, 2);
    await expect(page.locator("#product-images-error")).toHaveText("Add at least one image.");
    expect(uploadCalls).toEqual([]);
  });

  test("edit: read-only code + category, image keys and other option sets sent back unchanged", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    const product = {
      id: 501,
      uuid: "e2e-501",
      productName: "HW3-Neeraj-mock-edit",
      productCode: "PRD-000501",
      price: 30000,
      unitPrice: 20000,
      description: "Mocked product for edit",
      images: [`${S3_ORIGIN}/products/abc/one.png`, `${S3_ORIGIN}/products/def/two.png`],
      isVisible: true,
      onSale: false,
      isOptions: true,
      erpCode: "77",
      erpName: "ERP edit",
      erpUnitPrice: 15000,
      quantity: 3,
      taxType: "tax_free",
      category: { id: 11, name: CATEGORY_PATH.category },
      subCategory: { id: 21, name: CATEGORY_PATH.subCategory },
      childCategory: { id: 31, name: CATEGORY_PATH.childCategory },
      createdBy: 1,
      isSuspended: false,
      isDeleted: false,
      createdAt: "2026-11-13T01:00:00.000Z",
      updatedAt: "2026-11-13T01:00:00.000Z",
      productOptions: [
        { optionGroup: 1, type: "CATEGORY_OPTION", option: [{ optionId: 900, optionName: "Category option", optionCode: "C900", price: 1000 }] },
        { optionGroup: 2, type: "SINGLE_VOLUME", option: [{ optionId: 901, optionName: "Workbook", optionCode: "W901", price: 5000 }] },
      ],
    };
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/501`, (route) => json(route, 200, ok(product)));
    await page.route(`${API_ORIGIN}/**/products/edit/501`, async (route) => {
      body = route.request().postDataJSON() as Record<string, unknown>;
      await json(route, 200, { success: true, message: "productCreatedSucessFully", data: null });
    });

    await page.goto("/shopping-mall/products/edit/501");
    const code = field(page, "Product code");
    await expect(code).toHaveValue("PRD-000501");
    await expect(code).toHaveAttribute("readonly", "");
    await field(page, "Product name").fill("HW3-Neeraj-mock-edit-2");
    await field(page, "Selling price").fill("19000");

    await page.getByRole("button", { name: /Step 3: Category & options/ }).click();
    await expectStep(page, 3);
    await expect(field(page, "Major category")).toHaveValue(CATEGORY_PATH.category);
    await expect(field(page, "Major category")).toHaveAttribute("readonly", "");
    await expect(page.getByText("Cannot be changed after registration")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Workbook", exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Step 4: ERP & review/ }).click();
    await expectStep(page, 4);
    await expect(field(page, "ERP code")).toHaveValue("77");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect.poll(() => body).not.toBeNull();
    expect(body).not.toHaveProperty("productCode");
    expect(body).toMatchObject({
      productName: "HW3-Neeraj-mock-edit-2",
      price: 30000,
      unitPrice: 19000,
      images: ["products/abc/one.png", "products/def/two.png"],
      isVisible: "yes",
      onSale: "no",
      isOptions: "yes",
      taxType: "tax_free",
      quantity: 3,
      categoryId: 11,
      subCategoryId: 21,
      childCategoryId: 31,
      productSets: [
        { optionGroup: 1, type: "CATEGORY_OPTION", option: [{ optionId: 900, price: 1000 }] },
        { optionGroup: 2, type: "SINGLE_VOLUME", option: [{ optionId: 901, price: 5000 }] },
      ],
    });
    await expect(page).toHaveURL(/\/shopping-mall\/products\/details\/501/);
    await expect(page.locator(".p-toast-message")).toContainText("Product saved");
  });

  test("375 px: compact stepper, one column, no horizontal page scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockApi(page, (route) => json(route, 200, ok(null)));

    await page.goto(CREATE_URL);
    await expect(page.getByText("Step 1 of 4 · Basic info")).toBeVisible();
    await fillStep1(page, { name: "HW3-Neeraj-mobile", price: "20000", selling: "10000" });
    // Enter in a field = Next
    await field(page, "Selling price").press("Enter");
    await expectStep(page, 2);
    await expect(page.getByText("Step 2 of 4 · Images & status")).toBeVisible();
    const scroll = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(scroll.width).toBeLessThanOrEqual(scroll.viewport);
  });

  test("Cancel asks first (design #21): No stays, Yes clears the draft and goes to the list", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await field(page, "Product name").fill("HW3-Neeraj-cancel-check");
    await expect
      .poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY))
      .toContain("HW3-Neeraj-cancel-check");

    const confirm = page.locator(".p-confirm-dialog");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(confirm).toContainText("All entered information will be deleted. Do you want to cancel?");
    await confirm.getByRole("button", { name: "No" }).click();
    await expect(page).toHaveURL(/\/products\/create/);
    await expect(field(page, "Product name")).toHaveValue("HW3-Neeraj-cancel-check");

    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await confirm.getByRole("button", { name: "Yes" }).click();
    await expect(page).toHaveURL(/\/shopping-mall\/products$/);
    expect(await page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY)).toBeNull();
  });

  test("edit of a missing product shows the not-found state", async ({ page }) => {
    consoleWatch.allow(isFailedResourceLog);
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/999999`, (route) =>
      json(route, 400, { success: false, message: "productNotFound", statusCode: 400, data: null }),
    );

    await page.goto("/shopping-mall/products/edit/999999");
    await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to list" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  });
});
