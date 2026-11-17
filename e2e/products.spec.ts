import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API_GLOB } from './helpers';

test.describe('상품 관리 목록 (read only)', () => {
  test('loads a page of 10 with the total count', async ({ page }) => {
    await page.goto('/shopping/products');
    await expect(page.getByRole('heading', { name: '상품 관리', level: 1 })).toBeVisible();
    await expect(page.getByText(/총 게시물 : [\d,]+/)).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await expect(page.locator('thead')).toContainText('판매금액');
    await expect(page.locator('tbody tr').first()).toContainText('₩');
  });

  test('search, type and page live in the URL; reload and back keep them', async ({ page }) => {
    await page.goto('/shopping/products');
    await page.getByLabel('검색어').fill('토킹클럽');
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await expect(page).toHaveURL(/\?q=%ED%86%A0%ED%82%B9%ED%81%B4%EB%9F%BD$/);

    await page.getByRole('button', { name: '2페이지' }).click();
    await expect(page).toHaveURL(/q=.+&page=2$/);
    // The previous page stays on screen under a loading overlay until page 2 arrives.
    await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0);
    const firstOnPage2 = (await page.locator('tbody tr').first().getByRole('link').innerText()).trim();

    await page.reload();
    await expect(page.getByLabel('검색어')).toHaveValue('토킹클럽');
    await expect(page.locator('tbody tr').first().getByRole('link')).toHaveText(firstOnPage2);

    await page.goBack();
    await expect(page).not.toHaveURL(/page=2/);
  });

  test('a bad URL falls back to a working list', async ({ page }) => {
    await page.goto('/shopping/products?page=-4&size=9999&type=hack');
    await expect(page.locator('tbody tr')).toHaveCount(10);
  });

  test('category search type', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Child&type=categoryName');
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toContainText('HW3-Pranesh-Child'); // loaded, not the loading row
    // Every row is in the searched 소분류.
    for (const text of await rows.allInnerTexts()) expect(text).toContain('HW3-Pranesh-Child');
  });

  test('deleted products the API still returns in a 카테고리 search are marked, not linked (API question A14)', async ({ page }) => {
    // Our earlier test products are deleted but still come back here (isDeleted: true).
    const listed = page.waitForResponse((r) => r.url().startsWith(`${API_GLOB}/products?`) && r.url().includes('categoryName'));
    await page.goto('/shopping/products?q=HW3-Pranesh-Child&type=categoryName');
    const body = (await (await listed).json()) as { data: { productName: string; isDeleted?: boolean }[] };
    const deleted = body.data.filter((p) => p.isDeleted);
    test.skip(deleted.length === 0, 'the API returned no deleted row this time');
    const row = page.locator('tbody tr', { hasText: deleted[0].productName });
    await expect(row).toContainText('삭제된 상품');
    await expect(row.getByRole('link')).toHaveCount(0);
    await expect(row.getByRole('checkbox')).toBeDisabled();
  });

  test('empty search shows the design message', async ({ page }) => {
    await page.goto('/shopping/products?q=zz-no-such-product-hw3');
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
    await expect(page.getByText(/총 게시물 : 0(?![\d,])/)).toBeVisible();
  });

  test('selection enables bulk delete; cancel deletes nothing', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeDisabled();
    await page.locator('tbody tr').first().getByRole('checkbox', { name: /HW3-Pranesh-Probe.* 선택/ }).check();
    await page.getByRole('button', { name: '삭제 (1)' }).click();
    const dialog = page.getByRole('dialog', { name: '상품 삭제' });
    await expect(dialog).toContainText('선택한 1개 상품을 삭제하시겠습니까?');
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(page.locator('tbody')).toContainText('HW3-Pranesh-Probe');
  });

  test('CSV export downloads the whole filtered result', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV 내보내기' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^products_\d{12}\.csv$/);
    const text = (await (await file.createReadStream()).toArray()).join('');
    expect(text).toContain('상품코드');
    expect(text).toContain('HW3-Pranesh-Probe');
  });

  test('API error shows an error with retry; network loss too', async ({ page }) => {
    await page.route(`${API_GLOB}/products?**`, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/shopping/products');
    await expect(page.getByText('상품 목록을 불러오지 못했습니다.')).toBeVisible();
    await page.unrouteAll();
    await page.route(`${API_GLOB}/products?**`, (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(page.getByText(/네트워크/)).toBeVisible();
  });

  test('no accessibility violations (WCAG A/AA)', async ({ page }) => {
    await page.goto('/shopping/products');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" , ")}`)).toEqual([]);
  });
});

test.describe('상품 상세 (read only)', () => {
  test('tabs: each loads on open, active tab in the URL', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    // Wait for the search result itself, so the click lands on the loaded, interactive row.
    await expect(page.getByText(/총 게시물 : 1$/)).toBeVisible();
    // A click in the first moments after load can land before the page is interactive; retry it.
    await expect(async () => {
      await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().click();
      await expect(page).toHaveURL(/\/shopping\/products\/\d+$/, { timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole('tab', { name: '기본 정보' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('상품코드');

    await page.getByRole('tab', { name: '같은 카테고리 상품' }).click();
    await expect(page).toHaveURL(/\?tab=related$/);
    // Our probe is the only product in its 소분류, so this tab shows its own empty state.
    await expect(page.getByRole('tabpanel')).toContainText('같은 카테고리에 다른 상품이 없습니다.');

    await page.reload();
    await expect(page.getByRole('tab', { name: '같은 카테고리 상품' })).toHaveAttribute('aria-selected', 'true');

    // Keyboard: arrows move between tabs.
    await page.getByRole('tab', { name: '같은 카테고리 상품' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/\?tab=erp$/);
    await expect(page.getByRole('tabpanel')).toContainText('ERP 코드');
  });

  test('related tab lists the other products of the 소분류', async ({ page }) => {
    await page.goto('/shopping/products/12564?tab=related');
    await expect(page.getByRole('tabpanel')).toContainText('같은 소분류 상품');
    await expect(page.getByRole('tabpanel').getByRole('link').first()).toBeVisible();
  });

  test('목록 returns to the same list page', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh');
    await page.getByRole('link', { name: /HW3-Pranesh-Probe/ }).first().click();
    await page.getByRole('link', { name: '목록' }).click();
    await expect(page).toHaveURL(/\/shopping\/products\?q=HW3-Pranesh$/);
  });

  test('a tab that fails shows its own error; others still work', async ({ page }) => {
    await page.route(`${API_GLOB}/products/get-products-by-category**`, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/shopping/products/20001?tab=related');
    await expect(page.getByText('같은 카테고리 상품을 불러오지 못했습니다.')).toBeVisible();
    await page.getByRole('tab', { name: '이미지' }).click();
    await expect(page.getByRole('tabpanel').getByRole('img').first()).toBeVisible();
  });

  test('unknown or invalid product → not found', async ({ page }) => {
    await page.goto('/shopping/products/99999999');
    await expect(page.getByText('상품을 찾을 수 없습니다.').first()).toBeVisible();
    await page.goto('/shopping/products/abc');
    await expect(page.getByText('404 · 페이지를 찾을 수 없습니다.')).toBeVisible();
  });
});

test.describe('상품 관리 목록 — more cases (read only)', () => {
  test('selection stops at 100 across pages, with a message', async ({ page }) => {
    await page.goto('/shopping/products?size=50');
    const selectPage = page.getByRole('checkbox', { name: '현재 페이지 전체 선택' });
    await expect(page.locator('tbody tr')).toHaveCount(50);
    await selectPage.check();
    await expect(page.getByRole('button', { name: '삭제 (50)' })).toBeEnabled();
    // After a page change, wait for the new rows (the header box clears) before ticking it again.
    await page.getByRole('button', { name: '2페이지' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(selectPage).not.toBeChecked();
    await selectPage.check();
    await expect(page.getByRole('button', { name: '삭제 (100)' })).toBeEnabled();
    await page.getByRole('button', { name: '3페이지' }).click();
    await expect(page).toHaveURL(/page=3/);
    await expect(selectPage).not.toBeChecked();
    await selectPage.click(); // a click, not check(): at the limit the box rightly stays unticked
    await expect(page.locator('.p-toast').getByText('한 번에 최대 100개까지 선택할 수 있습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '삭제 (100)' })).toBeVisible(); // still 100, not 150
  });

  test('page size 20: 20 rows, size in the URL, kept after reload', async ({ page }) => {
    await page.goto('/shopping/products');
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await page.getByRole('button', { name: '페이지당 표시 개수 목록 열기' }).click();
    await page.getByRole('option', { name: '20' }).click();
    await expect(page).toHaveURL(/size=20/);
    await expect(page.locator('tbody tr')).toHaveCount(20);
    await page.reload();
    await expect(page.locator('tbody tr')).toHaveCount(20);
  });

  test('clearing the search and searching again shows the whole list (q removed from the URL)', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    await expect(page.getByText(/총 게시물 : 1$/)).toBeVisible();
    await page.getByRole('searchbox', { name: '검색어' }).fill('');
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await expect(page).toHaveURL(/\/shopping\/products$/);
    await expect(page.locator('tbody tr')).toHaveCount(10);
  });

  test('노출여부 change refused by the API: the value goes back and an error toast shows', async ({ page }) => {
    await page.route(`${API_GLOB}/products/update-status/**`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"boom","statusCode":500}' }),
    );
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    const value = page.getByRole('combobox', { name: /HW3-Pranesh-Probe.* 노출여부/ });
    await expect(value).toHaveText('예');
    await page.getByRole('button', { name: /HW3-Pranesh-Probe.* 노출여부 목록 열기/ }).click();
    await page.getByRole('option', { name: '아니오' }).click();
    await expect(page.locator('.p-toast').getByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')).toBeVisible();
    await expect(value).toHaveText('예'); // the optimistic change is rolled back
  });

  test('CSV: a file with a BOM, the Korean header row and the rows; no results → the button is disabled', async ({ page }) => {
    await page.goto('/shopping/products?q=HW3-Pranesh-Probe');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV 내보내기' }).click();
    const file = await download;
    const bytes = Buffer.concat(await (await file.createReadStream()).toArray());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM: Excel opens the Korean correctly
    const lines = bytes.toString('utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
    expect(lines[0]).toBe('상품 ID,상품코드,상품명,판매금액,단가,카테고리,노출여부,판매상태,ERP 코드,상품ERP명,등록일자');
    expect(lines).toHaveLength(2); // header + the one matching product
    expect(lines[1]).toContain('HW3-Pranesh-Probe');

    await page.goto('/shopping/products?q=zz-no-such-product-hw3');
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CSV 내보내기' })).toBeDisabled();
  });

  test('the API itself refuses a call without a token (401)', async ({ playwright }) => {
    const api = await playwright.request.newContext();
    const res = await api.get(`${API_GLOB}/products?page=1&limit=1`, {
      headers: { 'x-talking-club-platform': 'web', 'accept-language': 'ko' },
    });
    expect(res.status()).toBe(401);
    await api.dispose();
  });
});

test.describe('상품 상세 — more cases (read only)', () => {
  type Details = { productName: string; productCode: string; category: { name: string }; childCategory: { name: string } };

  test('기본 정보 shows the API values of the product', async ({ page }) => {
    const details = page.waitForResponse((r) => r.url().endsWith('/products/details/20001'));
    await page.goto('/shopping/products/20001');
    const product = ((await (await details).json()) as { data: Details }).data;
    const panel = page.getByRole('tabpanel');
    await expect(panel).toContainText(product.productCode);
    await expect(panel).toContainText(product.productName);
    await expect(panel).toContainText(product.category.name);
    await expect(panel).toContainText(product.childCategory.name);
  });

  test('이미지 tab with no images shows its empty state', async ({ page }) => {
    await page.route(`${API_GLOB}/products/details/20001`, async (route) => {
      const res = await route.fetch();
      const body = (await res.json()) as { data: { images: string[] } };
      body.data.images = [];
      await route.fulfill({ response: res, json: body });
    });
    await page.goto('/shopping/products/20001?tab=images');
    await expect(page.getByRole('tabpanel')).toContainText('등록된 이미지가 없습니다.');
  });

  test('같은 카테고리 상품 pages when there are more than 10', async ({ page }) => {
    await page.route(`${API_GLOB}/products/get-products-by-category**`, async (route) => {
      const res = await route.fetch();
      const body = (await res.json()) as { data: Record<string, unknown>[]; totalRecords: number; totalPage: number; page: number };
      const template = body.data[0];
      const pageNo = Number(new URL(route.request().url()).searchParams.get('page') ?? '1');
      const ids = pageNo === 1 ? Array.from({ length: 10 }, (_, i) => i + 1) : [11, 12];
      body.data = ids.map((n) => ({ ...template, id: 990000 + n, productName: `HW3-Pranesh-Mock-${n}` }));
      body.totalRecords = 12;
      body.totalPage = 2;
      body.page = pageNo;
      await route.fulfill({ response: res, json: body });
    });
    await page.goto('/shopping/products/20001?tab=related');
    const panel = page.getByRole('tabpanel');
    // A link's name is "<상품명><코드> · <가격>", so match the name at the start.
    await expect(panel.getByRole('link', { name: /^HW3-Pranesh-Mock-1(?!\d)/ })).toBeVisible();
    await expect(panel.getByRole('link', { name: /HW3-Pranesh-Mock-\d+/ })).toHaveCount(10);
    await panel.getByRole('button', { name: '2페이지' }).click();
    await expect(panel.getByRole('link', { name: /^HW3-Pranesh-Mock-12(?!\d)/ })).toBeVisible();
    await expect(panel.getByRole('link', { name: /HW3-Pranesh-Mock-\d+/ })).toHaveCount(2);
  });
});
