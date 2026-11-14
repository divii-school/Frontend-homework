import { expect, test } from '@playwright/test';

/**
 * Changes data on the shared QA server — only our own HW3-Pranesh-* records.
 * Works inside 학원 Shop › HW3-Pranesh-Sub (top-level categories are capped by the API).
 * Run with: npm run test:e2e:mutation
 */
const stamp = Date.now().toString().slice(-6);
const childName = `HW3-Pranesh-E2E-${stamp}`;
const renamed = `${childName}-수정`;

test.describe.configure({ mode: 'serial' });

test('add, rename and delete a 소분류 under our own 중분류', async ({ page }) => {
  await page.goto('/shopping/categories?q=HW3-Pranesh-Sub');
  const subRow = page.locator('li', { has: page.getByRole('button', { name: 'HW3-Pranesh-Sub 수정' }) }).first();

  // Add (with spaces around the name: they must be trimmed).
  await subRow.getByRole('button', { name: /소분류/ }).first().click();
  const add = page.getByRole('dialog', { name: '소분류 등록' });
  await expect(add).toContainText('상위 카테고리: HW3-Pranesh-Sub');
  await add.getByLabel('카테고리명').fill(`  ${childName}  `);
  await add.getByRole('button', { name: '등록' }).click();
  await expect(page.getByText('소분류가 등록되었습니다.')).toBeVisible();
  await expect(page.getByText(childName, { exact: true })).toBeVisible();

  // Rename — the dialog opens with the current name.
  await page.getByRole('button', { name: `${childName} 수정` }).click();
  const edit = page.getByRole('dialog', { name: '소분류 수정' });
  await expect(edit.getByLabel('카테고리명')).toHaveValue(childName);
  await edit.getByLabel('카테고리명').fill(renamed);
  await edit.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText('소분류가 수정되었습니다.')).toBeVisible();
  await expect(page.getByText(renamed, { exact: true })).toBeVisible();

  // Delete — confirm first; cancel keeps it.
  await page.getByRole('button', { name: `${renamed} 삭제` }).click();
  const confirm = page.getByRole('dialog', { name: '카테고리 삭제' });
  await expect(confirm).toContainText('되돌릴 수 없습니다');
  await confirm.getByRole('button', { name: '취소' }).click();
  await expect(page.getByText(renamed, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: `${renamed} 삭제` }).click();
  await page.getByRole('dialog', { name: '카테고리 삭제' }).getByRole('button', { name: '삭제' }).click();
  await expect(page.getByText(/소분류가 삭제되었습니다/)).toBeVisible();
  await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
});
