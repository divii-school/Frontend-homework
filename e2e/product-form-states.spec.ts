import { test, expect, type Page, type Request, type Route } from "@playwright/test";
import { injectSession } from "./helpers";
import {
  API_BASE,
  CREATE_URL,
  MAX_IMAGE_MB,
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
// The app's own upload route (/api/upload) is mocked in the browser too, so no test reaches S3; the route
// itself is tested in upload-route-states.spec.ts.
//   1. submit → 400 unitPriceMustBeLessThanPrice → back on the selling price (step 1), values kept
//   2. submit → 500 → still on step 4, error box + toast, values kept
//   3. submit → network error → same, with the connection message
//   3b. create: a restored draft gets the server's fresh code; Register fetches the code again right before the POST
//   4. draft restored after reload (+ Discard)
//   5. ?step=3 typed into the URL with an empty form → sent back to step 1
//   6. image type / size rejected before any upload request
//   6b. upload: the browser sends the file + signed URL to /api/upload, never straight to S3
//   6c. a comma in the file name is removed (upload-URL request + upload form)
//   6d. /api/upload refuses (502, 413) → message on the image + Retry; Retry works
//   6e. a 5th image is blocked: remove → add → Undo → Retry
//   6f. edit of a product that already has 5 images: Save is stopped by the form rule (no request)
//   7. edit: read-only code + category; image keys + other option sets go back unchanged in the PUT body
//   7b. edit draft: restored after a reload while the product on the server is unchanged
//   7c. edit draft: dropped with a notice when the product changed (updatedAt, options only, old draft)
//   7d. edit draft after browser Back: compared with a copy fetched now, not with the cached one
//   8. 375 px: compact stepper, Enter = Next, no horizontal page scroll
//   9. Cancel asks first (design #21): No stays, Yes clears the draft and opens the list
//   9b. Log out in the top bar removes the draft of this tab
//  10. edit of a missing product → not-found state

test.use({ storageState: { cookies: [], origins: [] } });

const API_ORIGIN = API_BASE ? new URL(API_BASE).origin : "http://api.invalid";
const S3_ORIGIN = "https://hw3-s3-mock.test";
const DRAFT_KEY = "hw3-product-draft-create";
const EDIT_DRAFT_KEY = "hw3-product-draft-edit-501";
const EDIT_URL = "/shopping-mall/products/edit/501";
const UPLOAD_ROUTE = "**/api/upload";
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

/** GET /products/details/501 — the product the edit tests open. */
const EDIT_PRODUCT = {
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
/** The notice the edit form shows when it throws a saved draft away (FORM_MESSAGES.draftOutdated). */
const DRAFT_OUTDATED_NOTICE = "Your saved draft was not restored: this product was changed after the draft was saved.";

type SubmitHandler = (route: Route) => Promise<void>;

/** What the browser sent to /api/upload: the signed URL and the file name of the multipart form. */
interface UploadCall {
  url: string;
  fileName: string;
}
let uploadCalls: UploadCall[] = [];
/** Every write the browser sends straight to S3 — must stay empty in every test. */
let directS3Writes: string[] = [];

/** Reads the two form parts out of the raw multipart body. */
function readUploadForm(request: Request): UploadCall {
  const body = request.postDataBuffer()?.toString("utf-8") ?? "";
  return {
    url: /name="url"\r\n\r\n([^\r\n]*)/.exec(body)?.[1] ?? "",
    fileName: /name="file"; filename="([^"]*)"/.exec(body)?.[1] ?? "",
  };
}

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
  // The app's own upload route: accepts the file and remembers what the browser sent
  await page.route(UPLOAD_ROUTE, (route) => {
    uploadCalls.push(readUploadForm(route.request()));
    return json(route, 200, { ok: true });
  });
  // Fake S3: only the preview image is read from it. The browser must never write to S3 itself any more.
  await page.route(`${S3_ORIGIN}/**`, (route) => {
    const method = route.request().method();
    if (method !== "GET") {
      directS3Writes.push(`${method} ${route.request().url()}`);
      return route.fulfill({ status: 403, headers: CORS, body: "" });
    }
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

/** The stored draft of the edit form of product 501 (raw JSON), or null. */
function readEditDraft(page: Page) {
  return page.evaluate((key) => window.sessionStorage.getItem(key), EDIT_DRAFT_KEY);
}

let consoleWatch: ReturnType<typeof watchConsole>;

test.beforeEach(async ({ page, context, baseURL }) => {
  uploadCalls = [];
  directS3Writes = [];
  consoleWatch = watchConsole(page);
  await injectSession(context, baseURL ?? "http://localhost:3000", { role: "SUPER_ADMIN" });
  // The leave guard (beforeunload) may ask on reload — accept it like a user would
  page.on("dialog", (dialog) => void dialog.accept());
});

test.afterEach(() => {
  expect(consoleWatch.problems, "console errors / warnings").toEqual([]);
  expect(directS3Writes, "the browser never writes to S3 itself (uploads go through /api/upload)").toEqual([]);
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

  test("create: a restored draft gets a fresh code, Register sends a code fetched right before the POST", async ({ page }) => {
    await seedDraft(page); // its code is PRD-E2E-0001
    let submitted: Record<string, unknown> | null = null;
    await mockApi(page, async (route) => {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      await json(route, 200, ok(null));
    });
    let lastCode = "";
    let codeCalls = 0;
    await page.route(`${API_ORIGIN}/**/products/generate-code`, (route) => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      codeCalls += 1;
      lastCode = `PRD-E2E-${1000 + codeCalls}`;
      return json(route, 200, ok(lastCode));
    });

    await page.goto(`${CREATE_URL}?step=4`);
    await expectStep(page, 4);
    await expect(page.getByText("Draft restored")).toBeVisible();
    const review = page.locator(".product-review");
    await expect(review).toContainText(/PRD-E2E-1\d{3}/);
    await expect(review).not.toContainText("PRD-E2E-0001");
    const shownCode = /PRD-E2E-1\d{3}/.exec((await review.textContent()) ?? "")?.[0];

    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect.poll(() => submitted).not.toBeNull();
    expect(submitted).toMatchObject({ productCode: lastCode });
    expect(lastCode).not.toBe(shownCode);
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

  test("image type / size rejected before upload (.txt and 1 MB above the limit) — no upload request", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));
    const uploadUrlCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/utils/upload-file-urls")) uploadUrlCalls.push(request.url());
    });

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-files", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);
    await page.locator("#product-images-input").setInputFiles([
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
      { name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc((MAX_IMAGE_MB + 1) * 1024 * 1024, 1) },
    ]);

    const rejected = page.getByRole("alert", { name: "Files not added" });
    await expect(rejected).toContainText('"notes.txt" is not a supported image.');
    await expect(rejected).toContainText(`"huge.png" is larger than ${MAX_IMAGE_MB} MB.`);
    // The hint under the field names the same limit
    await expect(page.locator(".product-form-step:not([hidden])")).toContainText(`up to ${MAX_IMAGE_MB} MB each`);
    await expect(page.getByText("0 / 4 images")).toBeVisible();
    await clickNext(page);
    await expectStep(page, 2);
    await expect(page.locator("#product-images-error")).toHaveText("Add at least one image.");
    expect(uploadUrlCalls).toEqual([]);
    expect(uploadCalls).toEqual([]);
  });

  test("upload: the file and the signed URL go to /api/upload, never straight to S3", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));
    const signedUrl = `${S3_ORIGIN}/upload/${IMAGE.filePath}?X-Amz-Signature=e2e`;

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-upload", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);
    await page.locator("#product-images-input").setInputFiles(PNG_FIXTURE);

    // The image joins the form only after the upload route answered { ok: true }
    await expect(page.getByRole("button", { name: /^Remove image 1:/ })).toBeVisible();
    await expect(page.getByText("1 / 4 images")).toBeVisible();
    expect(uploadCalls).toEqual([{ url: signedUrl, fileName: IMAGE.name }]);
    // (afterEach also checks that no PUT went to S3 from the browser)
  });

  test("a comma in the file name is removed before the upload (API request and upload form)", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));
    let uploadUrlBody: Record<string, unknown> | null = null;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/utils/upload-file-urls")) {
        uploadUrlBody = request.postDataJSON() as Record<string, unknown>;
      }
    });

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-comma", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);
    await page.locator("#product-images-input").setInputFiles({
      name: "red,blue, final,.PNG",
      mimeType: "image/png",
      buffer: Buffer.from("small fake png"),
    });

    await expect(page.getByText("1 / 4 images")).toBeVisible();
    // The API builds the S3 key from this name → no comma may reach it; the extension stays
    expect(uploadUrlBody).toMatchObject({ fileName: "redblue final.PNG", extension: "png", count: 1 });
    expect(uploadCalls.map((call) => call.fileName)).toEqual(["redblue final.PNG"]);
  });

  test("the upload route refuses (502, then 413) → message on the image with Retry; Retry works", async ({ page }) => {
    consoleWatch.allow(isFailedResourceLog);
    await mockApi(page, (route) => json(route, 200, ok(null)));
    // 1st try: S3 refused (our JSON). 2nd try: the host cuts the request off (413, not JSON — like Vercel). 3rd: fine.
    let attempt = 0;
    await page.route(UPLOAD_ROUTE, (route) => {
      attempt += 1;
      if (attempt === 1) return json(route, 502, { ok: false, message: "uploadFailed" });
      if (attempt === 2) return route.fulfill({ status: 413, contentType: "text/plain", body: "Request Entity Too Large" });
      return json(route, 200, { ok: true });
    });

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-retry", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);
    await page.locator("#product-images-input").setInputFiles(PNG_FIXTURE);

    const failed = page.locator(".image-upload-item-failed");
    await expect(failed).toContainText("The image could not be uploaded. Please try again.");
    await expect(page.getByText("0 / 4 images")).toBeVisible(); // a failed upload never joins the form
    await failed.getByRole("button", { name: "Retry" }).click();
    await expect(failed).toContainText("The image is too large to upload. Please choose a smaller file.");
    await failed.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("button", { name: /^Remove image 1:/ })).toBeVisible();
    await expect(page.getByText("1 / 4 images")).toBeVisible();
    await expect(failed).toHaveCount(0);
    // An upload error is shown on the image itself — no toast on top of it
    await expect(page.locator(".p-toast-message")).toHaveCount(0);
  });

  test("a 5th image is blocked: 3 images + 1 failed → remove → add → Undo → Retry stays at 4", async ({ page }) => {
    consoleWatch.allow(isFailedResourceLog);
    await mockApi(page, (route) => json(route, 200, ok(null)));
    // Every file gets its own S3 key (from its name); the upload of "fail.png" is refused
    await page.route(`${API_ORIGIN}/**/utils/upload-file-urls`, (route) => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      const { fileName } = route.request().postDataJSON() as { fileName: string };
      const filePath = `products/e2e-mock/${fileName}`;
      return json(route, 200, ok({ urls: [{ url: `${S3_ORIGIN}/upload/${filePath}`, preview: `${S3_ORIGIN}/${filePath}`, filePath }] }));
    });
    await page.route(UPLOAD_ROUTE, (route) => {
      const call = readUploadForm(route.request());
      uploadCalls.push(call);
      return call.fileName === "fail.png" ? json(route, 502, { ok: false, message: "uploadFailed" }) : json(route, 200, { ok: true });
    });
    const png = (name: string) => ({ name, mimeType: "image/png", buffer: Buffer.from(`fake png ${name}`) });
    const input = page.locator("#product-images-input");
    const failed = page.locator(".image-upload-item-failed");

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await fillStep1(page, { name: "HW3-Neeraj-mock-max-images", price: "20000", selling: "10000" });
    await clickNext(page);
    await expectStep(page, 2);

    // 3 images + 1 failed upload
    await input.setInputFiles([png("a.png"), png("b.png"), png("c.png"), png("fail.png")]);
    await expect(page.getByText("3 / 4 images")).toBeVisible();
    await expect(failed).toContainText("The image could not be uploaded. Please try again.");

    // Remove one, add a new file, then bring the removed one back
    await page.getByRole("button", { name: "Remove image 1: a.png" }).click();
    await expect(page.getByText("2 / 4 images")).toBeVisible();
    await input.setInputFiles(png("d.png"));
    await expect(page.getByText("3 / 4 images")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("4 / 4 images")).toBeVisible();

    // Retry on the failed upload: no place left → not uploaded again, not added, and it says why
    const callsBeforeRetry = uploadCalls.length;
    await failed.getByRole("button", { name: "Retry" }).click();
    await expect(failed).toContainText('"fail.png" was not added: up to 4 images can be registered.');
    await expect(page.getByText("4 / 4 images")).toBeVisible();
    await expect(page.getByText("5 / 4 images")).toHaveCount(0);
    await expect(page.locator(".image-upload-item")).toHaveCount(5); // 4 images + the failed one
    expect(uploadCalls.length, "no upload request for a file that has no place").toBe(callsBeforeRetry);
    await expect(page.getByRole("button", { name: "Add file" })).toBeDisabled();
  });

  test("edit of a product that already has 5 images: Save is stopped by the form rule, no request", async ({ page }) => {
    // The API has no limit, so such a product can exist (saved before the form blocked the 5th image)
    const fiveImages = ["one", "two", "three", "four", "five"].map((name) => `${S3_ORIGIN}/products/e2e-mock/${name}.png`);
    let saveCalls = 0;
    let body: { images?: string[] } | null = null;
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/501`, (route) => json(route, 200, ok({ ...EDIT_PRODUCT, images: fiveImages })));
    await page.route(`${API_ORIGIN}/**/products/edit/501`, async (route) => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      saveCalls += 1;
      body = route.request().postDataJSON() as { images?: string[] };
      await json(route, 200, { success: true, message: "productCreatedSucessFully", data: null });
    });

    await page.goto(`${EDIT_URL}?step=4`);
    await expectStep(page, 4);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // Sent back to step 2 with the rule's message; nothing was saved
    await expectStep(page, 2);
    await expect(page.locator("#product-images-error")).toHaveText("Up to 4 images can be registered. Remove the extra images.");
    await expect(page.getByText("5 / 4 images")).toBeVisible();
    expect(saveCalls).toBe(0);

    // One image less → the message goes away and Save works with 4 images
    await page.getByRole("button", { name: /^Remove image 5:/ }).click();
    await expect(page.getByText("4 / 4 images")).toBeVisible();
    await expect(page.locator("#product-images-error")).toHaveCount(0);
    await page.getByRole("button", { name: /Step 4: ERP & review/ }).click();
    await expectStep(page, 4);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => saveCalls).toBe(1);
    expect(body).toMatchObject({ images: fiveImages.slice(0, 4).map((url) => url.replace(`${S3_ORIGIN}/`, "")) });
  });

  test("edit: read-only code + category, image keys and other option sets sent back unchanged", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/501`, (route) => json(route, 200, ok(EDIT_PRODUCT)));
    await page.route(`${API_ORIGIN}/**/products/edit/501`, async (route) => {
      body = route.request().postDataJSON() as Record<string, unknown>;
      await json(route, 200, { success: true, message: "productCreatedSucessFully", data: null });
    });

    await page.goto(EDIT_URL);
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

  test("edit draft: restored after a reload while the product on the server is unchanged", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/501`, (route) => json(route, 200, ok(EDIT_PRODUCT)));

    await page.goto(EDIT_URL);
    await expect(field(page, "Product name")).toHaveValue(EDIT_PRODUCT.productName);
    await field(page, "Product name").fill("HW3-Neeraj-edit-draft");
    await expect.poll(() => readEditDraft(page)).toContain("HW3-Neeraj-edit-draft");
    // The draft remembers which server copy it was started from
    const stored = JSON.parse((await readEditDraft(page)) ?? "{}") as { baseVersion?: string };
    expect(stored.baseVersion).toContain(EDIT_PRODUCT.updatedAt);

    await page.reload();
    await expect(page.getByText("Draft restored")).toBeVisible();
    await expect(field(page, "Product name")).toHaveValue("HW3-Neeraj-edit-draft");
    await expect(page.getByText(DRAFT_OUTDATED_NOTICE)).toHaveCount(0);
  });

  test("edit draft: dropped with a notice when the product changed on the server meanwhile", async ({ page }) => {
    // What the "server" answers — each step changes it between "draft saved" and "page opened again"
    let serverProduct = EDIT_PRODUCT;
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/501`, (route) => json(route, 200, ok(serverProduct)));

    const workbook = EDIT_PRODUCT.productOptions[1];
    const changes = [
      {
        title: "another admin saved the product (updatedAt moved)",
        changed: { ...EDIT_PRODUCT, productName: "HW3-Neeraj-saved-by-someone-else", updatedAt: "2026-11-14T09:30:00.000Z" },
      },
      {
        title: "only an option price changed (updatedAt stays the same)",
        changed: {
          ...EDIT_PRODUCT,
          productOptions: [EDIT_PRODUCT.productOptions[0], { ...workbook, option: [{ ...workbook.option[0], price: 7000 }] }],
        },
      },
    ];
    for (const { title, changed } of changes) {
      await test.step(title, async () => {
        serverProduct = EDIT_PRODUCT;
        await page.goto(EDIT_URL);
        await expect(field(page, "Product name")).toHaveValue(EDIT_PRODUCT.productName);
        await field(page, "Product name").fill("HW3-Neeraj-old-draft");
        await expect.poll(() => readEditDraft(page)).toContain("HW3-Neeraj-old-draft");

        serverProduct = changed;
        await page.reload();
        // The form shows the server's data, says why the draft is gone, and the draft is removed
        await expect(page.getByText(DRAFT_OUTDATED_NOTICE)).toBeVisible();
        await expect(page.getByText("Draft restored")).toHaveCount(0);
        await expect(field(page, "Product name")).toHaveValue(changed.productName);
        expect(await readEditDraft(page)).toBeNull();
      });
    }

    await test.step("a draft saved before this rule (no server copy stored with it) is not trusted either", async () => {
      serverProduct = EDIT_PRODUCT;
      await page.goto(EDIT_URL);
      await expect(field(page, "Product name")).toHaveValue(EDIT_PRODUCT.productName);
      await page.evaluate(
        ([key, value]) => window.sessionStorage.setItem(key, value),
        [EDIT_DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), values: { productName: "HW3-Neeraj-very-old-draft" } })] as const,
      );
      await page.reload();
      await expect(page.getByText(DRAFT_OUTDATED_NOTICE)).toBeVisible();
      await expect(field(page, "Product name")).toHaveValue(EDIT_PRODUCT.productName);
    });
  });

  test("edit draft after browser Back: reopening compares it with a copy fetched now, not the cached one", async ({ page }) => {
    let serverProduct = EDIT_PRODUCT;
    await mockApi(page, (route) => json(route, 200, ok(null)));
    await page.route(`${API_ORIGIN}/**/products/details/501`, (route) => json(route, 200, ok(serverProduct)));

    // Details page → Edit is a client-side navigation, so the loaded product stays in the query cache
    await page.goto("/shopping-mall/products/details/501");
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await expect(field(page, "Product name")).toHaveValue(EDIT_PRODUCT.productName);
    await field(page, "Product name").fill("HW3-Neeraj-back-draft");
    await expect.poll(() => readEditDraft(page)).toContain("HW3-Neeraj-back-draft");

    // Browser Back leaves the form without Cancel, so the draft stays
    await page.goBack();
    await expect(page).toHaveURL(/\/products\/details\/501/);
    expect(await readEditDraft(page)).toContain("HW3-Neeraj-back-draft");

    // Meanwhile another admin saves the product. The cache still holds the old copy.
    serverProduct = { ...EDIT_PRODUCT, productName: "HW3-Neeraj-saved-by-someone-else", updatedAt: "2026-11-14T09:30:00.000Z" };
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await expect(page.getByText(DRAFT_OUTDATED_NOTICE)).toBeVisible();
    await expect(field(page, "Product name")).toHaveValue("HW3-Neeraj-saved-by-someone-else");
    expect(await readEditDraft(page)).toBeNull();
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

  test("Log out in the top bar removes the draft of this tab", async ({ page }) => {
    await mockApi(page, (route) => json(route, 200, ok(null)));

    await page.goto(CREATE_URL);
    await expect(field(page, "Product code")).toHaveValue("PRD-E2E-0001");
    await field(page, "Product name").fill("HW3-Neeraj-logout-check");
    await expect
      .poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY))
      .toContain("HW3-Neeraj-logout-check");

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
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
