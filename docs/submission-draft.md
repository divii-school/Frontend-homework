# HW3 submission draft — Neeraj Gurjar (2026-11-17)

Built from the Notion assignment page (416326b2…) and the submission page (416326b2…3317e), both fetched on 2026-11-17: the page has **nine sections** (titles below are exact) and four properties (HW3 status, Submitted on, Vercel link, Branch / PR link). Paste each block under the matching heading. Placeholders in `<…>` need a value at submission. No logins, tokens or passwords anywhere in this file.

Status on 2026-11-17: the code review by Kakali came back with the result "Resubmit" (the code was praised; 2 must-fix and 4 should-fix items). All six items are fixed; see "Fixed after the code review (17 Nov)" right below. Labels of the UI are written as Korean text followed by the English meaning in brackets, because the whole UI is Korean now.

## Fixed after the code review (17 Nov)

1. **UI language (must-fix).** The whole UI text is now Korean and follows the Korean Figma frames (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리 (Shopping Mall Management)": 8.1.0 `8010:59065`, 8.1.1 `8010:57833`, 8.1.2 `5498:84860`, 8.1.3 `8034:61058`, 8.2.0 `5498:84158`; login `4019:78451`). `docs/ko-glossary.md` lists all 562 strings (English before, Korean now, source). PrimeReact's built-in texts use a Korean locale (`src/providers/primereact-locale.ts`), `<html lang="ko">`, and an unknown API message key falls back to the Korean server-error text. The `accept-language` request header stays `en` on purpose: the API answers with message keys, and the app maps the keys to Korean text.
2. **Image upload (must-fix).** The browser no longer sends the file to S3. `UploadService` posts the file and the signed URL to the app's own route `POST /api/upload` (`src/app/api/upload/route.ts`), and the server sends it to S3. So the S3 bucket CORS no longer matters. The route checks: logged-in session (401 JSON), only the `talking-club-dev` bucket (400), file type (415), size (413), S3 refusal (502). It is left out of the middleware matcher because Next 15.5 passes only the first 10 MB of a body through middleware; the route checks the session itself. Size limit: `NEXT_PUBLIC_MAX_IMAGE_MB` (default 4, because Vercel functions refuse request bodies above 4.5 MB).
3. **A 5th image (should-fix).** A 5th image can no longer be added or saved: a guard on every add / Undo / Retry path plus a form rule.
4. **Comma in a file name (should-fix).** Commas are removed from image file names before the upload (`src/utils/image-file.ts`, `safeFileName`).
5. **Edit draft (should-fix).** An edit draft is restored only if the product was not changed on the server since the draft was saved (the check compares `updatedAt` plus the option rows). Otherwise the draft is dropped with a notice, and the edit screen always loads a fresh copy. Create drafts are unchanged.
6. **Default error toast (should-fix).** `QueryCache` and `MutationCache` in `src/utils/query-client.ts` show a default error toast. Hooks whose screen shows its own error opt out with `meta: SHOWS_OWN_ERROR`. A 401 and a cancelled request never toast.

After the code re-check of 18 Nov (code result Pass; two small points, both done): the image size limit defaults to **4 MB** (Vercel functions refuse request bodies above 4.5 MB, so a deployment without `NEXT_PUBLIC_MAX_IMAGE_MB` still works), and `/api/upload` sends files **only to the `talking-club-dev` bucket** (server-only setting `UPLOAD_S3_BUCKET`; any other host, including another S3 bucket, gets 400).

---

## 1. Branch and PR link

- Branch: `hw3/neeraj` (repo `divii-school/Frontend-homework`)
- PR to `main` (never merged): https://github.com/divii-school/Frontend-homework/pull/2
- Commits on `origin/hw3/neeraj`: `b2e2974` (first build), `85e0572` (earlier review fixes), `8c968d7` (docs), `8b2f596` (code-review fixes: upload route, 5th image, comma, edit draft, error toast), `356dc8d` (Korean UI). One more docs commit follows (branch head).
- PR description text: `docs/pr-description.md`

## 2. Vercel link (latest build)

https://tc-admin-hw3-neeraj.vercel.app (own Vercel project, branch `hw3/neeraj`, runs commit `356dc8d`; `NEXT_PUBLIC_API_BASE_URL` set to the QA API, `NEXT_PUBLIC_MAX_IMAGE_MB=4`, deployment protection off).

Note for the testers: product images are uploaded through the app's own route `/api/upload`, so the upload works on the Vercel link. On the Vercel link an image may be **at most 4 MB** (platform limit; since 18 Nov 4 MB is also the default for any build). Checked on the deployed link on 2026-11-17 (17:45 to 17:47): `npx playwright test products.mutation --project=chromium` with `PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app` and mutations on: 18 passed (guest 14, setup 1, products.mutation 3). So a product with an image was registered, edited and deleted on the Vercel link. Leftovers 0.

## 3. How to run it (no secrets; "logins from DM")

```
git checkout hw3/neeraj
npm install                 # .npmrc has legacy-peer-deps (PrimeReact 10 + React 19)
copy .env.example .env.local
```
In `.env.local` set `NEXT_PUBLIC_API_BASE_URL` to the QA API (`…/api/v1`). Optional: `NEXT_PUBLIC_MAX_IMAGE_MB` (largest image in MB, default 4). For the Playwright tests also set `E2E_ADMIN_ID` and `E2E_ADMIN_PASSWORD` — the QA admin login comes **by DM**, it is not in the repo, docs or tests.
```
npm run dev                 # http://localhost:3000 → /login → /shopping-mall/products
npm run type-check ; npm run lint ; npm run build
npx playwright install chromium   # once (Playwright 1.64.1 browser)
npm run test:e2e            # guest + setup + mocked + read-only specs (see run order below)
npm run test:e2e:mutations  # E2E_ALLOW_MUTATIONS=1, only HW3-Neeraj- records
npm run test:e2e:report     # open the HTML report
```
The full run of section 5 (all 104 tests, including the create / edit / delete specs), in PowerShell. The production build is served on port 3100:
```
npm run build ; npx next start -p 3100                         # terminal 1
$env:E2E_ALLOW_MUTATIONS="1"; $env:PLAYWRIGHT_BASE_URL="http://localhost:3100"   # terminal 2
npx playwright test --output=test-results/pw-artifacts --trace=off
```
The image upload goes through `/api/upload` of the app itself, so no special port is needed any more. The option `E2E_MAP_3000_TO` still exists in `playwright.config.ts`, but it is no longer needed for the upload. Without `E2E_ALLOW_MUTATIONS=1` the product save is not run.
Run order (the QA API keeps one live session per account: a login / logout by the same user revokes the earlier token): `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, setup and then the chromium specs in a safe order. By hand: `--project=setup` (runs guest first), then each chromium spec file with `--no-deps`.
Playwright is pinned to 1.64.1 (its Chromium build is the only one allowed on the author's laptop) — do not upgrade it.

## 4. Prompts and skills used, and one problem you solved

Source: `docs/session-prompts.md`.

**My prompts (verbatim, Claude Code in VS Code):**

2026-11-13
1. `https://divii.slack.com/archives/D0ADCGKUNSK/p1794491160704229 ye check kro or ab kya kam karna hai`
2. `@Kakali Dinda ( Frontend ) ka last msg dekho vo kya bol rhi hai`
3. (pasted Kakali's HW3 DM — login removed) `ye msg tha ab dekho or btao kya krana hai`
4. `kya kya kar sakte hai jo bhi karna hai kar do`
5. `ab try kro` / `fir se try karna` / `try kro shi chal rha hai` (resuming after network errors)

2026-11-17 (after the code review)
6. `bhai ye dehko or improve kro` (sent with the link to Kakali's review message)

**What Claude did (plan-first):** read the Slack DM, the TL page, my submission page and the training page (Notion), the Figma frames (login 4019:78447, shopping 5498:98250 → 8.1.0–8.1.3, 8.2.0) and the real API code (`talking-club-backend`, `release/qa`). Wrote the plan first (`docs/hw3-plan.md`, `docs/design-questions.md`), then built in steps — foundation (auth, one nav / permission config, light/dark tokens, layout, services + hooks) → three screens (categories / product list + details / multi-step form) → fixes → lint, type-check, build, Playwright → QA documents. On 16–17 Nov, when the QA API was back, Claude ran the live read-only specs one command at a time, then the mutation specs, then updated the QA docs so every number is true. After the code review of 17 Nov, Claude fixed the six review items (see the list at the top), switched the whole UI to Korean using the Korean Figma frames, wrote `docs/ko-glossary.md`, ran the full test suite once more and updated all documents.
**Skills / tools:** Notion, Slack and Figma connectors; Claude Code subagents for the foundation, each screen and the QA documents; Playwright for tests and screenshots.

**Problems solved**
1. *The QA API was down (Cloudflare 521) on the build day.* Every screen got a mocked spec (`*-states.spec.ts`, `page.route` + injected session) and a `mocked` Playwright project without a login dependency, so loading / empty / 403 / 500 / network / rollback states were tested while the server was down. When the API came back (16–17 Nov) the live read-only specs passed 5 + 6 + 4 + 4, plus the category mutation spec.
2. *Refresh token vs CORS.* The refresh token is an httpOnly cookie but the QA CORS is `origin: *`, so a browser on another domain never sends it. Expiry is handled by decoding `exp` from the JWT and going to `/login?returnTo=<same page>`.
3. *Live test order.* The first live `categories.spec.ts` run failed 5 of 5 with 401: the QA API keeps one live session per account and the guest login / logout tests had revoked the token saved by `setup`. Fixed by making `setup` depend on `guest` in `playwright.config.ts` (guest → setup → chromium).
4. *Playwright hung with no output on Windows* when its log files sat inside `test-results/` (Playwright empties that folder at start). Fixed with `--output=test-results/pw-artifacts`.
5. *The S3 bucket CORS blocked the browser upload* (it accepted only the origin `http://localhost:3000`, so the upload failed on the Vercel link). Fixed in the code review round: the browser posts the file to the app's own route `/api/upload` and the server sends it to S3. CORS is a browser rule, so the bucket settings no longer matter. The route is not an open proxy: it checks the session, accepts only the `talking-club-dev` bucket, and checks type and size again.

## 5. lint / type-check / build / Playwright output + HTML report

Final gates, 2026-11-17, PowerShell. The gates ran first with no server running; then the production build was served with `npx next start -p 3100`, and the whole Playwright suite ran as **one command** (so one HTML report holds every test):

```
npm run type-check    exit 0   tsc --noEmit, 0 errors
npm run lint          exit 0   0 errors, 0 warnings
npm run build         exit 0   compiled successfully, 11 pages (including the new route /api/upload) + middleware

E2E_ALLOW_MUTATIONS=1  PLAYWRIGHT_BASE_URL=http://localhost:3100
npx playwright test --output=test-results/pw-artifacts --trace=off
                      104 passed (3.7 min) · 0 failed · 0 flaky · 0 skipped · 17:32 to 17:36 (first attempt)
  guest      14 passed   auth.spec 9 (incl. 4 live login tests) · roles.spec 5
  mocked     66 passed   categories-states 18 · default-error-toast-states 5 · product-form-states 20
                         · products-states 15 · session-expiry-states 1 · upload-route-states 7
  setup       1 passed   live UI login (auth.setup)
  chromium   23 passed   live: categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
                         · product-form.spec 4 · categories.mutation.spec 1 (add sub + 2 minor, rename, reorder, delete)
                         · products.mutation.spec 3 (register with a real image through /api/upload, edit, bulk delete)
leftover check        0 products and 0 categories named HW3-Neeraj-* remain
```

**Re-run after the re-check fixes (2026-11-18):** gates again 0 / 0 / 0, then the same one command on the production build: **104 passed** (3.3 min), 10:06 to 10:09, including `products.mutation.spec.ts` (real image upload through `/api/upload` to the `talking-club-dev` bucket) and the stricter `upload-route-states.spec.ts` (another bucket is refused). The first attempt at 10:04 stopped on the live login-error test only: the QA API answered too slowly (the `로그인 (Login)` button was still busy after 5 s; a probe right after measured 0.8 to 2.7 s per login answer). No code or test was changed between the two attempts. Leftovers 0; the new report zip was checked: login ID 0, password 0, session token 0.

Honest summary: every spec marked live above ran against the QA API, including product register / edit / delete with a real image upload to S3 through the app's own route `/api/upload` (no special port is needed, `E2E_MAP_3000_TO` was not used). The `mocked` project uses a mocked API. The run passed on the first attempt. The same mutation spec also passed on the deployed Vercel link (18 passed: guest 14, setup 1, products.mutation 3; 17:45 to 17:47). The full logs are kept outside the repo; the numbers above are copied from them. Run notes: `docs/live-run-2026-11-16.md` (last section).

Fixed earlier on 17 Nov after two internal reviews (details: `docs/qa-build-report.md` part 4): a second tab no longer logs the first tab out; the pager fits on one line at 375 px; a percent-encoded URL no longer gets past the route guards; Log out removes unsaved product form drafts; Register sends a fresh product code; CSV export guards text that starts with `-`; an edit with "상품 구매 필수 옵션 선택 (Required option for purchase)" on and no option rows can be saved; Register stays disabled after a successful save. The tests grew from 81 to 84 there, and to 104 with the code-review fixes (new files `upload-route-states.spec.ts` and `default-error-toast-states.spec.ts`, more tests in `product-form-states.spec.ts`).

HTML report: zipped `playwright-report/` of the full run above (`HW3-Neeraj-playwright-report.zip`, 104 tests), attached to the page; checked that it contains no login data (the QA login ID, the password and the saved session token were counted in the report: 0 each). The login fields are filled by a test helper that does not write the typed value into the report.

## 6. Unit test case sheet link

`<Google Sheet link — import docs/test-cases.csv (File → Import → Upload), then paste the link>`
Content: `docs/test-cases.md` / `.csv` — 123 cases (63 positive, 60 negative) in the WM QA template columns; 90 are covered by a Playwright test, 33 are manual. Labels in the steps and expected results are Korean text followed by the English meaning in brackets. Result column as of 2026-11-17: 6 Pass, 16 Pass (live), 19 Pass (mocked) + live Pass, 45 Pass (mocked) only, 4 Pass (mocked) + screenshots, 4 screenshots only, 26 manual for QA, 2 no role account, 1 known issue. Every Pass comes from the one full run in section 5 (104 passed); the screenshot results come from the screenshots retaken on 2026-11-17 at 17:40 (section 8). Cases added after the code review: LG-027 to LG-029 (Korean UI, default error toast) and PF-027 to PF-034 (upload route, size limit, 5th image, comma, edit draft).

## 7. Build report for QA

Full text: `docs/qa-build-report.md` (10 parts, dated 2026-11-17) — post it as a comment on the TL task. Key points:

- **Fixed after the code review of 17 Nov** (part 4 of the report): the UI is Korean; the image upload goes through the app's own route `/api/upload`; a 5th image is blocked; commas are removed from image file names; an outdated edit draft is dropped with a notice; a default error toast exists (see the list at the top of this file).
- **Verified live (QA API):** login, logout, wrong ID / password messages, returnTo; categories (read-only specs and the create / rename / reorder / delete flow under an existing main category); product list (search, filters, URL state, selection, CSV export); details tabs; form steps; product register (with the real image upload to S3 through `/api/upload`) / edit / delete — also on the Vercel link.
- **Verified only with a mocked API / injected session:** roles other than SUPER_ADMIN (no such account on QA), loading / empty / 401 (mid-session expiry to /login?returnTo, session-expiry-states.spec.ts) / 403 / 404 / 500 / network states, the `/api/upload` refusals (401 / 400 / 415 / 413 / 502), the default error toast.
- **Known issues now:**
  - On the Vercel link an image may be at most **4 MB** (platform limit for function request bodies). Since 18 Nov 4 MB is also the default for any build.
  - After a login or logout by the same user, the earlier token answers 401 on the next authenticated request although `exp` is still 24 h ahead (one live session per account).
  - `GET /products` has no sort parameter (always `id DESC`) → sort works within the current page only.
  - Category list has no paging or sort parameter — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (design question 7).
  - The category tree allows at most 3 main categories; QA already has 3 → main-category create cannot be tried on QA.
  - Removing every option on edit is not saved by the API (old options stay).
  - CORS `origin: *` → the refresh cookie cannot be used; after the 1-day token the user logs in again and returns to the same page.
  - `GET /products?type=categoryName&search=<name>` (search by category name) → also returns deleted products whose medium or minor category name matches (API side: the OR conditions are not in brackets after `isDeleted = false`; seen in the release/qa backend code). The list shows them as normal rows.
  - Only a SUPER_ADMIN account exists on QA. Firefox and Safari were not checked.
- **By design:** the row selection is kept when the search or the filters change; the selection bar always shows how many rows are selected, with a Clear action (`선택 해제`), and bulk delete deletes every selected product.
- **Known limitation:** the browser Back button leaves the form without the unsaved-changes dialog; drag reorder does not work on touch screens (Alt + ↑ / ↓ alternative).
- **Visual polish still open (768 / 375 px, three small items):** the rows-per-page select is not the same height as the buttons next to it; the disabled Delete button keeps its red border; the "필터 초기화 (Reset filters)" button is indented a little. (On the screenshots retaken on 17 Nov the cut step label at 768 px, the breadcrumb line starting with "/" at 375 px and the wrapped registration time no longer appear.)
- **No longer known issues (fixed):** the S3 CORS block of the browser upload, a comma in a file name, the 5th image, the edit draft overwriting newer data.

## 8. Side-by-side screenshots (design | your screen) at 1440 / 768 / 375, light and dark

Files in `docs/screenshots/` (25 PNGs and `README.md`; retaken 2026-11-17 at 17:40 by `scripts/screenshots/compare.mjs` against the production build on port 3100, mocked API, Chromium). The design side now shows the **Korean** Figma frames (new exports in `docs/design/` for 8.1.0, 8.1.1, 8.1.2, 8.1.3 and 8.2.0; the login frame was already Korean). At 1440 each screen is design | build light | build dark. Category and product names in the screenshots are sample data and stay English.

| Screen | 1440 design \| build | 768 | 375 |
|---|---|---|---|
| Login | `compare-1440-login.png` | `build-768-light-login.png` · `build-768-dark-login.png` | `build-375-light-login.png` · `build-375-dark-login.png` |
| Product list | `compare-1440-product-list.png` | `build-768-light-product-list.png` · `build-768-dark-product-list.png` | `build-375-light-product-list.png` · `build-375-dark-product-list.png` |
| Product form, step 1 | `compare-1440-product-form.png` | `build-768-light-product-form.png` · `build-768-dark-product-form.png` | `build-375-light-product-form.png` · `build-375-dark-product-form.png` |
| Product details | `compare-1440-product-details.png` | `build-768-light-product-details.png` · `build-768-dark-product-details.png` | `build-375-light-product-details.png` · `build-375-dark-product-details.png` |
| Categories | `compare-1440-categories.png` | `build-768-light-categories.png` · `build-768-dark-categories.png` | `build-375-light-categories.png` · `build-375-dark-categories.png` |

Not in Figma (written as design questions, `docs/design-questions.md`, 24 questions): the details page, dark mode, the 768 / 375 frames, and the wording decisions where the Korean frames disagree with each other (questions 20 to 24). They are built from the same tokens. Upload the PNGs to the Notion page (or link the pushed files) — upload step is in the checklist.

## 9. Your explanation: auth flow, route guard, table state in the URL, multi-step form, image upload

Source: `docs/explain-notes.md` (open the files while explaining).

- **Auth flow.** `POST /auth/login { loginId, password }` returns `data.token` (JWT, 1 day) and `data.user`. Non-HQ roles get the "관리자 권한이 없습니다. (You do not have admin permission.)" popup and the session is dropped. Otherwise token + user go to localStorage ("자동 로그인 (Auto login)" ticked) or sessionStorage, and a small cookie lets the server middleware see the login. Then the user goes to `returnTo` — relative paths only, so a link cannot send users to another site. Every call adds `Authorization: Bearer` and the three Talking Club headers (`CoreAPIService`); the `accept-language` header stays `en` on purpose, because the API answers with message keys and the app maps them to Korean text. Expiry: `exp` is decoded from the JWT; if expired or the API answers 401, the session is cleared and the user goes to `/login?returnTo=<page>`. The refresh token is not used because the QA CORS is `origin: *`, so the cookie is never sent cross-site. Logout: `GET /auth/logout`, clear storage, cookie and any unsaved product form draft of the tab (a 401 / expiry keeps the draft for the same user).
- **Route guard.** One config, `src/config/navigation.ts`, lists each page with roles and permission module; the sidebar, both guards and the buttons (`useCan`) read it, so they cannot disagree. Layer 1: `middleware.ts` on the server (no / expired cookie → login with returnTo; role not allowed → `/403`; the path is decoded first, so `/shopping-mall/%63ategories` is checked as `/shopping-mall/categories`). The upload route `/api/upload` is outside the middleware matcher and checks the session itself (JSON 401). Layer 2: `RouteGuard` on the client (also GENERAL_ADMIN's `shopping_mall` permission). Layer 3: buttons via `useCan`. No role is checked by hand in a screen. Tested in `e2e/roles.spec.ts`.
- **Table state in the URL.** The list has no `useState` for page / search / filters / sort; the URL is the state (`?page=2&limit=10&q=…&categoryId=…&sort=…`). `parseListParams()` reads it into one typed object, `toSearchString()` writes it back, every control calls `update()` → `router.replace`, and a filter change resets `page` to 1. Refresh and shared links show the same list; filter clicks use replace, so they do not fill the browser history. `toApiQuery()` builds the API query that is also the TanStack Query cache key. Sort is current-page only because the API has no sort parameter.
- **Multi-step form.** One react-hook-form `useForm` for all 4 steps, all sections inside one `<form>` and only the current one visible, so nothing unmounts and values survive Back / Next. The step is in the URL (`?step=`). "다음 (Next)" runs `trigger()` on that step's fields only (`STEP_FIELDS`) and focuses the first error. Rules match the API (e.g. selling price < unit price). A draft is saved in sessionStorage after half a second and restored after a reload. In edit mode the draft is restored only if the product was not changed on the server since the draft was saved (`updatedAt` plus the option rows are compared with a copy fetched now); otherwise it is dropped with a notice. In create mode "등록 (Register)" asks for a fresh product code right before the POST. On an API error nothing is cleared: field errors go back onto their field with `setError` and the stepper jumps to that step. Errors that a screen does not show itself get the default error toast from `QueryCache` / `MutationCache`; hooks that show their own error opt out with `meta: SHOWS_OWN_ERROR`.
- **Image upload.** The browser checks type (JPG / PNG / GIF / WEBP), size (≤ `NEXT_PUBLIC_MAX_IMAGE_MB`, default 4 MB) and count (≤ 4, guarded on every add / Undo / Retry path and by a form rule) first — a bad file sends no request. Commas are removed from the file name (`safeFileName`). `POST /utils/upload-file-urls` returns `{ url, preview, filePath }`; the browser then posts the file and the signed URL to the app's own route `POST /api/upload`, and **the server** sends the file to S3 (so the bucket CORS does not matter). The route checks the session (401), the S3 host (400, only the `talking-club-dev` bucket), the file type (415), the size (413) and the S3 answer (502). Only after the route answers OK are `filePath` (stored by the product API) and `preview` (thumbnail) added to the form. Remove = trash icon with Undo; a failed upload shows Retry.

---

## Still to do at submission

- [x] Work committed on `hw3/neeraj` and pushed (17 Nov: `b2e2974`, `85e0572`, `8c968d7`, `8b2f596`, `356dc8d`; one more docs commit follows; `.env.local` never committed).
- [x] PR to `main` opened (never merge it): https://github.com/divii-school/Frontend-homework/pull/2
- [x] Own Vercel project `tc-admin-hw3-neeraj`: production deploy of `hw3/neeraj` (commit `356dc8d`), `NEXT_PUBLIC_API_BASE_URL` set (API URL only, no logins), `NEXT_PUBLIC_MAX_IMAGE_MB=4`, deployment protection off.
- [x] HTML report of the full run (104 passed, 2026-11-17, 17:32 to 17:36) zipped as `HW3-Neeraj-playwright-report.zip` (kept outside the repo); secret check done: login ID 0, password 0, session token 0.
- [ ] Attach the new `HW3-Neeraj-playwright-report.zip` (104 tests) to section 5 of the Notion page, in place of the older report. If the tests are run again, check the new report the same way before attaching it.
- [ ] Import `docs/test-cases.csv` into a Google Sheet and put the link in section 6 (the CSV file itself is attached to the page).
- [ ] Upload the 25 screenshots retaken at 17:40 (Korean UI and Korean design frames) to section 8 of the Notion page, in place of the older ones.
- [ ] Update the nine sections of the Notion page from this file (the code review changed sections 1, 2, 3, 5, 6, 7, 8 and 9).
- [ ] Properties `HW3 status` → Submitted and `Submitted on`.
- [ ] Post the new build report (`docs/qa-build-report.md`) in section 7 of the Notion page.
- [ ] Answer Kakali's review message ("fixed, resubmitted") and comment on the TL page "HW3 resubmitted" + link, tagging Kakali.
- [ ] Decide with Kakali the open wording questions (design questions 20 to 24).
- [ ] After the final result on 20 Nov: delete the Vercel project.
