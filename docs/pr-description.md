# PR — HW3 · Shopping Mall: Product Category + Product Management (Neeraj)

`hw3/neeraj` → `main` · Commit: `<commit hash — fill at submission>` · Demo (Vercel): `<URL — fill at submission>` · **for review only, never merged** · TL task: https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d · Submission page: https://app.notion.com/p/416326b2d5fb814c8b75c984a7f3317e

> Screenshot links below are relative to `docs/` (they open when this file is viewed in the repo). When pasting into the GitHub PR body, use the file links of the pushed commit instead.

## What changed

A new Next.js 15 admin app (App Router, React 19, TypeScript strict, PrimeReact 10, SCSS, TanStack Query 5, react-hook-form, Playwright) at the repo root, on the real Talking Club QA API (`release/qa`):

- **Login (1.1.0)** — ID / password, "Auto login" (localStorage vs sessionStorage), API messages for an unknown ID and a wrong password, "no admin permission" popup for non-HQ accounts, logout. Protected routes on two levels: `src/middleware.ts` (no / expired cookie → `/login?returnTo=…`, role not allowed → `/403`) and the client `AuthGate` / `RouteGuard` (GENERAL_ADMIN module permissions, token expiry while the page is open, any API 401).
- **Roles** — one config, `src/config/navigation.ts`, drives the sidebar, both route guards and the button permissions (`useCan`). SUPER / MASTER: both pages; GENERAL_ADMIN: Product Management only with the `shopping_mall › product_management` permission; every other role: 403.
- **Product Category Management (8.2.0)** — 3-level tree, server search kept in `?q=`, expand / collapse all, add / rename / delete in dialogs (trim, required, ≤ 50 chars, duplicate at the same level, API duplicate keys shown on the field), delete blocked while children exist, reorder by drag-and-drop or Alt + ↑ / ↓ (optimistic, rolled back on error), "max 3 main categories" shown as a visible reason.
- **Product list (8.1.0)** — search by product name or category name, cascading Major → Medium → Minor filters, product type, paging, rows per page, sort (current page — the API has no sort), all in the URL; selection up to 100 across pages, bulk delete with confirm, inline exposure status (optimistic + rollback), CSV export of the whole filtered result (UTF-8 BOM). The table scrolls inside its own box at 769–1024 px and becomes cards at ≤ 768 px.
- **Product details (new, not in Figma)** — Overview (gallery, prices, status, ERP), Options, Same category; each tab mounts its own query hook and has its own loading / empty / error state; Overview and Options share the cached details query (the API returns options inside the product details), Same category has its own list query; tab in `?tab=`, keyboard tabs (arrows / Home / End).
- **Product register / edit (8.1.1 – 8.1.3)** — 4 steps (`?step=`), per-step validation with focus on the first error, values kept when going back, draft in sessionStorage restored after a reload, API field errors mapped back to their step, leave guard (Cancel, links, reload), direct S3 upload through signed URLs (type / size / count checked before any request). Edit keeps the code and category read-only and sends image keys and untouched option sets back unchanged.
- **Cross-cutting** — light / dark tokens (one dark value per light value), loading / empty / error states on every data block (`StateWrapper`: 403 / 404 / 500 / network), typed `ApiError` with readable messages, WM formats (`YYYY/MM/DD HH:mm`, `₩1,000`), 1440 / 768 / 375 layouts.
- **Tests and docs** — `e2e/`: 12 spec files + 1 setup file (auth.setup.ts) + 5 helper files (live read-only specs, mocked `*-states` specs, `*.mutation.spec.ts` gated by `E2E_ALLOW_MUTATIONS=1`), `docs/test-cases.md` + `.csv` (112 cases), `docs/qa-build-report.md`, `docs/design-questions.md` (19 questions), `scripts/screenshots/compare.mjs` + `docs/screenshots/`.

## Why

HW3 — Advanced Frontend Homework: rebuild two real Talking Club admin screens (Product Category Management, Product Management) with login and role-based access on the real QA API, following the WM frontend rules, and hand them over to QA the WM way.

## How it was tested (2026-11-17, real runs; live = against the QA API)

```
npm run type-check    → exit 0
npm run lint          → exit 0 (0 errors, 0 warnings)
npm run build         → exit 0, 10 routes + middleware
npx next start -p 3100, then ONE Playwright command for all 81 tests:
E2E_ALLOW_MUTATIONS=1 E2E_MAP_3000_TO=3100 npx playwright test --output=test-results/pw-artifacts --trace=off
  → exit 0 · 81 passed (3.6 min) · 0 failed · 0 flaky · first attempt
  guest     13 passed (auth.spec 9 incl. 4 live login tests, roles.spec 4)
  mocked    44 passed (categories-states 18, products-states 15, product-form-states 10, session-expiry-states 1)
  setup      1 passed (live UI login)
  chromium  23 passed, live: categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
            · product-form.spec 4 · categories.mutation.spec 1 (add, rename, reorder, delete)
            · products.mutation.spec 3 (register with a real image upload to S3, edit, delete)
clean-up check → 0 HW3-Neeraj- products or categories left
```

- Run order: `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, then setup, then the chromium specs (the QA API keeps one live session per account, so a login / logout in the guest tests invalidates the token saved by `setup`). When running single projects by hand: `--project=setup` (runs guest first), then each chromium spec file with `--no-deps`.
- **Product register / edit / delete passed live** through the port-3000 mapping (`E2E_MAP_3000_TO`, opt-in in `playwright.config.ts`): the S3 bucket CORS refuses the preflight from `http://localhost:3100`, the QA admin origin and a `vercel.app` origin (403 `AccessForbidden`) and allows only `http://localhost:3000`, which is used by another app on the author's laptop. With the mapping, Chromium opens `http://localhost:3000` but connects to the app on port 3100. The same steps also pass against a mocked API (`product-form-states.spec.ts`, mocked S3).
- Every category / product / form spec fails on any browser console error or warning.
- HTML report: the zipped `playwright-report/` of this run is attached to the submission page; checked for the QA login ID, the password and the saved session token (0 each). The login fields are filled by a helper (`setInputValueQuietly` in `e2e/helpers.ts`) that does not write the value into the report.
- Test cases: `docs/test-cases.md` — 112 cases, 59 positive / 53 negative, 81 mapped to a Playwright test, 31 manual. A case is marked live Pass only when a live spec covering it passed in this run.
- Screenshots: `node scripts/screenshots/compare.mjs` (mocked API, Chromium, retaken 2026-11-17 against the production build) — 5 screens × 1440 / 768 / 375 × light / dark.

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

The details page has no Figma frame (design question 4); its composite shows 8.1.2 Product edit as the closest frame. Dark mode and the 768 / 375 layouts are not in Figma (questions 1 and 2).

## Known limitations

- Image upload to S3 from the browser is refused by the bucket CORS for every origin except `http://localhost:3000` (preflight 403 for localhost:3100, the QA admin origin and a `vercel.app` origin, checked 2026-11-17). Request to the backend team: add the QA admin and Vercel origins to the bucket CORS. Until then the upload works only from the origin `http://localhost:3000` (the tests reach it through the port-3000 mapping) and fails in a deployed app such as the Vercel link.
- The category list API has no paging or sort parameter — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (question 7).
- The QA API keeps one live session per account: a new login or logout revokes the previous token (401 on the next request) although its `exp` is 24 h ahead; this decides the test run order.
- The API has no sort parameter → sort works within the current page only (question 6).
- No refresh token (QA CORS is `origin: *` without credentials) → after the 1-day token the user logs in again and returns to the same page.
- Max 3 main categories in the API; QA already has 3, so main-category create can't be tried on QA (question 8).
- Removing every option on edit is not saved by the API (old options stay); the form shows a note.
- Drag reorder does not work on touch screens; Alt + ↑ / ↓ needs a keyboard (question 19).
- Only a SUPER_ADMIN account exists on QA; other roles are verified with injected sessions in `e2e/roles.spec.ts`.

## Logins

The shared QA admin login comes **by DM**. It is not in this PR, the docs or the tests (tests read `E2E_ADMIN_ID` / `E2E_ADMIN_PASSWORD` from `.env.local`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
