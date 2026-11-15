# Build report — HW3 Talking Club Admin, Shopping Management (Sachin)

For: Archana (QA). Checks below were run on 16 Nov 2026 on the local build against the Talking Club QA API.
**The Vercel build is not deployed yet**; the link, the commit and the re-run on the deployed URL are filled in
before hand-over (WM: evidence must come from the deployed URL, not localhost).

## 1. Build

| Item | Value |
|---|---|
| Repo / branch | `divii-school/Frontend-homework`, branch `hw3/sachin` |
| Commit | _fill in after push_ |
| Deployed link (Vercel) | _fill in after deploy_ |
| API | Talking Club QA API only |
| Date | _fill in on hand-over day_ |

## 2. TL tasks covered

TL | HW3 — Advanced Frontend Homework (Real Project: Talking Club Shopping Management), sections 4 A–E.

## 3. What is in this build

1. **Login and logout** with the real API; validation and the API's error on a wrong ID or password.
2. **Protected pages**: a signed-out visitor is sent to login and returned to the same page after login.
3. **Roles**: menu, pages and buttons follow the user's role and permissions; a page the user may not open shows a 403 screen.
4. **Product Category Management**: tree of 대분류 / 중분류 / 소분류; search, sort, paging; create, rename, delete with confirm.
5. **Product Management list**: search, search type, category filter, sort, paging and page size, all kept in the address bar; row selection with bulk delete; visibility switch; export of the filtered result to CSV.
6. **Product create / edit** in four steps with validation per step, image upload (type and size check, preview, remove).
7. **Product details** with three tabs; the open tab is kept in the address bar.
8. **Light and dark mode**, remembered per browser.
9. **Error screens** for 401, 403, 404, 500 and no network.

## 4. Fixed issues

None; this is the first build.

## 5. Test accounts

The QA admin account sent by DM (role SUPER_ADMIN). No other role exists on the QA server, so limited roles were
checked by simulating the stored user in Playwright (`e2e/roles-and-errors.spec.ts`). No password is written here.

## 6. Data to prepare

Nothing. Please create, edit and delete only your own records. My test records are named `HW3-Sachin-…`.
Under 대분류 **학원 Shop** two of my 중분류 stay on the server:

- `HW3-Sachin-Fixture-Sub` / `HW3-Sachin-Fixture-Child`: kept on purpose; my tests create products under it.
- `HW3-Sachin-Unremovable-Sub` / `HW3-Sachin-Unremovable-Child`: cannot be deleted (see Known issues 2).

## 7. What to test

1. Login: empty fields, wrong password, correct login.
2. Open `/products?page=2` while signed out, log in, check you land on page 2.
3. Product list: search, change search type, category filter, sort by 상품명 / 판매금액 / 등록일자, page and page size; refresh after each and check nothing is lost.
4. Select rows → 삭제 → the dialog lists the names → cancel. (Delete only your own records.)
5. 내보내기 with a search applied: the CSV has only the filtered rows.
6. 등록: go through the four steps; try 다음 with empty fields; go back and check values are kept; upload a wrong file type, a file over 5 MB, then a valid image; remove it; save.
7. Open the product → tabs 기본 정보 / 카테고리 / 같은 카테고리 상품; refresh on a tab.
8. 수정: change a value and save.
9. Categories: search, sort, expand/collapse, add 중분류 and 소분류 under a 대분류, rename, delete with confirm.
10. Dark mode switch on every screen; refresh keeps it.
11. Sizes 1440 / 768 / 375: no sideways page scroll; the table scrolls inside its own box; below 991px the menu opens from the ☰ button.
12. Keyboard: Tab through login and the product form; arrow keys on the details tabs; focus is visible.

## 8. Known issues and what is not covered

1. **Logout signs out everyone.** The QA API's logout ends every session of the account and all HW3 developers share one account. If you are suddenly sent to the login page, someone pressed logout: log in again and you return to the same page.
2. **A category that has held a product cannot be deleted.** The API answers 500 "Something went wrong", even after the product is deleted. The app shows the API's message. Backend question A4 in `docs/design-questions.md`.
3. **Sort is per page.** The products API has no sort parameter, so sort orders the rows of the current page; the category list is sorted and paged in the browser. Questions A1, A2.
4. **Token refresh is not used** (the API's refresh cookie cannot be used from another domain). On expiry the app goes to login and returns to the same page.
5. **Not compared with Figma yet.** I had no access to the Figma file while building; colours and sizes were read from the live QA admin. Design question Q1.
6. The description is plain text, not rich text. The first product in the list (`HW3-Pranesh-Probe-a`) shows an empty thumbnail because its image file does not load from storage; the live admin shows the same.
7. Not run yet: 1920 and 1366 widths, Safari, a real mobile browser, and the full suite on the deployed URL.

## 9. Results (16 Nov 2026, local build, QA API)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | Pass, 0 errors, 0 warnings |
| Type-check | `npx tsc --noEmit` | Pass, 0 errors |
| Unit tests | `npm run test:unit` | 16 passed, 0 failed |
| Build | `npm run build` | Pass, 7 routes + middleware |
| Playwright read-only | `npm run test:e2e` | 32 passed, 0 failed (login setup + 31 tests), 2.8 min |
| Playwright mutation | `npm run test:e2e:mutation` | 7 passed, 0 failed (login setup + 6 tests), 1.8 min |
| Console | checked inside the list and category tests | 0 errors, 0 warnings |

The HTML report of the read-only run is `docs/playwright-report.zip`. Written test cases: `docs/test-cases.csv`
(53 cases; 49 passed, 4 not run yet and marked so).

```
> npm run lint
> eslint
(no output: 0 problems)

> npx tsc --noEmit
(no output: 0 errors)

> npm run test:unit
 ✓ src/utils/rules.test.ts (16 tests)
 Test Files  1 passed (1)
      Tests  16 passed (16)

> npm run build
 ✓ Compiled successfully
 ✓ Generating static pages (7/7)
Route (app)
┌ ○ /_not-found
├ ○ /auth/login
├ ○ /categories
├ ○ /products
├ ƒ /products/[id]
├ ƒ /products/[id]/edit
└ ○ /products/create
ƒ Middleware

> npm run test:e2e
  32 passed (2.8m)

> npm run test:e2e:mutation
  7 passed (1.8m)
```

## 10. Sizes and browsers checked

- Chrome (Playwright Chromium), desktop.
- Screenshots of every screen at **1440, 768 and 375**, light and dark: `docs/screenshots/day` and `docs/screenshots/night` (66 files).
- Not checked yet: 1920, 1366, Safari, a real mobile browser.
