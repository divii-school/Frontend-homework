import { expect, test } from '@playwright/test';

/**
 * Changes data on the shared QA server — only our own HW3-Pranesh-* records.
 * Works inside 학원 Shop › HW3-Pranesh-Sub (top-level categories are capped by the API).
 * One test.step per test case, so the HTML report shows pass / fail for each case.
 * Run with: npm run test:e2e:mutation
 */
const stamp = Date.now().toString().slice(-6);
const childName = `HW3-Pranesh-E2E-${stamp}`;
const renamed = `${childName}-수정`;

test.describe.configure({ mode: 'serial' });

test('add, rename and delete a 소분류 under our own 중분류', async ({ page }) => {
  await test.step('TC-CAT-06 · add (spaces around the name are trimmed) → toast, tree updated', async () => {
    await page.goto('/shopping/categories?q=HW3-Pranesh-Sub');
    const subRow = page.locator('li', { has: page.getByRole('button', { name: 'HW3-Pranesh-Sub 수정' }) }).first();
    await subRow.getByRole('button', { name: /소분류/ }).first().click();
    const add = page.getByRole('dialog', { name: '소분류 등록' });
    await expect(add).toContainText('상위 카테고리: HW3-Pranesh-Sub');
    await add.getByLabel('카테고리명').fill(`  ${childName}  `);
    await add.getByRole('button', { name: '등록' }).click();
    await expect(page.getByText('소분류가 등록되었습니다.')).toBeVisible();
    await expect(page.getByText(childName, { exact: true })).toBeVisible();
  });

  await test.step('TC-CAT-10 · rename: the dialog opens with the current name; save → toast', async () => {
    await page.getByRole('button', { name: `${childName} 수정` }).click();
    const edit = page.getByRole('dialog', { name: '소분류 수정' });
    await expect(edit.getByLabel('카테고리명')).toHaveValue(childName);
    await edit.getByLabel('카테고리명').fill(renamed);
    await edit.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('소분류가 수정되었습니다.')).toBeVisible();
    await expect(page.getByText(renamed, { exact: true })).toBeVisible();
  });

  await test.step('TC-CAT-11 · delete asks first ("되돌릴 수 없습니다"); 취소 keeps it', async () => {
    await page.getByRole('button', { name: `${renamed} 삭제` }).click();
    const confirm = page.getByRole('dialog', { name: '카테고리 삭제' });
    await expect(confirm).toContainText('되돌릴 수 없습니다');
    await confirm.getByRole('button', { name: '취소' }).click();
    await expect(page.getByText(renamed, { exact: true })).toBeVisible();
  });

  await test.step('TC-CAT-15 · 삭제 → toast, gone from the tree', async () => {
    await page.getByRole('button', { name: `${renamed} 삭제` }).click();
    await page.getByRole('dialog', { name: '카테고리 삭제' }).getByRole('button', { name: '삭제' }).click();
    await expect(page.getByText(/소분류가 삭제되었습니다/)).toBeVisible();
    await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
  });
});

test('a duplicate name is refused with the API message (case does not matter); nothing is created', async ({ page }) => {
  await page.goto('/shopping/categories?q=HW3-Pranesh-Sub');
  const subRow = page.locator('li', { has: page.getByRole('button', { name: 'HW3-Pranesh-Sub 수정' }) }).first();
  await subRow.getByRole('button', { name: /소분류/ }).first().click();
  const add = page.getByRole('dialog', { name: '소분류 등록' });
  await add.getByLabel('카테고리명').fill('hw3-pranesh-child'); // existing: HW3-Pranesh-Child
  await add.getByRole('button', { name: '등록' }).click();
  await expect(add.getByText('이미 등록된 소분류명입니다. 다른 이름을 입력해 주세요.')).toBeVisible();
  await expect(add.getByLabel('카테고리명')).toHaveValue('hw3-pranesh-child'); // typed value kept
  await add.getByRole('button', { name: '취소' }).click();
  await expect(page.getByText('hw3-pranesh-child', { exact: true })).toHaveCount(0);
});

test('add a 중분류 under a 대분류, then delete it', async ({ page }) => {
  const midName = `HW3-Pranesh-E2E-mid-${stamp}`;
  await page.goto('/shopping/categories');
  const top = page.locator('li', { has: page.getByRole('button', { name: '학원 Shop 수정' }) }).first();
  await top.getByRole('button', { name: /중분류/ }).first().click();
  const add = page.getByRole('dialog', { name: '중분류 등록' });
  await expect(add).toContainText('상위 카테고리: 학원 Shop');
  await add.getByLabel('카테고리명').fill(midName);
  await add.getByRole('button', { name: '등록' }).click();
  await expect(page.getByText('중분류가 등록되었습니다.')).toBeVisible();

  await page.goto(`/shopping/categories?q=${midName}`);
  await expect(page.getByText(midName, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `${midName} 삭제` }).click();
  await page.getByRole('dialog', { name: '카테고리 삭제' }).getByRole('button', { name: '삭제' }).click();
  await expect(page.getByText(/중분류가 삭제되었습니다/)).toBeVisible();
  await page.goto(`/shopping/categories?q=${midName}`);
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
});

test('reorder our own 소분류 with the drag handle (keyboard), rename to a duplicate is refused, then clean up', async ({ page }) => {
  const a = `HW3-Pranesh-E2E-A-${stamp}`;
  const b = `HW3-Pranesh-E2E-B-${stamp}`;
  const handles = page.getByRole('button', { name: /순서 변경 \(위\/아래 화살표\)$/ });
  const order = async () =>
    (await handles.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''))).map((l) =>
      l.replace(' 순서 변경 (위/아래 화살표)', ''),
    );
  // Normal (unfiltered) tree: open 학원 Shop › HW3-Pranesh-Sub.
  const openSub = async () => {
    await page.goto('/shopping/categories');
    await page.getByRole('button', { name: '학원 Shop 펼치기' }).click();
    await page.getByRole('button', { name: 'HW3-Pranesh-Sub 펼치기' }).click();
    await expect(page.getByText(b, { exact: true })).toBeVisible();
  };

  await test.step('setup · two more 소분류 next to HW3-Pranesh-Child (every sibling is our own record)', async () => {
    for (const name of [a, b]) {
      await page.goto('/shopping/categories?q=HW3-Pranesh-Sub');
      const subRow = page.locator('li', { has: page.getByRole('button', { name: 'HW3-Pranesh-Sub 수정' }) }).first();
      await subRow.getByRole('button', { name: /소분류/ }).first().click();
      const add = page.getByRole('dialog', { name: '소분류 등록' });
      await add.getByLabel('카테고리명').fill(name);
      await add.getByRole('button', { name: '등록' }).click();
      await expect(page.getByText('소분류가 등록되었습니다.')).toBeVisible();
    }
    await openSub();
  });

  await test.step('TC-CAT-14 · a group with other people\'s records has no handle; ours moves with ↓ and stays after reload', async () => {
    await expect(page.getByRole('button', { name: 'HW3-Pranesh-Sub 순서 변경 (위/아래 화살표)' })).toHaveCount(0);
    await expect(handles).toHaveCount(3);
    const before = await order();
    await handles.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByText('순서가 변경되었습니다.')).toBeVisible();
    const expected = [before[1], before[0], before[2]];
    await expect.poll(order).toEqual(expected);
    await openSub();
    expect(await order()).toEqual(expected);
  });

  await test.step('TC-CAT-22 · rename to a sibling\'s name is refused by the API; 취소 keeps the old name', async () => {
    await page.getByRole('button', { name: `${b} 수정` }).click();
    const edit = page.getByRole('dialog', { name: '소분류 수정' });
    await edit.getByLabel('카테고리명').fill(a);
    await edit.getByRole('button', { name: '저장' }).click();
    await expect(edit.getByText('이미 등록된 소분류명입니다. 다른 이름을 입력해 주세요.')).toBeVisible();
    await edit.getByRole('button', { name: '취소' }).click();
    await expect(page.getByText(b, { exact: true })).toBeVisible();
  });

  await test.step('cleanup · delete both test records', async () => {
    for (const name of [a, b]) {
      await page.getByRole('button', { name: `${name} 삭제` }).click();
      await page.getByRole('dialog', { name: '카테고리 삭제' }).getByRole('button', { name: '삭제' }).click();
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    }
  });
});
