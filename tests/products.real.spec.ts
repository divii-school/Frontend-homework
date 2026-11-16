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
    await expect(table.locator("tbody tr")).toHaveCount(10);
    await expect(page.getByText(/^Total Posts: [\d,]+$/)).toBeVisible();
    // Prices use ₩ with commas; dates are YYYY/MM/DD HH:MM.
    await expect(table.locator("tbody tr").first()).toContainText(/₩[\d,]+/);
    await expect(table.locator("tbody tr").first()).toContainText(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);

    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page).toHaveURL("/shopping/products?page=2");
    await page.reload();
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");

    await page.getByLabel("Search by").selectOption("categoryName");
    await page.getByLabel("Search term").fill("ACE");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/shopping/products?search=ACE&type=categoryName");
    await expect(table.locator("tbody tr").first()).toContainText("ACE");

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
});
