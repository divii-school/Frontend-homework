# RP | HW3 Pranesh — build report for QA

Format: WM | Report, 10 parts from the training page Step 8 Part C.
For: Archana (QA) · Bhagyashree (design) · Kakali (code).

## 1. Build

| | |
|---|---|
| Branch | `hw3/pranesh` (from `main`) in `divii-school/Frontend-homework` |
| Commit | `0eac864` (app code tested and deployed: QA round notes `cae155a` + hydration fix, 2026-11-18; any later commit on the branch changes docs and evidence only). Earlier: `733202b` QA review fixes, `936dff7` code-review fixes, `1643925` first build |
| Link (Vercel) | https://hw3-pranesh-talking-club-admin.vercel.app — frontend only, calls the Talking Club **QA** API (deployed with the Vercel CLI from this branch; no Vercel login needed) |
| Date | 2026-11-18 (first build 2026-11-16) |
| API | `NEXT_PUBLIC_API_BASE_URL` = QA server. Never production. |

## 2. TL task

- [TL | HW3 — Advanced Frontend Homework (Talking Club Shopping Management)](https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d)

## 3. What was built (plain words)

1. **Login** (Figma login 1.1.0): ID + password, 자동 로그인, show/hide password, the Figma messages for an
   unknown ID and a wrong password, and the "관리자 권한이 없습니다" popup for an admin without shopping rights.
2. **Logout** from the header. Pages behind login send you to login and back to the **same page** afterwards.
3. **Roles**: one file (`src/config/app-routes.ts`) decides the menu, which URLs open, and which buttons show.
   A URL the role can't use shows a **403** page.
4. **Session expiry**: the app renews the login quietly; if that fails it says "로그인이 만료되었습니다" and,
   after login, returns to the page you were on.
5. **상품 카테고리 관리** (8.2.0): the 3-level tree, search (kept in the URL), 모두 펼치기/접기,
   add / edit / delete per level with confirm. A category with children can't be deleted.
6. **상품 관리 list** (8.1.0): 10 per page, search by 상품명 or 카테고리, page and search kept in the URL,
   row checkboxes (max 100) with bulk delete, inline 노출 change, CSV export of the whole filtered result.
7. **상품 등록 / 수정** (8.1.1 / 8.1.2): 4 steps (기본 정보 → 이미지·노출 → 카테고리 → ERP). Each step is
   checked before 다음; going back keeps everything; an API error keeps everything typed.
8. **Image upload**: JPG/PNG/WEBP, max 4 MB, max 4 images, preview, X to remove, first image = 대표.
   Not 800×800 → a note, still allowed.
9. **상품 상세** (not in Figma, see questions D2): tabs 기본 정보 · 이미지 · ERP 정보 · 같은 카테고리 상품.
   The open tab is in the URL (`?tab=`); each tab has its own loading, empty and error state.
10. **Light / dark mode** (header button), remembered after reload.
11. **Error pages**: 401 → login, 403, 404, 500 (with 다시 시도), network loss.

## 4. Fixed issues

No QA tickets yet. Code review (Kakali, 2026-11-17, result Pass) listed 8 should-fix items; all 8 are fixed:

| # | Review item | What changed | Proof |
|---|---|---|---|
| 1 | 자동 로그인 went to login when the access token expired, without trying a refresh | A `hw3_session` marker cookie (no token in it) is set and cleared with the refresh token. The middleware lets a page through when the session can be renewed; `AuthProvider` renews the token before anything shows. If the renewal is refused: login with "로그인이 만료되었습니다", then back to the same page | `auth.spec` › 자동 로그인 (3 tests) |
| 2 | Removing an image while others were still uploading could bring it back | Each finished upload is added to the **current** image list, not a copy taken before the uploads started | `product-images.spec` › removed image stays removed |
| 3 | Empty `pranesh-test-file.txt` | Deleted | — |
| 4 | No crash screen for the login page | `app/error.tsx` (login and other pages outside the admin shell) and `app/global-error.tsx` (root layout itself) | build |
| 5 | A screen that forgets its error state fails silently | `QueryCache` / `MutationCache` show a default error toast; screens that show the error themselves mark the hook `meta: { handlesError: true }`; no toast on 401 (already going to login) | `query-defaults.test.ts`, `categories.spec` › default error toast |
| 6 | Image upload bypassed `httpClient` (no refresh, no redirect) | Upload goes through `httpClient` with `baseURL: ''` | `product-images.spec` › expired token during upload |
| 7 | A bug in our own code was reported as a network error | New error kind `unknown`: "예기치 않은 오류가 발생했습니다…"; never retried | `api-error.test.ts` |
| 8 | API validation sentences showed in English | Each class-validator sentence becomes Korean as "<field label>: <rule>", e.g. "카테고리명: 필수 입력 항목입니다."; an unknown sentence becomes "입력한 내용을 다시 확인해 주세요." | `api-error.test.ts` (9 cases) |

Optional item (unknown API key shown as "(someKey)"): removed on 2026-11-18 per the TL rule "never show raw keys"; the screen now shows only "요청을 처리하지 못했습니다."

QA review (Archana, 2026-11-17, Resubmit) — fixed in `733202b`:

| Item | What changed |
|---|---|
| Spot check 1: delete dialog said "하위 카테고리 1개" with a search active (real: 10) | The search result holds only matching children. The row count is hidden in search mode, and the delete check always asks the API for the real children (a node whose children did not match could otherwise have looked empty). Test TC-CAT-19 |
| Spot check 2: disabled 대분류 등록 looked enabled | Disabled buttons use the grey disabled token. Test TC-CAT-20 |
| Spot check 3: access token in a JS-readable cookie | Intended; reasons and limits in API question A13 |
| Spot check 4 (optional): toasts close too fast | 5 s for every toast |
| Found while testing: a 카테고리 search returns deleted products | API question A14. Shown as 삭제된 상품 (no link, not selectable), left out of the CSV. Test TC-PRD-LIST-19 |
| A1–A8 (sheet and evidence) | Section 7 below and the sheet: results per row from the real run, 14 untested cases now tested, full test titles, unit test list attached, "Runs on QA server" + "How QA reproduces", logout rule, Vercel run, Platform and Role columns |

QA intake notes (Archana, 2026-11-17, accepted at intake) — tests and docs only, no app change:

| Note | What changed |
|---|---|
| 1. TC-PRD-FORM-24 pointed at the TC-PRD-FORM-16 step | Its own Playwright test: 단가 1500 → "₩ 1,500", 판매가 1234567 → "₩ 1,234,567" |
| 2. TC-COMMON-21 said "(4 cases)" | The 4 crash-screen unit tests are listed by full title |
| 3. TC-COMMON-11–15, 17–18 listed only the 로그인 tests | Every screen's test is listed, with a first line naming all screens covered |
| 4. TC-PRD-LIST-19 "How QA reproduces" | Full step-by-step instructions |
| Question: why the session ended mid-run | No test presses the real logout (logout tests use a mocked API). In that run the API refused the token once (401) and then refused its renewal; every later test passed with the same session, so it was a one-off refusal on the server side, cause unknown. Also fixed: two of my runs at the same time shared one saved-login file; it is now one file per target host (`playwright.config.ts`). Final clean runs: 109 / 109 locally, 101 / 101 on Vercel |
| Question: A14 to the API owner | Raised with Kakali on the TL page, 2026-11-17, to forward to the API owner |

QA round (Archana, 2026-11-18, **Pass** with 2 small fixes and 2 wording notes) — all 4 fixed in `cae155a`:

| Note | What changed | Test |
|---|---|---|
| A1. `/themes/…/theme.css` on /login was redirected to /login by the middleware | The middleware skips `themes/`, `icons/`, `images/` and static files (`.css`, `.js`, fonts, …); protected pages still redirect | `auth.spec` › static files load on the login page without a session |
| A2. "총 게시물 : 0" while the list was still loading | The total shows only after the list has answered | `products.spec` › 총 게시물 appears only after the list has loaded |
| B3. Generic particles ("단가을(를)", "판매가은(는)") | Each field gets its own particle: "단가를 입력해 주세요.", "판매가는 0보다 커야 합니다.", "수량은 정수로 입력해 주세요." (helper `josa` in `src/lib/text.ts`) | `text.test.ts` (3), `product-form-schema.test.ts` › messages use the particle that fits each field, `product-form.spec` › step 4 (ERP) |
| B4. Edit 취소 dialog said "입력한 정보는 모두 삭제됩니다" | On edit: "변경한 내용은 저장되지 않습니다. 취소하시겠습니까?" (register keeps its wording) | `product-form.spec` › edit: 취소 after a change |

TL update (Kakali, 2026-11-18, "QA API issues stay as they are"): every API issue is now in §8a with what I saw, the
request and the answer. The unknown-key suffix "(someKey)" is removed, so no raw key is ever shown.

Found while re-testing on Vercel (2026-11-18), not reported by QA — **React hydration error #418 on /login**:

| What | Detail |
|---|---|
| Symptom | About 1 in 10 cold loads of /login on Vercel logged `Minified React error #418` (server HTML did not match the client; React rebuilt the page). Measured: 4 / 40 today's build, 3 / 40 yesterday's, 0 / 40 locally (fast JS) |
| Cause | The theme script added the PrimeReact `<link>` to `<head>` before React attached. When the JS files arrived late, React found that unknown element where it expected the login page (dev build diff: `+ <Suspense>` / `- <link id="prime-theme">`). Changing the link's `href` instead also failed: React 19 matches a `<head>` stylesheet by its href |
| Fix | The light and dark theme links are now part of the server HTML (`PrimeThemeLinks`); the script only switches which one is `disabled`, never adds an element or changes an href. Our `:root` overrides became `html:root`, so they still win now that the theme loads after our CSS |
| Proof | With JS delayed at random: previous build 4 / 30 loads with the error, fixed build 0 / 30 light and 0 / 30 dark. Computed styles of every element on 로그인, 상품 관리, 상품 상세, 상품 등록 and 카테고리 in light and dark: identical to the previous build. Tests: `quality.spec` › theme stylesheet and hydration (2), both fail on the previous build |

## 5. Test account / roles

- The shared QA admin account is **sent by DM** (not written here). It is a `SUPER_ADMIN` and sees everything.
- No limited-role account exists on the QA server (questions A9). Limited roles are proven by Playwright
  with a mocked login: `e2e/roles.spec.ts`.
- ⚠ **Logging out signs out everyone using that account** (questions A4). Please tell the team before you log out.

## 6. Data to prepare

None. The build uses existing QA data (about 1,700 products).
For create/edit/delete checks, please **only use names starting with `HW3-Pranesh-`** and delete them afterwards;
five people share this server. My own test category branch: 학원 Shop › `HW3-Pranesh-Sub` › `HW3-Pranesh-Child`.

## 7. What to test

Full list: `docs/qa/HW3-Pranesh-unit-test-cases.csv` and the shared Google Sheet — **130 cases (62 positive / 68 negative)**,
one scenario per row, WM columns (Test Case ID, Platform, Role, Function / Module, Scenario, Input, Expected Result,
Actual Result, Pass / Fail, Last Run Date) plus the exact automated test(s), the result on Vercel, whether the case
can run on the QA server (Yes 97 · Yes with DevTools 15 · Mock only 11 · Do not run on the shared account 1) and
how QA reproduces it. The results are written by `docs/qa/build-test-cases.mjs` from the real Playwright and Vitest
JSON output; it stops if a row names a test that does not exist. Main points:

1. Login: empty, unknown ID, wrong password, network down; 자동 로그인 on/off.
2. Open a page while logged out → login → back to the same URL (with its search).
3. Logout → protected pages need login again.
4. Categories: search + reload, expand/fold, add / rename / delete a `HW3-Pranesh-` 소분류, delete blocked with children, empty name.
5. Product list: search by 상품명 and 카테고리, page 2 + reload + back, no result, select + 삭제 cancel, 노출 change, CSV.
6. Register: every step's errors, 단가 ≥ 판매가 refused, image type / size / count, go back and forth, register.
7. Edit and delete your `HW3-Pranesh-` product from the details page.
8. Details tabs: switch, reload keeps the tab, 같은 카테고리 상품.
9. 404: `/shopping/products/abc` and `/shopping/products/99999999`.
10. Dark mode on every screen; sizes in part 10.

## 8. Known issues / not covered

### 8a. API issues (QA API, not frontend bugs)

The Talking Club QA API is in maintenance (TL page, Kakali, 2026-11-18). These are **API issues**: they are left as
they are, not fixed or worked around in the API. Workarounds already built are kept. On every one of them the screen
shows a Korean message and never crashes or shows a raw API key.

| # | What I saw | Request | API answer | What the screen does |
|---|---|---|---|---|
| A1 | No sort on the product list | `GET /api/v1/products?page=1&limit=10&sort=price&order=desc` (also `sortBy`) | 200, same order every time; the API spec lists only `page, limit, type, search` | No sort control; the API's order is shown |
| A2 | Category list incomplete, no paging or sort | `GET /api/v1/product-category/list` | 200 with 3 of the 12 대분류; `search` is the only parameter | Tree read level by level from `/products/categories` → `/subcategories/{id}` → `/childcategories/{id}` |
| A3 | 대분류 cannot be added | `POST` add 대분류 | `isCreatable: false`; add → `maximumCategoryLimitReached` | 대분류 등록 disabled, reason shown in Korean |
| A4 | One logout ends every session of the shared account | logout in browser 1, then any call in browser 2 | 401 in browser 2 | "로그인이 만료되었습니다"; after login, back to the same page |
| A5 | Allowed values for 노출여부 not documented | `PUT /api/v1/products/update-status/{id}/{status}` | `yes` = on, any other value = off | Sends `yes` / `no` |
| A6 | Unknown product answers 400, not 404 | `GET /api/v1/products/details/99999999` | 400 `productNotFound` | Korean 404 screen |
| A7 | Names come back HTML-escaped | `GET /api/v1/products/categories` (a name with `&`) | `&amp;` in the name | Shown as `&` |
| A8 | Image bucket CORS allows only `http://localhost:3000` | browser `PUT` to the signed S3 URL from Vercel | blocked by CORS | Upload goes through our own `/api/upload` route |
| A11 | API doc says `ids` is `string[]`; the server refuses strings | `DELETE /api/v1/products/delete` `{"ids":["20002"]}` | 400 "each value in ids must be a number…"; numbers → 200 | Sends numbers |
| A12 | Server down most of 2026-11-13 | any request | 521 (Cloudflare) | "서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요." |
| A14 | 카테고리 search returns deleted products | `GET /api/v1/products?type=categoryName&search=HW3-Pranesh-Child&page=1&limit=10` | 200, 14 rows, 13 with `isDeleted: true`; `details/{id}` of each → 400 `productNotFound` | Rows marked 삭제된 상품 (no link, not selectable), left out of the CSV; the total follows the API |

Full evidence for each: [design-and-api-questions.md](HW3-Pranesh-design-and-api-questions.md).

### 8b. Frontend: known issues / not covered

- **No 768 / 375 design** to compare with (questions D1); layout was built to WM rules.
- **No details-page design** (questions D2).
- **8.1.3 options** not built: no API (questions D9).
- Drag-reorder of categories is shown only where every sibling is a `HW3-Pranesh-` record, so other people's
  order can't be changed by accident.
- Limited roles checked with a mocked login only: the QA server has no limited-role account (questions A9).
- **Shared account:** if many screens suddenly show "로그인이 만료되었습니다", someone logged out (A4); log in again.
  The same applies to Playwright runs.
- **Edit 취소 → 예 once stayed on the form** (TC-PRD-EDIT-06): in 1 of 22 runs the page did not switch to the
  details page after 예, although the server had answered (200) and the build was the same. In every other run (21, including
  the final clean full run) it passed, so it could not be reproduced; the cause is inside the Next.js client router and is not known.
  The form had already been reset, so nothing was saved. If it happens: close the box (X) and press 취소 again.
- **Browser Back** from a half-filled product form goes back to the list without a prompt (in-app navigation; closing or
  reloading the tab does warn). TC-PRD-FORM-29.
- 11 cases are **Mock only** (no limited-role account, server-down/500 responses, HTML names, crash screens); the sheet says why.
- Labels follow the **Korean** Figma frames (e.g. 판매금액, 노출여부, 등록일자, 상품ERP명). Fields the design names
  twice (two "단가") are labelled 단가 and ERP 단가 so they can be told apart.

## 9. Check results

Run on 2026-11-18 (commit `0eac864`) against the Talking Club QA API. Playwright ran against the **production build**
(`next build` + `next start`) and, for the read-only project, against the **Vercel deployment** of the same commit.

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | clean: 0 errors, 0 warnings |
| Type-check | `npm run typecheck` | clean |
| Unit tests | `npm run test` | 97 passed (10 files); per-test list: `docs/qa/evidence/vitest-verbose.txt` |
| Build | `npm run build` | compiled successfully, no warnings |
| Playwright read-only | `npm run test:e2e` | 104 (auth 16 · roles 4 · categories 14 · products 25 · product-form 14 · product-images 2 · quality 29) |
| Playwright mutation | `npm run test:e2e:mutation` | 8 (only `HW3-Pranesh-*` records; all deleted afterwards) |
| Total, local run | read-only + mutation + login setup | **113 passed, 0 failed, 0 flaky** |
| Read-only on **Vercel** | `PLAYWRIGHT_BASE_URL=<Vercel URL> npx playwright test --project=readonly` | **105 passed (104 + login setup), 0 failed, 0 flaky** — two earlier runs that day each had 7–10 failures from one point on, because the QA API refused the shared session for a few minutes (401, then the renewal refused); the screens showed "로그인이 만료되었습니다" as designed. API issue A4, not a frontend fault |

The quality tests check every screen (login, list, details and its 4 tabs, register, categories) for zero console
errors/warnings, zero WCAG 2 A/AA violations (axe) in light **and** dark, and no sideways page scroll at
1920 / 1440 / 1366 / 768 / 375.

HTML reports (local, Vercel) and the JSON results are attached to the submission page (checked: no login data). JSON results are also in `docs/qa/evidence/`.

## 10. Screen sizes and browsers checked

- **Sizes:** 1920, 1440, 1366, 768, 375, each in light and dark: 50 screenshots in `docs/screenshots/`, taken by
  `npm run screenshots`. Side-by-side images (design | build) are on the submission page.
- **Browser:** Chromium (Playwright, same engine as Chrome and Edge) on Windows 11, against the production build
  of commit `0eac864`, and the read-only suite against the Vercel deployment of the same commit (104 passed + login setup).
- Not checked: Safari / iOS (no device available).
