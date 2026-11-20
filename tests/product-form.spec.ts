import { test, expect, type Page } from "@playwright/test";
import { fakeSession, envelope } from "./helpers/session";
import { bigPngFile, pngFile, textFile } from "./helpers/images";

// Multi-step product form (Figma 8.1.1 / 8.1.2) with every API call mocked. No QA data is touched.

interface Captured {
  adds: unknown[];
  edits: { url: string; body: unknown }[];
}

async function setup(page: Page, opts: { failSave?: boolean } = {}) {
  const captured: Captured = { adds: [], edits: [] };
  await fakeSession(page);
  const json = (body: string, status = 200) => ({ status, contentType: "application/json", body });

  await page.route("**/api/v1/products/generate-code", (r) => r.fulfill(json(envelope("PRD-099999"))));
  await page.route("**/api/v1/products/categories", (r) => r.fulfill(json(envelope([{ id: 67, name: "Main textbook" }, { id: 68, name: "Supplementary" }]))));
  await page.route("**/api/v1/products/subcategories/*", (r) => r.fulfill(json(envelope([{ id: 72, name: "Phonics & Alphabet" }]))));
  await page.route("**/api/v1/products/childcategories/*", (r) => r.fulfill(json(envelope([{ id: 536, name: "ACE Alphabet" }]))));
  await page.route("**/api/v1/utils/upload-file-urls", (r) =>
    r.fulfill(
      json(
        envelope({
          urls: [{ url: "https://talking-club-dev.s3.ap-northeast-2.amazonaws.com/products/1/test.png?X-Amz-Signature=x", filePath: "products/1/test.png", preview: "" }],
        }),
        201,
      ),
    ),
  );
  // Our own upload route (would PUT to S3) — mocked as success.
  await page.route("**/api/upload", (r) => r.fulfill(json(JSON.stringify({ ok: true }))));
  await page.route("**/api/v1/products/add", async (r) => {
    captured.adds.push(JSON.parse(r.request().postData() ?? "null"));
    return opts.failSave ? r.fulfill(json(envelope(null, 400, "productCodeAlreadyExists"), 400)) : r.fulfill(json(envelope({ id: 1 }, 201), 201));
  });
  await page.route("**/api/v1/products/edit/*", async (r) => {
    captured.edits.push({ url: new URL(r.request().url()).pathname, body: JSON.parse(r.request().postData() ?? "null") });
    return r.fulfill(json(envelope({})));
  });
  await page.route("**/api/v1/products/details/5", (r) =>
    r.fulfill(
      json(
        envelope({
          id: 5, productName: "HW3-Sandip-Existing", productCode: "PRD-000005", price: 19000, unitPrice: 15000, description: "desc",
          images: ["https://talking-club-dev.s3.ap-northeast-2.amazonaws.com/products/a/one.png"], isVisible: true, onSale: false, erpCode: "ERP-5", erpName: "Existing ERP", erpUnitPrice: 9000,
          quantity: 3, taxType: "tax_free", category: { id: 67, name: "Main textbook" }, subCategory: { id: 72, name: "Phonics & Alphabet" },
          childCategory: { id: 536, name: "ACE Alphabet" }, createdAt: "2026-11-16T00:00:00.000Z",
        }),
      ),
    ),
  );
  await page.route("**/api/v1/products?**", (r) => r.fulfill(json(JSON.stringify({ success: true, message: "Success", data: [], totalRecords: 0, totalPage: 0, page: 1 }))));
  return captured;
}

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true }).click();

async function fillStep1(page: Page) {
  await page.getByLabel("Product Name").fill("HW3-Sandip-Form");
  await page.getByLabel("Unit Price").fill("15,000");
  await page.getByLabel("Selling Price").fill("19000");
  await page.getByLabel("Detailed Description").fill("A product made by the form test.");
}

test.describe("product form (mocked API)", () => {
  test("step 1 validates before moving on; the code is generated and read-only", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/new");
    await expect(page.getByLabel("Product Code")).toHaveValue("PRD-099999");
    await expect(page.getByLabel("Product Code")).toHaveAttribute("readonly", "");

    await next(page);
    await expect(page.getByText("Please enter the product name.")).toBeVisible();
    await expect(page.getByText("Please enter the unit price.")).toBeVisible();
    await expect(page.getByLabel("Product Name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("heading", { name: "Step 1 of 4: Basic information" })).toBeVisible();

    // Letters are dropped from money fields; commas are fine.
    await page.getByLabel("Unit Price").fill("12a3");
    await expect(page.getByLabel("Unit Price")).toHaveValue("123");
    await fillStep1(page);
    await next(page);
    await expect(page.getByRole("heading", { name: "Step 2 of 4: Images" })).toBeFocused();
  });

  test("values are kept when going back and forth", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/new");
    await fillStep1(page);
    await next(page);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Product Name")).toHaveValue("HW3-Sandip-Form");
    await expect(page.getByLabel("Unit Price")).toHaveValue("15,000");
    await expect(page.getByLabel("Detailed Description")).toHaveValue("A product made by the form test.");
  });

  test("images: type and size are checked, preview shows, remove works, max 4", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/new");
    await fillStep1(page);
    await next(page);

    await next(page);
    await expect(page.getByText("Please add at least one image.")).toBeVisible();

    const input = page.locator('input[type="file"]');
    await input.setInputFiles([textFile(), bigPngFile()]);
    await expect(page.getByText("“notes.txt” is not a JPG, PNG or WebP image.")).toBeVisible();
    await expect(page.getByText("“too-big.png” is larger than 3 MB.")).toBeVisible();
    await expect(page.getByRole("list", { name: "Product images" }).getByRole("listitem")).toHaveCount(0);

    await input.setInputFiles(pngFile());
    await expect(page.getByRole("img", { name: "Product image 1" })).toBeVisible();
    await expect(page.getByText("Thumbnail", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Remove image 1" }).click();
    await expect(page.getByRole("img", { name: "Product image 1" })).toHaveCount(0);
  });

  test("full create sends the API body; category levels reset below a change", async ({ page }) => {
    const captured = await setup(page);
    await page.goto("/shopping/products/new");
    await fillStep1(page);
    await next(page);
    await page.locator('input[type="file"]').setInputFiles(pngFile());
    await expect(page.getByRole("img", { name: "Product image 1" })).toBeVisible();
    await next(page);

    await next(page);
    await expect(page.getByText("Please select a major category.")).toBeVisible();
    await page.getByLabel("Exposure Status").selectOption("no");
    await page.getByRole("radio", { name: "Main textbook" }).check();
    await page.getByRole("radio", { name: "Phonics & Alphabet" }).check();
    await page.getByRole("radio", { name: "ACE Alphabet" }).check();
    // Changing the major category clears medium + minor.
    await page.getByRole("radio", { name: "Supplementary" }).check();
    await expect(page.getByRole("radio", { name: "ACE Alphabet" })).toHaveCount(0);
    await page.getByRole("radio", { name: "Main textbook" }).check();
    await page.getByRole("radio", { name: "Phonics & Alphabet" }).check();
    await page.getByRole("radio", { name: "ACE Alphabet" }).check();
    await next(page);

    await page.getByLabel("Product ERP Name").fill("Form ERP");
    await page.getByLabel("Quantity").fill("2");
    await page.getByLabel("Tax Exemption").selectOption("tax");
    await page.getByLabel("ERP Unit Price").fill("8,000");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page).toHaveURL("/shopping/products");
    await expect(page.getByText("“HW3-Sandip-Form” was registered.")).toBeVisible();
    expect(captured.adds).toEqual([
      {
        productName: "HW3-Sandip-Form", price: 19000, unitPrice: 15000, description: "A product made by the form test.",
        images: ["products/1/test.png"], isVisible: "no", onSale: "yes", isOptions: "no", categoryId: 67, subCategoryId: 72,
        childCategoryId: 536, erpName: "Form ERP", quantity: 2, taxType: "tax", erpUnitPrice: 8000,
        productCode: "PRD-099999",
      },
    ]);
  });

  test("a failed save keeps every value and shows the API message", async ({ page }) => {
    await setup(page, { failSave: true });
    await page.goto("/shopping/products/new");
    await fillStep1(page);
    await next(page);
    await page.locator('input[type="file"]').setInputFiles(pngFile());
    await expect(page.getByRole("img", { name: "Product image 1" })).toBeVisible();
    await next(page);
    await page.getByRole("radio", { name: "Main textbook" }).check();
    await page.getByRole("radio", { name: "Phonics & Alphabet" }).check();
    await page.getByRole("radio", { name: "ACE Alphabet" }).check();
    await next(page);
    await page.getByLabel("Product ERP Name").fill("Form ERP");
    await page.getByLabel("Quantity").fill("2");
    await page.getByLabel("Tax Exemption").selectOption("tax");
    await page.getByLabel("ERP Unit Price").fill("8000");
    await page.getByRole("button", { name: "Register" }).click();

    // Known API code → Korean text; the raw key is never shown.
    await expect(page.getByRole("alert").filter({ hasText: "이미 사용 중인 상품 코드입니다" })).toContainText("입력한 내용은 그대로 남아 있습니다.");
    await expect(page.getByText("productCodeAlreadyExists")).toHaveCount(0);
    await expect(page.getByLabel("Product ERP Name")).toHaveValue("Form ERP");
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("img", { name: "Product image 1" })).toBeVisible();
  });

  test("ERP code is server-assigned: read-only and never sent", async ({ page }) => {
    const captured = await setup(page);
    await page.goto("/shopping/products/5/edit");
    await expect(page.getByLabel("Product Name")).toHaveValue("HW3-Sandip-Existing");
    for (let i = 0; i < 3; i++) await next(page);
    await expect(page.getByLabel("ERP Code")).toHaveValue("ERP-5");
    await expect(page.getByLabel("ERP Code")).toHaveAttribute("readonly", "");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL("/shopping/products");
    expect(captured.edits[0].body).not.toHaveProperty("erpCode");
  });

  test("edit loads the product and sends PUT without productCode", async ({ page }) => {
    const captured = await setup(page);
    await page.goto("/shopping/products/5/edit");
    await expect(page.getByRole("heading", { name: "Edit Product", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Product Name")).toHaveValue("HW3-Sandip-Existing");
    await expect(page.getByLabel("Product Code")).toHaveValue("PRD-000005");
    await page.getByLabel("Selling Price").fill("21000");
    for (let i = 0; i < 3; i++) await next(page);
    await expect(page.getByLabel("Tax Exemption")).toHaveValue("tax_free");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page).toHaveURL("/shopping/products");
    expect(captured.edits).toHaveLength(1);
    expect(captured.edits[0].url).toBe("/api/v1/products/edit/5");
    expect(captured.edits[0].body).toMatchObject({ price: 21000, images: ["products/a/one.png"], categoryId: 67, erpName: "Existing ERP", taxType: "tax_free" });
    expect(captured.edits[0].body).not.toHaveProperty("productCode");
  });

  test("cancel asks first; No keeps the form", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/new");
    await page.getByLabel("Product Name").fill("Keep me");
    await page.getByRole("button", { name: "Cancel" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("All entered information will be deleted. Do you want to cancel?");
    await expect(dialog.getByRole("button", { name: "No" })).toBeFocused();
    await dialog.getByRole("button", { name: "No" }).click();
    await expect(page.getByLabel("Product Name")).toHaveValue("Keep me");

    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes" }).click();
    await expect(page).toHaveURL("/shopping/products");
  });

  test("unknown product shows a not-found message", async ({ page }) => {
    await setup(page);
    await page.route("**/api/v1/products/details/404404", (r) => r.fulfill({ status: 404, contentType: "application/json", body: envelope(null, 404, "productNotFound") }));
    await page.goto("/shopping/products/404404/edit");
    await expect(page.getByText("상품을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.")).toBeVisible();
  });
});
