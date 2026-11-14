import { expect, test } from '@playwright/test';
import { API_GLOB } from './helpers';

test.describe('로그인 (logged out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a protected page sends you to login and back afterwards', async ({ page }) => {
    await page.goto('/shopping/categories?q=Shop');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping%2Fcategories%3Fq%3DShop/);
    await expect(page).toHaveTitle(/로그인/);

    const login = page.getByRole('button', { name: '로그인', exact: true });
    await expect(login).toBeDisabled(); // Figma: disabled until both fields are filled
    await page.getByPlaceholder('아이디').fill(process.env.E2E_LOGIN_ID ?? '');
    await expect(login).toBeDisabled();
    await page.getByPlaceholder('비밀번호').fill(process.env.E2E_PASSWORD ?? '');
    await expect(login).toBeEnabled();
    await login.click();

    await expect(page).toHaveURL(/\/shopping\/categories\?q=Shop$/);
    await expect(page.getByRole('heading', { name: '상품 카테고리 관리', level: 1 })).toBeVisible();
  });

  test('wrong password shows the Figma message under the password', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('아이디').fill(process.env.E2E_LOGIN_ID ?? '');
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
    await page.getByPlaceholder('아이디').fill(process.env.E2E_LOGIN_ID ?? '');
    await page.getByPlaceholder('비밀번호').fill(process.env.E2E_PASSWORD ?? '');
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
    await page.getByPlaceholder('아이디').fill(process.env.E2E_LOGIN_ID ?? '');
    await page.getByPlaceholder('비밀번호').fill(process.env.E2E_PASSWORD ?? '');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/shopping\/products/);
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/shopping/products');
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await context.close();
  });
});
