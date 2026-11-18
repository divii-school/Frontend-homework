import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Brief section D (production quality), read-only, on every screen:
 * - zero console errors or warnings,
 * - WCAG 2 A/AA accessibility scan (axe) in light AND dark,
 * - no page wider than the screen at 1920 / 1440 / 1366 / 768 / 375.
 */
type Screen = { name: string; open: (page: Page) => Promise<void>; loggedOut?: boolean };

/** Finds our probe product in the list and opens its details by URL (no race with a click before hydration). */
async function openProbeDetails(page: Page) {
  await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
  const href = await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().getAttribute('href');
  if (!href) throw new Error('probe product link not found');
  await page.goto(href);
}

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
      await openProbeDetails(page);
      await expect(page.getByRole('tabpanel')).toContainText('상품코드');
    },
  },
  ...(['이미지', 'ERP 정보', '같은 카테고리 상품'] as const).map((tab) => ({
    name: `상품 상세 · ${tab}`,
    open: async (page: Page) => {
      await openProbeDetails(page);
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

    test('no horizontal page scroll at 1920 / 1440 / 1366 / 768 / 375', async ({ page }) => {
      for (const width of [1920, 1440, 1366, 768, 375]) {
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

test('dark mode: the header button switches it, it survives a reload, and switches back', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/shopping/products');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '다크 모드로 전환' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark'); // saved choice wins over the OS setting
  await page.getByRole('button', { name: '라이트 모드로 전환' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test.describe('theme stylesheet and hydration (React #418 found on Vercel, 2026-11-18)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('both theme links come in the server HTML; the boot script only enables one', async ({ page, request }) => {
    const html = await (await request.get('/login')).text();
    expect(html).toContain('id="prime-theme-light"');
    expect(html).toContain('id="prime-theme-dark"');
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      const enabled = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLLinkElement>('link[id^="prime-theme"]')].filter((l) => !l.disabled).map((l) => l.id),
      );
      expect(enabled).toEqual([`prime-theme-${scheme}`]);
    }
  });

  test('login hydrates cleanly even when the JS files arrive late and out of order (12 cold loads)', async ({ browser }) => {
    const errors: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      const context = await browser.newContext({ colorScheme: i % 3 === 0 ? 'dark' : 'light' });
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(`load ${i}: ${e.message.slice(0, 120)}`));
      // Delay each JS file by a different amount, so they finish in a different order each time.
      await page.route('**/_next/static/chunks/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 600));
        await route.continue();
      });
      await page.goto('/login');
      await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
      await page.waitForTimeout(300);
      await context.close();
    }
    expect(errors).toEqual([]);
  });
});

test('keyboard only: skip link, menu, dialog with Escape, visible focus ring', async ({ page }) => {
  await page.goto('/shopping/products');
  await expect(page.locator('tbody tr').first()).toBeVisible();

  // 1. The first Tab lands on "본문으로 바로가기"; Enter moves focus into the main content.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문으로 바로가기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);

  // 2. Tab reaches the side menu; Enter opens 상품 카테고리 관리.
  const menuLink = page.getByRole('link', { name: '상품 카테고리 관리' });
  await menuLink.focus();
  const ring = await menuLink.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
  });
  expect(ring, 'a focused element shows a focus ring').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/shopping\/categories/);

  // 3. A dialog opens from the keyboard and Escape closes it.
  await page.getByRole('button', { name: '학원 Shop 삭제' }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: '삭제할 수 없습니다' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
