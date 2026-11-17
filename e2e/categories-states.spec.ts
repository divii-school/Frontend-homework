import { test, expect } from "@playwright/test";
import { injectSession, mockApi } from "./helpers";
import {
  FAILED_RESOURCE,
  fulfillJson,
  mockCategoryApi,
  nodeItem,
  nodeRow,
  sampleTree,
  visibleOrder,
  watchConsole,
} from "./categories.helpers";
import {
  checkDeleteBlocked,
  checkExpandCollapse,
  checkFormValidation,
  checkSearch,
  checkTreeRenders,
  countWrites,
  runCrudFlow,
} from "./categories.flows";

// 8.2.0 Product Category Management with a MOCKED API — passes while the QA server is down.
// Each test starts a fresh browser with a fake SUPER_ADMIN session (no saved login) and answers the
// category endpoints from memory (categories.helpers.ts). Tests tagged @failed-requests mock a
// 400 / 500 / network failure, so Chrome's "Failed to load resource" line is allowed there; any other
// console error or warning fails the test.
//
// Run alone (no QA login needed):  npx playwright test e2e/categories-states.spec.ts --project=chromium --no-deps

test.use({ storageState: { cookies: [], origins: [] } });

const PAGE_URL = "/shopping-mall/categories";
let problems: string[] = [];

test.beforeEach(async ({ page, context, baseURL }) => {
  problems = watchConsole(page, test.info().tags.includes("@failed-requests") ? [FAILED_RESOURCE] : []);
  await injectSession(context, baseURL ?? "http://localhost:3000", { role: "SUPER_ADMIN" });
  await mockApi(page);
});

test.afterEach(() => {
  expect(problems, "console errors / warnings").toEqual([]);
});

test.describe("Category screen states (mocked API)", () => {
  test("loading shows a tree-shaped skeleton, then the tree", async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/product-category\/list/, async (route) => {
      await gate;
      await fulfillJson(route, 200, { success: true, message: "", data: sampleTree(), totalRecords: 3, isCreatable: false });
    });

    await page.goto(PAGE_URL);
    await expect(page.getByRole("heading", { name: "Product Category Management", level: 1 })).toBeVisible();
    const skeleton = page.locator(".category-tree-skeleton");
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute("role", "status");

    release();
    await expect(skeleton).toHaveCount(0);
    await expect(nodeRow(page, "category", 67)).toBeVisible();
  });

  test("empty tree shows the first-use message; Register main category opens its dialog", async ({ page }) => {
    await mockCategoryApi(page, []);
    await page.goto(PAGE_URL);

    await expect(page.getByRole("heading", { name: "No categories yet" })).toBeVisible();
    const register = page.getByRole("button", { name: "Register main category" });
    await expect(register).toBeEnabled();
    await register.click();
    const dialog = page.getByRole("dialog", { name: "Register main category" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Category name")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("a search without matches shows 'No search results found'; Clear search resets it", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(`${PAGE_URL}?q=zzzz-nothing`);

    await expect(page.getByRole("heading", { name: "No search results found" })).toBeVisible();
    await expect(page.getByLabel("Search categories")).toHaveValue("zzzz-nothing");
    expect(mock.searches).toContain("zzzz-nothing");

    await page.getByRole("button", { name: "Clear search" }).first().click();
    await expect(page).toHaveURL(/\/shopping-mall\/categories$/);
    await expect(nodeRow(page, "category", 67)).toBeVisible();
  });

  test("500 error shows the server error state; Try again reloads", { tag: "@failed-requests" }, async ({ page }) => {
    await mockCategoryApi(page);
    let fail = true;
    await page.route(/\/product-category\/list/, (route) =>
      fail ? fulfillJson(route, 500, { success: false, message: "Internal server error", statusCode: 500 }) : route.fallback(),
    );

    await page.goto(PAGE_URL);
    const error = page.getByRole("alert").filter({ hasText: "Server error" });
    await expect(error).toBeVisible({ timeout: 15_000 });
    await expect(error).toContainText("Error code 500");
    await expect(page.getByRole("button", { name: "Register main category" })).toBeDisabled();

    fail = false;
    await error.getByRole("button", { name: "Try again" }).click();
    await expect(nodeRow(page, "category", 67)).toBeVisible();
  });

  test("network error shows the connection state; Try again reloads", { tag: "@failed-requests" }, async ({ page }) => {
    await mockCategoryApi(page);
    let offline = true;
    await page.route(/\/product-category\/list/, (route) => (offline ? route.abort("failed") : route.fallback()));

    await page.goto(PAGE_URL);
    const error = page.getByRole("alert").filter({ hasText: "Connection problem" });
    await expect(error).toBeVisible({ timeout: 15_000 });

    offline = false;
    await error.getByRole("button", { name: "Try again" }).click();
    await expect(nodeRow(page, "category", 67)).toBeVisible();
  });

  test("isCreatable=false disables Register main category and says why", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    mock.isCreatable = false;
    await page.goto(PAGE_URL);

    await expect(nodeRow(page, "category", 67)).toBeVisible();
    const register = page.getByRole("button", { name: "Register main category" });
    await expect(register).toBeDisabled();
    await expect(page.getByText("Up to 3 main categories can be registered. Delete one to add another.")).toBeVisible();
    await expect(register).toHaveAttribute("aria-describedby", "category-register-reason");
  });
});

test.describe("Category tree interactions (mocked API)", () => {
  test("renders 3 levels: [id] name, counts, level badges and the right add buttons", async ({ page }) => {
    await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    const main = nodeRow(page, "category", 67);
    await expect(main).toContainText("Main");
    await expect(main).toContainText("[67]");
    await expect(main).toContainText("(2 subcategories)");
    await expect(main.getByRole("button", { name: "Add subcategory to [67] Main" })).toBeVisible();

    const sub = nodeRow(page, "subCategory", 72);
    await expect(sub).toContainText("[72]Phonics & Alphabet");
    await expect(sub).toContainText("(2 minor categories)");
    await expect(sub.getByRole("button", { name: "Add minor category to [72] Phonics & Alphabet" })).toBeVisible();

    // Depth limit: nothing can be added under a minor category
    const minor = nodeRow(page, "childCategory", 536);
    await expect(minor.getByRole("button", { name: /^Add / })).toHaveCount(0);
    await expect(minor.getByRole("button", { name: "Edit [536] ACE Alphabet" })).toBeVisible();
    await expect(minor.getByRole("button", { name: "Delete [536] ACE Alphabet" })).toBeVisible();

    // A main category without children: count 0, no chevron
    await expect(nodeRow(page, "category", 80)).toContainText("(0 subcategories)");
    await expect(nodeRow(page, "category", 80).getByRole("button", { name: /^Subcategories of/ })).toHaveCount(0);
  });

  test("chevron toggles one row; Expand all / Collapse all toggle every row", async ({ page }) => {
    await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    const toggle = page.getByRole("button", { name: "Subcategories of [67] Main" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nodeItem(page, "subCategory", 72)).toBeHidden();
    await toggle.click();
    await expect(nodeItem(page, "subCategory", 72)).toBeVisible();

    await page.getByRole("button", { name: "Collapse all" }).click();
    await expect(nodeItem(page, "subCategory", 72)).toBeHidden();
    await expect(nodeItem(page, "subCategory", 166)).toBeHidden();
    await expect(page.locator('.category-toggle[aria-expanded="true"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Expand all" }).click();
    await expect(nodeItem(page, "childCategory", 536)).toBeVisible();
    await expect(nodeItem(page, "subCategory", 166)).toBeVisible();
  });

  test("search is sent to the API and kept in the URL (Enter and magnifier)", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(PAGE_URL);
    await expect(nodeRow(page, "category", 67)).toBeVisible();

    const box = page.getByLabel("Search categories");
    await box.fill("Phonics");
    await box.press("Enter");
    await expect(page).toHaveURL(/\?q=Phonics$/);
    await expect(nodeRow(page, "subCategory", 72)).toBeVisible();
    await expect(nodeItem(page, "category", 74)).toHaveCount(0);
    expect(mock.searches).toContain("Phonics");

    await box.fill("Booster");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\?q=Booster$/);
    await expect(nodeRow(page, "subCategory", 166)).toBeVisible();
    await expect(nodeItem(page, "category", 67)).toHaveCount(0);

    // Only part of the siblings is shown during a search → no reordering
    await expect(page.getByText("Clear the search to change the order.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Reorder / })).toHaveCount(0);

    // The term survives a reload (URL state)
    await page.reload();
    await expect(page.getByLabel("Search categories")).toHaveValue("Booster");
    await expect(nodeRow(page, "subCategory", 166)).toBeVisible();
  });

  test("Alt+↓ on a row moves it and saves the whole sibling order (keyboard reorder)", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    const handle = page.getByRole("button", { name: "Reorder [166] Booster" });
    await handle.focus();
    await page.keyboard.press("Alt+ArrowDown");

    await expect
      .poll(() => mock.writes)
      .toContainEqual({ method: "PUT", path: "/reorder-subcategories", body: { ids: [168, 166, 169] } });
    await expect(page.getByText("Order saved.")).toBeVisible();
    expect(await visibleOrder(page, 'li[data-level="category"][data-id="74"] > ul', "subCategory")).toEqual([168, 166, 169]);
    await expect(handle).toBeFocused();
  });

  test("drag-and-drop by the handle reorders within the same level", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    await page
      .getByRole("button", { name: "Reorder [536] ACE Alphabet" })
      .dragTo(nodeRow(page, "childCategory", 645));

    await expect
      .poll(() => mock.writes)
      .toContainEqual({ method: "PUT", path: "/reorder-subsubcategories", body: { ids: [645, 536] } });
    await expect
      .poll(() => visibleOrder(page, 'li[data-level="subCategory"][data-id="72"] > ul', "childCategory"))
      .toEqual([645, 536]);
  });

  test(
    "add dialog: required / spaces / 51 chars / duplicate are refused before the API; API duplicate shows on the field",
    { tag: "@failed-requests" },
    async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    const addButton = page.getByRole("button", { name: "Add subcategory to [74] Books" });
    await addButton.click();
    const dialog = page.getByRole("dialog", { name: "Add subcategory" });
    const input = dialog.getByLabel("Category name");
    await expect(input).toBeFocused();
    await expect(dialog).toContainText("[74] Books");

    await input.press("Enter");
    await expect(dialog.getByRole("alert")).toHaveText("Please enter a category name.");
    await input.fill("    ");
    await input.press("Enter");
    await expect(dialog.getByRole("alert")).toHaveText("Please enter a category name.");
    await input.fill("x".repeat(51));
    await input.press("Enter");
    await expect(dialog.getByRole("alert")).toHaveText("Use 50 characters or fewer.");
    await input.fill("  booster ");
    await input.press("Enter");
    await expect(dialog.getByRole("alert")).toHaveText("This name is already used at this level.");
    expect(mock.writes).toEqual([]);

    // The API's duplicate answer goes under the field, the dialog stays open
    await page.route(/\/product-category\/subcategory\/add/, (route) =>
      fulfillJson(route, 400, { success: false, message: "subCategoryAlreadyExists", statusCode: 400 }),
    );
    await input.fill("Something new");
    await input.press("Enter");
    await expect(dialog.getByRole("alert")).toHaveText("A middle category with this name already exists in this category.");
    await expect(input).toHaveAttribute("aria-invalid", "true");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(addButton).toBeFocused();
    },
  );

  test("add saves the trimmed name, opens the parent and shows a toast", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    await page.getByRole("button", { name: "Subcategories of [74] Books" }).click();
    await page.getByRole("button", { name: "Add subcategory to [74] Books" }).click();
    const dialog = page.getByRole("dialog", { name: "Add subcategory" });
    await dialog.getByLabel("Category name").fill("  HW3-Neeraj-mock  ");
    await dialog.getByRole("button", { name: "Register" }).click();

    await expect(page.getByText("Middle category added.")).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(mock.writes).toContainEqual({ method: "POST", path: "/subcategory/add", body: { name: "HW3-Neeraj-mock", categoryId: 74 } });
    await expect(nodeItem(page, "category", 74).getByText("HW3-Neeraj-mock")).toBeVisible();
  });

  test("delete is blocked while children exist (no request); a leaf is confirmed, then deleted", async ({ page }) => {
    const mock = await mockCategoryApi(page);
    await page.goto(PAGE_URL);

    await page.getByRole("button", { name: "Delete [67] Main" }).click();
    const blocked = page.getByRole("dialog", { name: "Cannot delete" });
    await expect(blocked).toContainText('Cannot delete "[67] Main": it has subcategories. Delete them first.');
    await blocked.getByRole("button", { name: "OK" }).click();
    await expect(blocked).toBeHidden();
    expect(mock.writes).toEqual([]);

    const deleteLeaf = page.getByRole("button", { name: "Delete [166] Booster" });
    await deleteLeaf.click();
    const confirm = page.getByRole("dialog", { name: "Delete subcategory" });
    await expect(confirm).toContainText('Delete the subcategory "[166] Booster"? This cannot be undone.');
    await confirm.getByRole("button", { name: "Cancel" }).click();
    expect(mock.writes).toEqual([]);

    await deleteLeaf.click();
    await confirm.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Middle category deleted.")).toBeVisible();
    expect(mock.writes).toEqual([{ method: "DELETE", path: "/subcategory/delete/166", body: null }]);
    await expect(nodeItem(page, "subCategory", 166)).toHaveCount(0);
  });

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
  ]) {
    test(`${viewport.width}px: no horizontal page scroll and ≥ 40px action buttons`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockCategoryApi(page);
      await page.goto(PAGE_URL);
      await expect(nodeRow(page, "childCategory", 536)).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      for (const name of ["Edit [536] ACE Alphabet", "Delete [536] ACE Alphabet", "Add minor category to [72] Phonics & Alphabet"]) {
        const box = await page.getByRole("button", { name }).boundingBox();
        expect(box, name).not.toBeNull();
        expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(40);
        expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(40);
      }
    });
  }
});

// The steps of the live specs (categories.flows.ts) against the in-memory API, so they are proven
// to work before the QA server is back.
test.describe("Live-spec steps against the in-memory API", () => {
  test("read-only steps send no writes", async ({ page }) => {
    await mockCategoryApi(page);
    const writes = countWrites(page);
    await checkTreeRenders(page);
    await checkSearch(page);
    await checkExpandCollapse(page);
    await checkFormValidation(page);
    await checkDeleteBlocked(page);
    expect(writes.count).toBe(0);
  });

  test("create → edit → reorder → delete steps leave nothing behind", async ({ page }) => {
    test.setTimeout(120_000);
    const mock = await mockCategoryApi(page);
    await runCrudFlow(page, "HW3-Neeraj-cat-mock");

    const names = JSON.stringify(mock.tree);
    expect(names).not.toContain("HW3-Neeraj-cat-mock");
    expect(mock.writes.map((write) => `${write.method} ${write.path}`)).toEqual([
      "POST /subcategory/add",
      "POST /subcategory-child/add",
      "POST /subcategory-child/add",
      expect.stringMatching(/^PUT \/subcategory-child\/edit\/\d+$/),
      "PUT /reorder-subsubcategories",
      expect.stringMatching(/^DELETE \/subcategory-child\/delete\/\d+$/),
      expect.stringMatching(/^DELETE \/subcategory-child\/delete\/\d+$/),
      expect.stringMatching(/^DELETE \/subcategory\/delete\/\d+$/),
    ]);
  });
});
