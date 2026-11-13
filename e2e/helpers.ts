import type { Page } from '@playwright/test';

/** The real API host, read from the same env variable the app uses. */
export const API_GLOB = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tkclub-admn-api-qa.dvconsulting.org'}/api/v1`;

/** A JWT-shaped string whose payload has `exp`; only the app's expiry check reads it (never the API). */
export function fakeJwt(expiresInSeconds: number): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 1, role: 'ADMIN', exp })}.signature`;
}

type Permission = string | { module: string; subModules: string[] };

/**
 * The QA server has only a SUPER_ADMIN account, so other roles are tested by answering
 * our /api/auth/login with a user that has limited permissions. Everything after the
 * login (menu, route guard, 403) is the real app code.
 */
export async function loginAs(page: Page, role: string, permissions: Permission[]) {
  // The fake token would be refused by the real API, so its reads answer empty here.
  await page.route(`${API_GLOB}/**`, (route) => {
    const url = route.request().url();
    const paged = { success: true, message: 'Success', data: [], totalRecords: 0, totalPage: 0, page: 1 };
    const list = { success: true, message: 'Success', data: [], totalRecords: 0, isCreatable: false };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.includes('/products?') ? paged : list) });
  });
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'loginSuccess',
        data: {
          token: fakeJwt(3600),
          user: { id: 9, uuid: 'e2e', fullName: 'E2E 제한 관리자', userId: 'e2e_limited', role, permissions },
        },
      }),
    }),
  );
  await page.goto('/login');
  await page.getByPlaceholder('아이디').fill('e2e_limited');
  await page.getByPlaceholder('비밀번호').fill('not-used');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
}
