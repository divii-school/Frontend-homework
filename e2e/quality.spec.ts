import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Brief section D (production quality), read-only, on every screen:
 * - zero console errors or warnings,
 * - WCAG 2 A/AA accessibility scan (axe) in light AND dark,
 * - no page wider than the screen at 1440 / 768 / 375.
 */
type Screen = { name: string; open: (page: Page) => Promise<void>; loggedOut?: boolean };

const SCREENS: Screen[] = [
  {
    name: '로그인',
    loggedOut: true,
    open: async (page) => {
      await page.goto('/login');
      await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
    },
  },
  {
    name: '상품 관리',
    open: async (page) => {
      await page.goto('/shopping/products');
      await expect(page.locator('tbody tr').first()).toBeVisible();
    },
  },
  {
    name: '상품 상세',
    open: async (page) => {
      await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
      await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().click();
      await expect(page.getByRole('tabpanel')).toContainText('상품코드');
    },
  },
  ...(['이미지', 'ERP 정보', '같은 카테고리 상품'] as const).map((tab) => ({
    name: `상품 상세 · ${tab}`,
    open: async (page: Page) => {
      await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
      await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().click();
      await page.getByRole('tab', { name: tab }).click();
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    },
  })),
  {
    name: '상품 등록',
    open: async (page) => {
      await page.goto('/shopping/products/new');
      await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-/);
    },
  },
  {
    name: '상품 카테고리 관리',
    open: async (page) => {
      await page.goto('/shopping/categories');
      await expect(page.getByText('학원 Shop').first()).toBeVisible();
    },
  },
];

/** Starts collecting console errors/warnings and uncaught exceptions for one page. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 });
}

for (const screen of SCREENS) {
  test.describe(screen.name, () => {
    if (screen.loggedOut) test.use({ storageState: { cookies: [], origins: [] } });

    for (const theme of ['light', 'dark'] as const) {
      test(`${theme}: no console errors/warnings and no WCAG A/AA violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        const problems = watchConsole(page);
        await screen.open(page);
        await settle(page);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' , ')}`)).toEqual([]);
        expect(problems).toEqual([]);
      });
    }

    test('no horizontal page scroll at 1440 / 768 / 375', async ({ page }) => {
      for (const width of [1440, 768, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await screen.open(page);
        await settle(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${width}px is ${overflow}px wider than the screen`).toBeLessThanOrEqual(0);
      }
    });
  });
}

test('404 page: no console errors other than the expected 404 response', async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByText('404 · 페이지를 찾을 수 없습니다.')).toBeVisible();
  // The browser itself logs the 404 status of this navigation; that line is the point of the page.
  expect(problems.filter((p) => !/status of 404/.test(p))).toEqual([]);
});
