import { expect, type Locator, type Page } from "@playwright/test";
import { isCategoryWrite, nodeItem, nodeRow, visibleOrder } from "./categories.helpers";

// The steps of the LIVE category specs (categories.spec.ts, categories.mutation.spec.ts).
// They live here so categories-states.spec.ts can run the very same steps against the in-memory
// API — that is how they are checked while the QA server is down. Every locator is role / label based.

export const CATEGORIES_URL = "/shopping-mall/categories";

/** Counts category writes (POST / PUT / DELETE) the page sends from now on. */
export function countWrites(page: Page): { count: number } {
  const counter = { count: 0 };
  page.on("request", (request) => {
    if (isCategoryWrite(request)) counter.count += 1;
  });
  return counter;
}

/** id, name and the "[id] name" label of a node <li>. */
async function describeNode(item: Locator): Promise<{ id: number; name: string; label: string }> {
  const id = Number(await item.getAttribute("data-id"));
  const name = ((await item.locator(":scope > .category-row .category-name").textContent()) ?? "").trim();
  return { id, name, label: `[${id}] ${name}` };
}

/** The <li> of the node with exactly this name at this level. */
function nodeByName(page: Page, level: string, name: string): Locator {
  return page.locator(`li[data-level="${level}"]`).filter({ has: page.getByText(name, { exact: true }) });
}

/** First main category that has subcategories (it has a chevron somewhere inside). */
function mainWithChildren(page: Page): Locator {
  return page.locator('li[data-level="category"]').filter({ has: page.locator(".category-toggle") }).first();
}

/** Opens the page and waits until the tree is drawn. */
export async function openCategories(page: Page): Promise<void> {
  await page.goto(CATEGORIES_URL);
  await expect(page.getByRole("heading", { name: "상품 카테고리 관리", level: 1 })).toBeVisible();
  await expect(page.locator('li[data-level="category"]').first()).toBeVisible({ timeout: 30_000 });
}

/** Fills the open add / edit dialog, saves with Enter and checks the API call + toast. */
async function saveInDialog(page: Page, dialogName: string, name: string, apiPath: string, toast: string): Promise<void> {
  const dialog = page.getByRole("dialog", { name: dialogName });
  const input = dialog.getByRole("textbox", { name: "명칭" });
  await expect(input).toBeFocused();
  await input.fill(name);
  const response = page.waitForResponse((res) => res.url().includes(apiPath) && res.request().method() !== "GET");
  await input.press("Enter");
  const answer = await response;
  expect(answer.ok(), `${apiPath} answered ${answer.status()}`).toBe(true);
  await expect(dialog).toBeHidden();
  await expect(page.getByText(toast).first()).toBeVisible();
}

/** Clicks the trash icon of a leaf, confirms, and checks the DELETE call + toast + row gone. */
async function deleteLeaf(page: Page, level: string, id: number, label: string, apiPath: string, toast: string): Promise<void> {
  await nodeRow(page, level, id).getByRole("button", { name: `${label} 삭제` }).click();
  const confirm = page.getByRole("dialog", { name: /^(대분류|중분류|소분류) 삭제$/ });
  await expect(confirm).toContainText(label);
  const response = page.waitForResponse((res) => res.url().includes(apiPath) && res.request().method() === "DELETE");
  await confirm.getByRole("button", { name: "삭제", exact: true }).click();
  expect((await response).ok(), `${apiPath} failed`).toBe(true);
  await expect(page.getByText(toast).first()).toBeVisible();
  await expect(nodeItem(page, level, id)).toHaveCount(0);
}

// ---- Read-only steps ---------------------------------------------------------------------------

/** Title, breadcrumb, first main row with "[id]" and its "(N subcategories)" count. */
export async function checkTreeRenders(page: Page): Promise<void> {
  await openCategories(page);
  await expect(page.getByRole("navigation", { name: "현재 위치" })).toContainText("상품 카테고리 관리");
  const node = await describeNode(page.locator('li[data-level="category"]').first());
  const row = nodeRow(page, "category", node.id);
  await expect(row).toContainText(`[${node.id}]`);
  await expect(row).toContainText(/\(\d+개 중분류\)/);
  await expect(page.getByRole("button", { name: "대분류 등록" })).toBeVisible();
}

/** Searching an existing name finds it (term in the URL); gibberish shows the empty state. */
export async function checkSearch(page: Page): Promise<void> {
  await openCategories(page);
  const firstSub = page.locator('li[data-level="subCategory"]').first();
  const target = (await firstSub.count()) > 0 ? firstSub : page.locator('li[data-level="category"]').first();
  const level = (await target.getAttribute("data-level")) ?? "category";
  const node = await describeNode(target);

  const box = page.getByRole("textbox", { name: "카테고리 검색" });
  await box.fill(node.name);
  await box.press("Enter");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(node.name);
  await expect(nodeRow(page, level, node.id)).toBeVisible();

  await box.fill(`zz-no-such-category-${Date.now()}`);
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.getByRole("heading", { name: "검색 결과가 없습니다" })).toBeVisible();
}

/** Collapse all hides every child row, Expand all shows them; one chevron toggles one row. */
export async function checkExpandCollapse(page: Page): Promise<void> {
  await openCategories(page);
  const parent = mainWithChildren(page);
  await expect(parent, "the tree needs a main category with subcategories").toBeVisible();
  const node = await describeNode(parent);
  const firstChild = parent.locator('li[data-level="subCategory"]').first();

  await page.getByRole("button", { name: "모두 접기" }).click();
  await expect(firstChild).toBeHidden();
  await expect(page.locator('.category-toggle[aria-expanded="true"]')).toHaveCount(0);

  await page.getByRole("button", { name: "모두 펼치기" }).click();
  await expect(firstChild).toBeVisible();
  await expect(page.locator('.category-toggle[aria-expanded="false"]')).toHaveCount(0);

  const toggle = nodeRow(page, "category", node.id).locator(".category-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(firstChild).toBeHidden();
  await toggle.click();
  await expect(firstChild).toBeVisible();
}

/** The add dialog refuses empty, spaces-only and 51-character names without calling the API. */
export async function checkFormValidation(page: Page): Promise<void> {
  await openCategories(page);
  const node = await describeNode(page.locator('li[data-level="category"]').first());
  await nodeRow(page, "category", node.id).getByRole("button", { name: /에 중분류 추가$/ }).click();

  const dialog = page.getByRole("dialog", { name: "중분류 추가" });
  const input = dialog.getByRole("textbox", { name: "명칭" });
  await expect(input).toBeFocused();

  await input.press("Enter");
  await expect(dialog.getByRole("alert")).toHaveText("명칭을 입력해 주세요.");
  await input.fill("     ");
  await input.press("Enter");
  await expect(dialog.getByRole("alert")).toHaveText("명칭을 입력해 주세요.");
  await input.fill("x".repeat(51));
  await input.press("Enter");
  await expect(dialog.getByRole("alert")).toHaveText("명칭은 50자 이내로 입력해 주세요.");
  await expect(input).toHaveAttribute("aria-invalid", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

/** Trash on a main category that has subcategories → "Cannot delete" alert (the spec checks: no request). */
export async function checkDeleteBlocked(page: Page): Promise<void> {
  await openCategories(page);
  const parent = mainWithChildren(page);
  await expect(parent, "the tree needs a main category with subcategories").toBeVisible();
  const node = await describeNode(parent);

  await nodeRow(page, "category", node.id).getByRole("button", { name: / 삭제$/ }).click();
  const blocked = page.getByRole("dialog", { name: "삭제 불가" });
  await expect(blocked).toContainText("하위 항목을 먼저 삭제해 주세요.");
  await blocked.getByRole("button", { name: "확인" }).click();
  await expect(blocked).toBeHidden();
}

// ---- Create → edit → reorder → delete (only records named runPrefix…) ---------------------------

/**
 * Adds subcategory `runPrefix` under the first main category, two minor categories under it,
 * renames one, swaps their order (both are ours), then deletes children first and the subcategory.
 */
export async function runCrudFlow(page: Page, runPrefix: string): Promise<void> {
  const subName = runPrefix;
  const minorA = `${runPrefix}-a`;
  const minorB = `${runPrefix}-b`;
  const minorAEdited = `${runPrefix}-a-edited`;

  await openCategories(page);
  const main = await describeNode(page.locator('li[data-level="category"]').first());

  // 1. Subcategory under an existing main category
  await nodeRow(page, "category", main.id).getByRole("button", { name: /에 중분류 추가$/ }).click();
  await saveInDialog(page, "중분류 추가", subName, "/product-category/subcategory/add", "중분류가 등록되었습니다.");
  const sub = nodeByName(page, "subCategory", subName);
  await expect(sub).toBeVisible();
  const subId = Number(await sub.getAttribute("data-id"));
  const subLabel = `[${subId}] ${subName}`;

  // 2. Two minor categories under it
  for (const name of [minorA, minorB]) {
    await nodeRow(page, "subCategory", subId).getByRole("button", { name: `${subLabel}에 소분류 추가` }).click();
    await saveInDialog(page, "소분류 추가", name, "/product-category/subcategory-child/add", "소분류가 등록되었습니다.");
    await expect(nodeByName(page, "childCategory", name)).toBeVisible();
  }
  const aId = Number(await nodeByName(page, "childCategory", minorA).getAttribute("data-id"));
  const bId = Number(await nodeByName(page, "childCategory", minorB).getAttribute("data-id"));

  // 3. Edit: rename minor A
  await nodeRow(page, "childCategory", aId).getByRole("button", { name: `[${aId}] ${minorA} 수정` }).click();
  await expect(page.getByRole("dialog", { name: "소분류 수정" }).getByRole("textbox", { name: "명칭" })).toHaveValue(minorA);
  await saveInDialog(page, "소분류 수정", minorAEdited, `/product-category/subcategory-child/edit/${aId}`, "소분류가 수정되었습니다.");
  await expect(nodeRow(page, "childCategory", aId)).toContainText(minorAEdited);

  // 4. Reorder — only because the group holds exactly our two records
  const group = `li[data-level="subCategory"][data-id="${subId}"] > ul`;
  expect(await visibleOrder(page, group, "childCategory")).toEqual([aId, bId]);
  const reorderCall = page.waitForRequest((req) => req.url().includes("/product-category/reorder-subsubcategories") && req.method() === "PUT");
  await page.getByRole("button", { name: `[${bId}] ${minorB} 순서 변경` }).focus();
  await page.keyboard.press("Alt+ArrowUp");
  const request = await reorderCall;
  expect(request.postDataJSON()).toEqual({ ids: [bId, aId] });
  expect((await request.response())?.ok(), "reorder failed").toBe(true);
  await expect(page.getByText("카테고리 순서가 변경되었습니다.").first()).toBeVisible();
  await page.reload();
  await expect.poll(() => visibleOrder(page, group, "childCategory")).toEqual([bId, aId]);

  // 5. Delete: the subcategory is blocked while it has children (no request) …
  const writes = countWrites(page);
  await nodeRow(page, "subCategory", subId).getByRole("button", { name: `${subLabel} 삭제` }).click();
  const blocked = page.getByRole("dialog", { name: "삭제 불가" });
  await expect(blocked).toContainText("하위 항목을 먼저 삭제해 주세요.");
  await blocked.getByRole("button", { name: "확인" }).click();
  expect(writes.count).toBe(0);

  // … so children first, then the subcategory
  await deleteLeaf(page, "childCategory", bId, `[${bId}] ${minorB}`, `/subcategory-child/delete/${bId}`, "소분류가 삭제되었습니다.");
  await deleteLeaf(page, "childCategory", aId, `[${aId}] ${minorAEdited}`, `/subcategory-child/delete/${aId}`, "소분류가 삭제되었습니다.");
  await deleteLeaf(page, "subCategory", subId, subLabel, `/subcategory/delete/${subId}`, "중분류가 삭제되었습니다.");
}
