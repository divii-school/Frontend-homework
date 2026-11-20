import { expect, type Page } from '@playwright/test';

export const LOGIN_ID = process.env.E2E_LOGIN_ID ?? '';
export const PASSWORD = process.env.E2E_PASSWORD ?? '';
export const hasLogin = !!(LOGIN_ID && PASSWORD);
export const PREFIX = 'HW3-Saswat-';

/** Collects console errors/warnings so every spec can assert "zero console errors". */
export function trackConsole(page: Page): string[] {
  const issues: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') issues.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  return issues;
}

export async function login(page: Page, returnTo?: string) {
  await page.goto(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login');
  await page.getByPlaceholder('아이디를 입력해 주세요.').fill(LOGIN_ID);
  await page.getByPlaceholder('비밀번호를 입력해 주세요.').fill(PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
