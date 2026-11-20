import { test, expect, type Page } from "@playwright/test";
import { fakeSession, envelope } from "./helpers/session";

// Product details page with tabs, every API call mocked (shapes captured from QA 2026-11-17).

const DETAIL = {
  id: 7, productName: "HW3-Sandip-Detail", productCode: "PRD-000007", price: 19000, unitPrice: 15000, description: "Line one\nLine two",
  images: [], isVisible: true, onSale: false, erpCode: "TC000007", erpName: "Detail ERP", erpUnitPrice: 9000, quantity: 3, taxType: "tax_free",
  category: { id: 67, name: "Main" }, subCategory: { id: 72, name: "Phonics" }, childCategory: { id: 536, name: "ACE Alphabet" },
  createdAt: "2026-11-16T03:00:00.000Z",
};

const paged = (data: unknown[], total: number, page = 1) => JSON.stringify({ success: true, message: "Success", data, totalRecords: total, totalPage: Math.ceil(total / 10), page });

interface Opts {
  sessionsFail?: boolean;
  sessionsEmpty?: boolean;
  detailFail?: boolean;
}

async function setup(page: Page, opts: Opts = {}) {
  const hits = { detail: 0, sessions: 0, related: 0 };
  let sessionsFail = opts.sessionsFail ?? false;
  await fakeSession(page);
  await page.route("**/api/v1/products/details/7", (r) => {
    hits.detail++;
    return opts.detailFail
      ? r.fulfill({ status: 500, contentType: "application/json", body: envelope(null, 500) })
      : r.fulfill({ status: 200, contentType: "application/json", body: envelope(DETAIL) });
  });
  await page.route("**/api/v1/session-products**", (r) => {
    hits.sessions++;
    if (sessionsFail) return r.fulfill({ status: 500, contentType: "application/json", body: envelope(null, 500) });
    const p = Number(new URL(r.request().url()).searchParams.get("page"));
    const rows = opts.sessionsEmpty
      ? []
      : Array.from({ length: p === 2 ? 2 : 10 }, (_, i) => ({ id: p * 100 + i, bookType: i === 0 ? "MAIN" : "OPTIONAL", isActive: i % 2 === 0, createdAt: "2026-10-15T19:30:51.000Z", session: { id: i, title: `Phonics${p}-${i}` } }));
    return r.fulfill({ status: 200, contentType: "application/json", body: paged(rows, opts.sessionsEmpty ? 0 : 12, p) });
  });
  await page.route("**/api/v1/products/get-products-by-category**", (r) => {
    hits.related++;
    const rows = [
      { id: 7, productName: "HW3-Sandip-Detail", productCode: "PRD-000007", price: 19000, isVisible: true, onSale: false },
      { id: 8, productName: "Sibling product", productCode: "PRD-000008", price: 5000, isVisible: false, onSale: true },
    ];
    return r.fulfill({ status: 200, contentType: "application/json", body: paged(rows, 2) });
  });
  return { hits, setSessionsFail: (v: boolean) => (sessionsFail = v) };
}

test.describe("product details tabs (mocked API)", () => {
  test("overview shows the product; only the overview data is fetched", async ({ page }) => {
    const { hits } = await setup(page);
    await page.goto("/shopping/products/7");
    await expect(page.getByRole("heading", { level: 1, name: "HW3-Sandip-Detail" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel).toContainText("₩19,000");
    await expect(panel).toContainText("Main > Phonics > ACE Alphabet");
    await expect(panel).toContainText("Tax-free");
    await expect(panel).toContainText("2026-11-16 12:00 PM");
    await expect(panel).toContainText("No images.");
    expect(hits.sessions).toBe(0);
    expect(hits.related).toBe(0);
    await expect(page.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/shopping/products/7/edit");
  });

  test("active tab lives in the URL, survives reload; tab paging too", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/7");
    await page.getByRole("tab", { name: "Sessions" }).click();
    await expect(page).toHaveURL("/shopping/products/7?tab=sessions");
    await expect(page.getByRole("tabpanel").locator("tbody tr")).toHaveCount(10);
    await expect(page.getByRole("tabpanel")).toContainText("Total: 12");

    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page).toHaveURL("/shopping/products/7?tab=sessions&page=2");
    await page.reload();
    await expect(page.getByRole("tab", { name: "Sessions" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").locator("tbody tr")).toHaveCount(2);

    // Changing tab resets the tab's page.
    await page.getByRole("tab", { name: "Same category" }).click();
    await expect(page).toHaveURL("/shopping/products/7?tab=related");
  });

  test("same-category tab hides the product itself and links to siblings", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/7?tab=related");
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("link", { name: "Sibling product" })).toHaveAttribute("href", "/shopping/products/8");
    await expect(panel.getByRole("link", { name: "HW3-Sandip-Detail" })).toHaveCount(0);
  });

  test("a failing tab shows its own error and retry; other tabs still work", async ({ page }) => {
    const { setSessionsFail } = await setup(page, { sessionsFail: true });
    await page.goto("/shopping/products/7?tab=sessions");
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("alert")).toContainText("서버에 문제가 발생했습니다", { timeout: 10_000 });

    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByRole("tabpanel")).toContainText("₩19,000");

    // Back on Sessions it fails again; then the API recovers and "Try again" loads it.
    await page.getByRole("tab", { name: "Sessions" }).click();
    await expect(page.getByRole("tabpanel").getByRole("alert")).toBeVisible({ timeout: 10_000 });
    setSessionsFail(false);
    await page.getByRole("tabpanel").getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("tabpanel").locator("tbody tr")).toHaveCount(10);
  });

  test("empty sessions tab message", async ({ page }) => {
    await setup(page, { sessionsEmpty: true });
    await page.goto("/shopping/products/7?tab=sessions");
    await expect(page.getByRole("tabpanel")).toContainText("This product isn't linked to any class session yet.");
  });

  test("overview error does not block the sessions tab", async ({ page }) => {
    await setup(page, { detailFail: true });
    await page.goto("/shopping/products/7");
    await expect(page.getByRole("tabpanel").getByRole("alert")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Product Details" })).toBeVisible();
    await page.getByRole("tab", { name: "Sessions" }).click();
    await expect(page.getByRole("tabpanel").locator("tbody tr")).toHaveCount(10);
  });

  test("keyboard: arrow keys move between tabs", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/7");
    await page.getByRole("tab", { name: "Overview" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Sessions" })).toBeFocused();
    await expect(page).toHaveURL("/shopping/products/7?tab=sessions");
    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Same category" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Overview" })).toBeFocused();
    await expect(page).toHaveURL("/shopping/products/7");
  });

  test("unknown tab in the URL falls back to Overview", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products/7?tab=nope");
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });
});
