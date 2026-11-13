import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';

/** Logs in once through the real login screen; every other test reuses this session. */
setup('log in as the QA admin', async ({ page }) => {
  const id = process.env.E2E_LOGIN_ID;
  const password = process.env.E2E_PASSWORD;
  if (!id || !password) throw new Error('Set E2E_LOGIN_ID and E2E_PASSWORD in .env.local (logins from DM).');

  await page.goto('/login');
  await page.getByPlaceholder('아이디').fill(id);
  await page.getByPlaceholder('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/shopping\/products/);
  await expect(page.getByRole('heading', { name: '상품 관리', level: 1 })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
