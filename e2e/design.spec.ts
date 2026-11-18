import { expect, test, type Page } from '@playwright/test';

/**
 * Design review (Bhagyashree, 2026-11-18): one test per fix, read only. Each checks what was reported, so a
 * regression shows up here rather than in the next design review.
 */

/** Alpha (0–255) of the top-left pixel of the visible logo, drawn onto a canvas. */
async function visibleLogo(page: Page) {
  return page.evaluate(async () => {
    const img = [...document.querySelectorAll<HTMLImageElement>('img[src*="logo-talkingclub"]')].find((i) => i.offsetParent !== null);
    if (!img) return null;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    const corner = ctx.getImageData(0, 0, 1, 1).data[3];
    const visibleCount = [...document.querySelectorAll('img[src*="logo-talkingclub"]')].filter((i) => (i as HTMLElement).offsetParent !== null).length;
    return { src: img.currentSrc, corner, visibleCount };
  });
}

test.describe('logo: no white box in dark mode (must-fix 1)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`${scheme}: one logo, transparent background, the ${scheme} version (header)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/shopping/products');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      const logo = await visibleLogo(page);
      expect(logo?.visibleCount).toBe(1);
      expect(logo?.src).toContain(`logo-talkingclub-${scheme}`);
      expect(logo?.corner, 'the corner pixel is transparent (no box)').toBe(0);
    });
  }

  test.describe('login card', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('dark: the dark version, transparent background', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/login');
      await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
      const logo = await visibleLogo(page);
      expect(logo?.src).toContain('logo-talkingclub-dark');
      expect(logo?.corner).toBe(0);
    });
  });
});

test('상품 관리 at 375: the search box fits, with its 🔍 button inside the screen (must-fix 2)', async ({ page }) => {
  for (const width of [375, 358]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/shopping/products');
    const form = page.getByRole('search');
    await expect(form.getByRole('button', { name: '검색', exact: true })).toBeVisible();
    const box = await form.evaluate((f) => {
      const panel = f.closest('section') as HTMLElement;
      const p = panel.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(panel).paddingRight);
      const button = (f.querySelector('button[type=submit]') as HTMLElement).getBoundingClientRect();
      return { formRight: f.getBoundingClientRect().right, contentRight: p.right - pad, buttonRight: button.right, viewport: document.documentElement.clientWidth };
    });
    expect(box.formRight, `${width}px: form inside its panel`).toBeLessThanOrEqual(box.contentRight + 0.5);
    expect(box.buttonRight, `${width}px: 🔍 inside the screen`).toBeLessThanOrEqual(box.viewport);
  }
});

test('상품 관리: the product code under each thumbnail (should-fix 3)', async ({ page }) => {
  await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
  const row = page.locator('tbody tr').filter({ hasText: 'HW3-Pranesh-Probe-a' }).first();
  await expect(row).toBeVisible();
  // The thumbnail is the second column when the 선택 checkbox column is shown.
  await expect(row.locator('td').nth(1)).toContainText(/PRD-\d+/);
});

test('상품 등록: single-line fields are underline-only, 상세설명 stays boxed (should-fix 4)', async ({ page }) => {
  await page.goto('/shopping/products/new');
  const name = page.getByRole('textbox', { name: '상품명', exact: true });
  await expect(name).toBeVisible();
  const field = await name.evaluate((e) => {
    const s = getComputedStyle(e);
    return { top: s.borderTopWidth, left: s.borderLeftWidth, bottom: s.borderBottomWidth, radius: s.borderTopLeftRadius };
  });
  expect(field).toEqual({ top: '0px', left: '0px', bottom: '1px', radius: '0px' });
  const description = await page.getByRole('textbox', { name: '상세설명' }).evaluate((e) => getComputedStyle(e).borderTopWidth);
  expect(description).toBe('1px');
});

test('상품 등록: 취소 is a red outline with red text (should-fix 5)', async ({ page }) => {
  await page.goto('/shopping/products/new');
  const cancel = page.getByRole('button', { name: '취소', exact: true });
  const [color, border, primary] = await cancel.evaluate((e) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-primary)';
    document.body.append(probe);
    const p = getComputedStyle(probe).color;
    probe.remove();
    const s = getComputedStyle(e);
    return [s.color, s.borderTopColor, p];
  });
  expect(color).toBe(primary);
  expect(border).toBe(primary);
});

test('Korean text breaks between words, never inside one (should-fix 6, WM 5.4)', async ({ page }) => {
  await page.goto('/shopping/products');
  expect(await page.evaluate(() => getComputedStyle(document.body).wordBreak)).toBe('keep-all');
});

test('상품 상세 at 375: all four tabs are visible, no tab scrollbar (should-fix 7)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/shopping/products/20001');
  const tablist = page.getByRole('tablist');
  await expect(tablist.getByRole('tab')).toHaveCount(4);
  const layout = await tablist.evaluate((t) => ({
    overflow: t.scrollWidth - t.clientWidth,
    tabsOutside: [...t.querySelectorAll('[role=tab]')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth).length,
  }));
  expect(layout).toEqual({ overflow: 0, tabsOutside: 0 });
});

test('buttons in one row have the same height: 등록, 삭제, CSV 내보내기 (minor)', async ({ page }) => {
  await page.goto('/shopping/products');
  const heights = await Promise.all(
    [page.getByRole('link', { name: '등록' }), page.getByRole('button', { name: /^삭제/ }), page.getByRole('button', { name: 'CSV 내보내기' })].map(
      (l) => l.evaluate((e) => Math.round(e.getBoundingClientRect().height)),
    ),
  );
  expect(new Set(heights).size, `heights ${heights.join(' / ')}`).toBe(1);
});

test('sidebar: the full Figma menu, other menus greyed out and not clickable (minor)', async ({ page }) => {
  await page.goto('/shopping/products');
  const nav = page.getByRole('navigation', { name: '관리자 메뉴' });
  for (const label of ['대시보드', '유저관리', '공지사항 관리', '권한 관리', '주문 배송 관리', '적립금 관리']) {
    const item = nav.getByText(label, { exact: true });
    await expect(item).toBeVisible();
    await expect(nav.getByRole('link', { name: label })).toHaveCount(0);
  }
  await expect(nav.locator('[aria-disabled="true"]')).toHaveCount(11);
  await expect(nav.getByRole('link', { name: '상품 관리' })).toBeVisible();
});
