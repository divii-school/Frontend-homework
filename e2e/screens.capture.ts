import { expect, test, type Page } from '@playwright/test';

/**
 * Screenshots for the submission page (design | build), every screen at every size, light and dark.
 * Read-only. Run with: npm run screenshots  → docs/screenshots/<width>-<theme>-<screen>.png
 * The login screen is captured logged out and with empty fields, so no account shows in any image.
 */
const WIDTHS = [1920, 1440, 1366, 768, 375] as const;
const THEMES = ['light', 'dark'] as const;
const OUT = 'docs/screenshots';

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 });
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test.describe(`${width} ${theme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme: theme });
      const shot = (page: Page, name: string) =>
        page.screenshot({ path: `${OUT}/${width}-${theme}-${name}.png`, fullPage: true });

      test('login', async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, locale: 'ko-KR' });
        const page = await context.newPage();
        await page.goto('/login');
        await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
        await shot(page, '1-login');
        await context.close();
      });

      test('product list, details, register', async ({ page }) => {
        await page.goto('/shopping/products');
        await expect(page.locator('tbody tr').first()).toBeVisible();
        await settle(page);
        await shot(page, '2-product-list');

        await page.locator('tbody tr').first().getByRole('link').first().click();
        await expect(page.getByRole('tabpanel')).toBeVisible();
        await settle(page);
        await shot(page, '3-product-details');

        await page.goto('/shopping/products/new');
        await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-/);
        await shot(page, '4-product-register-step1');
      });

      test('categories', async ({ page }) => {
        await page.goto('/shopping/categories?q=HW3-Pranesh');
        await expect(page.getByText('HW3-Pranesh-Sub').first()).toBeVisible();
        await settle(page);
        await shot(page, '5-categories');
      });
    });
  }
}
