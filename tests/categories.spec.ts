import { fakeSession } from "./helpers/session";
import { test, expect, type Page } from "@playwright/test";

// Read-only UI tests for 8.2.0 with the category API mocked (page.route), so they don't depend on QA data.
// A fake session is put in sessionStorage so the route guard lets the page render.

const TREE = [
  {
    id: 67,
    name: "Main textbook",
    subCategories: [
      { id: 72, name: "Phonics & Alphabet", childCategories: [{ id: 536, name: "ACE Alphabet" }, { id: 645, name: "ACE Phonics" }] },
      { id: 494, name: "ACE", childCategories: [{ id: 500, name: "Insider" }] },
    ],
  },
  { id: 74, name: "Main", subCategories: [{ id: 166, name: "Booster" }] },
];

function envelope(data: unknown, statusCode = 200) {
  return JSON.stringify({ success: statusCode < 400, message: statusCode < 400 ? "ok" : "Something went wrong", data, errors: null, statusCode });
}

async function openWithMock(page: Page, handler: (search: string | null) => { status: number; data: unknown }, path = "/shopping/categories") {
  await fakeSession(page);
  await page.route("**/api/v1/product-category/list**", async (route) => {
    const search = new URL(route.request().url()).searchParams.get("search");
    const { status, data } = handler(search);
    await route.fulfill({ status, contentType: "application/json", body: envelope(data, status) });
  });
  await page.goto(path);
}

const tree = (page: Page) => page.getByRole("region", { name: "Category tree" });

test.describe("product category management", () => {
  test("logged-out user is sent to login", async ({ page }) => {
    await page.goto("/shopping/categories");
    await expect(page).toHaveURL("/login?next=%2Fshopping%2Fcategories");
  });

  test("renders the 3-level tree expanded, with codes and child counts", async ({ page }) => {
    await openWithMock(page, () => ({ status: 200, data: TREE }));
    await expect(page.getByRole("heading", { name: "Product Category Management" })).toBeVisible();
    await expect(tree(page).getByText("ACE Alphabet", { exact: true })).toBeVisible();
    await expect(tree(page).getByText("[536]", { exact: true })).toBeVisible();
    await expect(tree(page).getByText("(2 subcategories)", { exact: true }).first()).toBeVisible();
    // A subcategory with no children shows no count.
    await expect(tree(page).getByText("(0 subcategories)", { exact: true })).toHaveCount(0);
  });

  test("Fold all / Expand all and a single toggle", async ({ page }) => {
    await openWithMock(page, () => ({ status: 200, data: TREE }));
    await page.getByRole("button", { name: "Fold all" }).click();
    await expect(tree(page).getByText("Phonics & Alphabet", { exact: true })).toBeHidden();

    await page.getByRole("button", { name: "Expand Main textbook" }).click();
    await expect(tree(page).getByText("Phonics & Alphabet", { exact: true })).toBeVisible();
    await expect(tree(page).getByText("ACE Alphabet", { exact: true })).toBeHidden();

    await page.getByRole("button", { name: "Expand all" }).click();
    await expect(tree(page).getByText("ACE Alphabet", { exact: true })).toBeVisible();
  });

  test("search goes to the server, lives in the URL and survives a reload", async ({ page }) => {
    const seen: (string | null)[] = [];
    await openWithMock(page, (search) => {
      seen.push(search);
      return { status: 200, data: search ? [TREE[1]] : TREE };
    });
    await page.getByPlaceholder("Category search...").fill("Main");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/shopping/categories?search=Main");
    await expect(tree(page).getByText("Booster", { exact: true })).toBeVisible();
    await expect(tree(page).getByText("Main textbook", { exact: true })).toBeHidden();
    expect(seen).toContain("Main");

    await page.reload();
    await expect(page.getByPlaceholder("Category search...")).toHaveValue("Main");
    await expect(tree(page).getByText("Booster", { exact: true })).toBeVisible();
  });

  test("empty search result message", async ({ page }) => {
    await openWithMock(page, () => ({ status: 200, data: [] }), "/shopping/categories?search=nothing");
    await expect(tree(page).getByText("No search results found.", { exact: true })).toBeVisible();
  });

  test("server error shows a message and Try again", async ({ page }) => {
    // Fail until the error is on screen (covers React Query's single retry), then recover.
    let failing = true;
    await openWithMock(page, () => (failing ? { status: 500, data: null } : { status: 200, data: TREE }));
    await expect(tree(page).getByRole("alert")).toContainText("서버에 문제가 발생했습니다", { timeout: 10_000 });
    failing = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(tree(page).getByText("Main textbook", { exact: true })).toBeVisible();
  });
});
