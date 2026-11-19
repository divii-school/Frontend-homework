import { readFile } from "node:fs/promises";
import { test, expect, type Locator, type Page } from "@playwright/test";
import { THEME_STORAGE_KEY } from "../src/utils/theme";
import { injectSession, tokenColor } from "./helpers";
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

// QA round 18 Nov: 판매가 / 판매금액 = API `price` (what the cart and the order charge), 단가 = API `unitPrice`
// (the API requires unitPrice < price); every date is Korea time (KST) whatever the viewer's time zone is.
// The browser runs in India time here (UTC+5:30) to prove the dates do not follow it.
test.describe("Prices and KST dates — viewer in India (mocked API)", () => {
  test.use({ timezoneId: "Asia/Kolkata" });

  const QA_PRODUCT = mockProduct(7, {
    productName: "HW3-Mock-Price-KST",
    price: 1500,
    unitPrice: 1200,
    createdAt: "2026-11-13T05:39:00.000Z", // 11:09 in India, 14:39 in Korea
    updatedAt: "2026-11-13T15:30:00.000Z", // the next day in Korea: 2026/11/14 00:30
  });

  test("list, CSV and details show 판매가 = price, 단가 = unitPrice and the time in KST", async ({ page }) => {
    await mockProductApi(page, {
      list: (route, url) => fulfillProductPage(route, url, [QA_PRODUCT]),
      details: (route, id) => fulfillJson(route, 200, { success: true, message: "", data: mockDetails(id, QA_PRODUCT) }),
    });

    // List: 판매금액 is the selling price only (no crossed-out second price); the date is KST
    await page.goto(LIST_URL);
    const row = tableRows(page).first();
    await expect(row.locator(".col-price")).toHaveText("₩1,500");
    await expect(row.locator(".col-date")).toHaveText("2026/11/13 14:39");

    // CSV: 단가 = unitPrice, 판매금액 = price, 등록일자 in KST
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV 다운로드" }).click();
    const text = await readFile(await (await downloadPromise).path(), "utf8");
    const lines = text.slice(1).trim().split("\r\n");
    expect(lines[1]).toBe("7,PRD-000007,HW3-Mock-Price-KST,1200,1500,Main books > Phonics > Insider,예,예,2026/11/13 14:39");

    // Details: 단가 / 판매가 and both dates in KST
    await page.goto("/shopping-mall/products/details/7");
    const info = (label: string) => page.locator(".product-info-item").filter({ has: page.locator("dt", { hasText: new RegExp(`^${label}$`) }) }).locator("dd");
    await expect(info("단가")).toHaveText("₩1,200");
    await expect(info("판매가")).toHaveText("₩1,500");
    await expect(info("등록일자")).toHaveText("2026/11/13 14:39");
    await expect(info("수정일자")).toHaveText("2026/11/14 00:30");
  });
});

// Design review of 18 Nov: the points that can come back unnoticed (font, token colours, logo, disabled 삭제).
test.describe("Product list — design review points (mocked API)", () => {
  test("Figma tokens: Pretendard web font, Gray 130 text, Primary 80 table header, Gray 80 underline search, keep-all", async ({ page }) => {
    await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, products(3)) });
    await page.goto(LIST_URL);
    await expect(tableRows(page)).toHaveCount(3);

    // Font: the first family of the page is the self-hosted Pretendard file and it is loaded, so Korean
    // text never falls back to a font of the PC. PrimeReact parts (button, input) use the same family.
    const font = await page.evaluate(async () => {
      await document.fonts.ready;
      const firstFamily = (selector: string) =>
        getComputedStyle(document.querySelector(selector) as Element)
          .fontFamily.split(",")[0]
          .trim()
          .replace(/^["']|["']$/g, "");
      const page = firstFamily("body");
      return {
        page,
        loaded: Array.from(document.fonts).some((face) => face.family.replace(/^["']|["']$/g, "") === page && face.status === "loaded"),
        korean: document.fonts.check(`14px "${page}"`, "상품 관리"),
        interLoaded: Array.from(document.fonts).some((face) => /inter/i.test(face.family) && face.status === "loaded"),
        button: firstFamily(".p-button"),
        input: firstFamily("#product-search-input"),
        select: firstFamily("#product-search-type"),
      };
    });
    expect(font.page).toMatch(/pretendard/i);
    expect(font).toMatchObject({ loaded: true, korean: true, interLoaded: false, button: font.page, input: font.page, select: font.page });

    // Colours: the three values the designer named (WM 5.4), read from the rendered page
    await expect(page.locator("body")).toHaveCSS("color", "rgb(24, 24, 24)"); // Gray 130 #181818
    await expect(page.getByRole("columnheader", { name: "썸네일" })).toHaveCSS("background-color", "rgb(255, 241, 243)"); // Primary 80 #fff1f3
    expect(await tokenColor(page, "border-strong")).toBe("rgb(217, 217, 217)"); // Gray 80 #d9d9d9

    // Search type + search term are underline-only fields (design 8.1.0): no box, a Gray 80 line, 40px high
    for (const control of [page.getByLabel("검색 조건"), page.getByLabel("검색어", { exact: true })]) {
      await expect(control).toHaveCSS("border-top-width", "0px");
      await expect(control).toHaveCSS("border-left-width", "0px");
      await expect(control).toHaveCSS("border-bottom-width", "1px");
      await expect(control).toHaveCSS("border-bottom-color", "rgb(217, 217, 217)");
      expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40);
    }
    // Keyboard focus on an underline field: the line takes the focus colour (= the brand colour)
    await page.getByLabel("검색어", { exact: true }).focus();
    await expect(page.getByLabel("검색어", { exact: true })).toHaveCSS("border-bottom-color", await tokenColor(page, "focus-ring"));
    expect(await tokenColor(page, "focus-ring")).toBe(await tokenColor(page, "primary"));

    // Korean line breaking (WM 5.4) and the rows-per-page select as high as the buttons beside it
    await expect(page.locator("body")).toHaveCSS("word-break", "keep-all");
    await expect(page.locator(".field-hint, .product-table td").first()).toHaveCSS("word-break", "keep-all");
    const pageSize = await page.getByLabel("페이지당 행 수").boundingBox();
    const exportCsv = await page.getByRole("button", { name: "CSV 다운로드" }).boundingBox();
    expect(pageSize?.height).toBe(40);
    expect(exportCsv?.height).toBe(40);

    // Wide screen: the filters are always there and the phone-only 필터 button is not
    await expect(page.getByLabel("상품 유형")).toBeVisible();
    await expect(page.locator(".product-filter-toggle")).toBeHidden();
  });

  test("the header logo is the TalkingClub image and links to the home page", async ({ page }) => {
    await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, products(1)) });
    await page.goto(LIST_URL);
    await expect(tableRows(page)).toHaveCount(1);

    const home = page.getByRole("complementary", { name: "사이드바" }).getByRole("link", { name: "토킹클럽 홈" });
    await expect(home).toBeVisible();
    await expect(home).toHaveAttribute("href", LIST_URL);
    // One image named "TalkingClub" (mark + wordmark from the logo file), no text and no "관리자" beside it
    const logo = home.getByRole("img", { name: "TalkingClub" });
    await expect(logo).toBeVisible();
    await expect(logo.locator("image").first()).toHaveAttribute("href", "/brand/talkingclub-logo.png");
    await expect(home).toHaveText("");
    const box = await logo.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(158); // Figma: 158 x 30
    expect(Math.round(box?.height ?? 0)).toBe(30);
    const file = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, "/brand/talkingclub-logo.png");
    expect(file).toEqual({ width: 512, height: 107 });
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${theme}: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`, async ({ page }) => {
      await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THEME_STORAGE_KEY, theme] as const);
      // An empty list disables CSV 다운로드 as well, so the two disabled buttons can be compared
      await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, []) });
      await page.goto(LIST_URL);
      await expect(page.getByRole("heading", { name: "등록된 상품이 없습니다" })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const remove = page.getByRole("button", { name: "삭제", exact: true });
      const exportCsv = page.getByRole("button", { name: "CSV 다운로드" });
      await expect(remove).toBeDisabled();
      await expect(exportCsv).toBeDisabled();

      const look = (button: Locator) =>
        button.evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, border: style.borderTopColor, label: style.color, opacity: style.opacity };
        });
      const muted = {
        background: await tokenColor(page, "disabled-bg"),
        border: await tokenColor(page, "disabled-bg"),
        label: await tokenColor(page, "disabled-text"),
        opacity: "1",
      };
      expect(await look(remove)).toEqual(muted);
      expect(await look(exportCsv)).toEqual(muted);
      // Nothing of the danger colour is left on the disabled button (it used to keep a red border and red text)
      const danger = await tokenColor(page, "danger");
      expect(muted.border).not.toBe(danger);
      expect(muted.label).not.toBe(danger);
    });
  }
});

test.describe("Product list — 375px phone (mocked API)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("filters sit behind the 필터 button: closed at first, opens, shows the number of active filters, filtering still works", async ({ page }) => {
    const all = [mockProduct(3, { isOptions: true }), mockProduct(2), mockProduct(1)];
    await mockProductApi(page, { list: (route, url) => fulfillProductPage(route, url, all) });

    await page.goto(LIST_URL);
    await expect(tableRows(page)).toHaveCount(3);
    const toggle = page.locator(".product-filter-toggle");
    const panel = page.locator("#product-filter-panel");

    // Closed at first: the search row stays, the filters take no room above the first product
    await expect(page.getByRole("button", { name: "필터", exact: true })).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "product-filter-panel");
    await expect(panel).toBeHidden();
    await expect(page.getByLabel("검색어", { exact: true })).toBeVisible();
    await expect(page.getByLabel("상품 유형")).toBeHidden();
    await expect(page.locator(".product-filter-count")).toHaveCount(0);
    const firstCard = await tableRows(page).first().boundingBox();
    expect(firstCard?.y ?? Number.POSITIVE_INFINITY, "the first product starts on the first screen").toBeLessThan(812 * 0.75);

    // Open: the same filters as on a wide screen; a change goes to the URL and filters the list
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await page.getByLabel("상품 유형").selectOption("MAIN");
    await expect(page).toHaveURL(/\?productType=MAIN$/);
    await expect(tableRows(page)).toHaveCount(1);
    await expect(toggle).toHaveAccessibleName("필터 1개 적용 중");
    await expect(page.locator(".product-filter-count")).toHaveText("1");

    // A link that already holds a filter: the panel starts closed, the number on the button shows the filter
    await page.reload();
    await expect(tableRows(page)).toHaveCount(1);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAccessibleName("필터 1개 적용 중");
    await expect(page.locator(".product-filter-count")).toHaveText("1");

    // 필터 초기화 inside the panel still clears everything
    await toggle.click();
    await panel.getByRole("button", { name: "필터 초기화" }).click();
    await expect(page).toHaveURL(/\/shopping-mall\/products$/);
    await expect(tableRows(page)).toHaveCount(3);
    await expect(toggle).toHaveAccessibleName("필터");
    await expect(page.locator(".product-filter-count")).toHaveCount(0);

    // Close it again
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

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

  test("the tab bar shows no native scrollbar at 1440 / 768 / 375", async ({ page }) => {
    await mockProductApi(page, {
      details: (route, id) => fulfillJson(route, 200, { success: true, message: "", data: mockDetails(id) }),
    });

    for (const width of [1440, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/shopping-mall/products/details/7");
      const tabs = page.getByRole("tablist", { name: "상품 상세 탭" });
      await expect(tabs).toBeVisible();
      const bar = await tabs.evaluate((element) => ({
        // content taller than the box = an up / down scrollbar (it was 1px taller)
        tallerThanBox: element.scrollHeight - element.clientHeight,
        // content wider than the box = a sideways scrollbar on a phone
        widerThanBox: element.scrollWidth - element.clientWidth,
        // room the browser keeps for a scrollbar track (the bar has no border)
        scrollbarTrack: (element as HTMLElement).offsetHeight - element.clientHeight,
        scrollbarWidth: getComputedStyle(element).scrollbarWidth,
      }));
      expect(bar, `${width}px`).toEqual({ tallerThanBox: 0, widerThanBox: 0, scrollbarTrack: 0, scrollbarWidth: "none" });
      await expect(page.getByRole("tab", { name: "동일 카테고리 상품" })).toBeInViewport();
    }
  });

  test("productNotFound from the API shows the not-found state", async ({ page }) => {
    await mockProductApi(page, {}); // details → 400 productNotFound
    await page.goto("/shopping-mall/products/details/424242");
    await expect(page.getByRole("heading", { name: "상품을 찾을 수 없습니다" })).toBeVisible();
    await expect(page.getByRole("link", { name: "목록으로" })).toHaveAttribute("href", /\/shopping-mall\/products/);
  });
});
