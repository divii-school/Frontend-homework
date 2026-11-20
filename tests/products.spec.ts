import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fakeSession } from "./helpers/session";

// Product list UI (Figma 8.1.0) with the products API mocked by an in-memory list.
// Row shape = what GET /api/v1/products returned on QA (2026-11-16). No QA data is touched.

interface Row {
  id: number;
  productName: string;
  productCode: string;
  price: number;
  isVisible: boolean;
  image: string | null;
  category: { id: number; name: string } | null;
  subCategory: { id: number; name: string } | null;
  childCategory: { id: number; name: string } | null;
  createdAt: string;
}

function makeRows(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    id: 1000 + i,
    productName: i === 0 ? "=SUM(A1) tricky" : `Product ${i + 1}`,
    productCode: `P-${1000 + i}`,
    price: 4000 + i * 100,
    isVisible: i % 2 === 0,
    image: null,
    category: i === 1 ? null : { id: 1, name: "Main" },
    subCategory: i === 1 ? null : { id: 2, name: "ACE" },
    childCategory: i === 1 ? null : { id: 3, name: "Insider" },
    createdAt: "2025-09-12T08:10:18.000Z", // 17:10 in KST
  }));
}

interface Options {
  failStatus?: boolean;
}

async function setup(page: Page, total = 25, opts: Options = {}) {
  let rows = makeRows(total);
  const calls: { method: string; url: string; body: unknown }[] = [];

  await fakeSession(page);
  await page.route("**/api/v1/products**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const body = req.postData() ? JSON.parse(req.postData() as string) : null;
    if (req.method() !== "GET") calls.push({ method: req.method(), url: url.pathname, body });

    if (req.method() === "GET" && url.pathname === "/api/v1/products") {
      const page = Number(url.searchParams.get("page"));
      const limit = Number(url.searchParams.get("limit"));
      const search = url.searchParams.get("search");
      const type = url.searchParams.get("type");
      const filtered = search
        ? rows.filter((r) => (type === "categoryName" ? r.category?.name ?? "" : r.productName).includes(search))
        : rows;
      const data = filtered.slice((page - 1) * limit, page * limit);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Success", data, totalRecords: filtered.length, totalPage: Math.ceil(filtered.length / limit), page }),
      });
    }
    if (req.method() === "DELETE") {
      rows = rows.filter((r) => !body.ids.includes(r.id));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Success", data: null }) });
    }
    const status = url.pathname.match(/update-status\/(\d+)\/(yes|no)$/);
    if (status) {
      if (opts.failStatus) {
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, message: "Something went wrong", data: null, statusCode: 500 }) });
      }
      rows = rows.map((r) => (r.id === Number(status[1]) ? { ...r, isVisible: status[2] === "yes" } : r));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Success", data: null }) });
    }
    return route.fulfill({ status: 404, body: "" });
  });
  return { calls };
}

const body = (page: Page) => page.getByRole("table").locator("tbody");

test.describe("product list (mocked API)", () => {
  test("renders 10 rows with Figma formats and the total", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products");
    await expect(body(page).locator("tr")).toHaveCount(10);
    await expect(page.getByText("총 게시물 : 25")).toBeVisible();
    const first = body(page).locator("tr").first();
    await expect(first).toContainText("₩4,000");
    await expect(first).toContainText("2025/09/12 17:10");
    await expect(first).toContainText("Main > ACE > Insider");
    await expect(body(page).locator("tr").nth(1)).toContainText("-");
    await expect(first.getByRole("link", { name: "=SUM(A1) tricky" })).toHaveAttribute("href", "/shopping/products/1000");
  });

  test("paging and search live in the URL and survive reload", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products");
    await page.getByRole("button", { name: "3 페이지" }).click();
    await expect(page).toHaveURL("/shopping/products?page=3");
    await expect(body(page).locator("tr")).toHaveCount(5);
    await page.reload();
    await expect(page.getByRole("button", { name: "3 페이지" })).toHaveAttribute("aria-current", "page");

    await page.getByLabel("검색어").fill("Product 1");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/shopping/products?search=Product+1");
    await expect(page.getByText(/^총 게시물 : \d+$/)).toHaveText("총 게시물 : 10"); // Product 10–19 (row 1 is "=SUM(A1) tricky")

    await page.goBack();
    await expect(page).toHaveURL("/shopping/products?page=3");
    await expect(page.getByLabel("검색어")).toHaveValue("");
  });

  test("no results message", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products?search=nothing-matches");
    await expect(body(page)).toContainText("검색 결과가 없습니다.");
  });

  test("select rows (incl. across pages) and bulk delete sends numeric ids", async ({ page }) => {
    const { calls } = await setup(page);
    await page.goto("/shopping/products");
    await expect(page.getByRole("button", { name: "삭제" })).toBeDisabled();

    await page.getByLabel("이 페이지의 상품 전체 선택").check();
    await page.getByRole("button", { name: "2 페이지" }).click();
    await page.getByLabel("Product 12 선택").check();
    await expect(page.getByText("11개 선택됨")).toBeVisible();

    await page.getByRole("button", { name: "삭제", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("상품 11개를 삭제할까요?");
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();
    await dialog.getByRole("button", { name: "삭제" }).click();

    await expect(page.getByText("상품 11개를 삭제했습니다.")).toBeVisible();
    await expect(page.getByText("총 게시물 : 14")).toBeVisible();
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/v1/products/delete");
    expect(calls[0].body).toEqual({ ids: [...Array.from({ length: 10 }, (_, i) => 1000 + i), 1011] });
  });

  test("exposure status changes inline with a toast", async ({ page }) => {
    const { calls } = await setup(page);
    await page.goto("/shopping/products");
    await page.getByLabel("Product 2 노출여부").selectOption("yes");
    await expect(page.getByText("“Product 2” 노출여부를 예로 변경했습니다.")).toBeVisible();
    expect(calls).toEqual([{ method: "PUT", url: "/api/v1/products/update-status/1001/yes", body: null }]);
  });

  test("exposure status rolls back when the API fails", async ({ page }) => {
    await setup(page, 25, { failStatus: true });
    await page.goto("/shopping/products");
    const select = page.getByLabel("Product 2 노출여부");
    await select.selectOption("yes");
    await expect(page.getByText("서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.")).toBeVisible();
    await expect(select).toHaveValue("no");
  });

  test("export downloads the whole filtered result as CSV", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products?search=Product+1");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV 내보내기" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^products-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = (await readFile(await download.path())).toString("utf8");
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe("ID,상품코드,상품명,판매금액,카테고리(과정),노출여부,등록일자");
    expect(lines).toHaveLength(11); // header + Product 10–19, across two pages of the list
    await expect(page.getByText("상품 10개를 내보냈습니다.")).toBeVisible();
  });

  test("CSV guards against spreadsheet formulas", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV 내보내기" }).click();
    const csv = (await readFile(await (await downloadPromise).path())).toString("utf8");
    expect(csv).toContain("'=SUM(A1) tricky");
  });

  test("a page past the end jumps to the last page", async ({ page }) => {
    await setup(page);
    await page.goto("/shopping/products?page=9");
    await expect(page).toHaveURL("/shopping/products?page=3");
  });
});

test("soft-deleted rows returned by the API are not shown", async ({ page }) => {
  await fakeSession(page);
  const row = (id: number, name: string, isDeleted: boolean) => ({
    id, productName: name, productCode: `P-${id}`, price: 1000, isVisible: true, image: null,
    category: null, subCategory: null, childCategory: null, createdAt: "2026-11-16T00:00:00.000Z", isDeleted,
  });
  await page.route("**/api/v1/products**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Success", data: [row(1, "Live product", false), row(2, "Deleted product", true)], totalRecords: 2, totalPage: 1, page: 1 }),
    }),
  );
  await page.goto("/shopping/products?search=ACE&type=categoryName");
  await expect(page.getByRole("link", { name: "Live product" })).toBeVisible();
  await expect(page.getByText("Deleted product")).toHaveCount(0);
});

test("a page with only deleted rows says so instead of 'No search results'", async ({ page }) => {
  await fakeSession(page);
  const deleted = (id: number) => ({
    id, productName: `Deleted ${id}`, productCode: `P-${id}`, price: 1000, isVisible: true, image: null,
    category: null, subCategory: null, childCategory: null, createdAt: "2026-11-16T00:00:00.000Z", isDeleted: true,
  });
  await page.route("**/api/v1/products**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Success", data: [deleted(1), deleted(2)], totalRecords: 30, totalPage: 3, page: 1 }),
    }),
  );
  await page.goto("/shopping/products?search=ACE&type=categoryName");
  await expect(page.getByText("이 페이지에는 삭제된 상품만 있어 표시할 상품이 없습니다.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "2 페이지" })).toBeVisible();
});

test("the header switch changes light / dark and remembers it after a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await setup(page);
  await page.goto("/shopping/products");
  const html = page.locator("html");
  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "라이트 모드로 전환" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});
