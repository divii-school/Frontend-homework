import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { API_GLOB } from './helpers';

/**
 * Full product life cycle on the shared QA server — only our own HW3-Pranesh-* product,
 * filed under 학원 Shop › HW3-Pranesh-Sub › HW3-Pranesh-Child, deleted at the end.
 * Run with: npm run test:e2e:mutation
 */
const stamp = Date.now().toString().slice(-6);
const name = `HW3-Pranesh-E2E-상품-${stamp}`;
const fixture = (file: string) => path.join(__dirname, 'fixtures', file);

test.describe.configure({ mode: 'serial' });

/** Clicks the visible category label (the radio itself is visually hidden), then checks it took. */
async function pickCategory(page: Page, name: string) {
  await page.locator('label').filter({ hasText: new RegExp(`^${name}$`) }).click();
  await expect(page.getByRole('radio', { name, exact: true })).toBeChecked();
}

async function typeAmount(page: Page, label: string, value: string) {
  const input = page.getByRole('spinbutton', { name: label, exact: true });
  await input.click();
  await input.press('Control+a');
  await input.press('Backspace');
  await input.pressSequentially(value);
  await input.press('Tab');
}

test('create through the 4 steps (validation, image upload, values kept going back)', async ({ page }) => {
  // One test.step per test case, so the HTML report shows pass / fail for each case (QA A3).
  await test.step('TC-PRD-FORM-01 · 4 steps; the product code is generated and read-only', async () => {
    await page.goto('/shopping/products/new');
    await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-\d+$/);
    await expect(page.getByLabel('상품코드')).toHaveAttribute('readonly', '');
    await expect(page.getByRole('list', { name: '입력 단계' }).getByRole('listitem')).toHaveCount(4);
  });

  await test.step('TC-PRD-FORM-02 · step 1 empty → errors, does not move on', async () => {
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByText('상품명을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toBeVisible();
  });

  await test.step('TC-PRD-FORM-03 · 단가 equal to 판매가 is refused', async () => {
    await page.getByRole('textbox', { name: '상품명', exact: true }).fill(name);
    await typeAmount(page, '단가', '2000');
    await typeAmount(page, '판매가', '2000');
    await page.getByLabel('상세설명').fill('E2E 테스트 상품입니다.\n두 번째 줄');
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByText('단가는 판매가보다 작아야 합니다.')).toBeVisible(); // API rule, checked before sending
    await typeAmount(page, '단가', '1500');
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByRole('heading', { name: /2\. 이미지 · 노출/ })).toBeVisible();
  });

  await test.step('TC-PRD-FORM-06 · no image → "대표 이미지를 1장 이상 등록해 주세요."', async () => {
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByText('대표 이미지를 1장 이상 등록해 주세요.')).toBeVisible();
  });

  const fileInput = page.locator('input[type="file"]');
  await test.step('TC-PRD-FORM-08 · a text file is refused', async () => {
    await fileInput.setInputFiles(fixture('not-an-image.txt'));
    await expect(page.getByText(/JPG, PNG, WEBP 이미지만 등록할 수 있습니다/)).toBeVisible();
  });

  await test.step('TC-PRD-FORM-07 · a real PNG uploads to S3 and previews as 대표', async () => {
    await fileInput.setInputFiles(fixture('HW3-Pranesh-e2e.png'));
    await expect(page.getByRole('img', { name: '상품 이미지 1 (대표)' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('(1/4)')).toBeVisible();
    await page.getByRole('button', { name: '다음' }).click();
  });

  await test.step('TC-PRD-FORM-14 · categories chosen column by column', async () => {
    await expect(page.getByRole('heading', { name: /3\. 카테고리/ })).toBeVisible();
    await pickCategory(page, '학원 Shop');
    await pickCategory(page, 'HW3-Pranesh-Sub');
    await pickCategory(page, 'HW3-Pranesh-Child');
    await page.getByRole('button', { name: '다음' }).click();
  });

  await test.step('TC-PRD-FORM-16 · 이전 ×3 then 다음 ×3 keeps every value', async () => {
    await page.getByLabel('상품ERP명').fill(`${name}-ERP`);
    await typeAmount(page, 'ERP 단가', '1200');
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '이전' }).click();
    await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue(name);
    await expect(page.getByRole('spinbutton', { name: '단가', exact: true })).toHaveValue('₩ 1,500');
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByLabel('상품ERP명')).toHaveValue(`${name}-ERP`);
  });

  await test.step('TC-PRD-FORM-17 · 등록 → toast, back to the list', async () => {
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText('상품이 등록되었습니다.')).toBeVisible();
    await expect(page).toHaveURL(/\/shopping\/products$/);
  });
});

test('an API error keeps everything typed (server refused the save)', async ({ page }) => {
  await page.route('**/api/v1/products/add', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"boom","statusCode":500}' }),
  );
  await page.goto('/shopping/products/new');
  await page.getByRole('textbox', { name: '상품명', exact: true }).fill(`${name}-오류`);
  await typeAmount(page, '단가', '100');
  await typeAmount(page, '판매가', '200');
  await page.getByLabel('상세설명').fill('x');
  await page.getByRole('button', { name: '다음' }).click();
  await page.locator('input[type="file"]').setInputFiles(fixture('HW3-Pranesh-e2e.png'));
  await expect(page.getByRole('img', { name: '상품 이미지 1 (대표)' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: '다음' }).click();
  await pickCategory(page, '학원 Shop');
  await pickCategory(page, 'HW3-Pranesh-Sub');
  await pickCategory(page, 'HW3-Pranesh-Child');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('상품ERP명').fill('x');
  await typeAmount(page, 'ERP 단가', '100');
  await page.getByRole('button', { name: '등록', exact: true }).click();

  await expect(page.getByRole('alert').filter({ hasText: '입력한 내용은 그대로 유지됩니다' })).toBeVisible();
  await expect(page.getByLabel('상품ERP명')).toHaveValue('x');
  await page.getByRole('button', { name: '이전' }).click();
  await page.getByRole('button', { name: '이전' }).click();
  await page.getByRole('button', { name: '이전' }).click();
  await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue(`${name}-오류`);
});

test('find it, toggle 노출 inline, edit it, then delete it', async ({ page }) => {
  const row = page.locator('tbody tr', { hasText: name });
  await test.step('TC-PRD-FORM-17 · the new product is found by search', async () => {
    await page.goto(`/shopping/products?q=${encodeURIComponent(name)}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText('₩2,000');
    await expect(row).toContainText('학원 Shop > HW3-Pranesh-Sub > HW3-Pranesh-Child');
  });

  await test.step('TC-PRD-LIST-09 · inline 노출여부 change is saved with a toast', async () => {
    await row.getByRole('button', { name: `${name} 노출여부 목록 열기` }).click();
    await page.getByRole('option', { name: '아니오' }).click();
    await expect(page.getByText(/노출여부가 변경되었습니다/)).toBeVisible();
  });

  await test.step('TC-PRD-EDIT-01 · edit opens with the saved values; category read-only', async () => {
    await row.getByRole('link', { name }).click();
    await expect(page.getByRole('tabpanel')).toContainText('아니오');
    await page.getByRole('link', { name: '수정' }).click();
    await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue(name);
    await typeAmount(page, '판매가', '3000');
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByText('카테고리는 등록 후 수정할 수 없습니다.')).toHaveCount(1);
  });

  await test.step('TC-PRD-EDIT-02 · 저장 → toast, details shows ₩3,000', async () => {
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByText('상품이 수정되었습니다.')).toBeVisible();
    await expect(page.getByRole('tabpanel')).toContainText('₩3,000');
  });

  await test.step('TC-PRD-DETAIL-08 · delete from details → toast, gone from search', async () => {
    await page.getByRole('button', { name: '삭제' }).click();
    await page.getByRole('dialog', { name: '상품 삭제' }).getByRole('button', { name: '삭제' }).click();
    await expect(page.getByText(/상품이 삭제되었습니다/)).toBeVisible();
    await page.goto(`/shopping/products?q=${encodeURIComponent(name)}`);
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  });
});

test('bulk delete removes every selected product (ids sent as numbers to the real API)', async ({ page, context }) => {
  const prefix = `HW3-Pranesh-E2E-bulk-${stamp}`;
  const token = decodeURIComponent((await context.cookies()).find((c) => c.name === 'hw3_at')?.value ?? '');
  const headers = { authorization: `Bearer ${token}`, 'x-talking-club-platform': 'web', 'x-talking-club-version': '1.0.0', 'accept-language': 'ko' };
  const api = page.request;

  await test.step("setup · two products created through the API (our probe's category and image)", async () => {
    const probeRes = await api.get(`${API_GLOB}/products?page=1&limit=1&type=productName&search=HW3-Pranesh-Probe`, { headers });
    expect(probeRes.status()).toBe(200);
    type Row = { images: string[]; category: { id: number }; subCategory: { id: number }; childCategory: { id: number } };
    const probe = ((await probeRes.json()) as { data: Row[] }).data[0];
    for (const n of [1, 2]) {
      const code = ((await (await api.get(`${API_GLOB}/products/generate-code`, { headers })).json()) as { data: string }).data;
      const res = await api.post(`${API_GLOB}/products/add`, {
        headers,
        data: {
          productName: `${prefix}-${n}`,
          productCode: code,
          price: 2000,
          unitPrice: 1000,
          description: 'E2E bulk delete',
          erpName: `${prefix}-${n}-ERP`,
          erpUnitPrice: 900,
          taxType: 'tax',
          quantity: 1,
          categoryId: probe.category.id,
          subCategoryId: probe.subCategory.id,
          childCategoryId: probe.childCategory.id,
          images: [probe.images[0]],
          isOptions: 'no',
          isVisible: 'yes',
          onSale: 'yes',
        },
      });
      expect(res.ok(), await res.text()).toBe(true);
    }
  });

  await test.step('TC-PRD-LIST-12 · select both, 삭제 (2), confirm → toast; the search is empty', async () => {
    await page.goto(`/shopping/products?q=${encodeURIComponent(prefix)}`);
    await expect(page.getByText(/총 게시물 : 2$/)).toBeVisible();
    await page.getByRole('checkbox', { name: '현재 페이지 전체 선택' }).check();
    await page.getByRole('button', { name: '삭제 (2)' }).click();
    const dialog = page.getByRole('dialog', { name: '상품 삭제' });
    await expect(dialog).toContainText('선택한 2개 상품을 삭제하시겠습니까?');
    const deleted = page.waitForRequest((r) => r.url().endsWith('/products/delete') && r.method() === 'DELETE');
    await dialog.getByRole('button', { name: '삭제' }).click();
    const body = (await deleted).postDataJSON() as { ids: unknown[] };
    expect(body.ids).toHaveLength(2);
    expect(body.ids.every((id) => typeof id === 'number')).toBe(true);
    await expect(page.getByText('2개 상품이 삭제되었습니다.')).toBeVisible();
    await page.goto(`/shopping/products?q=${encodeURIComponent(prefix)}`);
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  });
});
