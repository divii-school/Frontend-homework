import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

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
  await page.goto('/shopping/products/new');
  await expect(page.getByLabel('상품코드')).toHaveValue(/^PRD-\d+$/);

  // Step 1: empty → errors, nothing moves on.
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('상품명을 입력해 주세요.')).toBeVisible();
  await page.getByRole('textbox', { name: '상품명', exact: true }).fill(name);
  await typeAmount(page, '단가', '2000');
  await typeAmount(page, '판매가', '2000');
  await page.getByLabel('상세설명').fill('E2E 테스트 상품입니다.\n두 번째 줄');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('단가는 판매가보다 작아야 합니다.')).toBeVisible(); // API rule, checked before sending
  await typeAmount(page, '단가', '1500');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('heading', { name: /2\. 이미지 · 노출/ })).toBeVisible();

  // Step 2: images are required; wrong type refused; a real PNG uploads and previews.
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('대표 이미지를 1장 이상 등록해 주세요.')).toBeVisible();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(fixture('not-an-image.txt'));
  await expect(page.getByText(/JPG, PNG, WEBP 이미지만 등록할 수 있습니다/)).toBeVisible();
  await fileInput.setInputFiles(fixture('HW3-Pranesh-e2e.png'));
  await expect(page.getByRole('img', { name: '상품 이미지 1 (대표)' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: '다음' }).click();

  // Step 3: categories, column by column.
  await expect(page.getByRole('heading', { name: /3\. 카테고리/ })).toBeVisible();
  await pickCategory(page, '학원 Shop');
  await pickCategory(page, 'HW3-Pranesh-Sub');
  await pickCategory(page, 'HW3-Pranesh-Child');
  await page.getByRole('button', { name: '다음' }).click();

  // Step 4: ERP, then go all the way back — everything is still there.
  await page.getByLabel('ERP 상품명').fill(`${name}-ERP`);
  await typeAmount(page, 'ERP 단가', '1200');
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '이전' }).click();
  await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue(name);
  await expect(page.getByRole('spinbutton', { name: '단가', exact: true })).toHaveValue('₩ 1,500');
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByLabel('ERP 상품명')).toHaveValue(`${name}-ERP`);

  await page.getByRole('button', { name: '등록', exact: true }).click();
  await expect(page.getByText('상품이 등록되었습니다.')).toBeVisible();
  await expect(page).toHaveURL(/\/shopping\/products$/);
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
  await page.getByLabel('ERP 상품명').fill('x');
  await typeAmount(page, 'ERP 단가', '100');
  await page.getByRole('button', { name: '등록', exact: true }).click();

  await expect(page.getByRole('alert').filter({ hasText: '입력한 내용은 그대로 유지됩니다' })).toBeVisible();
  await expect(page.getByLabel('ERP 상품명')).toHaveValue('x');
  await page.getByRole('button', { name: '이전' }).click();
  await page.getByRole('button', { name: '이전' }).click();
  await page.getByRole('button', { name: '이전' }).click();
  await expect(page.getByRole('textbox', { name: '상품명', exact: true })).toHaveValue(`${name}-오류`);
});

test('find it, toggle 노출 inline, edit it, then delete it', async ({ page }) => {
  await page.goto(`/shopping/products?q=${encodeURIComponent(name)}`);
  const row = page.locator('tbody tr', { hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText('₩2,000');
  await expect(row).toContainText('학원 Shop > HW3-Pranesh-Sub > HW3-Pranesh-Child');

  // Inline 노출 toggle with toast.
  await row.getByRole("button", { name: `${name} 노출 여부 목록 열기` }).click();
  await page.getByRole('option', { name: '아니오' }).click();
  await expect(page.getByText(/노출 여부가 변경되었습니다/)).toBeVisible();

  // Details → edit price → saved.
  await row.getByRole('link', { name }).click();
  await expect(page.getByRole('tabpanel')).toContainText('아니오');
  await page.getByRole('link', { name: '수정' }).click();
  await typeAmount(page, '판매가', '3000');
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('카테고리는 등록 후 수정할 수 없습니다.')).toHaveCount(1);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('상품이 수정되었습니다.')).toBeVisible();
  await expect(page.getByRole('tabpanel')).toContainText('₩3,000');

  // Delete from details.
  await page.getByRole('button', { name: '삭제' }).click();
  await page.getByRole('dialog', { name: '상품 삭제' }).getByRole('button', { name: '삭제' }).click();
  await expect(page.getByText(/상품이 삭제되었습니다/)).toBeVisible();
  await page.goto(`/shopping/products?q=${encodeURIComponent(name)}`);
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
});
