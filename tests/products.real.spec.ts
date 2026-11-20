import { test, expect } from "@playwright/test";
import { realLogin, realLogout } from "./helpers/realLogin";

// READ-ONLY against the QA API: logs in, reads lists, logs out. Never creates, edits or deletes anything.

test.describe("real QA API (read-only)", () => {
  test("product list: rows, paging and search in the URL", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") errors.push(msg.text());
    });

    await realLogin(page, "/shopping/products");
    const table = page.getByRole("table");
    // First request after a fresh dev-server compile can be slow on QA.
    await expect(table.locator("tbody tr").first()).toContainText(/₩/, { timeout: 20_000 });
    await expect(table.locator("tbody tr")).toHaveCount(10);
    await expect(page.getByText(/^Total Posts: [\d,]+$/)).toBeVisible();
    // Prices use ₩ with commas; dates use the WM format YYYY-MM-DD h:mm AM (KST).
    await expect(table.locator("tbody tr").first()).toContainText(/₩[\d,]+/);
    await expect(table.locator("tbody tr").first()).toContainText(/\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} (AM|PM)/);

    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page).toHaveURL("/shopping/products?page=2");
    await page.reload();
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");

    await page.getByLabel("Search by").selectOption("categoryName");
    // "ACE" is avoided: its first page is only deleted test products (API issue A2). 주교재 = a main category.
    await page.getByLabel("Search term").fill("주교재");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`/shopping/products?search=${encodeURIComponent("주교재")}&type=categoryName`);
    await expect(table.locator("tbody tr").first()).toContainText("주교재");

    await realLogout(page);
    expect(errors).toEqual([]);
  });

  test("category tree loads from the real API", async ({ page }) => {
    await realLogin(page, "/shopping/categories");
    const tree = page.getByRole("region", { name: "Category tree" });
    await expect(tree.getByRole("listitem").first()).toBeVisible();
    await expect(tree.getByText(/^\[\d+\]$/).first()).toBeVisible();
    await realLogout(page);
  });

  test("product details: overview, sessions and same-category tabs load real data", async ({ page }) => {
    // 10598 = an existing QA product linked to a class session (read-only).
    await realLogin(page, "/shopping/products/10598");
    await expect(page.getByRole("tabpanel")).toContainText(/₩[\d,]+/, { timeout: 20_000 });
    await page.getByRole("tab", { name: "Sessions" }).click();
    await expect(page).toHaveURL("/shopping/products/10598?tab=sessions");
    await expect(page.getByRole("tabpanel").locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("tab", { name: "Same category" }).click();
    await expect(page.getByRole("tabpanel").locator("tbody tr, [role=status]").first()).toBeVisible({ timeout: 20_000 });
    await realLogout(page);
  });
});
