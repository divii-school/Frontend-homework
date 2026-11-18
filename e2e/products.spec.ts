import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { expectProductRows, watchConsole } from "./helpers";

// Read-only: nothing here creates, changes or deletes data.
test.describe("product list", () => {
  test("opens with title, rows and total, and no console errors or warnings", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/products");
    await expectProductRows(page);
    await expect(page).toHaveTitle(/상품 관리/);
    await expect(page.getByText(/총 게시물:/)).toContainText(/\d/);
    await expect(page.getByRole("columnheader", { name: "판매금액" })).toBeVisible();
    // WM formats: won with a three-digit comma and no space, Korean date with 오전/오후 before the time
    await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText(/[\d,]+원/);
    await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText(/\d{4}년 \d{1,2}월 \d{1,2}일 (오전|오후) \d{2}:\d{2}/);
    // Every price has its three-digit comma: at least one is 1,000원 or more, and none shows four digits in a row
    const prices = await page.locator(".p-datatable-tbody > tr > td:nth-child(4)").allTextContents();
    expect(prices.some((text) => /\d,\d{3}원/.test(text))).toBe(true);
    expect(prices.filter((text) => /\d{4}/.test(text))).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("search goes to the URL and survives a refresh", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    await page.getByLabel("상품 검색").fill("FLY HIGH");
    await expect(page).toHaveURL(/search=FLY\+HIGH/);
    await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText("FLY HIGH");

    await page.reload();
    await expect(page.getByLabel("상품 검색")).toHaveValue("FLY HIGH");
    await expect(page.locator(".p-datatable-tbody > tr").first()).toContainText("FLY HIGH");
  });

  test("paging and page size are in the URL and are sent to the server", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const request = page.waitForRequest((item) => item.url().includes("/api/v1/products?") && item.url().includes("page=2"));
    await page.getByRole("button", { name: "Page 2" }).click();
    await request;
    await expect(page).toHaveURL(/page=2/);

    await page.goto("/products?page=3&limit=20");
    await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(20);
    await expect(page.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "true");
  });

  test("sort is kept in the URL and orders the rows", async ({ page }) => {
    await page.goto("/products?limit=20");
    await expectProductRows(page);
    // The API has no sort parameter, so the screen says the sort covers only this page (code review, 18 Nov)
    await expect(page.getByText("정렬은 현재 페이지 기준입니다.")).toBeVisible();
    // First click on a header sorts ascending; the choice is written to the URL.
    await page.getByRole("columnheader", { name: "판매금액" }).click();
    await expect(page).toHaveURL(/sort=price&order=asc/);
    const prices = async () => {
      const cells = await page.locator(".p-datatable-tbody > tr > td:nth-child(4)").allTextContents();
      return cells.map((text) => Number(text.replace(/[^\d]/g, "")));
    };
    await expect.poll(async () => {
      const numbers = await prices();
      return numbers.length > 1 && numbers.every((value, index) => index === 0 || numbers[index - 1] <= value);
    }).toBe(true);

    // A refresh keeps the sort
    await page.reload();
    await expectProductRows(page);
    const numbers = await prices();
    expect(numbers).toEqual([...numbers].sort((x, y) => x - y));
  });

  test("category filter is sent to the server and kept in the URL", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const request = page.waitForRequest((item) => item.url().includes("get-products-by-category") && item.url().includes("categoryId="));
    // The select opens only once its options have loaded, so the click is repeated until the list shows
    const firstOption = page.locator(".p-dropdown-panel .p-dropdown-item").first();
    await expect(async () => {
      if (!(await firstOption.isVisible())) await page.locator(".list-toolbar-category").click();
      await expect(firstOption).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
    await firstOption.click();
    await request;
    await expect(page).toHaveURL(/categoryId=\d+/);
  });

  test("a search with no result shows the empty state", async ({ page }) => {
    await page.goto("/products?search=zzzz-no-such-product-qq");
    await expect(page.getByText("조건에 맞는 상품이 없습니다.")).toBeVisible();
  });

  test("an invalid URL falls back to the defaults instead of breaking", async ({ page }) => {
    await page.goto("/products?page=abc&limit=7&sort=hack&order=up");
    await expectProductRows(page);
    await expect(page.locator(".p-datatable-tbody > tr")).toHaveCount(10);
  });

  test("a page past the end goes to the last page that exists", async ({ page }) => {
    await page.goto("/products?search=FLY+HIGH&page=999");
    await expectProductRows(page);
    await expect(page).not.toHaveURL(/page=999/);
    await expect(page.getByRole("button", { name: "Last Page" })).toBeDisabled();
    await expect(page.getByLabel("상품 검색")).toHaveValue("FLY HIGH");
  });

  test("a search with a space typed slowly keeps the space", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const box = page.getByLabel("상품 검색");
    await box.pressSequentially("FLY ");
    await expect(page).toHaveURL(/search=FLY$/);
    await box.pressSequentially("HIGH");
    await expect(box).toHaveValue("FLY HIGH");
    await expect(page).toHaveURL(/search=FLY\+HIGH/);
  });

  test("export downloads exactly the filtered result as CSV", async ({ page }) => {
    await page.goto("/products?search=FLY+HIGH");
    await expectProductRows(page);
    const total = Number((await page.getByText(/총 게시물:/).textContent())?.replace(/[^\d]/g, ""));
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "내보내기" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe("products.csv");
    await expect(page.getByText("내보내기 완료")).toBeVisible();

    // The header, then one row per product of the search (not only the page on screen), each matching it
    const text = readFileSync(await download.path(), "utf8").replace(/^﻿/, "");
    const [header, ...rows] = text.split("\r\n");
    expect(header).toBe("상품코드,상품명,판매금액,카테고리,노출여부,판매상태,등록일자");
    expect(rows).toHaveLength(total);
    expect(rows.every((row) => row.toUpperCase().includes("FLY HIGH"))).toBe(true);
    expect(rows.every((row) => /"\d{1,3}(,\d{3})*원"|,\d{1,3}원,/.test(row))).toBe(true);
  });
});

test.describe("product details", () => {
  test("tabs load their own data and the open tab is kept in the URL", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    await page.locator(".p-datatable-tbody .data-table-link").first().click();
    await expect(page.getByRole("heading", { level: 1, name: "상품 상세" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "기본 정보" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("상품코드")).toBeVisible();

    const treeRequest = page.waitForRequest((item) => item.url().includes("/product-category/list"));
    await page.getByRole("tab", { name: "카테고리", exact: true }).click();
    await treeRequest;
    await expect(page).toHaveURL(/tab=category/);
    await expect(page.getByText("카테고리 경로")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("tab", { name: "카테고리", exact: true })).toHaveAttribute("aria-selected", "true");

    // Keyboard: the right arrow moves to the next tab
    await page.getByRole("tab", { name: "카테고리", exact: true }).press("ArrowRight");
    await expect(page).toHaveURL(/tab=related/);
    await expect(page.getByRole("tab", { name: "같은 카테고리 상품" })).toHaveAttribute("aria-selected", "true");
  });

  test("an unknown product shows the not-found state with the API's message", async ({ page }) => {
    await page.goto("/products/99999999");
    await expect(page.getByText("상품을 찾을 수 없습니다.")).toBeVisible();
  });
});

test.describe("product form (no save)", () => {
  test("each step validates, values are kept when going back, and the step is in the URL", async ({ page }) => {
    await page.goto("/products/create");
    await expect(page.getByRole("heading", { level: 1, name: "상품 등록" })).toBeVisible();
    await expect(page.getByLabel("상품코드")).toHaveValue(/PRD-\d+/);

    // Step 1: "next" with empty fields stays on the step and explains why
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByText("상품명을 입력해 주세요.")).toBeVisible();
    await expect(page.getByText("상품 ERP명을 입력해 주세요.")).toBeVisible();
    await page.getByLabel("상품명").fill("HW3-Sachin-Draft");
    await page.getByLabel("상품 ERP명").fill("HW3-Sachin-ERP");
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page).toHaveURL(/step=price/);

    // Step 2: wrong format, then the sale price is calculated
    await page.getByLabel("수량").fill("abc");
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByText("수량은 0 이상의 숫자로 입력해 주세요.")).toBeVisible();
    await page.getByLabel("수량").fill("3");
    await page.getByLabel("단가(원)", { exact: true }).fill("1500");
    await page.getByLabel("ERP 단가(원)").fill("1000");
    await expect(page.getByLabel("판매가")).toHaveValue("4,500원");

    // Back: step 1 still has what was typed; forward again: step 2 too
    await page.getByRole("button", { name: "이전" }).click();
    await expect(page.getByLabel("상품명")).toHaveValue("HW3-Sachin-Draft");
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByLabel("수량")).toHaveValue("3");

    // Step 3: categories are required; the lower selects wait for the upper one
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page).toHaveURL(/step=category/);
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByText("대분류를 선택해 주세요.")).toBeVisible();
    const subSelect = page.locator(".form-field", { has: page.locator("#product-subCategoryId") }).locator(".p-dropdown");
    await expect(subSelect).toHaveClass(/p-disabled/);
  });

  test("a wrong file type is refused without an upload request", async ({ page }) => {
    let uploadCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/upload")) uploadCalls += 1;
    });
    await page.goto("/products/create?step=media");
    await expect(page.getByRole("button", { name: "파일추가" })).toBeVisible();
    await page.locator("#product-images").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
    await expect(page.getByText("notes.txt: PNG, JPG, WEBP 이미지만 등록할 수 있습니다.")).toBeVisible();
    expect(uploadCalls).toBe(0);
  });
});
