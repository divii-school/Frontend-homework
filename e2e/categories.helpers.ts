import { expect, type Page, type Request, type Route } from "@playwright/test";

// Helpers for the 8.2.0 category specs only (categories*.spec.ts):
//  - watchConsole: collects console errors / warnings and page errors so each test can fail on them
//  - a small in-memory copy of the category API for the mocked spec (no QA server needed)

// ---- Console guard ------------------------------------------------------------------------------
/** "Failed to load resource" is what Chrome logs for a mocked 500 / aborted request — expected there. */
export const FAILED_RESOURCE = /Failed to load resource/;

/** Returns the list that fills up with console errors / warnings / page errors (minus `allow`). */
export function watchConsole(page: Page, allow: RegExp[] = []): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const type = message.type();
    if (type !== "error" && type !== "warning") return;
    const text = message.text();
    if (allow.some((pattern) => pattern.test(text))) return;
    problems.push(`${type}: ${text}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

/** True for calls that would change data (POST / PUT / DELETE to the category API). */
export function isCategoryWrite(request: Request): boolean {
  return request.url().includes("/product-category/") && ["POST", "PUT", "DELETE"].includes(request.method());
}

// ---- Locators --------------------------------------------------------------------------------------
/** The <li> of one node: [data-level][data-id] are set by CategoryNode. */
export const nodeItem = (page: Page, level: string, id: number) => page.locator(`li[data-level="${level}"][data-id="${id}"]`);
/** The row (not its children) of one node. */
export const nodeRow = (page: Page, level: string, id: number) => nodeItem(page, level, id).locator(":scope > .category-row");

// ---- In-memory category API (mocked spec) ---------------------------------------------------------
export interface MockChild {
  id: number;
  name: string;
  sortOrder: number;
}
export interface MockSub extends MockChild {
  childCategories: MockChild[];
}
export interface MockCategory extends MockChild {
  subCategories: MockSub[];
}

/** Same shape as GET /product-category/list (looks like the design: [67] Main, [72] Phonics & Alphabet …). */
export function sampleTree(): MockCategory[] {
  return [
    {
      id: 67,
      name: "Main",
      sortOrder: 1,
      subCategories: [
        {
          id: 72,
          name: "Phonics & Alphabet",
          sortOrder: 1,
          childCategories: [
            { id: 536, name: "ACE Alphabet", sortOrder: 1 },
            { id: 645, name: "ACE Phonics", sortOrder: 2 },
          ],
        },
        {
          id: 494,
          name: "ACE",
          sortOrder: 2,
          childCategories: [
            { id: 500, name: "Insider", sortOrder: 1 },
            { id: 501, name: "Adventurer", sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 74,
      name: "Books",
      sortOrder: 2,
      subCategories: [
        { id: 166, name: "Booster", sortOrder: 1, childCategories: [] },
        { id: 168, name: "Racer", sortOrder: 2, childCategories: [] },
        { id: 169, name: "Junior", sortOrder: 3, childCategories: [] },
      ],
    },
    { id: 80, name: "Goods", sortOrder: 3, subCategories: [] },
  ];
}

const CORS = { "access-control-allow-origin": "*" };

export function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({ status, contentType: "application/json", headers: CORS, body: JSON.stringify(body) });
}

/** Backend search (release/qa): a row stays when its own name, its sub's or its child's name matches. */
function searchTree(tree: MockCategory[], term: string): MockCategory[] {
  const has = (name: string) => name.toLowerCase().includes(term.toLowerCase());
  return tree.flatMap((category) => {
    if (has(category.name)) return [category];
    const subCategories = category.subCategories.flatMap((sub) => {
      if (has(sub.name)) return [sub];
      const childCategories = sub.childCategories.filter((child) => has(child.name));
      return childCategories.length > 0 ? [{ ...sub, childCategories }] : [];
    });
    return subCategories.length > 0 ? [{ ...category, subCategories }] : [];
  });
}

/** Puts the siblings whose ids are in `ids` into that order (what the reorder endpoints do). */
function applyOrder<T extends MockChild>(items: T[], ids: number[]): T[] {
  if (!items.some((item) => ids.includes(item.id))) return items;
  return [...items]
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    .map((item, index) => ({ ...item, sortOrder: index + 1 }));
}

export interface CategoryMock {
  /** Current server state (changes with add / delete / reorder). */
  tree: MockCategory[];
  isCreatable: boolean;
  /** Every write call: method, path, JSON body. */
  writes: Array<{ method: string; path: string; body: unknown }>;
  /** Search terms the list endpoint received, in order. */
  searches: string[];
}

/**
 * Answers the category endpoints from memory. Call after helpers.mockApi(page) — the later route wins.
 * Writes succeed with the real backend message keys.
 */
export async function mockCategoryApi(page: Page, initial: MockCategory[] = sampleTree()): Promise<CategoryMock> {
  const mock: CategoryMock = { tree: initial, isCreatable: initial.length < 3, writes: [], searches: [] };
  let nextId = 9000;

  await page.route(/\/product-category\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/product-category/, "");
    const method = request.method();

    if (method === "GET" && path === "/list") {
      const term = url.searchParams.get("search") ?? "";
      mock.searches.push(term);
      const data = term ? searchTree(mock.tree, term) : mock.tree;
      return fulfillJson(route, 200, { success: true, message: "", data, totalRecords: mock.tree.length, isCreatable: mock.isCreatable });
    }

    const body: unknown = request.postData() ? JSON.parse(request.postData() as string) : null;
    mock.writes.push({ method, path, body });
    const ids = (body as { ids?: number[] } | null)?.ids ?? [];
    const name = (body as { name?: string } | null)?.name ?? "";
    const idFromPath = Number(path.split("/").pop());

    if (path === "/reorder-categories") mock.tree = applyOrder(mock.tree, ids);
    if (path === "/reorder-subcategories") mock.tree = mock.tree.map((c) => ({ ...c, subCategories: applyOrder(c.subCategories, ids) }));
    if (path === "/reorder-subsubcategories") {
      mock.tree = mock.tree.map((c) => ({
        ...c,
        subCategories: c.subCategories.map((s) => ({ ...s, childCategories: applyOrder(s.childCategories, ids) })),
      }));
    }
    if (path.startsWith("/reorder")) return fulfillJson(route, 200, { success: true, message: "orderSwappedSuccessfully", data: null });

    if (path === "/subcategory/add") {
      const { categoryId } = body as { categoryId: number };
      mock.tree = mock.tree.map((c) =>
        c.id === categoryId
          ? { ...c, subCategories: [...c.subCategories, { id: nextId++, name, sortOrder: c.subCategories.length + 1, childCategories: [] }] }
          : c,
      );
      return fulfillJson(route, 200, { success: true, message: "subCategoryAddedSucessFully", data: null });
    }

    if (path === "/subcategory-child/add") {
      const { subCategoryId } = body as { subCategoryId: number };
      mock.tree = mock.tree.map((c) => ({
        ...c,
        subCategories: c.subCategories.map((s) =>
          s.id === subCategoryId
            ? { ...s, childCategories: [...s.childCategories, { id: nextId++, name, sortOrder: s.childCategories.length + 1 }] }
            : s,
        ),
      }));
      return fulfillJson(route, 200, { success: true, message: "childSubcategoryAddedSucessFully", data: null });
    }

    if (path.startsWith("/subcategory-child/edit/")) {
      mock.tree = mock.tree.map((c) => ({
        ...c,
        subCategories: c.subCategories.map((s) => ({
          ...s,
          childCategories: s.childCategories.map((x) => (x.id === idFromPath ? { ...x, name } : x)),
        })),
      }));
      return fulfillJson(route, 200, { success: true, message: "childSubcategoryUpdatedSucessFully", data: null });
    }

    if (path.startsWith("/subcategory-child/delete/")) {
      mock.tree = mock.tree.map((c) => ({
        ...c,
        subCategories: c.subCategories.map((s) => ({ ...s, childCategories: s.childCategories.filter((x) => x.id !== idFromPath) })),
      }));
      return fulfillJson(route, 200, { success: true, message: "childSubcategoryDeletedSuccessFull", data: null });
    }
    if (path.startsWith("/subcategory/delete/")) {
      mock.tree = mock.tree.map((c) => ({ ...c, subCategories: c.subCategories.filter((s) => s.id !== idFromPath) }));
      return fulfillJson(route, 200, { success: true, message: "subCategoryDeletedSuccessFull", data: null });
    }
    if (path.startsWith("/delete/")) {
      mock.tree = mock.tree.filter((c) => c.id !== idFromPath);
      return fulfillJson(route, 200, { success: true, message: "categoryDeletedSuccessFull", data: null });
    }

    return fulfillJson(route, 200, { success: true, message: "", data: null });
  });

  return mock;
}

/** The ids of the rows of one level under one parent, top to bottom, as shown on screen. */
export async function visibleOrder(page: Page, parentSelector: string, level: string): Promise<number[]> {
  const items = page.locator(`${parentSelector} > li[data-level="${level}"]`);
  await expect(items.first()).toBeVisible();
  const ids = await items.evaluateAll((elements) => elements.map((element) => Number(element.getAttribute("data-id"))));
  return ids;
}
