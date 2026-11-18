import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { API_GLOB, typeAmount } from './helpers';

/**
 * 상품 등록 / 수정 cases that need no real save (read only): uploads and saves are answered here,
 * so nothing reaches S3 and no product is created or changed. Categories and the product code
 * are read from the QA API. Product 20001 is our own probe (HW3-Pranesh-Probe-a).
 */
const png = fs.readFileSync(path.join(__dirname, 'fixtures', 'HW3-Pranesh-e2e.png'));
const file = (name: string) => ({ name, mimeType: 'image/png', buffer: png });
const uploaded = (key: string) =>
  JSON.stringify({ success: true, message: 'uploaded', data: { filePath: `products/${key}.png`, preview: '/images/logo-talkingclub.png' } });
const productImages = (page: Page) => page.getByRole('img', { name: /^상품 이미지 \d/ });

async function mockUploads(page: Page) {
  let n = 0;
  await page.route('**/api/upload', (route) => {
    n += 1;
    return route.fulfill({ status: 201, contentType: 'application/json', body: uploaded(`mock-${n}`) });
  });
}

async function fillStep1(page: Page) {
  await page.goto('/shopping/products/new');
  await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-\d+$/);
  await page.getByRole('textbox', { name: '상품명', exact: true }).fill('HW3-Pranesh-E2E-not-saved');
  await typeAmount(page, '단가', '1000');
  await typeAmount(page, '판매가', '2000');
  await page.getByLabel('상세설명').fill('저장하지 않는 테스트');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('heading', { name: /2\. 이미지 · 노출/ })).toBeVisible();
}

async function pickCategory(page: Page, name: string) {
  await page.locator('label').filter({ hasText: new RegExp(`^${name}$`) }).click();
  await expect(page.getByRole('radio', { name, exact: true })).toBeChecked();
}

/** Steps 1–3 done (image mocked, real categories); returns on step 4. */
async function reachErpStep(page: Page) {
  await mockUploads(page);
  await fillStep1(page);
  await page.locator('input[type="file"]').setInputFiles(file('photo.png'));
  await expect(page.getByRole('img', { name: '상품 이미지 1 (대표)' })).toBeVisible();
  await page.getByRole('button', { name: '다음' }).click();
  await pickCategory(page, '학원 Shop');
  await pickCategory(page, 'HW3-Pranesh-Sub');
  await pickCategory(page, 'HW3-Pranesh-Child');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByLabel('상품ERP명')).toBeVisible();
}

test.describe('상품 등록 (read only, saves answered here)', () => {
  test('a file named .png that is not an image is refused before upload', async ({ page }) => {
    let uploads = 0;
    await page.route('**/api/upload', (route) => {
      uploads += 1;
      return route.fulfill({ status: 201, contentType: 'application/json', body: uploaded('x') });
    });
    await fillStep1(page);
    await page.locator('input[type="file"]').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('this is text, not a png') });
    await expect(page.getByText('fake.png: 이미지 파일을 읽을 수 없습니다. 다른 파일을 선택해 주세요.')).toBeVisible();
    await expect(productImages(page)).toHaveCount(0);
    expect(uploads).toBe(0);
  });

  test('X removes an image; the next one becomes 대표', async ({ page }) => {
    await mockUploads(page);
    await fillStep1(page);
    await page.locator('input[type="file"]').setInputFiles([file('first.png'), file('second.png')]);
    await expect(productImages(page)).toHaveCount(2);
    await expect(page.getByText('(2/4)')).toBeVisible();
    await page.getByRole('button', { name: '상품 이미지 1 삭제' }).click();
    await expect(productImages(page)).toHaveCount(1);
    await expect(page.getByRole('img', { name: '상품 이미지 1 (대표)' })).toBeVisible();
    await expect(page.getByText('(1/4)')).toBeVisible();
  });

  test('choosing 5 images: a message, only the first 4 upload, then 파일 추가 is disabled', async ({ page }) => {
    await mockUploads(page);
    await fillStep1(page);
    await page.locator('input[type="file"]').setInputFiles([1, 2, 3, 4, 5].map((n) => file(`p${n}.png`)));
    await expect(page.getByText('이미지는 최대 4장까지 등록할 수 있습니다. 앞의 4장만 올립니다.')).toBeVisible();
    await expect(productImages(page)).toHaveCount(4);
    await expect(page.getByText('(4/4)')).toBeVisible();
    await expect(page.getByRole('button', { name: '파일 추가' })).toBeDisabled();
  });

  test('money fields show ₩ and a comma every three digits as you type', async ({ page }) => {
    await page.goto('/shopping/products/new');
    await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-\d+$/);
    await typeAmount(page, '단가', '1500');
    await expect(page.getByRole('spinbutton', { name: '단가', exact: true })).toHaveValue('₩ 1,500');
    await typeAmount(page, '판매가', '1234567');
    await expect(page.getByRole('spinbutton', { name: '판매가', exact: true })).toHaveValue('₩ 1,234,567');
  });

  test('step 2 defaults: 노출상태 예 and 판매상태 예', async ({ page }) => {
    await fillStep1(page);
    await expect(page.getByRole('combobox', { name: '노출상태' })).toHaveText('예');
    await expect(page.getByRole('combobox', { name: '판매상태' })).toHaveText('예');
  });

  test('step 4 (ERP): empty ERP명 and ERP 단가 are refused; nothing is sent', async ({ page }) => {
    let posted = 0;
    await page.route(`${API_GLOB}/products/add`, (route) => {
      posted += 1;
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"message":"Success","data":null}' });
    });
    await reachErpStep(page);
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText('상품ERP명을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('ERP 단가를 입력해 주세요.')).toBeVisible();
    await typeAmount(page, 'ERP 단가', '0');
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText('ERP 단가는 0보다 커야 합니다.')).toBeVisible();
    expect(posted).toBe(0);
  });

  test('double-clicking 등록 sends one save only', async ({ page }) => {
    let posted = 0;
    await page.route(`${API_GLOB}/products/add`, async (route) => {
      posted += 1;
      await new Promise((resolve) => setTimeout(resolve, 1500)); // a slow server
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"message":"Success","data":null}' });
    });
    await reachErpStep(page);
    await page.getByLabel('상품ERP명').fill('HW3-Pranesh-E2E-not-saved-ERP');
    await typeAmount(page, 'ERP 단가', '900');
    await page.getByRole('button', { name: '등록', exact: true }).dblclick();
    await expect(page.getByText('상품이 등록되었습니다.')).toBeVisible();
    expect(posted).toBe(1);
  });

  test('취소 with input: asks first; 아니오 keeps everything, 예 goes back to the list', async ({ page }) => {
    await page.goto('/shopping/products/new');
    await page.getByRole('textbox', { name: '상품명', exact: true }).fill('HW3-Pranesh-E2E-cancel');
    await page.getByRole('button', { name: '취소', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '작성 취소' });
    await expect(dialog).toContainText('입력한 정보는 모두 삭제됩니다. 취소하시겠습니까?');
    await dialog.getByRole('button', { name: '아니오' }).click();
    await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue('HW3-Pranesh-E2E-cancel');
    await page.getByRole('button', { name: '취소', exact: true }).click();
    await page.getByRole('dialog', { name: '작성 취소' }).getByRole('button', { name: '예' }).click();
    await expect(page).toHaveURL(/\/shopping\/products$/);
  });

  test('closing or reloading the tab with unsaved input asks the browser to confirm', async ({ page }) => {
    await page.goto('/shopping/products/new');
    await page.getByRole('textbox', { name: '상품명', exact: true }).fill('HW3-Pranesh-E2E-unsaved');
    const dialog = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const shown = await dialog;
    expect(shown.type()).toBe('beforeunload');
    await shown.dismiss(); // stay on the page
  });

  test('browser Back from a half-filled form returns to the list (in-app navigation: no browser prompt)', async ({ page }) => {
    await page.goto('/shopping/products');
    await page.getByRole('link', { name: '등록' }).click();
    await expect(page).toHaveURL(/\/shopping\/products\/new$/);
    await page.getByRole('textbox', { name: '상품명', exact: true }).fill('HW3-Pranesh-E2E-back');
    await page.goBack();
    await expect(page).toHaveURL(/\/shopping\/products$/);
    await expect(page.getByRole('heading', { name: '상품 관리', level: 1 })).toBeVisible();
  });
});

test.describe('상품 수정 (read only, saves answered here)', () => {
  test('edit: an emptied 상품명 is refused on 다음', async ({ page }) => {
    await page.goto('/shopping/products/20001/edit');
    const name = page.getByRole('textbox', { name: '상품명', exact: true });
    await expect(name).toHaveValue(/HW3-Pranesh-Probe/);
    await name.fill('');
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByText('상품명을 입력해 주세요.')).toBeVisible();
  });

  test('edit: add and remove an image', async ({ page }) => {
    await mockUploads(page);
    await page.goto('/shopping/products/20001/edit');
    await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue(/HW3-Pranesh-Probe/);
    await page.getByRole('button', { name: '다음' }).click();
    const before = await productImages(page).count();
    await page.locator('input[type="file"]').setInputFiles(file('extra.png'));
    await expect(productImages(page)).toHaveCount(before + 1);
    await page.getByRole('button', { name: `상품 이미지 ${before + 1} 삭제` }).click();
    await expect(productImages(page)).toHaveCount(before);
  });

  test('edit: an API error keeps every value typed', async ({ page }) => {
    let calls = 0;
    await page.route(`${API_GLOB}/products/edit/**`, (route) => {
      calls += 1;
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"boom","statusCode":500}' });
    });
    await page.goto('/shopping/products/20001/edit');
    const name = page.getByRole('textbox', { name: '상품명', exact: true });
    await expect(name).toHaveValue(/HW3-Pranesh-Probe/);
    await name.fill('HW3-Pranesh-Probe-a-edited-not-saved');
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '다음' }).click();
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: '입력한 내용은 그대로 유지됩니다' })).toBeVisible();
    expect(calls).toBe(1);
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '이전' }).click();
    await expect(name).toHaveValue('HW3-Pranesh-Probe-a-edited-not-saved');
    await expect(page).toHaveURL(/\/shopping\/products\/20001\/edit$/);
  });

  test('edit: 취소 after a change asks first, then returns to the details page unchanged', async ({ page }) => {
    let saved = false;
    page.on('request', (r) => {
      if (r.method() === 'PUT' && r.url().includes('/products/edit/')) saved = true;
    });
    await page.goto('/shopping/products/20001/edit');
    const name = page.getByRole('textbox', { name: '상품명', exact: true });
    await expect(name).toHaveValue(/HW3-Pranesh-Probe/);
    await name.fill('HW3-Pranesh-Probe-a-cancel');
    await page.getByRole('button', { name: '취소', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '작성 취소' });
    // Edit wording: nothing is deleted, the changes are just not saved.
    await expect(dialog).toContainText('변경한 내용은 저장되지 않습니다. 취소하시겠습니까?');
    await expect(dialog).not.toContainText('삭제');
    await dialog.getByRole('button', { name: '예' }).click();
    await expect(page).toHaveURL(/\/shopping\/products\/20001$/);
    await expect(page.getByRole('tabpanel')).toContainText('HW3-Pranesh-Probe-a');
    expect(saved).toBe(false);
  });
});
