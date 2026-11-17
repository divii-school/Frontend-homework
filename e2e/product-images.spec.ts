import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { typeAmount } from './helpers';

/**
 * Image upload on 상품 등록 (read only: /api/upload is answered here, nothing reaches S3 or the API).
 * Code review should-fix 2 and 6 (2026-11-17).
 */
const png = fs.readFileSync(path.join(__dirname, 'fixtures', 'HW3-Pranesh-e2e.png'));
const file = (name: string) => ({ name, mimeType: 'image/png', buffer: png });
const uploaded = (key: string) =>
  JSON.stringify({ success: true, message: 'uploaded', data: { filePath: `products/${key}.png`, preview: '/images/logo-talkingclub.png' } });

/** Opens 상품 등록 and passes step 1 (no save happens in these tests). */
async function openImageStep(page: Page) {
  await page.goto('/shopping/products/new');
  await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-\d+$/);
  await page.getByRole('textbox', { name: '상품명', exact: true }).fill('HW3-Pranesh-E2E-not-saved');
  await typeAmount(page, '단가', '1000');
  await typeAmount(page, '판매가', '2000');
  await page.getByLabel('상세설명').fill('저장하지 않는 테스트');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('heading', { name: /2\. 이미지 · 노출/ })).toBeVisible();
}

const productImages = (page: Page) => page.getByRole('img', { name: /^상품 이미지 \d/ });

test('an image removed while another is still uploading stays removed', async ({ page }) => {
  let releaseSecond!: () => void;
  const secondMayFinish = new Promise<void>((resolve) => (releaseSecond = resolve));
  let calls = 0;
  await page.route('**/api/upload', async (route) => {
    calls += 1;
    if (calls === 1) return route.fulfill({ status: 201, contentType: 'application/json', body: uploaded('first') });
    await secondMayFinish; // the second upload is still running while the first image is removed
    return route.fulfill({ status: 201, contentType: 'application/json', body: uploaded('second') });
  });

  await openImageStep(page);
  await page.locator('input[type="file"]').setInputFiles([file('first.png'), file('second.png')]);
  await expect(productImages(page)).toHaveCount(1);
  await page.getByRole('button', { name: '상품 이미지 1 삭제' }).click();
  await expect(productImages(page)).toHaveCount(0);

  releaseSecond();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  // Only the second image: the removed first one did not come back.
  await expect(productImages(page)).toHaveCount(1);
  await expect(page.getByText('(1/4)')).toBeVisible();
});

test('an expired token during upload is renewed once and the upload goes through', async ({ page, context }) => {
  const token = (await context.cookies()).find((c) => c.name === 'hw3_at')?.value ?? '';
  let uploads = 0;
  await page.route('**/api/upload', (route) => {
    uploads += 1;
    if (uploads === 1) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{"success":false,"message":"Unauthorized"}' });
    }
    return route.fulfill({ status: 201, contentType: 'application/json', body: uploaded('after-refresh') });
  });
  let refreshes = 0;
  await page.route('**/api/auth/refresh', (route) => {
    refreshes += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Success', data: { token: decodeURIComponent(token) } }) });
  });

  await openImageStep(page);
  await page.locator('input[type="file"]').setInputFiles(file('photo.png'));
  await expect(page.getByRole('img', { name: '상품 이미지 1 (대표)' })).toBeVisible();
  expect(uploads).toBe(2); // refused once, then replayed with the new token
  expect(refreshes).toBe(1);
  await expect(page.getByText(/로그인이 필요합니다|업로드하지 못했습니다/)).toHaveCount(0);
  await expect(page).toHaveURL(/\/shopping\/products\/new$/);
});
