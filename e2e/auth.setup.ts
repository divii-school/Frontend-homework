import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';
import { fillSecret, qaLogin } from './helpers';

/** Logs in once through the real login screen; every other test reuses this session. */
setup('log in as the QA admin', async ({ page }) => {
  const { id, password } = qaLogin();

  await page.goto('/login');
  await fillSecret(page.getByPlaceholder('아이디'), id);
  await fillSecret(page.getByPlaceholder('비밀번호'), password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/shopping\/products/);
  await expect(page.getByRole('heading', { name: '상품 관리', level: 1 })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
