import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "fs";
import { HW3_RECORD_PREFIX } from "../src/utils/constants";
import { ADMIN_STORAGE_STATE, SESSION_COOKIE_NAME } from "./helpers";
import { watchConsole } from "./categories.helpers";
import { runCrudFlow } from "./categories.flows";

// 8.2.0 create → edit → reorder → delete on the SHARED QA DB. Runs only with E2E_ALLOW_MUTATIONS=1
// (playwright.config.ts ignores *.mutation.spec.ts otherwise; the skip below is a second lock).
//
// Shared-data rule: only records named `HW3-Neeraj-cat-<timestamp>…` are created, edited, reordered
// and deleted. The API refuses a 4th main category, so the test adds a SUBCATEGORY under an existing
// main category and two minor categories under that. afterAll deletes whatever of this run is left
// (children first), straight through the API, even when the UI steps failed half-way.

const RUN_PREFIX = `${HW3_RECORD_PREFIX}cat-${Date.now()}`;
const API_HEADERS = {
  "accept-language": "en",
  "x-talking-club-platform": "web",
  "x-talking-club-version": "1.0.0",
};

interface ApiNode {
  id: number;
  name: string;
  subCategories?: ApiNode[];
  childCategories?: ApiNode[];
}

/** Token of the saved admin session (e2e/.auth/admin.json, written by auth.setup.ts). */
function savedToken(): string | null {
  try {
    const state = JSON.parse(readFileSync(ADMIN_STORAGE_STATE, "utf8")) as { cookies?: Array<{ name: string; value: string }> };
    return state.cookies?.find((cookie) => cookie.name === SESSION_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

/** Deletes this run's leftovers: minor categories first, then subcategories. Never touches other names. */
async function deleteLeftovers(api: APIRequestContext, base: string): Promise<string[]> {
  const deleted: string[] = [];
  const list = await api.get(`${base}/product-category/list`, { params: { search: RUN_PREFIX } });
  if (!list.ok()) return [`list failed: ${list.status()}`];
  const categories = ((await list.json()) as { data?: ApiNode[] }).data ?? [];
  const ours = (node: ApiNode) => node.name.startsWith(RUN_PREFIX);

  for (const category of categories) {
    for (const sub of category.subCategories ?? []) {
      const children = sub.childCategories ?? [];
      for (const child of children.filter(ours)) {
        const res = await api.delete(`${base}/product-category/subcategory-child/delete/${child.id}`);
        deleted.push(`minor ${child.id} ${child.name}: ${res.status()}`);
      }
      // Our subcategory only, and only when nothing of anybody else hangs under it
      if (ours(sub) && children.every(ours)) {
        const res = await api.delete(`${base}/product-category/subcategory/delete/${sub.id}`);
        deleted.push(`sub ${sub.id} ${sub.name}: ${res.status()}`);
      }
    }
  }
  return deleted;
}

test.describe("Product categories — create / edit / reorder / delete (QA DB)", { tag: "@mutation" }, () => {
  test.skip(process.env.E2E_ALLOW_MUTATIONS !== "1", "Mutations need E2E_ALLOW_MUTATIONS=1 (shared QA DB).");

  test.afterAll(async ({ playwright }) => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
    const token = savedToken();
    if (!base || !token) return;
    const api = await playwright.request.newContext({ extraHTTPHeaders: { ...API_HEADERS, Authorization: `Bearer ${token}` } });
    try {
      const deleted = await deleteLeftovers(api, base);
      if (deleted.length > 0) console.log(`[categories cleanup] ${deleted.join(" | ")}`);
    } finally {
      await api.dispose();
    }
  });

  // (Title has no timestamp: Playwright needs the same title in the runner and the worker.)
  test("add subcategory + 2 minor categories, rename, reorder, delete — HW3-Neeraj-cat-<timestamp>", async ({ page }) => {
    test.setTimeout(180_000);
    test.info().annotations.push({ type: "records", description: RUN_PREFIX });
    const problems = watchConsole(page);

    await runCrudFlow(page, RUN_PREFIX);

    expect(problems, "console errors / warnings").toEqual([]);
  });
});
