# Build report — HW3 Talking Club Admin, Shopping Management (Sachin)

For: Archana (QA). The checks below were run on 16 Nov 2026 on the production build (`npm run build` +
`next start`) on my machine, against the Talking Club QA API.
**The Vercel link is not filled in yet**; the same checks are run again on the deployed URL before hand-over
(WM: evidence must come from the deployed URL, not localhost).

## 1. Build

| Item | Value |
|---|---|
| Repo / branch | `divii-school/Frontend-homework`, branch `hw3/sachin` |
| Commit | the latest commit of the branch (see the PR) |
| Deployed link (Vercel) | _to be filled in after deploy_ |
| API | Talking Club QA API only |
| Date | 16 Nov 2026 |

## 2. TL tasks covered

TL | HW3 — Advanced Frontend Homework (Real Project: Talking Club Shopping Management), section 4 A–E.

## 3. What is in this build

1. **Login and logout** with the real API; messages under empty fields and the API's error for a wrong ID or password; 자동 로그인 (stay signed in after the browser closes).
2. **Protected pages**: a signed-out visitor is sent to login and returned to the same page after login.
3. **Roles**: menu, pages and buttons follow the user's role and permissions; a page the user may not open shows a 403 screen.
4. **Product Category Management**: tree of 대분류 / 중분류 / 소분류; search, sort, paging; create, rename, delete with confirm.
5. **Product Management list**: search, search type, category filter, sort, page and page size, all kept in the address bar; row selection with bulk delete; visibility switch; export of the filtered result to CSV.
6. **Product create / edit** in four steps with validation on each step, and image upload (type and size check, preview, remove).
7. **Product details** with three tabs; the open tab is kept in the address bar.
8. **Light and dark mode**, remembered per browser.
9. **Error screens** for 401, 403, 404, 500 and no network.

## 4. Fixed issues

None; this is the first build.

## 5. Test accounts

The QA admin account sent by DM (role SUPER_ADMIN). No other role exists on the QA server, so limited roles
were checked by simulating the stored user in Playwright (`e2e/roles-and-errors.spec.ts`). No password is
written here.

## 6. Data to prepare

Nothing. Please create, edit and delete only your own records. My test records are named `HW3-Sachin-…`.
Two of my 중분류 stay on the server under 대분류 **학원 Shop**:

- `HW3-Sachin-Fixture-Sub` / `HW3-Sachin-Fixture-Child`: kept on purpose; my tests create products under it.
- `HW3-Sachin-Unremovable-Sub` / `HW3-Sachin-Unremovable-Child`: cannot be deleted (Known issues, 2).

## 7. What to test

1. Login: empty fields, wrong password, correct login, 자동 로그인.
2. Open `/products?page=2` while signed out, log in, and check you land on page 2.
3. Product list: search, change the search type, category filter, sort by 상품명 / 판매금액 / 등록일자, page and page size. Refresh after each and check nothing is lost.
4. Select rows → 삭제 → the dialog lists the names → cancel. (Delete only your own records.)
5. 내보내기 with a search applied: the CSV has only the filtered rows.
6. 등록: go through the four steps; press 다음 with empty fields; go back and check the values are kept; upload a wrong file type, a file over 4 MB, then a valid image; remove it; save.
7. Open the product → tabs 기본 정보 / 카테고리 / 같은 카테고리 상품; refresh on a tab.
8. 수정: change only the name and save: the price stays as it was. Then change 수량 and check that 판매가 becomes 수량 × 단가.
9. Categories: search, sort, open and close rows, add a 중분류 and a 소분류 under a 대분류, rename, delete with confirm.
10. Dark mode switch on every screen; refresh keeps it.
11. Sizes 1440 / 768 / 375: no sideways page scroll; the table scrolls inside its own box; below 991px the menu opens from the ☰ button.
12. Keyboard: Tab through login and the product form; arrow keys on the details tabs; focus is visible.

## 8. Known issues and what is not covered

1. **Logout signs out everyone.** The QA API's logout ends every session of the account, and all HW3 developers share one account. If you are suddenly sent to the login page, someone pressed logout: log in again and you return to the same page.
2. **A category that has held a product cannot be deleted.** The API answers 500 "Something went wrong", even after the product is deleted. The app shows "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." (API question A4.)
3. **Sort is per page.** The products API has no sort parameter, so sort orders the rows of the current page; the category list is sorted and paged in the browser. (A1, A2.)
4. **Token refresh is not used**: the API's refresh cookie cannot be used from another domain. When the token expires the app goes to login and returns to the same page.
5. **Not compared with Figma yet.** I had no access to the Figma file while building; colours and sizes were read from the live QA admin. (Design question Q1.)
6. **White text on the brand pink is 3.98:1**, below the 4.5:1 of WCAG AA. The colour is used as designed. (Q9.)
7. The description is plain text, not rich text. Category reordering by drag is not built. A new 대분류 cannot be added on the QA server (the API says `isCreatable: false`), so that button is not shown.
8. Not run yet: the suite on the deployed URL, real Safari and a real phone. Safari's engine (WebKit) and the phone width (375) were run in Playwright.

## 9. Results (16 Nov 2026, production build on my machine, QA API)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | Pass: 0 errors, 0 warnings |
| Type-check | `npx tsc --noEmit` | Pass: 0 errors |
| Unit tests | `npm run test:unit` | 18 passed, 0 failed |
| Build | `npm run build` | Pass: 7 pages, 1 route handler, middleware |
| Playwright read-only, Chromium | `npm run test:e2e` | 42 passed, 0 failed (login setup + 41 tests) |
| Playwright read-only, WebKit | `npm run test:e2e:webkit` | 42 passed, 0 failed |
| Playwright create / edit / delete | `npm run test:e2e:mutation` | 7 passed, 0 failed (login setup + 6 tests) |
| The same read-only tests on the dev server | `npm run test:e2e` without `PLAYWRIGHT_BASE_URL` | 42 passed, 0 failed |
| Write tests and screenshots without their scripts | `npx playwright test --project=mutation --project=screenshots` | all 16 skipped: nothing written |
| Console | inside the tests, on every screen | 0 errors, 0 warnings |
| Sideways scroll | inside the tests, 11 screens × 11 widths (1920 → 375) | none |

The HTML report of the Chromium read-only run is `docs/playwright-report.zip`. Written test cases:
`docs/test-cases.csv`.

```
> npm run lint
> eslint
(no output: 0 problems)

> npx tsc --noEmit
(no output: 0 errors)

> npm run test:unit
 ✓ src/utils/rules.test.ts (18 tests)
 Test Files  1 passed (1)
      Tests  18 passed (18)

> npm run build
 ✓ Compiled successfully
 ✓ Generating static pages (8/8)
Route (app)
┌ ○ /_not-found
├ ƒ /api/upload
├ ○ /auth/login
├ ○ /categories
├ ○ /products
├ ƒ /products/[id]
├ ƒ /products/[id]/edit
└ ○ /products/create
ƒ Middleware

> npm run test:e2e
  42 passed

> npm run test:e2e:webkit
  42 passed

> npm run test:e2e:mutation
  7 passed
```

## 10. Sizes and browsers checked

- Chromium (the engine of Chrome and Edge) and WebKit (the engine of Safari), desktop, in Playwright.
- No sideways page scroll at 1920, 1600, 1440, 1366, 1280, 1024, 991, 768, 640, 480 and 375 on every screen (automated).
- Screenshots of every screen at **1920, 1440, 1366, 768 and 375**, light and dark: `docs/screenshots/day` and `docs/screenshots/night` (110 files).
- Not checked yet: real Safari and a real mobile browser (WM Frontend Standard 5.9).
