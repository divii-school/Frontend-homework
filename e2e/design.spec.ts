import { expect, test, type Page } from "@playwright/test";
import { expectProductRows } from "./helpers";

// Read-only. The items of the design review of 18 Nov (Bhagyashree) that the other specs do not cover.

const useTheme = (page: Page, theme: "day" | "night") =>
  page.addInitScript((value) => window.localStorage.setItem("tc_admin_theme", value), theme);

/** The first product's details address, taken from the list. */
async function firstDetails(page: Page): Promise<string> {
  await page.goto("/products");
  await expectProductRows(page);
  return (await page.locator(".p-datatable-tbody .data-table-link").first().getAttribute("href")) ?? "/products/20000";
}

test.describe("design review of 18 Nov", () => {
  test("dark mode swaps the logo for its dark version, with no white box", async ({ page }) => {
    await useTheme(page, "night");
    await page.goto("/products");
    await expectProductRows(page);
    const logo = page.locator(".app-sidebar-logo");
    await expect(logo.locator(".brand-logo-night")).toBeVisible();
    await expect(logo.locator(".brand-logo-night")).toHaveAttribute("src", /login-logo-dark/);
    await expect(logo.locator(".brand-logo-day")).toBeHidden();
    // The dark file has loaded, and nothing behind it draws a box
    expect(await logo.locator(".brand-logo-night").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(logo.locator(".brand-logo")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test("light mode keeps the original logo", async ({ page }) => {
    await useTheme(page, "day");
    await page.goto("/products");
    await expectProductRows(page);
    const logo = page.locator(".app-sidebar-logo");
    await expect(logo.locator(".brand-logo-day")).toBeVisible();
    await expect(logo.locator(".brand-logo-night")).toBeHidden();
  });

  test("the rest of the admin menu is shown greyed out and opens nothing", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const sidebar = page.locator(".app-sidebar");
    for (const label of ["대시보드", "유저관리", "학원 관리", "학사관리", "교육과정 관리", "공지사항 관리", "결제 관리", "지사장 메뉴", "권한 관리", "주문 배송 관리", "적립금 관리"]) {
      // Each row also says "(사용할 수 없음)" to screen readers, so the visible name is matched as part of its text
      await expect(sidebar.getByText(label)).toBeVisible();
      await expect(sidebar.getByRole("link", { name: label })).toHaveCount(0);
    }
    // The two HW3 pages stay real links
    await expect(sidebar.getByRole("link", { name: "상품 관리", exact: true })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "상품 카테고리 관리" })).toBeVisible();
  });

  test("product list: code under each thumbnail, 예 / 아니오 dropdown, names as plain bold text", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const row = page.locator(".p-datatable-tbody > tr").first();
    const code = row.locator(".product-thumbnail-code");
    await expect(code).not.toBeEmpty();
    const thumbnail = await row.locator(".product-thumbnail").boundingBox();
    const codeBox = await code.boundingBox();
    expect(codeBox!.y).toBeGreaterThanOrEqual(thumbnail!.y + thumbnail!.height - 1);
    await expect(row.locator(".visibility-select .p-dropdown-label")).toHaveText(/^(예|아니오)$/);

    const name = row.locator(".data-table-link");
    await expect(name).toHaveCSS("text-decoration-line", "none");
    expect(Number(await name.evaluate((element) => getComputedStyle(element).fontWeight))).toBeGreaterThanOrEqual(700);
    await name.hover();
    await expect(name).toHaveCSS("text-decoration-line", "underline");
  });

  test("a selected row is highlighted, not only its checkbox", async ({ page }) => {
    await page.goto("/products");
    await expectProductRows(page);
    const rows = page.locator(".p-datatable-tbody > tr");
    const plain = await rows.nth(1).evaluate((element) => getComputedStyle(element).backgroundColor);
    // Selecting changes nothing on the server; it is cleared again at the end
    await rows.first().locator(".p-checkbox").click();
    await expect(rows.first()).toHaveClass(/p-highlight/);
    await page.mouse.move(0, 0);
    expect(await rows.first().evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(plain);
    await rows.first().locator(".p-checkbox").click();
    await expect(rows.first()).not.toHaveClass(/p-highlight/);
  });

  test("Pretendard is loaded as a web font, and body text uses the Figma grey", async ({ page }) => {
    await useTheme(page, "day");
    await page.goto("/products");
    await expectProductRows(page);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((face) => face.family.replace(/["']/g, "") === "Pretendard" && face.status === "loaded");
    });
    expect(loaded).toBe(true);
    // Figma Gray 120
    await expect(page.locator("body")).toHaveCSS("color", "rgb(49, 49, 49)");
  });

  test("details page: price with ₩ and date as YYYY/MM/DD HH:MM", async ({ page }) => {
    await page.goto(await firstDetails(page));
    await expect(page.getByRole("tab", { name: "기본 정보" })).toBeVisible();
    const row = (label: string) => page.locator(".details-row").filter({ has: page.getByText(label, { exact: true }) });
    await expect(row("판매가")).toContainText(/₩\d{1,3}(,\d{3})*/);
    await expect(row("등록일자")).toContainText(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  test("at 375px the details tabs have no scrollbar and the form stepper stays on one line", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(await firstDetails(page));
    const tabs = page.getByRole("tablist", { name: "상품 상세 탭" });
    await expect(tabs).toBeVisible();
    const tabBox = await tabs.evaluate((element: HTMLElement) => ({
      overflow: element.scrollWidth - element.clientWidth,
      scrollbar: element.offsetHeight - element.clientHeight - parseFloat(getComputedStyle(element).borderBottomWidth),
    }));
    expect(tabBox).toEqual({ overflow: 0, scrollbar: 0 });

    await page.goto("/products/create");
    const steps = page.locator(".stepper-item");
    await expect(steps).toHaveCount(4);
    const tops = await steps.evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });
});
