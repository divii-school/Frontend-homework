# PR — HW3 · Shopping Mall: Product Category + Product Management (Neeraj)

`hw3/neeraj` → `main` · Commits: `b2e2974` first build · `85e0572` earlier review fixes · `8c968d7` docs · `8b2f596` code-review fixes · `356dc8d` Korean UI · one more docs commit follows (branch head) · PR: https://github.com/divii-school/Frontend-homework/pull/2 · Demo (Vercel): https://tc-admin-hw3-neeraj.vercel.app (runs `356dc8d`, `NEXT_PUBLIC_MAX_IMAGE_MB=4`) · **for review only, never merged** · TL task: https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d · Submission page: https://app.notion.com/p/416326b2d5fb814c8b75c984a7f3317e

> Labels of the UI are written as Korean text followed by the English meaning in brackets, because the whole UI is Korean now (see `docs/ko-glossary.md`).
>
> Screenshot links below are relative to `docs/` (they open when this file is viewed in the repo). When pasting into the GitHub PR body, use the file links of the pushed commit instead.

## What changed

A new Next.js 15 admin app (App Router, React 19, TypeScript strict, PrimeReact 10, SCSS, TanStack Query 5, react-hook-form, Playwright) at the repo root, on the real Talking Club QA API (`release/qa`):

- **Korean UI** — the whole UI text is Korean and follows the Korean Figma frames (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리 (Shopping Mall Management)"). `docs/ko-glossary.md` lists all 562 strings (English before, Korean now, source). PrimeReact's built-in texts use a Korean locale (`src/providers/primereact-locale.ts`), `<html lang="ko">`, an unknown API message key falls back to the Korean server-error text. The `accept-language` request header stays `en` on purpose (the API answers with message keys; the app maps keys to Korean text).
- **Login (1.1.0)** — ID / password, `자동 로그인 (Auto login)` (localStorage vs sessionStorage), API messages for an unknown ID and a wrong password, `관리자 권한이 없습니다. (You do not have admin permission.)` popup for non-HQ accounts, logout. Protected routes on two levels: `src/middleware.ts` (no / expired cookie → `/login?returnTo=…`, role not allowed → `/403`) and the client `AuthGate` / `RouteGuard` (GENERAL_ADMIN module permissions, token expiry while the page is open, any API 401).
- **Roles** — one config, `src/config/navigation.ts`, drives the sidebar, both route guards and the button permissions (`useCan`). SUPER / MASTER: both pages; GENERAL_ADMIN: `상품 관리 (Product Management)` only with the `shopping_mall › product_management` permission; every other role: 403.
- **`상품 카테고리 관리 (Product Category Management)` (8.2.0)** — 3-level tree, server search kept in `?q=`, expand / collapse all, add / rename / delete in dialogs (trim, required, ≤ 50 chars, duplicate at the same level, API duplicate keys shown on the field), delete blocked while children exist, reorder by drag-and-drop or Alt + ↑ / ↓ (optimistic, rolled back on error), "max 3 main categories" (`대분류는 최대 3개까지 등록할 수 있습니다.`) shown as a visible reason.
- **`상품 관리 (Product list)` (8.1.0)** — search by product name or category name, cascading Major → Medium → Minor filters, product type, paging, rows per page, sort (current page — the API has no sort), all in the URL; selection up to 100 across pages, bulk delete with confirm, inline exposure status (optimistic + rollback), CSV export of the whole filtered result (UTF-8 BOM). The table scrolls inside its own box at 769–1024 px and becomes cards at ≤ 768 px.
- **Product details (new, not in Figma)** — `상품 정보 (Overview)` (gallery, prices, status, ERP), `옵션 (Options)`, `동일 카테고리 상품 (Same category)`; each tab mounts its own query hook and has its own loading / empty / error state; Overview and Options share the cached details query (the API returns options inside the product details), Same category has its own list query; tab in `?tab=`, keyboard tabs (arrows / Home / End).
- **Product register / edit (8.1.1 – 8.1.3)** — 4 steps (`?step=`), per-step validation with focus on the first error, values kept when going back, draft in sessionStorage restored after a reload, API field errors mapped back to their step, leave guard (Cancel, links, reload), image upload through the app's own route `POST /api/upload` (the server sends the file to S3 with the signed URL; type / size / count checked before any request and again on the server). In edit mode a saved draft is restored only if the product was not changed on the server meanwhile. Edit keeps the code and category read-only and sends image keys and untouched option sets back unchanged.
- **Cross-cutting** — light / dark tokens (one dark value per light value), loading / empty / error states on every data block (`StateWrapper`: 403 / 404 / 500 / network), typed `ApiError` with readable (Korean) messages, a default error toast for failed requests that a screen does not show itself (`meta: SHOWS_OWN_ERROR` opts out), WM formats (`YYYY/MM/DD HH:mm`, `₩1,000`), 1440 / 768 / 375 layouts.
- **Tests and docs** — `e2e/`: 14 spec files + 1 setup file (auth.setup.ts) + helper files (live read-only specs, mocked `*-states` specs, `*.mutation.spec.ts` gated by `E2E_ALLOW_MUTATIONS=1`), `docs/test-cases.md` + `.csv` (123 cases), `docs/qa-build-report.md`, `docs/design-questions.md` (24 questions), `docs/ko-glossary.md`, `scripts/screenshots/compare.mjs` + `docs/screenshots/`.

## Why

HW3 — Advanced Frontend Homework: rebuild two real Talking Club admin screens (Product Category Management, Product Management) with login and role-based access on the real QA API, following the WM frontend rules, and hand them over to QA the WM way.

## How it was tested (2026-11-17 and 2026-11-18, real runs; live = against the QA API)

**Re-run after the re-check fixes (2026-11-18):** gates again 0 / 0 / 0, then the same one command on the production build: **104 passed** (3.3 min), 10:06 to 10:09, including `products.mutation.spec.ts` (real image upload through `/api/upload` to the `talking-club-dev` bucket) and the stricter `upload-route-states.spec.ts` (another bucket is refused). The first attempt at 10:04 stopped on the live login-error test only: the QA API answered too slowly (the `로그인 (Login)` button was still busy after 5 s; a probe right after measured 0.8 to 2.7 s per login answer). No code or test was changed between the two attempts. Leftovers 0; the new report zip was checked: login ID 0, password 0, session token 0.

The full run of 17 Nov:

```
npm run type-check    → exit 0
npm run lint          → exit 0 (0 errors, 0 warnings)
npm run build         → exit 0, 11 pages (including the new route /api/upload) + middleware
npx next start -p 3100, then ONE Playwright command for all 104 tests:
E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test --output=test-results/pw-artifacts --trace=off
  → 104 passed (3.7 min) · 0 failed · 0 flaky · 0 skipped · 17:32 to 17:36 (first attempt)
  guest     14 passed (auth.spec 9 incl. 4 live login tests, roles.spec 5)
  mocked    66 passed (categories-states 18, default-error-toast-states 5, product-form-states 20,
            products-states 15, session-expiry-states 1, upload-route-states 7)
  setup      1 passed (live UI login)
  chromium  23 passed, live: categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
            · product-form.spec 4 · categories.mutation.spec 1 (add, rename, reorder, delete)
            · products.mutation.spec 3 (register with a real image through /api/upload, edit, bulk delete)
clean-up check → 0 HW3-Neeraj- products or categories left
```

- Run order: `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, then setup, then the chromium specs (the QA API keeps one live session per account, so a login / logout in the guest tests invalidates the token saved by `setup`). When running single projects by hand: `--project=setup` (runs guest first), then each chromium spec file with `--no-deps`.
- **Product register / edit / delete passed live** with a real image: the browser posts the file to `POST /api/upload` of the app and the server sends it to S3, so the S3 bucket CORS does not matter and no special port is needed (`E2E_MAP_3000_TO` was not used; the option still exists in `playwright.config.ts`).
- **Check on the deployed Vercel link, 17:45 to 17:47:** `npx playwright test products.mutation --project=chromium` with `PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app` and mutations on: 18 passed (guest 14, setup 1, products.mutation 3). A product with an image can be registered, edited and deleted on the Vercel link. Leftovers 0.
- Every category / product / form spec fails on any browser console error or warning.
- HTML report: the zipped `playwright-report/` of this run (`HW3-Neeraj-playwright-report.zip`, 104 tests) is attached to the submission page; checked for the QA login ID, the password and the saved session token (0 each). The login fields are filled by a helper (`setInputValueQuietly` in `e2e/helpers.ts`) that does not write the value into the report.
- Test cases: `docs/test-cases.md` — 123 cases, 63 positive / 60 negative, 90 mapped to a Playwright test, 33 manual. A case is marked live Pass only when a live spec covering it passed in this run.
- Screenshots: `node scripts/screenshots/compare.mjs` (mocked API, Chromium, retaken 2026-11-17 at 17:40 against the production build) — 5 screens × 1440 / 768 / 375 × light / dark. The design side shows the Korean Figma frames.

## Fixed after the code review (17 Nov)

Reviewer Kakali, result "Resubmit": the code was praised; 2 must-fix and 4 should-fix items. All six are done (commit `8b2f596` for items 2 to 6, `356dc8d` for item 1):

1. **UI language (must-fix).** The whole UI text is Korean and follows the Korean Figma frames (8.1.0 `8010:59065`, 8.1.1 `8010:57833`, 8.1.2 `5498:84860`, 8.1.3 `8034:61058`, 8.2.0 `5498:84158`; login `4019:78451`). `docs/ko-glossary.md` lists all 562 strings. Built-in PrimeReact texts use a Korean locale, `<html lang="ko">`, unknown API message keys fall back to the Korean server-error text. The `accept-language` header stays `en` on purpose.
2. **Upload (must-fix).** The browser no longer sends the file to S3. `UploadService` posts the file and the signed URL to `POST /api/upload` (`src/app/api/upload/route.ts`) and the server sends it to S3, so the bucket CORS no longer matters. The route checks: logged-in session (401 JSON), only the `talking-club-dev` bucket (400), file type (415), size (413), S3 refusal (502). It is left out of the middleware matcher because Next 15.5 passes only the first 10 MB of a body through middleware; the route checks the session itself. Size limit: `NEXT_PUBLIC_MAX_IMAGE_MB` (default 4, because Vercel functions refuse request bodies above 4.5 MB).
3. **A 5th image** can no longer be added or saved (a guard on every add / Undo / Retry path plus a form rule).
4. **Commas** are removed from image file names before the upload (`src/utils/image-file.ts`, `safeFileName`).
5. **Edit draft** is restored only if the product was not changed on the server since the draft was saved (compares `updatedAt` plus the option rows); otherwise it is dropped with a notice, and the edit screen always loads a fresh copy. Create drafts are unchanged.
6. **Default error toast** in `QueryCache` / `MutationCache` (`src/utils/query-client.ts`); hooks whose screen shows its own error opt out with `meta: SHOWS_OWN_ERROR`; a 401 and a cancelled request never toast.

After the code re-check of 18 Nov (code result Pass; two small points, both done): the image size limit defaults to **4 MB** (Vercel functions refuse request bodies above 4.5 MB, so a deployment without `NEXT_PUBLIC_MAX_IMAGE_MB` still works), and `/api/upload` sends files **only to the `talking-club-dev` bucket** (server-only setting `UPLOAD_S3_BUCKET`; any other host, including another S3 bucket, gets 400).

## Fixed earlier on 17 Nov (two internal reviews, before the hand-over)

- A second tab without a saved session no longer logs the first tab out (it deleted the shared login cookie).
- The list pager fits on one line at 375 px.
- A percent-encoded URL (`/shopping-mall/%63ategories`) no longer gets past the route guards: `matchRoute()` decodes the path first (new test in `roles.spec.ts`).
- Log out removes the unsaved product form drafts of the tab (new test in `product-form-states.spec.ts`).
- Register fetches a fresh product code right before the POST; a restored draft also gets the fresh code (new test in `product-form-states.spec.ts`).
- CSV export puts `'` before any text that starts with `-`, `=`, `+` or `@`.
- An edit with `상품 구매 필수 옵션 선택 (Required option for purchase)` on and no option rows can be saved as it is.
- `등록 (Register)` / `저장 (Save)` stays disabled after a successful save until the next page opens.
- Tests: the HTML report no longer holds the typed QA login; the screenshot script waits for hydration.

## WM rules followed

- Plan first, one step at a time, `type-check` + `lint` after every step (`docs/hw3-plan.md`).
- **Shared QA DB:** every record a test or a person creates is named `HW3-Neeraj-…`; mutation tests create → verify → delete their own record and clean up through the API in `afterAll`; mutations never run by default.
- **No secrets in the repo:** `.env.local` is git-ignored; the QA login is read from env in tests and never written in code, docs or reports.
- **Colours only through tokens:** palette in `src/styles/_tokens.scss` (named colour + code, one dark value per light value); components use only `var(--color-*)` — no hex / rgb anywhere else. Spacing, font sizes, radii and breakpoints also from tokens / mixins.
- **Class names** lowercase-with-hyphens; a plain-words comment above each main block.
- **Reuse first:** shared `PageHeader`, `StateWrapper`, `EmptyState`, `ErrorState`, `TableSkeleton`, `ListPagination`, `AlertDialog`, one global Toast and ConfirmDialog; PrimeReact components before custom ones.
- **Data layer:** endpoints → service (`CoreAPIService`, one `ApiError`) → TanStack Query hook; query keys only from `src/utils/query-keys.ts`; screens never call axios directly; mutations invalidate their keys.
- **Permissions** only through `navigation.ts` + `useCan()` — no role checks written by hand in screens.
- **URL state** for list filters / page / sort, form step and details tab.
- **a11y:** every input labelled, icon buttons have `aria-label`, errors `role="alert"`, loading `role="status"`, visible focus ring from tokens, keyboard alternatives for drag-and-drop and tabs.
- **Formats:** `formatDateTime` → `YYYY/MM/DD HH:mm`, `formatWon` → `₩1,000`, `-` when empty.
- TypeScript strict, no `any`. Playwright tests: one file per feature, `*.mutation.spec.ts` for writes, role / label locators, page text checked (not only the URL).

## Screenshots (design | build light | build dark at 1440; build at 768 / 375)

| Screen | 1440 design \| build | 768 | 375 |
|---|---|---|---|
| Login | [compare-1440-login.png](screenshots/compare-1440-login.png) | [light](screenshots/build-768-light-login.png) · [dark](screenshots/build-768-dark-login.png) | [light](screenshots/build-375-light-login.png) · [dark](screenshots/build-375-dark-login.png) |
| Product list | [compare-1440-product-list.png](screenshots/compare-1440-product-list.png) | [light](screenshots/build-768-light-product-list.png) · [dark](screenshots/build-768-dark-product-list.png) | [light](screenshots/build-375-light-product-list.png) · [dark](screenshots/build-375-dark-product-list.png) |
| Product form, step 1 | [compare-1440-product-form.png](screenshots/compare-1440-product-form.png) | [light](screenshots/build-768-light-product-form.png) · [dark](screenshots/build-768-dark-product-form.png) | [light](screenshots/build-375-light-product-form.png) · [dark](screenshots/build-375-dark-product-form.png) |
| Product details | [compare-1440-product-details.png](screenshots/compare-1440-product-details.png) | [light](screenshots/build-768-light-product-details.png) · [dark](screenshots/build-768-dark-product-details.png) | [light](screenshots/build-375-light-product-details.png) · [dark](screenshots/build-375-dark-product-details.png) |
| Categories | [compare-1440-categories.png](screenshots/compare-1440-categories.png) | [light](screenshots/build-768-light-categories.png) · [dark](screenshots/build-768-dark-categories.png) | [light](screenshots/build-375-light-categories.png) · [dark](screenshots/build-375-dark-categories.png) |

The details page has no Figma frame (design question 4); its composite shows 8.1.2 Product edit as the closest frame. Dark mode and the 768 / 375 layouts are not in Figma (questions 1 and 2). The design side of the 1440 images shows the Korean Figma frames (the details page has none).

## Known limitations

- On the Vercel link an image may be at most 4 MB (platform limit for function request bodies). Since 18 Nov 4 MB is also the default for any build.
- The category list API has no paging or sort parameter — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (question 7).
- The QA API keeps one live session per account: a new login or logout revokes the previous token (401 on the next request) although its `exp` is 24 h ahead; this decides the test run order.
- The API has no sort parameter → sort works within the current page only (question 6).
- No refresh token (QA CORS is `origin: *` without credentials) → after the 1-day token the user logs in again and returns to the same page.
- Max 3 main categories in the API; QA already has 3, so main-category create can't be tried on QA (question 8).
- Removing every option on edit is not saved by the API (old options stay); the form shows a note.
- Drag reorder does not work on touch screens; Alt + ↑ / ↓ needs a keyboard (question 19).
- API side: a search by category name (`GET /products?type=categoryName&search=…`) also returns deleted products whose medium or minor category name matches (the OR conditions are not in brackets); the list shows them as normal rows.
- By design: the row selection is kept when the search or the filters change; the selection bar always shows how many rows are selected, with a `선택 해제 (Clear)` action.
- The browser Back button leaves the form without the unsaved-changes dialog.
- Visual polish still open at 768 / 375 px (three small items): the rows-per-page select is not the same height as the buttons next to it; the disabled `삭제 (Delete)` button keeps its red border; the `필터 초기화 (Reset filters)` button is indented a little.
- Wording decisions where the Korean frames disagree with each other are listed as design questions 20 to 24 (`docs/design-questions.md`).
- Only a SUPER_ADMIN account exists on QA; other roles are verified with injected sessions in `e2e/roles.spec.ts`. Firefox and Safari were not checked.
- No longer known issues (fixed in the code review round): the S3 CORS block of the browser upload, a comma in an image file name, the 5th image, the edit draft overwriting newer data.

## Logins

The shared QA admin login comes **by DM**. It is not in this PR, the docs or the tests (tests read `E2E_ADMIN_ID` / `E2E_ADMIN_PASSWORD` from `.env.local`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
