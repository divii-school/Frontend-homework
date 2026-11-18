import { expect, test } from '@playwright/test';
import { API_GLOB, fillSecret, qaLogin } from './helpers';

test.describe('로그인 (logged out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a protected page sends you to login and back afterwards', async ({ page }) => {
    await page.goto('/shopping/categories?q=Shop');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping%2Fcategories%3Fq%3DShop/);
    await expect(page).toHaveTitle(/로그인/);

    const login = page.getByRole('button', { name: '로그인', exact: true });
    await expect(login).toBeDisabled(); // Figma: disabled until both fields are filled
    await fillSecret(page.getByPlaceholder('아이디'), qaLogin().id);
    await expect(login).toBeDisabled();
    await fillSecret(page.getByPlaceholder('비밀번호'), qaLogin().password);
    await expect(login).toBeEnabled();
    await login.click();

    await expect(page).toHaveURL(/\/shopping\/categories\?q=Shop$/);
    await expect(page.getByRole('heading', { name: '상품 카테고리 관리', level: 1 })).toBeVisible();
  });

  test('wrong password shows the Figma message under the password', async ({ page }) => {
    await page.goto('/login');
    await fillSecret(page.getByPlaceholder('아이디'), qaLogin().id);
    await page.getByPlaceholder('비밀번호').fill('wrong-password-e2e');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.locator('#password-error')).toHaveText('아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unknown ID shows the Figma message under the ID', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('아이디').fill('hw3_pranesh_no_such_user');
    await page.getByPlaceholder('비밀번호').fill('whatever-1');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.locator('#loginId-error')).toHaveText('등록되지 않은 계정입니다.');
  });

  test('spaces only in the ID keep the login button disabled', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('아이디').fill('   ');
    await page.getByPlaceholder('비밀번호').fill('something');
    // The ID is trimmed before the check, so "   " counts as empty.
    await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeDisabled();
  });

  /** Logs in for real (the shared account; logging in does not sign anyone out) and returns our cookies. */
  async function loginWith(page: import('@playwright/test').Page, remember: boolean) {
    await page.goto('/login');
    await fillSecret(page.getByPlaceholder('아이디'), qaLogin().id);
    await fillSecret(page.getByPlaceholder('비밀번호'), qaLogin().password);
    if (remember) await page.getByText('자동 로그인').click();
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/shopping\/products/);
    const cookies = await page.context().cookies();
    return (name: string) => cookies.find((c) => c.name === name);
  }

  test('자동 로그인 checked: the session cookies outlive the browser (persistent, up to 7 days)', async ({ page }) => {
    const cookie = await loginWith(page, true);
    const now = Date.now() / 1000;
    for (const name of ['hw3_at', 'hw3_rt', 'hw3_session']) {
      const c = cookie(name);
      expect(c, name).toBeDefined();
      expect(c?.expires, `${name} has an expiry date`).toBeGreaterThan(now); // -1 would mean "ends with the browser"
    }
    expect(cookie('hw3_rt')?.expires ?? 0).toBeLessThanOrEqual(now + 7 * 24 * 3600 + 60);
    expect(cookie('hw3_rt')?.httpOnly).toBe(true);
  });

  test('자동 로그인 unchecked: every session cookie ends when the browser closes', async ({ page }) => {
    const cookie = await loginWith(page, false);
    for (const name of ['hw3_at', 'hw3_rt', 'hw3_session']) {
      expect(cookie(name), name).toBeDefined();
      expect(cookie(name)?.expires, `${name} is a browser-session cookie`).toBe(-1);
    }
  });

  test('show/hide password toggle', async ({ page }) => {
    await page.goto('/login');
    const password = page.getByPlaceholder('비밀번호');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: '비밀번호 보기' }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('server unreachable on login shows a network message', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.abort('failed'));
    await page.goto('/login');
    await page.getByPlaceholder('아이디').fill('someone');
    await page.getByPlaceholder('비밀번호').fill('something');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: '네트워크' })).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('API server down (Cloudflare 521) says the server is not responding, no field marked wrong', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.fulfill({ status: 521, contentType: 'text/html', body: 'error code: 521' }));
    await page.goto('/login');
    await page.getByPlaceholder('아이디').fill('someone');
    await page.getByPlaceholder('비밀번호').fill('something');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.' })).toBeVisible();
    await expect(page.getByPlaceholder('아이디')).toHaveValue('someone');
    await expect(page.getByPlaceholder('비밀번호')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('static files load on the login page without a session (never redirected to login)', async ({ page }) => {
    const redirected: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 300 && r.status() < 400 && /\/(themes|icons|images)\//.test(new URL(r.url()).pathname)) redirected.push(r.url());
    });
    await page.goto('/login');
    await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
    for (const path of ['/themes/lara-light-pink/theme.css', '/themes/lara-dark-pink/theme.css']) {
      const res = await page.request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type'], path).toContain('text/css');
    }
    expect(redirected).toEqual([]);
  });
});

test.describe('세션 만료 (logged in)', () => {
  test('401 + failed refresh → login with returnTo, then the same page after login', async ({ page }) => {
    // Every API call answers 401 and the refresh is refused: the session is over.
    await page.route(`${API_GLOB}/**`, (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized' }) }),
    );
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized' }) }),
    );
    await page.goto('/shopping/products?page=2');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping%2Fproducts%3Fpage%3D2&reason=expired/);
    await expect(page.getByRole('status')).toContainText('로그인이 만료되었습니다');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await fillSecret(page.getByPlaceholder('아이디'), qaLogin().id);
    await fillSecret(page.getByPlaceholder('비밀번호'), qaLogin().password);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/shopping\/products\?page=2$/);
  });

  test('401 + successful refresh → the call is retried and the page just works', async ({ page }) => {
    let first = true;
    await page.route(`${API_GLOB}/products?**`, async (route) => {
      if (first) {
        first = false;
        return route.fulfill({ status: 401, contentType: 'application/json', body: '{"success":false,"message":"Unauthorized"}' });
      }
      return route.continue();
    });
    let refreshed = false;
    page.on('request', (r) => {
      if (r.url().endsWith('/api/auth/refresh')) refreshed = true;
    });
    await page.goto('/shopping/products');
    await expect(page.getByText(/총 게시물/)).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
    expect(refreshed).toBe(true);
    await expect(page).toHaveURL(/\/shopping\/products$/);
  });

  test('logout clears the session; protected pages need login again', async ({ browser }) => {
    // On the QA API a logout ends EVERY session of the shared account (checked 2026-11-13),
    // so the server call is answered here; the app's own clean-up is what this test checks.
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.route('**/api/auth/logout', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"message":"logoutSuccess","data":null}' }),
    );
    await page.goto('/login');
    await fillSecret(page.getByPlaceholder('아이디'), qaLogin().id);
    await fillSecret(page.getByPlaceholder('비밀번호'), qaLogin().password);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/shopping\/products/);
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/shopping/products');
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await context.close();
  });
});

test.describe('자동 로그인 (access token expired, refresh token kept)', () => {
  /** Leaves the session as 자동 로그인 does after a while: no access token, but a renewable session. */
  async function expireAccessToken(context: import('@playwright/test').BrowserContext, baseURL: string | undefined) {
    const token = (await context.cookies()).find((c) => c.name === 'hw3_at')?.value ?? '';
    await context.clearCookies({ name: 'hw3_at' });
    await context.addCookies([{ name: 'hw3_session', value: '1', url: baseURL ?? 'http://localhost:3000' }]);
    return decodeURIComponent(token);
  }

  test('the token is renewed and the page opens, with no trip to login', async ({ page, context, baseURL }) => {
    const liveToken = await expireAccessToken(context, baseURL);
    let refreshes = 0;
    await page.route('**/api/auth/refresh', (route) => {
      refreshes += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Success', data: { token: liveToken } }) });
    });
    await page.goto('/shopping/products?page=2');
    await expect(page.getByRole('heading', { name: '상품 관리', level: 1 })).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expect(page).toHaveURL(/\/shopping\/products\?page=2$/);
    expect(refreshes).toBe(1);
    expect((await context.cookies()).some((c) => c.name === 'hw3_at')).toBe(true); // new token stored
  });

  test('if the renewal is refused: login says the session expired, then back to the same page', async ({ page, context, baseURL }) => {
    await expireAccessToken(context, baseURL);
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"success":false,"message":"Unauthorized"}' }),
    );
    await page.goto('/shopping/categories?q=Shop');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping%2Fcategories%3Fq%3DShop&reason=expired/);
    await expect(page.getByText('로그인이 만료되었습니다. 다시 로그인해 주세요.')).toBeVisible();
  });

  test('no access token and no renewable session still goes straight to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/shopping/products');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping%2Fproducts/);
  });
});
