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

  test('a 51-character name is refused in the add dialog (nothing is sent)', async ({ page }) => {
    let posted = false;
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.url().includes('/product-category/')) posted = true;
    });
    await page.goto('/shopping/categories?q=HW3-Pranesh');
    await page.getByRole('button', { name: /소분류/ }).filter({ hasText: '소분류' }).first().click();
    await page.getByLabel('카테고리명').fill('가'.repeat(51));
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText('카테고리명은 50자 이하로 입력해 주세요.')).toBeVisible();
    expect(posted).toBe(false);
  });

  test('edit dialog: opens with the current name; empty and 51-character names refused; 취소 changes nothing', async ({ page }) => {
    let saved = false;
    page.on('request', (r) => {
      if (r.method() === 'PUT' && r.url().includes('/product-category/')) saved = true;
    });
    await page.goto('/shopping/categories?q=HW3-Pranesh-Child');
    await page.getByRole('button', { name: 'HW3-Pranesh-Child 수정' }).click();
    const name = page.getByLabel('카테고리명');
    await expect(name).toHaveValue('HW3-Pranesh-Child');
    await name.fill('');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByText('카테고리명을 입력해 주세요.')).toBeVisible();
    await name.fill('나'.repeat(51));
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByText('카테고리명은 50자 이하로 입력해 주세요.')).toBeVisible();
    await page.getByRole('button', { name: '취소', exact: true }).click();
    await expect(name).toBeHidden();
    await expect(page.getByText('HW3-Pranesh-Child', { exact: true })).toBeVisible();
    expect(saved).toBe(false);
  });

  test('with a search active, delete checks the REAL children, not the filtered ones', async ({ page }) => {
    // QA spot check 2026-11-17: the search result holds only matching children (1), the category has 10+.
    const realChildren = page.waitForResponse((r) => /\/products\/subcategories\/\d+$/.test(r.url()) && r.request().method() === 'GET');
    await page.goto('/shopping/categories?q=HW3-Pranesh');
    const row = page.locator('li').filter({ has: page.getByRole('button', { name: '학원 Shop 삭제' }) }).first();
    await expect(row).not.toContainText(/\(\d+개 중분류\)/); // no count from a filtered tree
    await page.getByRole('button', { name: '학원 Shop 삭제' }).click();
    const body = (await (await realChildren).json()) as { data: unknown[] };
    const dialog = page.getByRole('dialog', { name: '삭제할 수 없습니다' });
    await expect(dialog).toContainText(`하위 카테고리 ${body.data.length}개가 있어 삭제할 수 없습니다`);
    expect(body.data.length).toBeGreaterThan(1);
  });

  test('disabled 대분류 등록 looks disabled (grey), not like the brand-red 검색 button', async ({ page }) => {
    await page.goto('/shopping/categories');
    const disabled = page.getByRole('button', { name: '대분류 등록' });
    await expect(disabled).toBeDisabled();
    const colours = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const probe = document.createElement('div');
      probe.style.background = css.getPropertyValue('--color-bg-disabled');
      document.body.append(probe);
      const disabledBg = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('대분류 등록'));
      const search = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '검색');
      return {
        disabledBg,
        button: button ? getComputedStyle(button).backgroundColor : '',
        search: search ? getComputedStyle(search).backgroundColor : '',
      };
    });
    expect(colours.button).toBe(colours.disabledBg);
    expect(colours.button).not.toBe(colours.search);
  });

  test('a category name with HTML is shown as text, never run', async ({ page }) => {
    const hostile = '<img src=x onerror="window.__hw3Xss=1">';
    await page.route(`${API_GLOB}/products/categories`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Success',
          data: [
            { id: 900001, name: hostile, sortOrder: 1, isDeleted: false, createdAt: '', updatedAt: '' },
            { id: 900002, name: '&lt;b&gt;escaped&lt;/b&gt;', sortOrder: 2, isDeleted: false, createdAt: '', updatedAt: '' },
          ],
        }),
      }),
    );
    await page.route(`${API_GLOB}/products/subcategories/**`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"message":"Success","data":[]}' }),
    );
    await page.goto('/shopping/categories');
    await expect(page.getByText(hostile, { exact: true })).toBeVisible();
    await expect(page.getByText('<b>escaped</b>', { exact: true })).toBeVisible(); // API-escaped name decoded as text
    await expect(page.locator('[aria-label="상품 카테고리"] img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __hw3Xss?: number }).__hw3Xss)).toBeUndefined();
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

test('a failure no screen shows itself still gets the default error toast', async ({ page }) => {
  // The "may 대분류 be added?" check only disables a button; it has no error view of its own.
  await page.route(`${API_GLOB}/product-category/list`, (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"boom","statusCode":500}' }),
  );
  await page.goto('/shopping/categories');
  await expect(page.locator('.p-toast').getByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[aria-label="상품 카테고리"] > li').first()).toBeVisible(); // the rest of the screen works
});
