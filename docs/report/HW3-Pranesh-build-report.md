# RP | HW3 Pranesh — build report for QA

Format: WM | Report, 10 parts from the training page Step 8 Part C.
For: Archana (QA) · Bhagyashree (design) · Kakali (code).

## 1. Build

| | |
|---|---|
| Branch | `hw3/pranesh` (from `main`) in `divii-school/Frontend-homework` |
| Commit | `733202b` (app code tested and deployed: QA review fixes; any later commit on the branch changes docs only). Earlier: `936dff7` code-review fixes, `1643925` first build |
| Link (Vercel) | https://hw3-pranesh-talking-club-admin.vercel.app — frontend only, calls the Talking Club **QA** API (deployed with the Vercel CLI from this branch; no Vercel login needed) |
| Date | 2026-11-17 (first build 2026-11-16) |
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

Optional item (unknown API key shown as "(someKey)"): kept for HW3 so QA can report the exact key; to be hidden before any client release.

QA review (Archana, 2026-11-17, Resubmit) — fixed in `733202b`:

| Item | What changed |
|---|---|
| Spot check 1: delete dialog said "하위 카테고리 1개" with a search active (real: 10) | The search result holds only matching children. The row count is hidden in search mode, and the delete check always asks the API for the real children (a node whose children did not match could otherwise have looked empty). Test TC-CAT-19 |
| Spot check 2: disabled 대분류 등록 looked enabled | Disabled buttons use the grey disabled token. Test TC-CAT-20 |
| Spot check 3: access token in a JS-readable cookie | Intended; reasons and limits in API question A13 |
| Spot check 4 (optional): toasts close too fast | 5 s for every toast |
| Found while testing: a 카테고리 search returns deleted products | API question A14. Shown as 삭제된 상품 (no link, not selectable), left out of the CSV. Test TC-PRD-LIST-19 |
| A1–A8 (sheet and evidence) | Section 7 below and the sheet: results per row from the real run, 14 untested cases now tested, full test titles, unit test list attached, "Runs on QA server" + "How QA reproduces", logout rule, Vercel run, Platform and Role columns |

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

Full list: `docs/qa/HW3-Pranesh-unit-test-cases.csv` and the shared Google Sheet — **124 cases (60 positive / 64 negative)**,
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

- **No sort** on either list: the API has no sort parameter (questions A1).
- **No 768 / 375 design** to compare with (questions D1); layout was built to WM rules.
- **No details-page design** (questions D2).
- **8.1.3 options** not built: no API (questions D9).
- 대분류 등록 disabled: the API caps top-level categories (questions A3).
- Drag-reorder of categories is shown only where every sibling is a `HW3-Pranesh-` record, so other people's
  order can't be changed by accident.
- Limited roles checked with a mocked login only (questions A9).
- **Shared account:** a logout by anyone ends every session of the QA account (questions A4). If many screens
  suddenly show "로그인이 만료되었습니다", that is the cause, not a bug; log in again. The same applies to Playwright runs.
- **Deleted products in a 카테고리 search** (questions A14): the API returns them; they are shown as 삭제된 상품 and the
  total / paging follow the API until it is fixed.
- **Browser Back** from a half-filled product form goes back to the list without a prompt (in-app navigation; closing or
  reloading the tab does warn). TC-PRD-FORM-29.
- 11 cases are **Mock only** (no limited-role account, server-down/500 responses, HTML names, crash screens); the sheet says why.
- Labels follow the **Korean** Figma frames (e.g. 판매금액, 노출여부, 등록일자, 상품ERP명). Fields the design names
  twice (two "단가") are labelled 단가 and ERP 단가 so they can be told apart.

## 9. Check results

Run on 2026-11-17 (commit `733202b`) against the Talking Club QA API. Playwright ran against the **production build**
(`next build` + `next start`) and, for the read-only project, against the **Vercel deployment** of the same commit.

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | clean: 0 errors, 0 warnings |
| Type-check | `npm run typecheck` | clean |
| Unit tests | `npm run test` | 93 passed (9 files); per-test list: `docs/qa/evidence/vitest-verbose.txt` |
| Build | `npm run build` | compiled successfully, no warnings |
| Playwright read-only | `npm run test:e2e` | 99 (auth 15 · roles 4 · categories 14 · products 24 · product-form 13 · product-images 2 · quality 27) |
| Playwright mutation | `npm run test:e2e:mutation` | 8 (only `HW3-Pranesh-*` records; all deleted afterwards) |
| Total, local run | read-only + mutation + login setup | **107 passed, 1 failed** — the failure: the shared account's session ended mid-run (A4); re-run on its own: **passed** (both reports attached) |
| Read-only on **Vercel** | `PLAYWRIGHT_BASE_URL=<Vercel URL> npx playwright test --project=readonly` | **100 passed, 0 failed, 0 flaky** |

The quality tests check every screen (login, list, details and its 4 tabs, register, categories) for zero console
errors/warnings, zero WCAG 2 A/AA violations (axe) in light **and** dark, and no sideways page scroll at
1920 / 1440 / 1366 / 768 / 375.

HTML reports (local, local re-run, Vercel) and the JSON results are attached to the submission page (checked: no login data). JSON results are also in `docs/qa/evidence/`.

## 10. Screen sizes and browsers checked

- **Sizes:** 1920, 1440, 1366, 768, 375, each in light and dark: 50 screenshots in `docs/screenshots/`, taken by
  `npm run screenshots`. Side-by-side images (design | build) are on the submission page.
- **Browser:** Chromium (Playwright, same engine as Chrome and Edge) on Windows 11, against the production build
  of commit `733202b`, and the read-only suite against the Vercel deployment of the same commit (100 passed).
- Not checked: Safari / iOS (no device available).
