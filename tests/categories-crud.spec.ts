import { fakeSession } from "./helpers/session";
import { test, expect, type Page, type Request } from "@playwright/test";

// Category add / edit / delete UI, with the API mocked by an in-memory tree (no QA data is touched).
// The real-API version will be categories.mutation.spec.ts (HW3-Sandip-* records) once the QA server is back.

interface Node {
  id: number;
  name: string;
  subCategories?: Node[];
  childCategories?: Node[];
}

function seed(): Node[] {
  return [
    {
      id: 67,
      name: "Main textbook",
      subCategories: [{ id: 72, name: "Phonics & Alphabet", childCategories: [{ id: 536, name: "ACE Alphabet" }] }],
    },
    { id: 74, name: "Main", subCategories: [] },
  ];
}

const ok = (data: unknown = null) => JSON.stringify({ success: true, message: "ok", data, errors: null, statusCode: 200 });

async function setup(page: Page, opts: { failWrites?: boolean; failKey?: string } = {}) {
  const tree = seed();
  const calls: { method: string; path: string; body: unknown }[] = [];
  let nextId = 900;

  const findSub = (id: number) => tree.flatMap((m) => m.subCategories ?? []).find((s) => s.id === id);

  await fakeSession(page);

  await page.route("**/api/v1/product-category/**", async (route) => {
    const req: Request = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/v1/product-category", "");
    const body = req.postData() ? JSON.parse(req.postData() as string) : null;
    if (req.method() !== "GET") calls.push({ method: req.method(), path, body });

    if (req.method() === "GET" && path === "/list") {
      return route.fulfill({ status: 200, contentType: "application/json", body: ok(tree) });
    }
    if (opts.failWrites) {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: opts.failKey ?? "Category name already exists", data: null, errors: null, statusCode: 400 }),
      });
    }
    if (path === "/add") tree.push({ id: nextId++, name: body.name, subCategories: [] });
    if (path === "/subcategory/add") tree.find((m) => m.id === body.categoryId)?.subCategories?.push({ id: nextId++, name: body.name, childCategories: [] });
    if (path === "/subcategory-child/add") findSub(body.subCategoryId)?.childCategories?.push({ id: nextId++, name: body.name });
    const edit = path.match(/^\/subcategory\/edit\/(\d+)$/);
    if (edit) {
      const sub = findSub(Number(edit[1]));
      if (sub) sub.name = body.name;
    }
    const del = path.match(/^\/subcategory-child\/delete\/(\d+)$/);
    if (del) for (const sub of tree.flatMap((m) => m.subCategories ?? [])) sub.childCategories = sub.childCategories?.filter((c) => c.id !== Number(del[1]));
    return route.fulfill({ status: 200, contentType: "application/json", body: ok() });
  });

  await page.goto("/shopping/categories");
  await expect(inTree(page, "Main textbook")).toBeVisible();
  return { calls };
}

const dialog = (page: Page) => page.getByRole("dialog");
const confirmDialog = (page: Page) => page.getByRole("alertdialog");
const inTree = (page: Page, text: string) => page.getByRole("region", { name: "카테고리 목록" }).getByText(text, { exact: true });

test.describe("product category add / edit / delete (mocked API)", () => {
  test("register a main category: name required, trimmed, then added with a toast", async ({ page }) => {
    const { calls } = await setup(page);
    await page.getByRole("button", { name: "등록" }).click();
    await expect(dialog(page).getByText("대분류 추가")).toBeVisible();
    await expect(dialog(page).getByLabel("카테고리명")).toBeFocused();

    // Empty / spaces only → validation message, no request.
    await dialog(page).getByLabel("카테고리명").fill("   ");
    await dialog(page).getByRole("button", { name: "추가" }).click();
    await expect(dialog(page).getByRole("alert")).toHaveText("카테고리명을 입력해 주세요.");
    expect(calls).toHaveLength(0);

    await dialog(page).getByLabel("카테고리명").fill("  HW3-Sandip-Books  ");
    await dialog(page).getByRole("button", { name: "추가" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("“HW3-Sandip-Books” 카테고리를 추가했습니다.")).toBeVisible();
    await expect(inTree(page, "HW3-Sandip-Books")).toBeVisible();
    expect(calls).toEqual([{ method: "POST", path: "/add", body: { name: "HW3-Sandip-Books" } }]);
  });

  test("add a subcategory and a child send the parent id in the right field", async ({ page }) => {
    const { calls } = await setup(page);

    await page.getByRole("button", { name: "Main 하위 카테고리", exact: true }).click();
    await expect(dialog(page).getByText("상위 카테고리:")).toContainText("[74] Main");
    await dialog(page).getByLabel("카테고리명").fill("HW3-Sandip-Sub");
    await dialog(page).getByRole("button", { name: "추가" }).click();
    await expect(dialog(page)).toBeHidden();

    await page.getByRole("button", { name: "Phonics & Alphabet 하위 카테고리" }).click();
    await expect(dialog(page).getByText("소분류 추가")).toBeVisible();
    await dialog(page).getByLabel("카테고리명").fill("HW3-Sandip-Child");
    await dialog(page).getByRole("button", { name: "추가" }).click();
    await expect(dialog(page)).toBeHidden();

    expect(calls).toEqual([
      { method: "POST", path: "/subcategory/add", body: { name: "HW3-Sandip-Sub", categoryId: 74 } },
      { method: "POST", path: "/subcategory-child/add", body: { name: "HW3-Sandip-Child", subCategoryId: 72 } },
    ]);
    await expect(inTree(page, "HW3-Sandip-Child")).toBeVisible();
  });

  test("edit keeps the parent id; Save stays disabled until the name changes", async ({ page }) => {
    const { calls } = await setup(page);
    await page.getByRole("button", { name: "Phonics & Alphabet 수정" }).click();

    const name = dialog(page).getByLabel("카테고리명");
    await expect(name).toHaveValue("Phonics & Alphabet");
    await expect(dialog(page).getByRole("button", { name: "저장" })).toBeDisabled();

    await name.fill("HW3-Sandip-Phonics");
    await dialog(page).getByRole("button", { name: "저장" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(inTree(page, "HW3-Sandip-Phonics")).toBeVisible();
    expect(calls).toEqual([{ method: "PUT", path: "/subcategory/edit/72", body: { name: "HW3-Sandip-Phonics", categoryId: 67 } }]);
  });

  test("API error keeps the dialog open with the typed name", async ({ page }) => {
    await setup(page, { failWrites: true });
    await page.getByRole("button", { name: "등록" }).click();
    await dialog(page).getByLabel("카테고리명").fill("HW3-Sandip-Dup");
    await dialog(page).getByRole("button", { name: "추가" }).click();

    // The API's own English sentence must not be shown; a Korean message by status instead.
    await expect(dialog(page).getByRole("alert")).toHaveText("요청을 처리하지 못했습니다. 입력한 내용을 확인해 주세요.");
    await expect(dialog(page)).not.toContainText("Category name already exists");
    await expect(dialog(page).getByLabel("카테고리명")).toHaveValue("HW3-Sandip-Dup");
  });

  test("a known API key gets its own Korean message, never the key", async ({ page }) => {
    await setup(page, { failWrites: true, failKey: "maximumCategoryLimitReached" });
    await page.getByRole("button", { name: "등록" }).click();
    await dialog(page).getByLabel("카테고리명").fill("HW3-Sandip-Limit");
    await dialog(page).getByRole("button", { name: "추가" }).click();

    await expect(dialog(page).getByRole("alert")).toHaveText("카테고리를 더 등록할 수 없습니다. 등록 가능한 최대 개수에 도달했습니다.");
    await expect(dialog(page)).not.toContainText("maximumCategoryLimitReached");
  });

  test("delete: blocked while it has subcategories; a leaf is deleted after confirm", async ({ page }) => {
    const { calls } = await setup(page);

    await page.getByRole("button", { name: "Main textbook 삭제" }).click();
    await expect(confirmDialog(page).getByText("삭제할 수 없는 카테고리")).toBeVisible();
    await expect(confirmDialog(page)).toContainText("하위 카테고리가 1개 있습니다");
    await confirmDialog(page).getByRole("button", { name: "확인" }).click();
    expect(calls).toHaveLength(0);

    await page.getByRole("button", { name: "ACE Alphabet 삭제" }).click();
    await expect(confirmDialog(page).getByText("카테고리를 삭제할까요?")).toBeVisible();
    await expect(confirmDialog(page).getByRole("button", { name: "취소" })).toBeFocused();
    await confirmDialog(page).getByRole("button", { name: "삭제" }).click();
    await expect(confirmDialog(page)).toBeHidden();
    await expect(inTree(page, "ACE Alphabet")).toBeHidden();
    expect(calls).toEqual([{ method: "DELETE", path: "/subcategory-child/delete/536", body: null }]);
  });

  test("Escape closes the dialog without saving", async ({ page }) => {
    const { calls } = await setup(page);
    await page.getByRole("button", { name: "등록" }).click();
    await dialog(page).getByLabel("카테고리명").fill("HW3-Sandip-Esc");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    expect(calls).toHaveLength(0);
  });
});
