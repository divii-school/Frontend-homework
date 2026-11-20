import { test, expect, type Page } from "@playwright/test";
import { realLogin, hasQaLogin } from "./helpers/realLogin";

// READ-ONLY screenshot pass for the submission: every screen at 1440 / 768 / 375, light and dark,
// against the real QA API. Each shot also asserts there is no sideways page scroll.
// Output: screenshots/<screen>-<width>-<theme>.png (committed for the design review).

const WIDTHS = [1440, 768, 375] as const;
const THEMES = ["light", "dark"] as const;

interface Screen {
  name: string;
  path: string;
  /** Waits until real content is on screen. */
  ready: (page: Page) => Promise<void>;
  needsLogin: boolean;
}

const SCREENS: Screen[] = [
  { name: "login", path: "/login", needsLogin: false, ready: async (p) => expect(p.getByRole("button", { name: "로그인" })).toBeVisible() },
  {
    name: "categories",
    path: "/shopping/categories",
    needsLogin: true,
    ready: async (p) => expect(p.getByRole("region", { name: "카테고리 목록" }).getByRole("listitem").first()).toBeVisible({ timeout: 20_000 }),
  },
  {
    name: "products",
    path: "/shopping/products",
    needsLogin: true,
    ready: async (p) => expect(p.getByRole("table").locator("tbody tr").first()).toContainText("₩", { timeout: 20_000 }),
  },
  {
    name: "product-new",
    path: "/shopping/products/new",
    needsLogin: true,
    ready: async (p) => expect(p.getByLabel("상품 코드")).toHaveValue(/PRD-/, { timeout: 20_000 }),
  },
  {
    name: "product-detail",
    path: "/shopping/products/12139",
    needsLogin: true,
    ready: async (p) => expect(p.getByRole("tabpanel")).toContainText("₩", { timeout: 20_000 }),
  },
  {
    name: "product-edit",
    path: "/shopping/products/12139/edit",
    needsLogin: true,
    ready: async (p) => expect(p.getByLabel("상품명")).not.toHaveValue("", { timeout: 20_000 }),
  },
];

test.describe.configure({ mode: "serial" });

for (const theme of THEMES) {
  test(`all screens, ${theme}`, async ({ page }) => {
    test.skip(!hasQaLogin, "needs the QA login in .env.local");
    test.setTimeout(240_000);
    await page.emulateMedia({ colorScheme: theme });
    await realLogin(page, "/shopping/products");

    for (const screen of SCREENS) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
        if (!screen.needsLogin) {
          // Login page while logged in redirects; show it in a clean context instead.
          continue;
        }
        await page.goto(screen.path);
        await screen.ready(page);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(overflow, `${screen.name} at ${width} scrolls sideways`).toBe(false);
        await page.screenshot({ path: `screenshots/${screen.name}-${width}-${theme}.png`, fullPage: true });
      }
    }
  });

  test(`login, ${theme}`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: theme });
    const page = await context.newPage();
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
      await page.goto("/login");
      await SCREENS[0].ready(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `login at ${width} scrolls sideways`).toBe(false);
      await page.screenshot({ path: `screenshots/login-${width}-${theme}.png`, fullPage: true });
    }
    await context.close();
  });
}
