# Build report — HW3 Talking Club Admin, Shopping Management (Sachin)

For: Archana (QA). The checks below were last run on 18 Nov 2026, after the code-review and design-review fixes,
on the production build (`npm run build` + `next start`) on my machine, against the Talking Club QA API.
The read-only and the create / edit / delete tests are also run on the deployed build,
https://talkingclub-hw3-sachin.vercel.app (WM: evidence must come from the deployed URL, not localhost).

## 1. Build

| Item | Value |
|---|---|
| Repo / branch | `divii-school/Frontend-homework`, branch `hw3/sachin` |
| Commit | the latest commit of the branch (see the PR) |
| Deployed link (Vercel) | https://talkingclub-hw3-sachin.vercel.app |
| API | Talking Club QA API only |
| Date | 18 Nov 2026 (my machine and Vercel) |

## 2. TL tasks covered

TL | HW3 — Advanced Frontend Homework (Real Project: Talking Club Shopping Management), section 4 A–E.

## 3. What is in this build

1. **Login and logout** with the real API; messages under empty fields; a wrong ID or password opens an alert closed with 확인 ("등록되지 않은 계정입니다." / "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요."); an account without admin rights gets the "관리자 권한이 없습니다." popup; an eye button shows or hides the typed password; 자동 로그인 (stay signed in after the browser closes).
2. **Protected pages**: a signed-out visitor is sent to login and returned to the same page after login.
3. **Roles**: menu, pages and buttons follow the user's role and permissions; a page the user may not open shows a 403 screen.
4. **Product Category Management**: tree of 대분류 / 중분류 / 소분류; search, sort, paging; create and rename (names up to 50 characters); delete with confirm, refused while a category still has categories under it.
5. **Product Management list**: search, search type, category filter, sort, page and page size, all kept in the address bar; row selection with bulk delete; 노출여부 as an inline 예 / 아니오 dropdown saved at once; the product code under each thumbnail; prices as ₩1,500 and dates as YYYY/MM/DD HH:MM in server time; export of the filtered result to CSV.
6. **Product create / edit** in four steps with validation on each step, and image upload (type and size check, preview, remove).
7. **Product details** with three tabs; the open tab is kept in the address bar.
8. **Light and dark mode**, remembered per browser; the logo has its own dark-mode file.
9. **Korean only on screen and for screen readers**, PrimeReact's own labels included (페이지당 행 수, 첫 페이지, 행 선택, …).
10. **Error screens** for 401, 403, 404, 500 and no network. Every API answer is shown in Korean: known keys have their own sentence, an unknown key or an English validation sentence gets a Korean one (no key and no English on screen).

## 4. Fixed issues

Code review of 18 Nov 2026 (Kakali, PR #4):

| # | Review item | Fix |
|---|---|---|
| 1 | Must fix: raw English API keys and validation sentences could appear on the Korean screen | Korean text for every key we know (`constants/messages.ts`); an unknown key gets a Korean sentence by its shape (…NotFound, …AlreadyExists, …LimitReached) or by its status; English validation sentences are translated per field (`utils/api-messages.ts`). |
| 2 | Sorting orders only the current page, and the screen did not say so | A hint "정렬은 현재 페이지 기준입니다." above the product table. |
| 3 | Delete was limited to `SUPER_ADMIN` and a made-up `ADMIN` role | Every action follows its page permission only (`config/navigation.ts`); the roles are the API's (MASTER_ADMIN, GENERAL_ADMIN). |
| 4 | No "관리자 권한이 없습니다" popup at login | The popup shows when the API refuses the account (`userSuspended`) or when the account may open no page; no session is kept. |
| 5 | A comma in an image file name broke the images after saving | Commas are removed from the name before the upload. |
| 6 | The upload route could crash with a 500 | An unreadable form answers 400 `invalidRequest`; no answer, an unexpected answer or a storage refusal answers 502 `uploadFailed`, always as JSON. |

Design fixes of 18 Nov (Figma frames 8.1.0, 8.1.1, 8.1.2 and 8.2.0, compared screen by screen):

| Screen | Fix |
|---|---|
| Login | A wrong ID or password opens an alert closed with 확인, with the two texts of the frame. |
| Product list | Search runs on Enter or the magnifier; "검색 결과가 없습니다." for a search without result; small grey 삭제 button; header 선택 without select-all; a toast when 노출여부 is saved; "총 게시물 : n" at the far right. |
| Product create / edit | 취소 asks "입력하신 내용이 전부 삭제됩니다. 취소하시겠습니까?" (예 / 아니오); 상품명 at most 100 characters; 비과세*, 노출상태* and 판매상태* are required dropdowns; the category is three lists (대분류 / 중분류 / 소분류) under one 카테고리* label; underlined fields, grey labels, one 630px column, 취소 and 등록 centred. |
| Product edit | 저장 in the page heading, saving from any step; the category is read-only with "등록 후 변경 불가". |
| Category | Search on Enter; 모두 펼치기 / 모두 접기 right after the search box; violet "+ 중분류 / + 소분류" buttons; pencil and trash in one grey. |

Design review of 18 Nov (Bhagyashree, Vercel build at 1440 / 768 / 375, light and dark):

| # | Review item | Fix |
|---|---|---|
| 1 | Must fix: the logo sits in a white box in dark mode | A dark-mode logo file of the same size (light text, lighter icon, no background), `public/assets/images/login-logo-dark.png`. Both files are in the page and the theme shows one, so they swap 1:1 (`components/common/BrandLogo.tsx`). |
| 2 | Must fix: 상품 관리 does not follow the Figma description (노출여부, 판매금액, 등록일자) | 노출여부 is an inline 예 / 아니오 dropdown in each row, saved at once with the toast 저장 완료. Money is `₩1,500` and dates `2026/11/13 14:39` (YYYY/MM/DD HH:MM, server time Asia/Seoul) on the list, the details page, the form and the CSV (`utils/format.ts`). |
| 3 | Should fix: no product code under the thumbnail | The code is under each thumbnail. |
| 4 | Should fix: 대분류 등록 is hidden | Always shown at the right end of the toolbar, as in the frame; disabled while the API answers `isCreatable: false`, with the reason right under it ("대분류는 더 이상 추가할 수 없습니다."). |
| 5 | Should fix: Pretendard is not loaded; body text and row borders are not Figma greys | Pretendard 1.3.9 is loaded as a web font (jsDelivr CDN). Body text is Figma Gray 120 `#313131`; table lines and dividers are Background 100 `#EAEAEA`. |
| – | Minor: product names underlined | Plain bold text; the underline shows only on hover or keyboard focus. |
| – | Minor: a selected row has no highlight | A selected row has the pale pink background. |
| – | Minor: only 쇼핑몰 관리 in the sidebar | The full menu of the frames; menus outside HW3 are grey and open nothing. |
| – | Minor: at 375 the details tabs show a scrollbar and the stepper wraps | The three tabs share the width with no scrollbar; the stepper stays on one line (the current step shows its name, the others their number). |
| – | Q9 (brand pink contrast) | Kept as designed, as the review says. |

Kept on purpose: the four form steps (Q3, Q16) and the fields the API does not have (Q17).

QA review of 18 Nov (Archana, Vercel build b731072):

| # | QA item | Fix |
|---|---|---|
| A1 | Must fix: a category name has no length limit (51 characters were saved) | At most 50 characters in the add and rename dialogs, with "50자 이내" under the field; from the 51st character the message "중분류 이름은 50자 이내로 입력해 주세요." shows and nothing is sent (`utils/category-rules.ts`). |
| A2 | Must fix: English in step 3 of the form ("대분류(main)", "중분류(mid)", "소분류(minor)") | The lists are headed 대분류, 중분류, 소분류. |
| A3 | Must fix: a category with children can be deleted in one click | Refused: the dialog says "하위 카테고리가 있어 삭제할 수 없습니다. 하위 카테고리를 먼저 삭제해 주세요." and has only 확인. Delete the lower categories first. |
| A4 | Must fix: price and date format, time in the viewer's zone | Done in the design round: ₩1,500 and 2026/11/13 14:39 in Korea time for every viewer, CSV included. |
| B5 | No show / hide password button | Figma 1.1.0 has an eye at the right end of the field. It is now a real button: reached with Tab, read as "비밀번호 보기" with its pressed state, eye-slash while masked. |
| B6 | Screen-reader labels in English (PrimeReact defaults) | A Korean locale for every PrimeReact text (`config/primereact-locale.ts`). The rows-per-page box ignores it (PrimeReact 10.9 bug), so the paginator draws that box itself with the name "페이지당 행 수". |
| B7 | Sheet: old run dates, one Actual Result sentence on every row, no Platform / Role | Every row has its run date, the test that checks it (spec › title, as in the report) and the Platform and Role columns. Rows that said more than their test checked now have a test for it (reload after 노출여부, 100 characters typed, no search while typing, grey menu). |
| B8 | Only the local report attached | The report of the run on the Vercel link is attached too (submission page, section 5). |

## 5. Test accounts

The QA admin account sent by DM (role SUPER_ADMIN). No other role exists on the QA server, so limited roles
were checked by simulating the stored user in Playwright (`e2e/roles-and-errors.spec.ts`). No password is
written here.

## 6. Data to prepare

Nothing. Please create, edit and delete only your own records. My test records are named `HW3-Sachin-…`.
Two of my 중분류 stay on the server under 대분류 **학원 Shop**:

- `HW3-Sachin-Fixture-Sub` / `HW3-Sachin-Fixture-Child`: kept on purpose; my tests create products under it.
- `HW3-Sachin-Unremovable-Sub` / `HW3-Sachin-Unremovable-Child`: cannot be deleted (API issue 2 in part 8).

## 7. What to test

1. Login: empty fields, an ID that does not exist, a wrong password (alert with 확인), the eye button (Tab to it, Enter), correct login, 자동 로그인.
2. Open `/products?page=2` while signed out, log in, and check you land on page 2.
3. Product list: search (press Enter or click the magnifier), change the search type, category filter, sort by 상품명 / 판매금액 / 등록일자, page and page size. Refresh after each and check nothing is lost. Prices read ₩1,500 and dates 2026/11/13 14:39; the product code is under each thumbnail; 노출여부 is a 예 / 아니오 dropdown (change it only on your own records).
4. Select rows → 삭제 → the dialog lists the names → cancel. (Delete only your own records.)
5. 내보내기 with a search applied: the CSV has only the filtered rows.
6. 등록: go through the four steps; press 다음 with empty fields (비과세, 노출상태 and 판매상태 must be chosen); go back and check the values are kept; upload a wrong file type, a file over 4 MB, then a valid image; remove it; press 취소 and answer 아니오; save.
7. Open the product → tabs 기본 정보 / 카테고리 / 같은 카테고리 상품; refresh on a tab.
8. 수정: change only the name and press 저장 at the top (from step 1): the price stays as it was. The category is read-only. Then change 수량 and check that 판매가 becomes 수량 × 단가.
9. Categories: search, sort, open and close rows, add a 중분류 and a 소분류 under a 대분류, rename, delete with confirm. Type 51 characters in a name: the message shows and nothing is saved. 삭제 on a category that has categories under it: refused with "하위 카테고리를 먼저 삭제해 주세요.". 대분류 등록 is shown but disabled, with the reason (the QA API allows no new 대분류).
10. Dark mode switch on every screen; refresh keeps it; the logo turns light with no white box.
11. Sizes 1440 / 768 / 375: no sideways page scroll; the table scrolls inside its own box; below 991px the menu opens from the ☰ button.
12. Keyboard: Tab through login and the product form; arrow keys on the details tabs; focus is visible.

## 8. Known issues and what is not covered

**API issues.** These come from the QA API, not from the frontend; they are kept as they are (TL update of 18 Nov).
The screen still shows a Korean message and never crashes.

| # | What I saw | Request | Answer | What the screen does |
|---|---|---|---|---|
| 1 | Logout signs out every user of the shared account | `GET /api/v1/auth/logout` | 200; afterwards every token of the account answers 401 | If you are suddenly sent to login, someone pressed logout: log in again and you return to the same page. My tests never send the real call. (A3) |
| 2 | A category that has held a product cannot be deleted, even after the product is deleted | `DELETE /api/v1/product-category/subcategory/delete/{id}` | 500 `{"message":"Something went wrong"}` | "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." (A4) |
| 3 | The products list cannot be sorted on the server | `GET /api/v1/products?sort=…` | 200; the sort parameter is ignored | Sort orders the current page, with the hint "정렬은 현재 페이지 기준입니다." (A1) |
| 4 | The category list has no sort or paging parameter | `GET /api/v1/product-category/list` | the whole tree | Sorted and paged in the browser. (A2) |
| 5 | Error answers are English keys, also with `accept-language: ko` | e.g. `POST /api/v1/auth/login` with an unknown ID | 400 `{"message":"invalidCredentials"}` | Each key is shown as a Korean sentence; unknown keys get a Korean fallback. (A16) |
| 6 | A missing record answers 400, not 404 | `GET /api/v1/products/details/{id}` for a deleted id | 400 `{"message":"productNotFound"}` | The not-found state. (A5) |
| 7 | The refresh token cannot be used from another domain | `GET /api/v1/auth/get-access-token` | the cookie is set for the API's own domain | On 401 the app goes to login and returns to the same page. (A6) |
| 8 | Storage accepts browser uploads only from a fixed list of sites | `PUT` to the signed storage address from a Vercel page | 403 on the preflight | Uploads go through the app's own route `/api/upload`. (A7) |
| 9 | Image paths are stored as one comma-separated text | `POST /api/v1/products/add` with `images` | a file name with a comma becomes two broken paths | Commas are removed from the file name before the upload. (A17) |
| 10 | No new 대분류 can be added on the QA server | `GET /api/v1/product-category/list` | `isCreatable: false` | The 대분류 등록 button is shown disabled, with the reason. (A12) |

**Frontend notes**

1. **Built before I could open the Figma file.** Colours and sizes were first read from the live QA admin (design
   question Q1). On 17 Nov I exported the Figma frames; on 18 Nov I fixed the differences and then the items of the
   design review (part 4). The side-by-side screenshots are on my submission page.
2. **White text on the brand pink is 3.98:1**, below the 4.5:1 of WCAG AA. Kept as designed, as the design review
   says (Q9).
3. The description is plain text, not rich text. Category reordering by drag is not built (A14).
4. Not run yet: real Safari and a real phone. Safari's engine (WebKit) and the phone width (375) were run in Playwright.

## 9. Results (18 Nov 2026, after the design-review and QA fixes, production build on my machine, QA API)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | Pass: 0 errors, 0 warnings |
| Type-check | `npx tsc --noEmit` | Pass: 0 errors |
| Unit tests | `npm run test:unit` | 24 passed, 0 failed |
| Build | `npm run build` | Pass: 7 pages, 1 route handler, middleware |
| Playwright read-only, Chromium | `npm run test:e2e` | 62 passed, 0 failed (login setup + 61 tests), none needed a retry |
| Playwright read-only, WebKit | `npm run test:e2e:webkit` | 62 passed, 0 failed |
| Playwright create / edit / delete | `npm run test:e2e:mutation` | 7 passed, 0 failed (login setup + 6 tests; the 노출여부 dropdown is changed on an `HW3-Sachin-…` product and checked again after a reload) |
| The same read-only tests on the dev server (17 Nov) | `npm run test:e2e` without `PLAYWRIGHT_BASE_URL` | 42 passed, 0 failed |
| Write tests and screenshots without their scripts | `npx playwright test --project=mutation --project=screenshots` | all 16 skipped: nothing written |
| Console | inside the tests, on every screen | 0 errors, 0 warnings |
| Sideways scroll | inside the tests, 11 screens × 11 widths (1920 → 375) | none |

The same read-only and create / edit / delete tests are run on the Vercel link after each redeploy
(`PLAYWRIGHT_BASE_URL=https://talkingclub-hw3-sachin.vercel.app`); those results are in section 5 of my
submission page. The first run on the Vercel link (17 Nov) had one failure: the backslash-redirect test expected a `localhost` address,
while the app correctly stayed on its own Vercel address. The test now checks the app's own address and passes
on both.

The HTML report of the Chromium read-only run is `docs/playwright-report.zip`. Written test cases:
`docs/test-cases.csv`.

```
> npm run lint
> eslint
(no output: 0 problems)

> npx tsc --noEmit
(no output: 0 errors)

> npm run test:unit
 ✓ src/utils/rules.test.ts (24 tests)
 Test Files  1 passed (1)
      Tests  24 passed (24)

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
  62 passed

> npm run test:e2e:webkit
  62 passed

> npm run test:e2e:mutation
  7 passed
```

## 10. Sizes and browsers checked

- Chromium (the engine of Chrome and Edge) and WebKit (the engine of Safari), desktop, in Playwright.
- No sideways page scroll at 1920, 1600, 1440, 1366, 1280, 1024, 991, 768, 640, 480 and 375 on every screen (automated).
- Screenshots of every screen at **1920, 1440, 1366, 768 and 375**, light and dark: `docs/screenshots/day` and `docs/screenshots/night` (110 files).
- Not checked yet: real Safari and a real mobile browser (WM Frontend Standard 5.9).
