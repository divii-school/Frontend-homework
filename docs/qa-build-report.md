# QA build report — Talking Club Admin · Shopping Mall (HW3)

Format: WM | Report (the 10 parts of training Step 8 Part C). Written as the hand-over to QA; post it as a comment on the TL task.

How to read the labels: the whole UI is Korean. A label, button or message is written as the Korean text followed by the English meaning in brackets, for example `등록 (Register)`. The full word list is `docs/ko-glossary.md`.

## 1. Build

| | |
|---|---|
| Repo / branch | https://github.com/divii-school/Frontend-homework · `hw3/neeraj` (PR to `main`, never merged) |
| Commits | `b2e2974` first build · `85e0572` earlier review fixes · `8c968d7` docs · `8b2f596` code-review fixes · `356dc8d` Korean UI · one more docs commit follows (branch head). The branch head of `hw3/neeraj` is the build under test (PR https://github.com/divii-school/Frontend-homework/pull/2) |
| Demo (Vercel) | https://tc-admin-hw3-neeraj.vercel.app (runs `356dc8d`, `NEXT_PUBLIC_MAX_IMAGE_MB=4`) |
| API | QA server, talking-club-backend `release/qa` (`NEXT_PUBLIC_API_BASE_URL` → `…/api/v1`) |
| Date | 2026-11-17 (lint, type-check, build and one full Playwright run of all 104 tests, 17:32 to 17:36, see part 9; live parts against the QA API; a check of the Vercel link at 17:45 to 17:47) |

## 2. TL tasks covered

- HW3 — Advanced Frontend Homework (TL task): https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d
- Submission page: https://app.notion.com/p/416326b2d5fb814c8b75c984a7f3317e

## 3. What changed, in plain words

Two Talking Club admin screens from the Shopping Mall menu (`쇼핑몰 관리`) were rebuilt as a new Next.js app on the real QA API, plus the login in front of them. The whole UI text is Korean and follows the Korean Figma frames:

- **Login (1.1.0)** — sign in with ID (`아이디`) and password (`비밀번호`), `자동 로그인 (Auto login)`, the right message for an unknown ID or a wrong password, and a `관리자 권한이 없습니다. (You do not have admin permission.)` popup for accounts that are not HQ admins. Pages are protected: opening a page while signed out goes to login and comes back to the same page afterwards. When the session expires the user is sent to login the same way.
- **Who sees what** — Super / Master admin see both pages; a General admin sees `상품 관리 (Product Management)` only if their permission includes it; every other role gets a `권한 없음 (No permission)` page. The menu only shows what the user may open.
- **`상품 카테고리 관리 (Product Category Management)` (8.2.0)** — the 3-level category tree (`대분류 (Main)` → `중분류 (Sub)` → `소분류 (Minor)`): search, expand / collapse, add, rename and delete in small dialogs, and change the order by dragging a row (or Alt + arrow keys). A category with children cannot be deleted.
- **`상품 관리 (Product list)` (8.1.0)** — search by product or category name, category and product type filters, paging, rows per page, sorting, row selection with bulk delete, inline exposure status, and CSV export of the filtered result. Filters live in the address bar, so a reload or a shared link shows the same list.
- **`상품 상세 (Product details)` (new)** — opens from a product name: `상품 정보 (Overview)` (images, prices, status, ERP), `옵션 (Options)` and `동일 카테고리 상품 (Same category)` tabs.
- **`상품 등록 / 상품 수정 (Product register / edit)` (8.1.1 – 8.1.3)** — the long form split into 4 steps (`기본 정보 (Basic info)` → `이미지 및 상태 (Images & status)` → `카테고리 및 옵션 (Category & options)` → `ERP 정보 및 확인 (ERP & review)`). Each step checks its fields before `다음 (Next)`, going back keeps the values, a draft survives a reload, and a server error never loses what was typed. Images (JPG / PNG / GIF / WEBP, 1–4 images, up to 10 MB on a local build and 4 MB on the Vercel link) are sent to the app's own route `/api/upload`, and the server puts them on S3.
- Every screen has loading, empty and error states, works at 1440 / 768 / 375 px, and has light and dark mode. Dates show as `YYYY/MM/DD HH:mm`, money as `₩1,000`. A failed request that a screen does not show itself gets a default error toast.

## 4. Fixed issues

None reported by QA — this is the first build handed to QA. Fixed before the hand-over:

**After the code review of 17 Nov (reviewer Kakali, result "Resubmit": the code was praised, 2 must-fix and 4 should-fix items; all six are done):**

1. **UI language (must-fix).** The whole UI text is Korean and follows the Korean Figma frames (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리 (Shopping Mall Management)": 8.1.0 `8010:59065`, 8.1.1 `8010:57833`, 8.1.2 `5498:84860`, 8.1.3 `8034:61058`, 8.2.0 `5498:84158`; login `4019:78451`). `docs/ko-glossary.md` lists all 562 strings (English before, Korean now, source). PrimeReact's built-in texts use a Korean locale (`src/providers/primereact-locale.ts`), `<html lang="ko">`, and an unknown API message key falls back to the Korean server-error text. The `accept-language` request header is still `en` on purpose: the API answers with message keys, and the app maps the keys to Korean text.
2. **Image upload (must-fix).** The browser no longer sends the file to S3. `UploadService` posts the file and the signed URL to the app's own route `POST /api/upload` (`src/app/api/upload/route.ts`), and the server sends it to S3, so the bucket CORS no longer matters. The route checks: logged-in session (401 JSON), only https S3 hosts (400), file type (415), size (413), S3 refusal (502). It is left out of the middleware matcher because Next 15.5 passes only the first 10 MB of a body through middleware; the route checks the session itself. Size limit: `NEXT_PUBLIC_MAX_IMAGE_MB` (default 10; set to 4 on Vercel, because Vercel functions refuse request bodies above 4.5 MB).
3. **A 5th image (should-fix)** can no longer be added or saved (a guard on every add / Undo / Retry path plus a form rule).
4. **Commas in image file names (should-fix)** are removed before the upload (`src/utils/image-file.ts`, `safeFileName`).
5. **Edit draft (should-fix).** An edit draft is restored only if the product was not changed on the server since the draft was saved (the check compares `updatedAt` plus the option rows). Otherwise the draft is dropped with a notice, and the edit screen always loads a fresh copy. Create drafts are unchanged.
6. **Default error toast (should-fix).** `QueryCache` and `MutationCache` in `src/utils/query-client.ts` show a default error toast. Hooks whose screen shows its own error opt out with `meta: SHOWS_OWN_ERROR`. A 401 and a cancelled request never toast.

**On 2026-11-17 after two internal reviews (earlier):**

1. A second browser tab without a saved session no longer logs the first tab out (it used to delete the shared login cookie).
2. The list pager fits on one line at 375 px (5 page links on phones).
3. A percent-encoded URL such as `/shopping-mall/%63ategories` no longer gets past the route guards: a GENERAL_ADMIN gets 403 there too (new test in `roles.spec.ts`).
4. Log out removes the unsaved product form drafts of the tab, so the next account never sees them (new test in `product-form-states.spec.ts`).
5. Register asks the API for a fresh product code right before it sends the product, so a code that someone else took in the meantime no longer makes every Register fail; a restored draft also gets the fresh code (new test in `product-form-states.spec.ts`).
6. CSV export puts `'` before any text that starts with `-` (as before with `=`, `+`, `@`), so Excel shows it as text and never runs it as a formula.
7. Editing a main product that has `상품 구매 필수 옵션 선택 (Required option for purchase)` on but no option rows can be saved as it is.
8. `등록 (Register)` / `저장 (Save)` stays disabled after a successful save until the next page opens (no second request).
9. Tests and tools: the HTML report no longer holds the typed QA login; the screenshot script waits until the login page is hydrated.

## 5. Test accounts / roles

| Role | Account | Where |
|---|---|---|
| SUPER_ADMIN | Shared QA admin account — **sent by DM, never written here** | QA server (`release/qa`) |
| MASTER_ADMIN, GENERAL_ADMIN, TEACHER, other roles | No account on QA | Verified with injected sessions (unsigned JWT + user in the browser, mocked API) in `e2e/roles.spec.ts` |

The only real account on QA is SUPER_ADMIN. The role rules (menu, URL guard, 403 page, no-admin popup) for the other roles can only be checked by the injected-session tests until QA gets accounts for them.

## 6. Data QA must prepare first

Nothing. Notes:

- The QA database is shared by 5 developers. Create records **only** with the prefix `HW3-Neeraj-` (e.g. `HW3-Neeraj-qa-product-1`) and edit / delete only those.
- The API allows at most **3 main (top-level) categories**, and QA already has 3, so `대분류 등록 (Register main category)` is disabled on QA with the reason shown under it. Add / rename / delete can be tested on **subcategories and minor categories** under an existing main category.
- For a product, at least one main → sub → minor category path must exist (QA has them).
- Keep a small test image (a few KB) ready. On the Vercel link an image may be at most 4 MB.

## 7. What to test (numbered)

Full list with IDs: `docs/test-cases.md` / `docs/test-cases.csv` (123 cases: 63 positive, 60 negative).

1. Open any page signed out → login with `?returnTo=`. Wrong ID / wrong password → the matching alert and field message (`등록된 아이디가 아닙니다 (This ID is not registered.)`, `비밀번호가 일치하지 않습니다 (The password does not match.)`). Correct login → back on the page you asked for.
2. `로그아웃 (Log out)` → plain login page; protected URLs ask to log in again. `자동 로그인 (Auto login)` off → a new tab asks to log in.
3. Sidebar: only `상품 관리 (Product Management)` and `상품 카테고리 관리 (Product Category Management)` are links; the other menus are greyed. Open `/shopping-mall/does-not-exist` → `페이지를 찾을 수 없습니다 (Page not found)`.
4. Categories: search ("Phonics"), `모두 펼치기 (Expand all)` / `모두 접기 (Collapse all)`, the chevron of one row. A search with no match → `검색 결과가 없습니다 (No search results found)` → `검색 초기화 (Clear search)`.
5. Categories: under an existing main category add a subcategory `HW3-Neeraj-…` (`+ 중분류 (+ Subcategory)`), add 2 minor categories under it (`+ 소분류 (+ Minor category)`), rename one, drag one above the other (and Alt + ↓ with the keyboard), reload → order kept. Delete the minors, then the subcategory.
6. Categories: empty name, spaces only, 51 characters, a name that already exists at that level → message in the dialog, nothing saved. `삭제 (Delete)` on a category that has children → `삭제 불가 (Cannot delete)`.
7. Product list: search by `상품명 (Product name)` and by `카테고리 (Category)`, `대분류 (Major)` → `중분류 (Medium)` → `소분류 (Minor)` filters, `상품 유형 (Product type)` (`메인 상품 (Main)` / `단권 상품 (Supplementary)`), page 2, `페이지당 행 수 (Rows per page)` 20, sort by name; reload → everything kept. Filter changes replace the URL (no extra history entries); `목록으로 (Back to list)` on the details page returns to the same filters.
8. Product list: tick rows (also across pages), `CSV 다운로드 (Export CSV)` (opens in Excel with Korean readable; a name that starts with `-`, `=`, `+` or `@` shows as plain text), change `노출여부 (Exposure Status)` of an `HW3-Neeraj-` product → toast `저장 완료 (Exposure status saved)`.
9. `상품 등록 (Register)`: `다음 (Next)` on an empty step 1 → 4 messages; `판매가 (Selling price)` ≥ `단가 (Unit price)` → `판매가는 단가보다 낮아야 합니다. (The selling price must be lower than the unit price.)`; add a `.txt` file and an image above the size limit (10 MB; 4 MB on the Vercel link) → refused before any request; add a real small PNG with `파일추가 (Add file)`; pick the category path; fill ERP; `등록 (Register)` → list with toast `상품이 성공적으로 등록되었습니다. (Product registered)`. In DevTools → Network the browser sends the file to `/api/upload` of the app, never to amazonaws.com.
10. Images: add 4 images, try a 5th → refused with a message; add a file named `photo,1.png` → the stored name has no comma; make one upload fail (offline) → `다시 시도 (Retry)` works.
11. Edit that product (`수정 (Edit)`): product code and category are read-only; change name and selling price → `저장 (Save)` → details page with toast `상품 정보가 성공적으로 수정되었습니다. (Product saved)`.
12. Draft: fill half of step 1, reload → `임시 저장된 내용을 불러왔습니다. (Draft restored)`; `임시 저장 삭제 (Discard)` empties it. `취소 (Cancel)` → `입력한 정보가 모두 삭제됩니다. 취소하시겠습니까? (All entered information will be deleted. Do you want to cancel?)` (`아니오 (No)` / `예 (Yes)`). Edit draft: change a name in the edit screen, then change the same product in another tab and save it, come back and reload → the draft is not restored and the notice `임시 저장된 내용을 불러오지 않았습니다. … (Your saved draft was not restored …)` is shown.
13. Details: tabs `상품 정보 (Overview)` / `옵션 (Options)` / `동일 카테고리 상품 (Same category)`, `?tab=` in the URL, arrow keys move between tabs; `목록으로 (Back to list)` returns to the same filters. `/details/999999999` → `상품을 찾을 수 없습니다 (Product not found)`.
14. Bulk delete your `HW3-Neeraj-` product from the list (`취소 (Cancel)` first, then `삭제 (Delete)`).
15. Errors: DevTools → Offline on the list, the category page and on Register → `연결 오류 (Connection problem)` / connection message, values kept; back online → `다시 시도 (Try again)`. An error that a screen does not show itself must give exactly one toast, never a silent failure.
16. Language: every visible text, including the paginator, dropdown messages and dialog buttons, is Korean; the browser tab title is `… | TalkingClub Admin`.
17. Resize 1440 → 1024 → 768 → 375: the sidebar becomes a drawer at ≤ 991 px; the product table scrolls inside its own box between 769 and 1024 px and becomes cards at ≤ 768 px; forms become one column at ≤ 768 px; no sideways page scroll at any width.
18. Toggle dark mode (moon icon) on each screen; reload keeps the choice.

## 8. Known issues and what is not covered

**Fixed in the code review round of 17 Nov (no longer known issues):** the S3 CORS block of the browser upload (the upload now goes through `/api/upload`), a comma in an image file name, a 5th image, and an edit draft that could overwrite newer server data.

- **Image size on the Vercel link: 4 MB at most.** A Vercel function refuses request bodies above 4.5 MB, and every image goes through the app's route `/api/upload`. So `NEXT_PUBLIC_MAX_IMAGE_MB` is 4 on the Vercel link; the check and the hint text use the same value. On a local build the limit is 10 MB.
- **One live session per account (observed 2026-11-16).** After a login or a logout by the same user, the previously issued token answers 401 on the next authenticated request, although its `exp` is still 24 h ahead. The guest login / logout tests share the admin account with `setup`, so run order matters. `setup` depends on `guest` in `playwright.config.ts`, so the order guest, setup, chromium is automatic (see part 9).
- **No sort parameter in the API** — `GET /products` always returns newest first (`id DESC`). Sort on the list header sorts the current page only; the screen says so (`현재 페이지 안에서만 정렬됩니다 (Sorted within this page)`). Backend question raised (design question 6).
- **Category list has no paging or sort parameter** — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (design question 7).
- **No refresh token** — the QA API answers CORS `origin: *` without credentials, so its httpOnly refresh-token cookie can't be used from this site. When the 1-day token expires the user logs in again (and returns to the same page).
- **Top-level category limit of 3** — the API refuses a 4th main category; QA already has 3, so main-category create can't be tested on QA (design question 8).
- **Removing all options on edit is not saved** — when every single-item option is removed and saved, the API keeps the old options (backend behaviour). The form shows a note about it (test case PF-026).
- **Drag reorder on touch screens** — native drag-and-drop does not work reliably on phones / tablets; the keyboard alternative (Alt + ↑ / ↓) needs a keyboard (design question 19).
- **Search by category name also returns deleted products (API side).** Request: `GET /products?type=categoryName&search=<name>` (search type `카테고리 (Category)` on the list). Observed: products that were deleted (soft delete, `isDeleted` true) also come back when their medium or minor category name matches. In the release/qa backend code the three `name LIKE :search` conditions are joined with OR and added after `product.isDeleted = false` without brackets, so the AND is applied first. The list shows such rows like any other row and counts them in the total; opening one shows `상품을 찾을 수 없습니다 (Product not found)`, and deleting it fails. The screen does not hide them. Found by reading the backend code, not reproduced on QA. Request to the backend team: put the OR conditions in brackets (`new Brackets(...)`).
- **Row selection is kept when the search or the filters change (by design).** The selection is a set of product ids that stays across pages, searches and filter changes (up to 100), so products from different pages can be deleted together. The selection bar always shows how many rows are selected (`건 선택됨 (N selected)`) with a `선택 해제 (Clear)` action. Bulk delete deletes every selected product, also the ones that are no longer on screen. Press `선택 해제 (Clear)` before a new search when only the visible rows should be deleted.
- **Browser Back button and the form (known limitation).** The browser Back button leaves the form (on step 1) without the unsaved-changes dialog: the leave guard covers `취소 (Cancel)`, links and reload / close only. The draft then stays in the tab and comes back the next time that form is opened (an outdated edit draft is dropped with a notice); Log out removes it.
- **Visual polish that is still open (three small items, seen on the 768 / 375 screenshots).** The rows-per-page select is not the same height as the buttons next to it; the disabled `삭제 (Delete)` button keeps its red border; the `필터 초기화 (Reset filters)` button is indented a little at 768 / 375 px. (On the screenshots retaken on 17 Nov the cut step label at 768 px, the breadcrumb line starting with "/" at 375 px and the wrapped registration time no longer appear.)
- **Wording decisions where the Korean frames disagree** (design questions 20 to 24, `docs/design-questions.md`): the edit frame says `할인가격` / `카테고리`, the app uses `판매가` / `등록 카테고리` on both screens; the tax label `비과세` follows the frame; money is shown as `₩4,000`; the product type filter is not in any frame; the first breadcrumb item of the frames (`공지사항 관리`) is a left-over and the app uses `쇼핑몰 관리`.
- No design for the details page, dark mode or tablet / phone layouts — built from the same tokens; all listed in `docs/design-questions.md` (24 questions).
- Not covered: concurrent edits by two admins, real MASTER_ADMIN / GENERAL_ADMIN / non-admin accounts (none on QA), Firefox and Safari. Only a SUPER_ADMIN account exists on QA.

## 9. Results of lint, type-check, build and tests

```
Final gates, 2026-11-17 (PowerShell). Gates first with no server running; then the production build served
with `npx next start -p 3100` and ALL Playwright tests in one command.
npm run type-check    → exit 0 · tsc --noEmit, 0 errors
npm run lint          → exit 0 · 0 errors, 0 warnings
npm run build         → exit 0 · compiled successfully, 11 pages (including the new route /api/upload) + middleware

E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test --output=test-results/pw-artifacts --trace=off
  → 104 passed (3.7 min) · 0 failed · 0 flaky · 0 skipped · 17:32 to 17:36 (first attempt)
  guest      14 passed  (auth.spec.ts 9 incl. 4 live "Login with the QA API" tests · roles.spec.ts 5)
  mocked     66 passed  (categories-states 18 · default-error-toast-states 5 · product-form-states 20
                         · products-states 15 · session-expiry-states 1 · upload-route-states 7; mocked API)
  setup       1 passed  (live UI login, writes e2e/.auth)
  chromium   23 passed  (live) categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
                        · product-form.spec 4 (no save) · categories.mutation.spec 1 (add sub + 2 minor, rename,
                        reorder, delete) · products.mutation.spec 3 (register with a real image through /api/upload,
                        edit, bulk delete)
  clean-up check after the run: 0 products and 0 categories named HW3-Neeraj-* left

Check on the deployed link, 17:45 to 17:47:
PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app E2E_ALLOW_MUTATIONS=1
npx playwright test products.mutation --project=chromium
  → 18 passed (guest 14, setup 1, products.mutation 3) · leftovers 0
```

The mutation specs (`E2E_ALLOW_MUTATIONS=1`) create, edit and delete only `HW3-Neeraj-` records. The image upload goes through the app's own route `/api/upload`, so no special port is needed. The option `E2E_MAP_3000_TO` (opt-in, `playwright.config.ts`) was **not** used in this run and is no longer needed for the upload. The new spec `upload-route-states.spec.ts` checks the route refusals (401 JSON, 400, 415, 413, 502 handling); `default-error-toast-states.spec.ts` checks the default error toast.

Run order with the one-session-per-account behaviour: `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, setup and then the chromium specs safely (`--project=setup` alone also runs guest first). Use `--output=test-results/pw-artifacts` when the logs are written inside `test-results/` (Playwright empties its output folder at start and the open log files made the runner hang on Windows).

What was verified how: login, categories (read-only and the create / rename / reorder / delete flow), product list (search, filters, URL state, selection, CSV export), details, the form steps, and product register (real image upload to S3 through `/api/upload`) / edit / delete — live against the QA API, also on the Vercel link. Roles other than SUPER_ADMIN, the upload route refusals, the default error toast, and error / empty / loading states — only with a mocked API or injected session.

The category, product and product-form specs also fail on any browser console error or warning (`auth.spec.ts` / `roles.spec.ts` don't watch the console). HTML report: the zipped `playwright-report/` of the full run is attached to the submission page (104 tests); it was checked for login data (QA login ID, password and saved session token: 0 each). The tests fill the login fields with a helper that does not write the value into the report. To open a local report: `npm run test:e2e:report`.

## 10. Screen sizes and browsers checked

- **Browser:** Chromium (Playwright 1.64.1, Desktop Chrome profile). Firefox / Safari not checked.
- **Widths checked by tests** (no sideways page scroll, layout assertions):
  - `categories-states.spec.ts` › "375px: no horizontal page scroll and ≥ 40px action buttons" and "768px: …"
  - `products-states.spec.ts` › "rows become cards and the page never scrolls sideways" (375 px, list + details)
  - `product-form-states.spec.ts` › "375 px: compact stepper, one column, no horizontal page scroll"
- **Screenshots, 1440 / 768 / 375, light and dark** (`node scripts/screenshots/compare.mjs` against the production build on port 3100, mocked API, Chromium; retaken 2026-11-17 at 17:40): login, product list, product form step 1, product details, categories → `docs/screenshots/` (25 PNGs, list in `docs/screenshots/README.md`). At 1440 each screen is shown next to its **Korean** Figma frame (design | build light | build dark). Category and product names in the screenshots are sample data and stay English.
