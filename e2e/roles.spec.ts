import { expect, test } from '@playwright/test';
import { loginAs } from './helpers';

// Fresh browser for each test: these log in as limited roles (see loginAs).
test.use({ storageState: { cookies: [], origins: [] } });

test('a role with only 상품 관리 sees only that menu, and 카테고리 URL shows 403', async ({ page }) => {
  await loginAs(page, 'ADMIN', [{ module: 'shopping_mall', subModules: ['product_management'] }]);
  await expect(page).toHaveURL(/\/shopping\/products/);

  const menu = page.getByRole('navigation', { name: '관리자 메뉴' });
  await expect(menu.getByRole('link', { name: '상품 관리' })).toBeVisible();
  await expect(menu.getByRole('link', { name: '상품 카테고리 관리' })).toHaveCount(0);

  await page.goto('/shopping/categories');
  await expect(page.getByText('403 · 접근 권한이 없습니다.')).toBeVisible();
  await expect(page).toHaveURL(/\/shopping\/categories$/); // URL kept, page content blocked
});

test('a role with only 카테고리 관리 is blocked from product URLs (incl. edit)', async ({ page }) => {
  await loginAs(page, 'ADMIN', [{ module: 'shopping_mall', subModules: ['category_management'] }]);
  await page.goto('/shopping/products/20001/edit');
  await expect(page.getByText('403 · 접근 권한이 없습니다.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '관리자 메뉴' }).getByRole('link', { name: '상품 관리' })).toHaveCount(0);
});

test('an admin with no shopping permission gets the Figma no-permission popup', async ({ page }) => {
  await loginAs(page, 'ADMIN', []);
  await expect(page.getByText('관리자 권한이 없습니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: '토킹클럽 홈으로' })).toHaveAttribute('href', 'https://www.talkingclub.co.kr');
  await expect(page).toHaveURL(/\/login/);
});

test('returnTo cannot send the user to another site', async ({ page }) => {
  await loginAs(page, 'SUPER_ADMIN', []);
  await page.goto('/login?returnTo=https://evil.example');
  await expect(page).toHaveURL(/\/shopping\/products/);
});
