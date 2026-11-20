# PR — HW3 · Shopping Mall: Product Category + Product Management (Neeraj)

`hw3/neeraj` → `main` · Commits: `b2e2974` first build · `85e0572` earlier review fixes · `8c968d7` docs · `8b2f596` code-review fixes · `356dc8d` Korean UI · `b25769b` docs · `355d2ae` code re-check points · `586b91a` QA round fixes · `733655c` two layout bugs · `792ef82` design review fixes · `636e258` font as a dynamic subset · `adb5df2` the first mouse click on a footer button of the product form is no longer lost · one more docs commit follows (branch head) · PR: https://github.com/divii-school/Frontend-homework/pull/2 · Demo (Vercel): https://tc-admin-hw3-neeraj.vercel.app (runs `adb5df2`, `NEXT_PUBLIC_MAX_IMAGE_MB=4`) · **for review only, never merged** · TL task: https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d · Submission page: https://app.notion.com/p/416326b2d5fb814c8b75c984a7f3317e

> Labels of the UI are written as Korean text followed by the English meaning in brackets, because the whole UI is Korean now (see `docs/ko-glossary.md`).
>
> Screenshot links below are relative to `docs/` (they open when this file is viewed in the repo). When pasting into the GitHub PR body, use the file links of the pushed commit instead.

## What changed

A new Next.js 15 admin app (App Router, React 19, TypeScript strict, PrimeReact 10, SCSS, TanStack Query 5, react-hook-form, Playwright) at the repo root, on the real Talking Club QA API (`release/qa`):

- **Korean UI** — the whole UI text is Korean and follows the Korean Figma frames (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리 (Shopping Mall Management)"). `docs/ko-glossary.md` lists all 564 strings (English before, Korean now, source; 562 at the code review, two more since the design review). PrimeReact's built-in texts use a Korean locale (`src/providers/primereact-locale.ts`), `<html lang="ko">`, an unknown API message key falls back to the Korean server-error text. The `accept-language` request header stays `en` on purpose (the API answers with message keys; the app maps keys to Korean text).
- **Login (1.1.0)** — ID / password, `자동 로그인 (Auto login)` (localStorage vs sessionStorage), API messages for an unknown ID and a wrong password, `관리자 권한이 없습니다. (You do not have admin permission.)` popup for non-HQ accounts, logout. Protected routes on two levels: `src/middleware.ts` (no / expired cookie → `/login?returnTo=…`, role not allowed → `/403`) and the client `AuthGate` / `RouteGuard` (GENERAL_ADMIN module permissions, token expiry while the page is open, any API 401).
- **Roles** — one config, `src/config/navigation.ts`, drives the sidebar, both route guards and the button permissions (`useCan`). SUPER / MASTER: both pages; GENERAL_ADMIN: `상품 관리 (Product Management)` only with the `shopping_mall › product_management` permission; every other role: 403.
- **`상품 카테고리 관리 (Product Category Management)` (8.2.0)** — 3-level tree, server search kept in `?q=`, expand / collapse all, add / rename / delete in dialogs (trim, required, ≤ 50 chars, duplicate at the same level, API duplicate keys shown on the field), delete blocked while children exist, reorder by drag-and-drop or Alt + ↑ / ↓ (optimistic, rolled back on error), "max 3 main categories" (`대분류는 최대 3개까지 등록할 수 있습니다.`) shown as a visible reason.
- **`상품 관리 (Product list)` (8.1.0)** — search by product name or category name, cascading Major → Medium → Minor filters, product type, paging, rows per page, sort (current page — the API has no sort), all in the URL; selection up to 100 across pages, bulk delete with confirm, inline exposure status (optimistic + rollback), CSV export of the whole filtered result (UTF-8 BOM). The column `판매금액 (Selling price)` shows the API field `price`; the CSV has `단가 (Unit price)` = `unitPrice` and `판매금액` = `price`. The table scrolls inside its own box at 769–1024 px and becomes cards at ≤ 768 px. The search type and the search input are underline-only fields, as in frame 8.1.0. At ≤ 768 px the filters sit behind a `필터 (Filters)` button that shows the number of active filters.
- **Product details (new, not in Figma)** — `상품 정보 (Overview)` (gallery, prices, status, ERP), `옵션 (Options)`, `동일 카테고리 상품 (Same category)`; each tab mounts its own query hook and has its own loading / empty / error state; Overview and Options share the cached details query (the API returns options inside the product details), Same category has its own list query; tab in `?tab=`, keyboard tabs (arrows / Home / End).
- **Product register / edit (8.1.1 – 8.1.3)** — 4 steps (`?step=`), per-step validation with focus on the first error, values kept when going back, draft in sessionStorage restored after a reload, API field errors mapped back to their step, leave guard (Cancel, links, reload), image upload through the app's own route `POST /api/upload` (the server sends the file to S3 with the signed URL; type / size / count checked before any request and again on the server). In edit mode a saved draft is restored only if the product was not changed on the server meanwhile. Edit keeps the code and category read-only and sends image keys and untouched option sets back unchanged. Prices: `단가 (Unit price)` = API `unitPrice` (asked first), `판매가 (Selling price)` = API `price` (the amount the cart and the order charge); rule `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)`, as the API requires `unitPrice < price`.
- **Look (design review, 18 Nov)** — the logo is the TalkingClub logo image of the Figma frames, shown through one component (`BrandLogo`). Every light colour in `src/styles/_tokens.scss` is the hex of a Figma style, with the style name in the comment. The font is Pretendard, the font of the frames, self-hosted as a dynamic subset (`src/styles/pretendard-font.css`). `word-break: keep-all` for Korean text. The text inputs and dropdowns of the product form are underline-only, as drawn.
- **Cross-cutting** — light / dark tokens (one dark value per light value), loading / empty / error states on every data block (`StateWrapper`: 403 / 404 / 500 / network), typed `ApiError` with readable (Korean) messages, a default error toast for failed requests that a screen does not show itself (`meta: SHOWS_OWN_ERROR` opts out), WM formats (`YYYY/MM/DD HH:mm` in Korea time for every viewer, `₩1,000`), browser tab title `… | 토킹클럽 관리자`, 1440 / 768 / 375 layouts.
- **Tests and docs** — `e2e/`: 14 spec files + 1 setup file (auth.setup.ts) + helper files, 115 tests (live read-only specs, mocked `*-states` specs, `*.mutation.spec.ts` gated by `E2E_ALLOW_MUTATIONS=1`), `docs/test-cases.md` + `.csv` (WM DEV template), `docs/qa-build-report.md`, `docs/design-questions.md` (27 questions), `docs/ko-glossary.md`, `scripts/screenshots/compare.mjs` + `docs/screenshots/`.

## Why

HW3 — Advanced Frontend Homework: rebuild two real Talking Club admin screens (Product Category Management, Product Management) with login and role-based access on the real QA API, following the WM frontend rules, and hand them over to QA the WM way.

## How it was tested (2026-11-17 to 2026-11-19, real runs; live = against the QA API)

**Final run against the Vercel link (build `adb5df2`):** the whole suite with mutations in one command:

```
E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app npx playwright test --output=test-results/pw-vercel --trace=off
  → 2026-11-20, 12:29 to 12:34 IST, build adb5df2, one command with --retries=2: 115 tests, 115 passed on the first attempt, 0 retried, 0 failed (4.4 min). Leftover check: 0 products and 0 categories named HW3-Neeraj-*. The HTML report attached to the submission is from this run (login ID 0, password 0, session token 0). Before the last fix, on build 636e258: 2026-11-19, 10:33 to 10:42 IST, build 636e258, one command with --retries=2: 114 tests, 113 passed on the first attempt, 1 passed on a retry, 0 failed (8.8 min). The retried test is categories-states.spec.ts › add dialog: required / spaces / 51 chars / duplicate are refused before the API; API duplicate shows on the field: its page load (page.goto) timed out twice after 30 s while the connection from the developer PC to the Vercel link stalled, then it passed. Leftover check: 0 products and 0 categories named HW3-Neeraj-*. A first attempt at 10:25 without retries is not a result: three page loads ended with net::ERR_TIMED_OUT, so the live tests did not start.
```

The suite now has 115 tests in 15 files: guest 15 (auth.spec 10 incl. 4 live login tests, roles.spec 5), mocked 76 (categories-states 19, default-error-toast-states 5, product-form-states 22, products-states 22, session-expiry-states 1, upload-route-states 7), setup 1 (auth.setup), chromium 23 (live: categories.spec 5, products-list.spec 6, products-details.spec 4, product-form.spec 4, categories.mutation.spec 1, products.mutation.spec 3).

Before it, 19 Nov, on the local production build of the font change (`636e258`, port 3100): type-check 0, lint 0, build 0; mocked 75 passed; guest tests without the API 11 passed. In the browser the first font family is `Pretendard Variable`, Korean text is drawn with it, and 'Inter var' is not loaded.

18 Nov, on the local production build of the design-fix build `792ef82` (port 3100, real QA API): type-check 0, lint 0, build 0; mocked 75 passed. Whole suite with mutations, one command, 18:34 to 18:39: 113 passed, 1 failed. The failure was `products.mutation.spec.ts › delete it with the list's bulk delete`: the row was gone from the screen and the product was deleted (leftover check: 0), but the QA API list still returned it after 5 s (the QA API is in maintenance and slow; an API issue). The wait was raised to 30 s and `products.mutation` ran again, 18:39 to 18:41: 19 passed (guest 15, setup 1, products.mutation 3). Leftovers: 0 products and 0 categories named `HW3-Neeraj-*`.

Not results: two runs of the whole suite against the Vercel link on build `792ef82` failed with timeouts in page loads (18 Nov, 18:49 to 19:03: 102 passed, 10 failed, 2 did not run; 19 Nov, 09:50 to 10:06: failed the same way). Cause: on that build one 2.06 MB font file was preloaded on every page, so the first page load on the Vercel link was several seconds slower. Fixed in `636e258` (the font is a dynamic subset now).

Tests changed in `792ef82` (design review): nine new tests, no title was renamed.

- `products-states.spec.ts`: `Figma tokens: Pretendard web font, Gray 130 text, Primary 80 table header, Gray 80 underline search, keep-all`; `the header logo is the TalkingClub image and links to the home page`; `light: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`; `dark: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`; `filters sit behind the 필터 button: closed at first, opens, shows the number of active filters, filtering still works`; `the tab bar shows no native scrollbar at 1440 / 768 / 375`
- `categories-states.spec.ts`: `375px: every row is one line — [code] and name together, the buttons beside them; row icons are grey`
- `product-form-states.spec.ts`: `fields are underline-only (the textarea stays boxed): error = danger line + message, focus = brand-colour line`
- `auth.spec.ts` (guest): `the logo is the TalkingClub image, alone as in frame 1.1.0; the page heading stays for screen readers`
- One wait changed: in `products.mutation.spec.ts › delete it with the list's bulk delete` the check "the API list no longer returns the product" now waits up to 30 s (it was the default 5 s).

**Earlier run, before the design fixes: 2026-11-18, against the Vercel link (build `586b91a`):** the whole suite with mutations (105 tests at that time) in one command, first attempt:

```
E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app npx playwright test --output=test-results/pw-vercel --trace=off
  → 105 passed (6.3 min) · 0 failed · 0 flaky · 0 skipped · 12:07 to 12:14
  guest     14 passed (auth.spec 9 incl. 4 live login tests, roles.spec 5)
  mocked    67 passed (categories-states 18, default-error-toast-states 5, product-form-states 20,
            products-states 16, session-expiry-states 1, upload-route-states 7)
  setup      1 passed (live UI login)
  chromium  23 passed, live: categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
            · product-form.spec 4 · categories.mutation.spec 1 · products.mutation.spec 3 (register with a real
            image through /api/upload, edit, bulk delete)
leftovers → 0 · HTML report HW3-Neeraj-playwright-report.zip (105 tests): login ID 0, password 0, session token 0
```

Before it, on the local production build (port 3100), 18 Nov: type-check 0, lint 0, build 0; mocked 66 passed plus the new test 1 passed; guest tests without the API 10 passed. Full live run 11:56 to 12:00: 102 passed, 1 failed, 2 did not run (the QA API did not answer `GET /products/categories` within 15 s in the setup of `products.mutation.spec.ts`; an API issue, nothing was created). Re-run of `products.mutation` 12:01 to 12:02: 18 passed (guest 14, setup 1, products.mutation 3); the real API accepted `단가 (Unit price)` 15,000 / `판매가 (Selling price)` 20,000 and the edit of `판매가` to 25,000 (API `price` 25,000, `unitPrice` 15,000). Leftovers 0.

Tests changed in `586b91a`: the values typed into the form were swapped (`단가` gets the smaller value), so the API bodies the tests check stay the same (the live edit now changes `판매가`, API `price`, to 25,000). Renamed: `product-form.spec.ts › step 1: required messages, unit price ≥ selling price, Next blocked until valid` and `product-form-states.spec.ts › 400 unitPriceMustBeLessThanPrice → back on the unit price, every value kept`. New mocked test `products-states.spec.ts › list, CSV and details show 판매가 = price, 단가 = unitPrice and the time in KST` (browser in India time, `Asia/Kolkata`). The two live login-error dialogs wait up to 15 s (the shared QA API sometimes needed more than 5 s for the first login answer of a run). The 5 MB part of `upload-route-states.spec.ts › a file above the size limit → 413` runs only against a local server (Vercel refuses bodies above 4.5 MB itself: `413 FUNCTION_PAYLOAD_TOO_LARGE`, not JSON).

**Re-run after the re-check fixes (2026-11-18, before the QA round fixes):** gates again 0 / 0 / 0, then the same one command on the production build: **104 passed** (3.3 min), 10:06 to 10:09, including `products.mutation.spec.ts` (real image upload through `/api/upload` to the `talking-club-dev` bucket) and the stricter `upload-route-states.spec.ts` (another bucket is refused). The first attempt at 10:04 stopped on the live login-error test only: the QA API answered too slowly (the `로그인 (Login)` button was still busy after 5 s; a probe right after measured 0.8 to 2.7 s per login answer). No code or test was changed between the two attempts. Leftovers 0; the new report zip was checked: login ID 0, password 0, session token 0.

The full run of 17 Nov (104 tests at that time):

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
- **Earlier check on the deployed Vercel link, 17 Nov, 17:45 to 17:47 (before the whole-suite run of 18 Nov):** `npx playwright test products.mutation --project=chromium` with `PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app` and mutations on: 18 passed (guest 14, setup 1, products.mutation 3). A product with an image can be registered, edited and deleted on the Vercel link. Leftovers 0.
- Every category / product / form spec fails on any browser console error or warning.
- HTML report: the attached report is the zipped `playwright-report/` of the final run against the Vercel link (`HW3-Neeraj-playwright-report.zip`, 2026-11-20, build `adb5df2`, 115 tests); checked for the QA login ID, the password and the saved session token (0 each). The login fields are filled by a helper (`setInputValueQuietly` in `e2e/helpers.ts`) that does not write the value into the report.
- Test cases: `docs/test-cases.md` / `.csv` — since 18 Nov in the WM DEV template; the developer ran the manual rows on 18 Nov (`docs/manual-run-2026-11-18.md`).
- Screenshots: `node scripts/screenshots/compare.mjs` (mocked API, Chromium; all 25 retaken on 2026-11-18 at 18:27 to 18:28 against the production build of the design-fix code `792ef82` on port 3100) — 5 screens × 1440 / 768 / 375 × light / dark. The design side shows the Korean Figma frames.

## Fixed after the design review (18 Nov)

Designer Bhagyashree, result "Resubmit". She reviewed the Vercel build at 1440 / 768 / 375 px, light and dark, against the Korean Figma frames 1.1.0, 8.1.0, 8.1.1 and 8.2.0. Her words: "A strong build: responsive (cards at ≤768, no sideways scroll), dark mode and the category tree are very good, and the 1440 layout follows the Figma frames closely." Three must-fix items, four should-fix items and some minor items. All are done in commit `792ef82`; the way the font is loaded was changed once more on 19 Nov (commit `636e258`).

1. **Logo (must-fix).** Before: a drawn single ring and the text "TalkingClub" on the header, and "TalkingClub | 관리자" on the login page. Now: the TalkingClub logo of the Figma frames (three-ring mark + wordmark) as one image with no text next to it, on the header, the login page, the 403 page, the 404 page, the error page and the no-permission popup. The Figma file has no vector logo, only a 158 × 30 px bitmap on a white background (the same file as `loginLogo.png` of the real admin project). The same artwork with a transparent background (512 × 107 px) was taken from the company's own web project (`talking-club-web-frontend/public/images/logo.png`) and saved as `public/brand/talkingclub-logo.png` (source confirmed by the developer on 18 Nov). `src/components/BrandLogo.tsx` shows it as an inline SVG: the mark is drawn from the file; the wordmark is filled with the current text colour through a mask, so it stays readable in dark mode; in dark mode the mark is made a little brighter (`$logo-mark-dark-filter` in `_tokens.scss`). On phones (≤ 480 px) the topbar shows the mark alone. Accessible name of the image: `TalkingClub`; the header link keeps `토킹클럽 홈 (Talking Club home)`; the login page keeps the hidden heading `토킹클럽 관리자 로그인 (Talking Club admin login)`; tab titles stay `… | 토킹클럽 관리자`. The favicon is now the mark (`src/app/icon.png`, was a drawn `icon.svg`). This answers design question 26.
2. **Colours and font follow the Figma styles (must-fix).** Light palette in `src/styles/_tokens.scss` (role: old → new, Figma style):
   - text `#1f2024` → `#181818` (Gray 130); secondary text `#4f535b` → `#505050` (Gray 110); muted text `#6b7079` → `#737373` (Gray 100); placeholder `#6b7079` → `#afafaf` (Gray 90, new role);
   - border `#e4e5e8` → `#eaeaea` (Background 100); strong border / input underline `#c4c6cc` → `#d9d9d9` (Gray 80); page background `#f6f6f8` → `#ffffff` (White); hover / subtle fill `#f6f6f8` → `#f7f7f7` (Background 90);
   - brand and primary `#ee2e5d` / `#d41f4e` → `#ef325b` (Talking Club); primary hover `#b3173f` → `#ac0c18` (Primary 110); table header and soft primary `#fdeef2` → `#fff1f3` (Primary 80);
   - danger `#c81e1e` → `#e66565` (Danger 100); new danger-strong `#a92e2e` (Danger 110, the filled danger button in confirm dialogs); danger soft `#fdecec` → `#ffdcdc` (Danger 90); disabled background `#d9d9dc` → `#d9d9d9` (Gray 80);
   - focus ring `#1d5fd0` (blue) → `#ef325b` (brand; dark mode `#ff5c85`).
   - Kept, because Figma gives no value: the success, warning and info colours, the overlay, the shadow and the dark palette (the design has no dark frames; in dark mode only the focus ring and the background of the active sub-menu row changed).
   - What you see: the light page background is white with bordered cards, as in the frames; the active sub-menu row is grey, not pink; the enabled `삭제 (Delete)` outline is the lighter Danger 100.
   - Font: the Figma text nodes use Pretendard. It is self-hosted as the "dynamic subset" of the npm package pretendard 1.3.9 (licence SIL OFL 1.1; the package is not a dependency): 92 small files in `public/fonts/pretendard/` and one `@font-face` rule per file with its `unicode-range` in `src/styles/pretendard-font.css` (imported in `src/app/layout.tsx`). The family name is `'Pretendard Variable'`, first in `$font-family-base`; PrimeReact uses it too; 'Inter var' is no longer loaded. The font is loaded as a dynamic subset: the browser downloads only the files for the characters a page shows (about 190 KB of fonts on the login page; in `792ef82` it was one 2.06 MB file, preloaded on every page).
   - Contrast: the Figma tokens are used as they are, and some are below WCAG AA (see Known limitations; design question 27).
3. **Disabled buttons are muted (must-fix).** A disabled `삭제 (Delete)` is a grey fill with a border of the same colour and a white label, like a disabled `CSV 다운로드 (Export CSV)`, in light and dark.
4. **Korean line breaks (should-fix).** `word-break: keep-all` on the whole page (Korean text breaks between words).
5. **Underline-only fields where the frames draw them (should-fix):** the search type and the search input of 8.1.0, and the text inputs and dropdowns of the product form (8.1.1 / 8.1.2); the textarea stays boxed, as drawn. The height stays 40 px; error = danger line + message; focus = 2 px brand line. Left boxed on purpose (not in the frames she named): the search of the 8.1.3 option picker and the input of the category add / edit dialog.
6. **Product list at ≤ 768 px (should-fix).** The search row stays visible; the four filters, `필터 초기화 (Reset filters)` and the hint sit behind a button `필터 (Filters)` (`aria-expanded`, `aria-controls`). It starts closed, also when filters are in the URL, and shows the number of active filters (accessible name `필터 N개 적용 중 (Filters, N in use)`). Desktop is unchanged. The open / closed state is not remembered across reloads; the search term is not counted as a filter.
7. **Category rows at ≤ 640 px are one line (should-fix):** `[code] name` together, the count under the name, the three actions at the right; the level badge is hidden there and `+ 소분류 (+ Minor category)` becomes a 40 × 40 px `+` button with the same accessible name.
8. **Minor items:** the focus ring is the brand colour; the tab bar of the details page no longer shows a native scrollbar; the rows-per-page select is 40 px high, like the buttons next to it; `필터 초기화 (Reset filters)` lines up with the fields at ≤ 1024 px; the pencil and trash icons of a category row are grey (the trash turns red on hover or keyboard focus). With item 3 this closes all three visual items that the QA round left open.

## Fixed after the QA round (18 Nov)

QA Archana, result "Resubmit"; the build was praised (90 checks passed on the Vercel build). Code changes in commit `586b91a`:

1. **`단가 (Unit price)` / `판매가 (Selling price)` were swapped (must-fix).** In the backend (`release/qa`) the shopping cart and the order charge `price` (`sellingPrice: product.price`), and the API refuses a product unless `unitPrice < price`. Now `판매가` and the list column `판매금액` = `price`, `단가` = `unitPrice`. Step 1 asks for `단가` first, then `판매가` (Figma 8.1.1 order), with the rule `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)`; the API key `unitPriceMustBeLessThanPrice` shows the same text. The list shows one price (`판매금액` = `price`, no crossed-out second price); CSV `단가` = `unitPrice`, `판매금액` = `price`; details, sort by `판매금액`, the default price of a picked single-item option and the step-4 summary use the same mapping. The Figma 8.1.2 description ("판매가 ≤ 정가") reads it the other way; design question 25.
2. **Dates (must-fix).** Every date is Korea time (KST, `Asia/Seoul`) for every viewer: list, details (`등록일자`, `수정일자`), CSV `등록일자` and the CSV file name, the draft "saved at" time. One place: `src/utils/format.ts` (dayjs `utc` + `timezone`, `DISPLAY_TIME_ZONE`).
3. **Test sheet (must-fix).** Now in the WM DEV template; manual rows run by the developer on 18 Nov (`docs/test-cases.md`, `docs/manual-run-2026-11-18.md`).
4. **English on screen (must-fix).** Tab titles `… | 토킹클럽 관리자` (were `… | TalkingClub Admin`); logo suffix `관리자` (was `Admin`) on login, 403, 404, error and the no-permission popup. Changed again by the design review: the logo is now the Figma logo image with no text next to it, so the text `관리자` next to the logo is gone (design review list above, item 1).
5. **Step-4 label (should-fix):** `ERP 단가 (ERP unit price)` (was `단가`).
6. **Vercel run (should-fix):** the whole suite (105 tests at that time) ran against the Vercel link on build `586b91a`, 105 passed (above, earlier run).
7. **Three visual items (should-fix):** fixed after the design review, commit `792ef82` (the rows-per-page select height, the red border of the disabled `삭제 (Delete)`, the indent of `필터 초기화 (Reset filters)`).
8. **Found by the developer's manual run, fixed (CSS only, commit `733655c`):** the row `노출여부 (Exposure Status)` select keeps its own width, so `아니오 (No)` is no longer cut on a narrow table (PL-023); `body` uses `overflow-x: clip` instead of `hidden`, so the sticky sidebar and topbar stay in view on long pages (LG-031).
9. **One bug found by the developer's manual re-run on the final build (19 Nov), fixed in commit `adb5df2`:** with the cursor in an empty field of the product form, the first mouse click on `다음 (Next)` did nothing. The form checks a field when it loses focus, so the field's message appeared on mouse-down, the footer moved 26 px down before the mouse button was released, and the click never reached the button (the second click worked; keyboard use and a click with no field focused were not affected, so the automated tests did not see it). Now `취소 (Cancel)`, `이전 (Back)`, `다음 (Next)` and `등록 (Register)` / `저장 (Save)` keep the focus in the field on mouse-down, so the first click arrives and the step is checked as a whole. New test: `product-form-states.spec.ts › the first mouse click on 다음 is not lost when the cursor is in an empty field` (it fails on the build before the fix). Test case PF-035.

Review status: code review **Pass** (Kakali, 18 Nov; the explanation call is still to come). QA (Archana): Resubmit on 18 Nov; the fixes are done; to be re-tested on the final build `adb5df2`. Design (Bhagyashree): Resubmit on 18 Nov; the fixes are done in `792ef82`; re-check on 20 Nov: **Pass** (on build `636e258`). Final result: Friday 20 Nov.

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
- **Colours only through tokens:** palette in `src/styles/_tokens.scss` (named colour + code, one dark value per light value). Every light value is the hex of a Figma style, and its comment starts with the style name. Components use only `var(--color-*)` — no hex / rgb anywhere else. Spacing, font sizes, radii and breakpoints also from tokens / mixins.
- **Font and logo:** the font is Pretendard (the font of the frames), self-hosted as a dynamic subset (`src/styles/pretendard-font.css`), first in `$font-family-base`. The logo is shown only through `BrandLogo`. `word-break: keep-all` for Korean text.
- **Class names** lowercase-with-hyphens; a plain-words comment above each main block.
- **Reuse first:** shared `PageHeader`, `StateWrapper`, `EmptyState`, `ErrorState`, `TableSkeleton`, `ListPagination`, `AlertDialog`, one global Toast and ConfirmDialog; PrimeReact components before custom ones.
- **Data layer:** endpoints → service (`CoreAPIService`, one `ApiError`) → TanStack Query hook; query keys only from `src/utils/query-keys.ts`; screens never call axios directly; mutations invalidate their keys.
- **Permissions** only through `navigation.ts` + `useCan()` — no role checks written by hand in screens.
- **URL state** for list filters / page / sort, form step and details tab.
- **a11y:** every input labelled, icon buttons have `aria-label`, errors `role="alert"`, loading `role="status"`, visible focus ring from tokens, keyboard alternatives for drag-and-drop and tabs.
- **Formats:** `formatDateTime` → `YYYY/MM/DD HH:mm` (always Korea time, `Asia/Seoul`), `formatWon` → `₩1,000`, `-` when empty.
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

The QA API is in maintenance (notice from Kakali, 18 Nov). API problems are not fixed or worked around; each one is labelled **API issue**, and an API issue does not block Pass.

- On the Vercel link an image may be at most 4 MB (platform limit for function request bodies). Since 18 Nov 4 MB is also the default for any build. For the same reason the 5 MB part of the 413 test runs only against a local server.
- API issue: the QA API is sometimes slow (the first login answer of a run took more than 5 s on 17 and 18 Nov; once `GET /products/categories` did not answer within 15 s). The live login-error tests wait up to 15 s.
- API issue: the category list API has no paging or sort parameter — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (question 7).
- API issue: the QA API keeps one live session per account: a new login or logout revokes the previous token (401 on the next request) although its `exp` is 24 h ahead; this decides the test run order.
- API issue: the API has no sort parameter → sort works within the current page only (question 6).
- API issue: no refresh token (QA CORS is `origin: *` without credentials) → after the 1-day token the user logs in again and returns to the same page.
- Max 3 main categories in the API; QA already has 3, so main-category create can't be tried on QA (question 8).
- API issue: removing every option on edit is not saved by the API (old options stay); the form shows a note.
- Drag reorder does not work on touch screens; Alt + ↑ / ↓ needs a keyboard (question 19).
- API issue: a search by category name (`GET /products?type=categoryName&search=…`) also returns deleted products whose medium or minor category name matches (the OR conditions are not in brackets); the list shows them as normal rows.
- By design: the row selection is kept when the search or the filters change; the selection bar always shows how many rows are selected, with a `선택 해제 (Clear)` action.
- The browser Back button leaves the form without the unsaved-changes dialog.
- Contrast: some Figma tokens are below WCAG AA (4.5:1 for text, 3:1 for non-text parts). The designer asked for the Figma tokens, so the app uses them as they are; before this round the app used darker values that passed AA. Design question 27 asks if they should stay.
  - primary `#ef325b` with white: 3.98:1 (labels of primary buttons, the current page in the pager, links, the active menu);
  - Danger 100 `#e66565` on white: 3.27:1 (error text under a field, the label of the enabled `삭제 (Delete)`);
  - placeholder Gray 90 `#afafaf`: 2.19:1; grey row icons `#99a1af`: 2.60:1;
  - Gray 80 underline / outline `#d9d9d9`: 1.41:1 (non-text).
- Still different from the frames: the form has 4 steps and the list has filters that Figma does not draw (both are earlier decisions); the enabled `삭제 (Delete)` is a danger outline (the frame draws a grey outline); field text is 14 px (Figma 16 px) and the −0.6 px letter-spacing of the frames is not applied; read-only fields have a dashed underline; dark mode is not in Figma.
- Wording decisions where the Korean frames disagree with each other are listed as design questions 20 to 24; the price mapping that follows the API is question 25 (`docs/design-questions.md`). Question 26 (the TalkingClub wordmark) is answered by the design review: the logo is the Figma logo image.
- Only a SUPER_ADMIN account exists on QA; other roles are verified with injected sessions in `e2e/roles.spec.ts`.
- Not checked: Safari and Firefox (Chromium only), a HiDPI screen, the no-permission popup with a real non-admin login (no such account on QA).
- No longer known issues: fixed in the code review round — the S3 CORS block of the browser upload, a comma in an image file name, the 5th image, the edit draft overwriting newer data; fixed in the QA round — the swapped `단가` / `판매가`, dates in the viewer's time zone, English in the tab title and next to the logo; fixed after the developer's manual run (`733655c`) — the cut `아니오 (No)` in the row status select, the sidebar / topbar that scrolled away; fixed in the design review round (`792ef82`) — the three small visual items (the rows-per-page select height, the red border of the disabled `삭제 (Delete)`, the indent of `필터 초기화 (Reset filters)`), the drawn logo, and colours and font that did not follow the Figma styles.

## Logins

The shared QA admin login comes **by DM**. It is not in this PR, the docs or the tests (tests read `E2E_ADMIN_ID` / `E2E_ADMIN_PASSWORD` from `.env.local`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
