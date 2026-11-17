import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import { injectSession } from "./helpers";
import {
  LIST_URL,
  fulfillJson,
  fulfillProductPage,
  mockDetails,
  mockProduct,
  mockProductApi,
  readTotal,
  serverError,
  watchConsole,
} from "./products-helpers";

// Product list + details states with a MOCKED API (page.route) — passes while the QA server is down.
// Each test starts from an empty browser with an injected SUPER_ADMIN session (no real login),
// so run it with `--no-deps` when the setup login can't reach the API:
//   npx playwright test e2e/products-states.spec.ts --project=chromium --no-deps

test.use({ storageState: { cookies: [], origins: [] } });

let assertCleanConsole: () => void;

test.beforeEach(async ({ page, context, baseURL }) => {
  assertCleanConsole = watchConsole(page, { allowFailedApiCalls: true });
  await injectSession(context, baseURL ?? "http://localhost:3000", { role: "SUPER_ADMIN" });
});

test.afterEach(() => assertCleanConsole());

const products = (count: number) => Array.from({ length: count }, (_, index) => mockProduct(count - index));
const tableRows = (page: Page) => page.locator(".product-table tbody tr");

test.describe("Product list — states (mocked API)", () => {
  test("loading skeleton, then rows", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await mockProductApi(page, {
      list: async (route, url) => {
        await gate;
        await fulfillProductPage(route, url, products(3));
      },
    });

    await page.goto(LIST_URL);
    await expect(page.locator(".table-skeleton").getByText("상품 목록을 불러오는 중…")).toBeAttached();
    await expect(page.locator(".table-skeleton")).toBeVisible();
    release();
    await expect(tableRows(page)).toHaveCount(3);
    await expect(page.locator(".table-skeleton")).toHaveCount(0);
    expect(await readTotal(page)).toBe(3);
  });

  test("empty result shows 'No products found' and resets the filters", async ({ page }) => {
    await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, products(3)) });

    await page.goto(`${LIST_URL}?q=no-such-product`);
    await expect(page.getByRole("heading", { name: "검색 결과가 없습니다" })).toBeVisible();
    await page.locator(".state-box").getByRole("button", { name: "필터 초기화" }).click();
    await expect(page).toHaveURL(/\/shopping-mall\/products$/);
    await expect(tableRows(page)).toHaveCount(3);
  });

  test("500 shows the server error, Try again recovers", async ({ page }) => {
    // The API fails (first load + the one automatic retry) until the user clicks "Try again"
    let failing = true;
    await mockProductApi(page, {
      list: (route, url) => (failing ? fulfillJson(route, 500, serverError) : fulfillProductPage(route, url, products(2))),
    });

    await page.goto(LIST_URL);
    await expect(page.getByRole("heading", { name: "서버 오류" })).toBeVisible();
    await expect(page.getByText("오류 코드 500")).toBeVisible();
    // The list shows its error inline (StateWrapper) → the default error toast must stay away
    await expect(page.locator(".p-toast-message")).toHaveCount(0);
    failing = false;
    await page.getByRole("button", { name: "다시 시도" }).click();
    await expect(tableRows(page)).toHaveCount(2);
  });

  test("network failure shows the connection error", async ({ page }) => {
    await mockProductApi(page, { list: (route) => route.abort("failed") });
    await page.goto(LIST_URL);
    await expect(page.getByRole("heading", { name: "연결 오류" })).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  });

  test("403 shows the no-permission state", async ({ page }) => {
    await mockProductApi(page, {
      list: (route) =>
        fulfillJson(route, 403, { success: false, message: "You do not have permission to access this resource", data: null, statusCode: 403 }),
    });
    await page.goto(LIST_URL);
    await expect(page.getByRole("heading", { name: "권한 없음" })).toBeVisible();
    await expect(page.getByText("오류 코드 403")).toBeVisible();
  });

  test("invalid URL params fall back to defaults and the URL is cleaned", async ({ page }) => {
    await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, products(3)) });
    await page.goto(`${LIST_URL}?page=abc&limit=7&productType=FOO&subCategoryId=5&sort=name&order=sideways`);
    await expect(page).toHaveURL(/\/shopping-mall\/products\?sort=name&order=asc$/);
    await expect(tableRows(page)).toHaveCount(3);
    await expect(page.getByRole("columnheader", { name: "상품명" })).toHaveAttribute("aria-sort", "ascending");
  });

  test("a filter change goes back to page 1; selection survives paging", async ({ page }) => {
    await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, products(25)) });

    await page.goto(`${LIST_URL}?page=2`);
    await expect(tableRows(page)).toHaveCount(10);
    await page.getByRole("checkbox", { name: "HW3-Mock-Product-15 선택" }).check();
    await page.getByRole("button", { name: "3페이지" }).click();
    await expect(page).toHaveURL(/page=3/);
    await page.getByRole("checkbox", { name: "HW3-Mock-Product-5 선택" }).check();
    await expect(page.locator(".product-selection-bar")).toContainText("2건 선택됨");

    await page.getByLabel("상품 유형").selectOption("SUPPLEMENTARY");
    await expect(page).toHaveURL(/\?productType=SUPPLEMENTARY$/);
    await expect(page.locator(".product-selection-bar")).toContainText("2건 선택됨");
    await page.locator(".product-selection-bar").getByRole("button", { name: "선택 해제" }).click();
    await expect(page.locator(".product-selection-bar")).not.toContainText("선택됨");
  });

  test("inline exposure status: saved toast on success", async ({ page }) => {
    const data = products(3);
    await mockProductApi(page, {
      list: (route, url) => fulfillProductPage(route, url, data),
      updateStatus: async (route, id, isVisible) => {
        const row = data.find((product) => product.id === id);
        if (row) row.isVisible = isVisible; // the "server" keeps the new value
        await fulfillJson(route, 200, { success: true, message: "productStatusUpdatedSuccessfully", data: null });
      },
    });

    await page.goto(LIST_URL);
    const status = page.getByRole("combobox", { name: "HW3-Mock-Product-2 노출여부" });
    await expect(status).toHaveValue("yes");
    await status.selectOption("no");
    await expect(page.getByText("저장 완료")).toBeVisible();
    await expect(status).toHaveValue("no");
  });

  test("inline exposure status: optimistic, then rolled back with an error toast", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await mockProductApi(page, {
      list: (route, url) => fulfillProductPage(route, url, products(3)),
      updateStatus: async (route) => {
        await gate;
        await fulfillJson(route, 500, serverError);
      },
    });

    await page.goto(LIST_URL);
    const status = page.getByRole("combobox", { name: "HW3-Mock-Product-1 노출여부" });
    await status.selectOption("no");
    await expect(status).toHaveValue("no"); // optimistic
    release();
    await expect(page.getByText("저장에 실패했습니다.")).toBeVisible();
    // The screen's own toast only — not a second (default) error toast on top of it
    await expect(page.locator(".p-toast-message")).toHaveCount(1);
    await expect(status).toHaveValue("yes"); // rolled back
  });

  test("CSV export fetches every page and writes the header + BOM", async ({ page }) => {
    const requestedPages: string[] = [];
    await mockProductApi(page, {
      list: (route, url) => {
        if (url.searchParams.get("limit") === "100") requestedPages.push(url.searchParams.get("page") ?? "");
        return fulfillProductPage(route, url, products(150));
      },
    });

    await page.goto(LIST_URL);
    await expect(tableRows(page)).toHaveCount(10);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV 다운로드" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^products-\d{8}-\d{4}\.csv$/);

    const text = await readFile(await download.path(), "utf8");
    expect(text.charCodeAt(0)).toBe(0xfeff);
    const lines = text.slice(1).trim().split("\r\n");
    expect(lines[0]).toBe("ID,상품코드,상품명,단가,판매금액,카테고리(과정),노출여부,판매상태,등록일자");
    expect(lines).toHaveLength(151);
    expect(requestedPages).toEqual(["1", "2"]);
  });
});

test.describe("Product list — 375px phone (mocked API)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("rows become cards and the page never scrolls sideways", async ({ page }) => {
    await mockProductApi(page, {
      list: (route, url) =>
        fulfillProductPage(route, url, [
          mockProduct(2, { productName: "HW3-Mock 아주 긴 상품 이름 테스트용 Product with a very long name that must wrap" }),
          mockProduct(1),
        ]),
    });

    await page.goto(LIST_URL);
    await expect(tableRows(page)).toHaveCount(2);
    // Card layout: the row is a grid, the thumbnail / category / status headers are hidden
    await expect(tableRows(page).first()).toHaveCSS("display", "grid");
    await expect(page.getByRole("columnheader", { name: "썸네일" })).toBeHidden();
    await expect(page.getByRole("button", { name: "상품명" })).toBeVisible(); // sort still reachable
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await mockProductApi(page, { details: (route, id) => fulfillJson(route, 200, { success: true, message: "", data: mockDetails(id) }) });
    await page.goto("/shopping-mall/products/details/2");
    await expect(page.getByRole("heading", { name: "기본 정보" })).toBeVisible();
    const detailsOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(detailsOverflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Product details — states (mocked API)", () => {
  test("a failing Same-category list only breaks its own tab", async ({ page }) => {
    await mockProductApi(page, {
      details: (route, id) => fulfillJson(route, 200, { success: true, message: "", data: mockDetails(id) }),
      list: (route) => fulfillJson(route, 500, serverError),
    });

    await page.goto("/shopping-mall/products/details/7?tab=related");
    await expect(page.getByRole("heading", { name: "HW3-Mock-Product-7", level: 1 })).toBeVisible();
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("heading", { name: "서버 오류" })).toBeVisible();

    await page.getByRole("tab", { name: "상품 정보" }).click();
    await expect(page).toHaveURL(/\?tab=overview$/);
    await expect(panel.getByRole("heading", { name: "기본 정보" })).toBeVisible();
    await expect(panel.getByRole("alert")).toHaveCount(0);
  });

  test("Options tab: empty state, then option groups", async ({ page }) => {
    await mockProductApi(page, {
      details: (route, id) =>
        fulfillJson(route, 200, {
          success: true,
          message: "",
          data:
            id === 8
              ? mockDetails(8, {
                  isOptions: true,
                  productOptions: [
                    { optionGroup: 1, type: "SINGLE_VOLUME", option: [{ optionId: 21, optionName: "Book A", optionCode: "PRD-21", price: 1000 }] },
                  ],
                })
              : mockDetails(id),
        }),
    });

    await page.goto("/shopping-mall/products/details/9?tab=options");
    await expect(page.getByRole("tabpanel").getByRole("heading", { name: "옵션 없음" })).toBeVisible();

    await page.goto("/shopping-mall/products/details/8?tab=options");
    await expect(page.getByRole("heading", { name: /옵션 1번/ })).toBeVisible();
    await expect(page.getByRole("cell", { name: "PRD-21" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "₩1,000" })).toBeVisible();
  });

  test("keyboard: arrow keys move between tabs, ?tab= follows, reload keeps it", async ({ page }) => {
    await mockProductApi(page, {
      details: (route, id) => fulfillJson(route, 200, { success: true, message: "", data: mockDetails(id) }),
      list: (route, url) => fulfillProductPage(route, url, [mockProduct(5), mockProduct(4)]),
    });

    await page.goto("/shopping-mall/products/details/4");
    const overview = page.getByRole("tab", { name: "상품 정보" });
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await overview.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/\?tab=options$/);
    await expect(page.getByRole("tab", { name: "옵션" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(page).toHaveURL(/\?tab=related$/);
    await expect(page.getByRole("tabpanel").getByRole("link", { name: "HW3-Mock-Product-5" })).toBeVisible();
    await expect(page.getByRole("tabpanel").getByRole("link", { name: "HW3-Mock-Product-4" })).toHaveCount(0); // itself left out
    await page.reload();
    await expect(page.getByRole("tab", { name: "동일 카테고리 상품" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "상품 정보" })).toHaveAttribute("tabindex", "-1");
  });

  test("productNotFound from the API shows the not-found state", async ({ page }) => {
    await mockProductApi(page, {}); // details → 400 productNotFound
    await page.goto("/shopping-mall/products/details/424242");
    await expect(page.getByRole("heading", { name: "상품을 찾을 수 없습니다" })).toBeVisible();
    await expect(page.getByRole("link", { name: "목록으로" })).toHaveAttribute("href", /\/shopping-mall\/products/);
  });
});
