# QA build report — HW3 Talking Club Admin · Shopping Management (Sandip)

Format: WM | Report with the 10 parts from training Step 8, Part C (same layout as HW2).
A hand-over to QA (Archana): everything needed to test is on this page or linked from it.

## 1. Build

| | |
| --- | --- |
| Repository | https://github.com/divii-school/Frontend-homework |
| Branch | `hw3/sandip` (PR to `main`, never merged) |
| Commit (deployed app) | `424f8a6`: design review fixes (Bhagyashree 11-20: follow the Korean Figma frames). Before: Korean UI `3002f93`, more API keys `8498009`, Korean upload-route messages `8572d0c`. Later commits only add docs and the published HTML report. |
| Date | 2026-11-20 (first build `beb0bad` 2026-11-17; Korean error messages `29e011f`; Korean UI `3002f93`) |
| Demo | https://hw3-sandip.vercel.app — own Vercel account, only `NEXT_PUBLIC_API_BASE_URL` set (QA API), no deployment protection |
| API | Talking Club **QA** API (`tkclub-admn-api-qa.dvconsulting.org`). Never production. |
| HTML report | https://hw3-sandip.vercel.app/playwright-report/index.html (run against the demo, see part 9) |

## 2. TL tasks covered

- TL | HW3 — Advanced Frontend Homework (Real Project: Talking Club Shopping Management): https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d — Section 4 A–E.
- Submission page: https://app.notion.com/p/416326b2d5fb817c8d6bde4e60f5b656

## 3. What changed, in plain words

1. **Login** (Figma 1.1.0): real QA login; the button works only when ID and password are filled; wrong login shows the API's message; show / hide password; "Auto login" keeps the session after the browser closes.
2. **Session and roles:** pages need a login (`/login?next=` brings you back). One config (`src/config/navigation.ts`) drives the menu, the route guard and the roles; a page your role can't open shows a 403 page; a non-admin account gets the "no permission" popup. When the token expires (24 h, or after logout elsewhere) you log in again and return to the same page.
3. **Product Category Management** (8.2.0): the 3-level tree from the API with server search (kept in the URL), Expand / Fold all, add main / sub / child categories, rename, delete (blocked while a category still has subcategories).
4. **Product list** (8.1.0): 10 per page from the server; page, search text and search field live in the URL (reload, Back, shared links); select rows across pages (max 100) and delete them; change Exposure Yes / No inline; export the whole filtered result as CSV.
5. **Register / edit product** (8.1.1 / 8.1.2) as a 4-step form: each step is checked before moving on, Back / Next keep every value, images (JPG / PNG / WebP ≤ 3 MB, up to 4) are checked, previewed and removable, a failed save keeps everything.
6. **Product details** (no Figma frame): tabs Overview / Sessions / Same category; the active tab and its page are in the URL; each tab loads its own data with its own loading / empty / error state.
7. **Quality:** light / dark through design tokens (no hardcoded colours in components), WM class names (lowercase-with-hyphens) and date format, keyboard and screen-reader support (labels, focus, dialogs, tabs), every error type handled (401 / 403 / 404 / 500 / network).

## 4. Fixed issues

| Issue | Fix |
| --- | --- |
| QA API's refresh token can't be used from the browser (httpOnly cookie on another domain, CORS without credentials) | No refresh; 401 → login → back to the same page with a "session ended" notice |
| Image upload blocked by the S3 bucket's CORS (only `localhost:3000` allowed) | `/api/upload` route PUTs the file to the signed URL server-side; only image files, ≤ 3 MB, only to the product bucket's `products/` folder |
| Editing a product sent image URLs back, so the server stored a doubled URL | Edit converts URLs to storage keys; checked on QA by the mutation test |
| Category-name search returned deleted products (one had a broken image → console error) | Rows with `isDeleted: true` are hidden |
| ERP code typed in the form was ignored by the server | ERP code shown read-only (server-assigned) |
| Arrow keys pressed quickly on the tabs could skip a tab | Next tab worked out from the focused tab, not the URL |
| "Total Posts: 0" while loading | Shows "–" until the data is there |
| WM: camelCase CSS classes (flagged in the HW1 review) | 71 classes renamed to lowercase-with-hyphens |
| WM: date format | `YYYY-MM-DD h:mm AM` in KST (design question D3) |
| Kakali 11-18: API errors showed English text or the raw key (e.g. `productCodeAlreadyExists`) | Every error is a Korean message by API code or HTTP status; raw keys never shown (tests assert it) |
| Kakali 11-20: the screens still showed English (login, menu, breadcrumb, form labels, page titles, "Saving…", `lang="en"`) | Whole UI in Korean: login (아이디, 비밀번호, 자동 로그인, 권한 없음), menu / breadcrumb (쇼핑몰 관리 › 상품 관리), all form labels and validation messages, buttons and busy text (저장 중…, 삭제 중…, 내보내는 중…), tables, tabs, dialogs, toasts, aria-labels, CSV headers, page titles (상품 관리 · 토킹클럽 관리자), dialog close button (닫기); `<html lang="ko">`. Tests now find every control by its Korean name |
| Kakali 11-20 (should fix): only 5 API keys had their own Korean text | Added 6 more: category name already used (대분류 / 중분류 / 소분류), category limit reached, unit price must be less than selling price, file required. Others still fall back to a Korean message by HTTP status |
| Kakali 11-20 (should fix): empty `sandip.txt` in the repo | Deleted |
| Design 11-20 (must fix): screens followed the English Figma frames | Labels, values and formats from the Korean frames: 판매금액, 카테고리(과정), 노출여부 (예 / 아니오), 등록일자, dates `YYYY/MM/DD HH:MM` (24 h, KST), "총 게시물 : N" (8.1.0); 모두 펼치기 / 모두 접기, 대분류 등록, + 중분류 / + 소분류, (N개 중분류) (8.2.0); 상품코드, 상세설명, 노출상태, 판매상태, 상품ERP명, 갯수, 비과세, 파일추가 (8.1.1 / 8.1.2); login shows the logo only. Side-by-side images redone with the Korean frames (`docs/figma/ko-*.png`) |
| Design 11-20 (should fix) | `word-break: keep-all` (WM 5.4); 저장 in the 상품 수정 header (checks every step); prices with thousands commas while typing; 대분류 등록 disabled with the reason (API `maximumCategoryLimitReached`); light / dark switch in the header (remembered); 취소 red outline + red text; button width from padding |
| Design 11-20 (minor) | Full Figma menu with the items outside HW3 greyed out; selected rows tinted; empty-state icon; stray divider removed; menu icon grey |
| A page of only deleted rows (API A2) said "No search results found" | Says the page has only deleted products and keeps the pagination |
| HTML report could contain the QA login (Playwright records typed values) | Real-API tests log in through an API request; the published report was scanned: no ID, password or token |

## 5. Test accounts / roles

| Account | Role | Can |
| --- | --- | --- |
| QA admin login from the DM (not written here) | SUPER_ADMIN | everything: products, categories |
| GENERAL_ADMIN (role from the Figma notes; no account given) | GENERAL_ADMIN | products only; categories → 403 (tested with a mocked session) |
| (logged out) | — | only `/login`; any other page → `/login?next=…` |

## 6. Data QA must prepare first

1. Nothing to seed: the app reads the shared Talking Club QA data.
2. **Shared data rule:** 5 people use the QA server. Create / edit / delete only your own records named `HW3-<name>-…`, and delete them after testing. Please don't edit other products or categories.
3. Useful existing records (read-only): product **12139** (ACE Alphabet: has a category and a description), product **10598** (linked to a class session), product **20000** (no session → empty Sessions tab).
4. To run locally instead: `npm install` → `cp .env.example .env.local` → `npm run dev` → http://localhost:3003.

## 7. What to test, numbered

Full cases (72, each P or N, with the automated test that covers it): [`docs/TEST-CASES.md`](TEST-CASES.md) · Google Sheet import: `docs/TEST-CASES.csv`.

1. `/login`: empty / wrong / correct login; Auto login on and off; Log out.
2. Open `/shopping/products?page=3` logged out → login → you land on page 3.
3. Product list: page 2, search by Product Name and by Category Name, reload, Back; select rows on two pages; Export CSV.
4. Register `HW3-<name>-Test`: try Next on empty steps, wrong file types / a big image, Back and Next, then Register.
5. Open it (name link) → tabs Overview / Sessions / Same category, reload on a tab, arrow keys on the tabs → Edit → change price → Save.
6. Change its Exposure Yes / No in the list, reload. Then select it → Delete.
7. Categories: search, Fold / Expand all, add `HW3-<name>-Cat` → add a sub and a child under it → rename → try deleting the parent (blocked) → delete the child, sub, then the parent.
8. Widths 1440 / 768 / 375 and dark mode on every screen; keyboard only (Tab, Enter, Escape, arrows).
9. Stop the network (DevTools offline) on a list → error + 다시 시도.

## 8. Known issues and what is not covered

- **Server-side sort** (HW3 4-C): the products API has no sort parameters (API A1); no sort controls.
- **Category list paging / sort** (HW3 4-B): the category API returns the whole tree, no paging / sort; built as the Figma tree (D12). **Drag reorder** not built.
- **Option products** (8.1.1 #11–15, 8.1.3) not built (D9).
- **Token refresh** not possible from the browser (A4) → re-login with return to the same page.
- Only desktop Figma frames exist; 768 / 375 and dark mode are our interpretation (D1, D2).
- **px values** in component SCSS are not yet all tokens (colours are); spacing tokens exist for the shared parts only.
- "총 게시물 : N" can be slightly high on category-name searches (API A2).
- 대분류 등록 is disabled because the QA API refuses new main categories (`maximumCategoryLimitReached`); switch `MAIN_CATEGORY_LIMIT_REACHED` in `src/config/categories.ts` when that changes.
- The product form stays a 4-step form (HW3 requirement); the Korean 8.1.1 frame is one long page.
- The browser logs "Failed to load resource: 400" when the API rejects a wrong login — a network log, not an app error.
- A 1×1 test image (`HW3-Sandip-probe.png`) was uploaded to the QA bucket during the upload check; it is not linked to any product.
- Browsers: Chromium (Playwright) and Chrome on Windows 11; Safari / Firefox not checked.

### 8a. API issues (QA API, as Kakali asked on 2026-11-18: not fixed in the frontend, listed here)

These are **API issues, not frontend bugs**. The API is left as it is. Every error on screen is a Korean message
(`src/lib/errors.ts`) — never the API's raw key or English text.

| # | What I saw | Request | Answer | What the screen does |
| --- | --- | --- | --- | --- |
| A1 | No server-side sort for products | `GET /api/v1/products?page=1&limit=3&sortBy=price&order=ASC` (also `sort`, `orderBy`, `sortField`) | 200, same order as without sort | No sort controls (8.1.0 has none either) |
| A2 | Category-name search returns deleted products. On 2026-11-20 the whole first page of "ACE" was deleted test products of other developers | `GET /api/v1/products?page=1&limit=10&type=categoryName&search=ACE` | 200, `totalRecords: 335`, all 10 rows `isDeleted: true` | Deleted rows hidden; a page with only deleted rows says "이 페이지에는 삭제된 상품만 있어…" and keeps the pagination; "Total Posts" is the API's number (can be high) |
| A3 | Details return image URLs, add / edit expect keys | `GET /api/v1/products/details/{id}` | `images: ["https://talking-club-dev.s3…/products/…"]`; sending these back makes the server store a doubled URL | Edit converts URLs to keys (`products/…`) |
| A4 | Refresh token can't be used from the browser | `POST /api/v1/auth/login` | `Set-Cookie: refreshToken=…; Domain=.dvconsulting.org; HttpOnly; SameSite=None`; CORS `Access-Control-Allow-Origin: *`, no credentials | On 401: "로그인이 만료되었습니다. 다시 로그인해 주세요." and back to the same page after login |
| A5 | Image bucket CORS only allows `http://localhost:3000` | `OPTIONS` on the signed S3 URL with `Origin: https://hw3-sandip.vercel.app` | 403, no `Access-Control-Allow-Origin` | Upload goes through the app's `/api/upload` route |
| A6 | ERP code is ignored when sent | `POST /api/v1/products/add` with `erpCode` | 201; the saved product has a different, server-assigned code | ERP code read-only in the form |
| A7 | One code for unknown ID and wrong password | `POST /api/v1/auth/login` with a wrong ID or password | 400 `invalidCredentials` (empty body: 401 `Unauthorized`) | "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요." |
| A8 | Refresh with an access token fails | `GET /api/v1/auth/get-access-token` with `Authorization: Bearer <access token>` | 500 "Something went wrong" | Not used (see A4) |
| A9 | QA server down for some hours | any request, 2026-11-13 afternoon | Cloudflare 521 | "네트워크 오류가 발생했습니다…" + 다시 시도 on every list |

## 9. Results of lint, type-check, build and tests

Real output, full text in `docs/results/`:

```text
$ npm run lint
> eslint
exit code: 0

$ npm run typecheck
> next typegen && tsc --noEmit
✓ Types generated successfully
exit code: 0

$ npm run build
✓ Compiled successfully
Route (app): /, /login, /shopping/categories, /shopping/products, /shopping/products/new,
             /shopping/products/[id], /shopping/products/[id]/edit, /api/upload
exit code: 0

$ PLAYWRIGHT_BASE_URL=https://hw3-sandip.vercel.app npx playwright test   # both projects, against the demo
63 passed (5.3m)    # chromium 62 = mocked UI tests 54 · real-QA read-only 3 · screenshots 4 · smoke 1
                    # mutation 1 (register with a real image upload → edit → exposure → delete, HW3-Sandip-E2E-*)
exit code: 0
```

After the run: no `HW3-Sandip` products left on QA (checked through the API).

## 10. Screen sizes and browsers checked

| What | Widths / themes | How |
| --- | --- | --- |
| Login, categories, product list, register, details, edit | 1440 · 768 · 375 × light · dark (36 shots), no sideways scroll asserted | `tests/screens.real.spec.ts` → `screenshots/` |
| Design vs build (side by side) | same 36 | `docs/design-compare/*.png` (Figma desktop frame left, build right; `node scripts/compose-design-compare.mjs`) |
| Functional | Desktop Chrome 1280 (Playwright default) | all specs |
| Browsers | Chromium (Playwright), Chrome on Windows 11 | Safari / Firefox not checked |
