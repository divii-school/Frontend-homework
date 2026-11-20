import { expect, test } from '@playwright/test';
import { hasLogin, login, trackConsole } from './helpers';

test.describe('상품 관리 (읽기 전용)', () => {
  test.skip(!hasLogin, 'E2E_LOGIN_ID / E2E_PASSWORD 가 필요합니다');

  test('목록이 보이고 콘솔 오류가 없다 @responsive', async ({ page }) => {
    const issues = trackConsole(page);
    await login(page, '/shopping/products');
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible();
    await expect(page.getByText(/총 게시물/)).toBeVisible();
    expect(issues).toEqual([]);
  });

  test('검색 / 페이지 상태가 URL에 남고 새로고침 후에도 유지된다', async ({ page }) => {
    await login(page, '/shopping/products');
    await page.getByLabel('검색어').fill('HW3');
    await page.getByRole('button', { name: '검색' }).click();
    await expect(page).toHaveURL(/search=HW3/);
    await page.reload();
    await expect(page.getByLabel('검색어')).toHaveValue('HW3');
    await expect(page).toHaveURL(/search=HW3/);
  });

  test('정렬 상태가 URL에 저장된다', async ({ page }) => {
    await login(page, '/shopping/products');
    await page.getByRole('columnheader', { name: /판매가/ }).click();
    await expect(page).toHaveURL(/sort=price/);
  });

  test('상세 페이지 탭이 URL에 저장된다', async ({ page }) => {
    await login(page, '/shopping/products');
    const first = page.locator('tbody a').first();
    test.skip((await first.count()) === 0, '상품이 없습니다');
    await first.click();
    await page.getByRole('tab', { name: '이미지' }).click();
    await expect(page).toHaveURL(/tab=images/);
    await page.reload();
    await expect(page.getByRole('tab', { name: '이미지' })).toHaveAttribute('aria-selected', 'true');
  });

  test('다크 모드 전환', async ({ page }) => {
    await login(page, '/shopping/products');
    await page.getByRole('button', { name: '다크 모드로 전환' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('상품 카테고리 관리 (읽기 전용)', () => {
  test.skip(!hasLogin, 'E2E_LOGIN_ID / E2E_PASSWORD 가 필요합니다');

  test('트리가 보이고 모두 접기/펼치기가 동작한다', async ({ page }) => {
    const issues = trackConsole(page);
    await login(page, '/shopping/categories');
    await expect(page.getByRole('heading', { name: '상품 카테고리 관리' })).toBeVisible();
    await page.getByRole('button', { name: '모두 접기' }).click();
    await page.getByRole('button', { name: '모두 펼치기' }).click();
    expect(issues).toEqual([]);
  });
});
