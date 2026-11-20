import { expect, test } from '@playwright/test';
import { hasLogin, login, trackConsole } from './helpers';

test.describe('로그인 / 라우트 가드', () => {
  test('로그인 버튼은 아이디와 비밀번호를 모두 입력해야 활성화된다', async ({ page }) => {
    const issues = trackConsole(page);
    await page.goto('/login');
    const btn = page.getByRole('button', { name: '로그인' });
    await expect(btn).toBeDisabled();
    await page.getByPlaceholder('아이디를 입력해 주세요.').fill('someone');
    await expect(btn).toBeDisabled();
    await page.getByPlaceholder('비밀번호를 입력해 주세요.').fill('x');
    await expect(btn).toBeEnabled();
    expect(issues).toEqual([]);
  });

  test('비밀번호 보기 버튼으로 마스킹을 해제한다', async ({ page }) => {
    await page.goto('/login');
    const pw = page.getByPlaceholder('비밀번호를 입력해 주세요.');
    await expect(pw).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: '비밀번호 보기' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
  });

  test('로그인하지 않으면 보호된 페이지에서 로그인으로 이동하고 returnTo를 남긴다', async ({ page }) => {
    await page.goto('/shopping/products?page=2');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping%2Fproducts%3Fpage%3D2/);
  });

  test('잘못된 비밀번호는 API 오류 메시지를 알림으로 보여준다', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('아이디를 입력해 주세요.').fill('hw3-not-a-user');
    await page.getByPlaceholder('비밀번호를 입력해 주세요.').fill('wrong-password');
    await page.getByRole('button', { name: '로그인' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/./).first()).toBeVisible();
    await dialog.getByRole('button', { name: '확인' }).click();
    await expect(dialog).toBeHidden();
  });

  test('로그인 후 원래 페이지(returnTo)로 돌아간다', async ({ page }) => {
    test.skip(!hasLogin, 'E2E_LOGIN_ID / E2E_PASSWORD 가 필요합니다');
    await login(page, '/shopping/products?page=2');
    await expect(page).toHaveURL(/\/shopping\/products\?page=2/);
  });

  test('로그아웃하면 로그인 페이지로 이동한다', async ({ page }) => {
    test.skip(!hasLogin, 'E2E_LOGIN_ID / E2E_PASSWORD 가 필요합니다');
    await login(page);
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
