import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API_GLOB } from './helpers';

test.describe('상품 관리 목록 (read only)', () => {
  test('loads a page of 10 with the total count', async ({ page }) => {
    await page.goto('/shopping/products');
    await expect(page.getByRole('heading', { name: '상품 관리', level: 1 })).toBeVisible();
    await expect(page.getByText(/총 게시물 [\d,]+건/)).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await expect(page.locator('thead')).toContainText('판매가');
    await expect(page.locator('tbody tr').first()).toContainText('₩');
  });

  test('search, type and page live in the URL; reload and back keep them', async ({ page }) => {
    await page.goto('/shopping/products');
    await page.getByLabel('검색어').fill('토킹클럽');
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await expect(page).toHaveURL(/\?q=%ED%86%A0%ED%82%B9%ED%81%B4%EB%9F%BD$/);

    await page.getByRole('button', { name: '2페이지' }).click();
    await expect(page).toHaveURL(/q=.+&page=2$/);
    // The previous page stays on screen under a loading overlay until page 2 arrives.
    await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0);
    const firstOnPage2 = (await page.locator('tbody tr').first().getByRole('link').innerText()).trim();

    await page.reload();
    await expect(page.getByLabel('검색어')).toHaveValue('토킹클럽');
    await expect(page.locator('tbody tr').first().getByRole('link')).toHaveText(firstOnPage2);

    await page.goBack();
    await expect(page).not.toHaveURL(/page=2/);
  });

  test('a bad URL falls back to a working list', async ({ page }) => {
    await page.goto('/shopping/products?page=-4&size=9999&type=hack');
    await expect(page.locator('tbody tr')).toHaveCount(10);
  });

  test('category search type', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Child&type=categoryName');
    await expect(page.locator('tbody')).toContainText('HW3-Pranesh-Probe');
  });

  test('empty search shows the design message', async ({ page }) => {
    await page.goto('/shopping/products?q=zz-no-such-product-hw3');
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
    await expect(page.getByText(/총 게시물 0건/)).toBeVisible();
  });

  test('selection enables bulk delete; cancel deletes nothing', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeDisabled();
    await page.locator('tbody tr').first().getByRole('checkbox', { name: /HW3-Pranesh-Probe.* 선택/ }).check();
    await page.getByRole('button', { name: '삭제 (1)' }).click();
    const dialog = page.getByRole('dialog', { name: '상품 삭제' });
    await expect(dialog).toContainText('선택한 1개 상품을 삭제하시겠습니까?');
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(page.locator('tbody')).toContainText('HW3-Pranesh-Probe');
  });

  test('CSV export downloads the whole filtered result', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV 내보내기' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^products_\d{12}\.csv$/);
    const text = (await (await file.createReadStream()).toArray()).join('');
    expect(text).toContain('상품코드');
    expect(text).toContain('HW3-Pranesh-Probe');
  });

  test('API error shows an error with retry; network loss too', async ({ page }) => {
    await page.route(`${API_GLOB}/products?**`, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/shopping/products');
    await expect(page.getByText('상품 목록을 불러오지 못했습니다.')).toBeVisible();
    await page.unrouteAll();
    await page.route(`${API_GLOB}/products?**`, (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(page.getByText(/네트워크/)).toBeVisible();
  });

  test('no accessibility violations (WCAG A/AA)', async ({ page }) => {
    await page.goto('/shopping/products');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" , ")}`)).toEqual([]);
  });
});

test.describe('상품 상세 (read only)', () => {
  test('tabs: each loads on open, active tab in the URL', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().click();
    await expect(page).toHaveURL(/\/shopping\/products\/\d+$/);
    await expect(page.getByRole('tab', { name: '기본 정보' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('상품코드');

    await page.getByRole('tab', { name: '같은 카테고리 상품' }).click();
    await expect(page).toHaveURL(/\?tab=related$/);
    // Our probe is the only product in its 소분류, so this tab shows its own empty state.
    await expect(page.getByRole('tabpanel')).toContainText('같은 카테고리에 다른 상품이 없습니다.');

    await page.reload();
    await expect(page.getByRole('tab', { name: '같은 카테고리 상품' })).toHaveAttribute('aria-selected', 'true');

    // Keyboard: arrows move between tabs.
    await page.getByRole('tab', { name: '같은 카테고리 상품' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/\?tab=erp$/);
    await expect(page.getByRole('tabpanel')).toContainText('ERP 코드');
  });

  test('related tab lists the other products of the 소분류', async ({ page }) => {
    await page.goto('/shopping/products/12564?tab=related');
    await expect(page.getByRole('tabpanel')).toContainText('같은 소분류 상품');
    await expect(page.getByRole('tabpanel').getByRole('link').first()).toBeVisible();
  });

  test('목록 returns to the same list page', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh');
    await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().click();
    await page.getByRole('link', { name: '목록' }).click();
    await expect(page).toHaveURL(/\/shopping\/products\?q=HW3-Pranesh$/);
  });

  test('a tab that fails shows its own error; others still work', async ({ page }) => {
    await page.route(`${API_GLOB}/products/get-products-by-category**`, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/shopping/products/20001?tab=related');
    await expect(page.getByText('같은 카테고리 상품을 불러오지 못했습니다.')).toBeVisible();
    await page.getByRole('tab', { name: '이미지' }).click();
    await expect(page.getByRole('tabpanel').getByRole('img').first()).toBeVisible();
  });

  test('unknown or invalid product → not found', async ({ page }) => {
    await page.goto('/shopping/products/99999999');
    await expect(page.getByText('상품을 찾을 수 없습니다.').first()).toBeVisible();
    await page.goto('/shopping/products/abc');
    await expect(page.getByText('404 · 페이지를 찾을 수 없습니다.')).toBeVisible();
  });
});
