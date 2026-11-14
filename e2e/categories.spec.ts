import { expect, test } from '@playwright/test';
import { API_GLOB } from './helpers';

test.describe('상품 카테고리 관리 (read only)', () => {
  test('shows every 대분류 with its 중분류 count, and expands', async ({ page }) => {
    await page.goto('/shopping/categories');
    await expect(page.getByRole('heading', { name: '상품 카테고리 관리', level: 1 })).toBeVisible();
    const topRows = page.locator('[aria-label="상품 카테고리"] > li');
    await expect(topRows).toHaveCount(12); // all 12, not the 3 the list endpoint returns
    await expect(topRows.first()).toContainText(/\(\d+개 중분류\)/);

    await page.getByRole('button', { name: '학원 Shop 펼치기' }).click();
    await expect(page.getByRole('button', { name: '학원 Shop 접기' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('HW3-Pranesh-Sub')).toBeVisible();
  });

  test('모두 펼치기 / 모두 접기', async ({ page }) => {
    await page.goto('/shopping/categories');
    await page.getByRole('button', { name: '모두 펼치기' }).click();
    await expect(page.getByRole('button', { name: '학원 Shop 접기' })).toBeVisible();
    await page.getByRole('button', { name: '모두 접기' }).click();
    await expect(page.getByRole('button', { name: '학원 Shop 펼치기' })).toBeVisible();
  });

  test('search lives in the URL and survives a reload', async ({ page }) => {
    await page.goto('/shopping/categories');
    await page.getByLabel('카테고리 검색').fill('HW3-Pranesh');
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await expect(page).toHaveURL(/\?q=HW3-Pranesh$/);
    await expect(page.getByText('HW3-Pranesh-Sub')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('카테고리 검색')).toHaveValue('HW3-Pranesh');
    await expect(page.getByText('HW3-Pranesh-Sub')).toBeVisible();
  });

  test('no result shows the design message', async ({ page }) => {
    await page.goto('/shopping/categories?q=zz-no-such-category-hw3');
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  });

  test('대분류 등록 is disabled while the API caps top-level categories', async ({ page }) => {
    await page.goto('/shopping/categories');
    await expect(page.getByRole('button', { name: '대분류 등록' })).toBeDisabled();
    await expect(page.getByRole('note')).toContainText('대분류 개수가 최대치에 도달하여');
  });

  test('a category with children cannot be deleted', async ({ page }) => {
    await page.goto('/shopping/categories');
    await page.getByRole('button', { name: '학원 Shop 삭제' }).click();
    const dialog = page.getByRole('dialog', { name: '삭제할 수 없습니다' });
    await expect(dialog).toContainText('하위 카테고리');
    await dialog.getByRole('button', { name: '확인' }).click();
    await expect(dialog).toBeHidden();
  });

  test('empty name is refused in the add dialog (nothing is sent)', async ({ page }) => {
    let posted = false;
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.url().includes('/product-category/')) posted = true;
    });
    await page.goto('/shopping/categories?q=HW3-Pranesh');
    await page.getByRole('button', { name: /소분류/ }).filter({ hasText: '소분류' }).first().click();
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText('카테고리명을 입력해 주세요.')).toBeVisible();
    await page.getByLabel('카테고리명').fill('   ');
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText('카테고리명을 입력해 주세요.')).toBeVisible();
    expect(posted).toBe(false);
  });

  test('API failure shows an error with retry', async ({ page }) => {
    await page.route(`${API_GLOB}/products/categories`, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/shopping/categories');
    await expect(page.getByText('카테고리를 불러오지 못했습니다.')).toBeVisible();
    await page.unroute(`${API_GLOB}/products/categories`);
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(page.locator('[aria-label="상품 카테고리"] > li').first()).toBeVisible();
  });
});
