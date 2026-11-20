import { expect, test } from '@playwright/test';
import { hasLogin, login, PREFIX } from './helpers';

// Creates, edits and deletes ONLY its own HW3-Saswat- record on the shared QA server.
test.describe('상품 카테고리 등록/수정/삭제 @mutation', () => {
  test.skip(!hasLogin, 'E2E_LOGIN_ID / E2E_PASSWORD 가 필요합니다');

  test('대분류를 등록 → 수정 → 삭제한다', async ({ page }) => {
    const name = `${PREFIX}Cat-${Date.now()}`;
    await login(page, '/shopping/categories');

    await page.getByRole('button', { name: '대분류 등록' }).click();
    await page.getByLabel('카테고리명').fill(name);
    await page.getByRole('dialog').getByRole('button', { name: '등록' }).click();
    await expect(page.getByText('등록되었습니다.')).toBeVisible();

    await page.getByLabel('카테고리 검색').fill(name);
    await page.getByRole('button', { name: '검색' }).click();
    await expect(page.getByText(name)).toBeVisible();

    await page.getByRole('button', { name: `${name} 수정` }).click();
    await page.getByLabel('카테고리명').fill(`${name}-E`);
    await page.getByRole('dialog').getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('수정되었습니다.')).toBeVisible();

    await page.getByLabel('카테고리 검색').fill(`${name}-E`);
    await page.getByRole('button', { name: '검색' }).click();
    await page.getByRole('button', { name: `${name}-E 삭제` }).click();
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(page.getByText('삭제되었습니다.')).toBeVisible();
  });

  test('빈 이름과 중복 이름은 막는다', async ({ page }) => {
    await login(page, '/shopping/categories');
    await page.getByRole('button', { name: '대분류 등록' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '등록' }).click();
    await expect(page.getByText('카테고리명을 입력해 주세요.')).toBeVisible();
  });
});
