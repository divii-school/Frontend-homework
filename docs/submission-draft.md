# HW3 submission draft — Neeraj Gurjar (2026-11-17)

Built from the Notion assignment page (416326b2…) and the submission page (416326b2…3317e), both fetched on 2026-11-17: the page has **nine sections** (titles below are exact) and four properties (HW3 status, Submitted on, Vercel link, Branch / PR link). Paste each block under the matching heading. Placeholders in `<…>` need a value at submission. No logins, tokens or passwords anywhere in this file.

---

## 1. Branch and PR link

- Branch: `hw3/neeraj` (repo `divii-school/Frontend-homework`)
- PR to `main` (never merged): `<PR link — fill at submission>`
- Commit: `<commit hash — fill at submission>`
- PR description text: `docs/pr-description.md`

## 2. Vercel link (latest build)

`<Vercel URL — fill at submission>` (own Vercel project, branch `hw3/neeraj`, `NEXT_PUBLIC_API_BASE_URL` set to the QA API, deployment protection off).

Note for the testers: the browser image upload to S3 is refused by the bucket CORS for every origin except `http://localhost:3000` (checked 2026-11-17: a `vercel.app` origin, the QA admin origin and `http://localhost:3100` get 403; details in section 7), so registering a product with an image will fail on the Vercel link until the backend adds the origin. The upload itself is proven by the automated run in section 5, which used the origin `http://localhost:3000`. Everything else works against the QA API.

## 3. How to run it (no secrets; "logins from DM")

```
git checkout hw3/neeraj
npm install                 # .npmrc has legacy-peer-deps (PrimeReact 10 + React 19)
copy .env.example .env.local
```
In `.env.local` set `NEXT_PUBLIC_API_BASE_URL` to the QA API (`…/api/v1`). For the Playwright tests also set `E2E_ADMIN_ID` and `E2E_ADMIN_PASSWORD` — the QA admin login comes **by DM**, it is not in the repo, docs or tests.
```
npm run dev                 # http://localhost:3000 → /login → /shopping-mall/products
npm run type-check ; npm run lint ; npm run build
npx playwright install chromium   # once (Playwright 1.64.1 browser)
npm run test:e2e            # guest + setup + mocked + read-only specs (see run order below)
npm run test:e2e:mutations  # E2E_ALLOW_MUTATIONS=1, only HW3-Neeraj- records
npm run test:e2e:report     # open the HTML report
```
The full run of section 5 (all 81 tests, including the create / edit / delete specs), in PowerShell. Port 3000 was used by another app, and the S3 bucket accepts the image upload only from the origin `http://localhost:3000`, so the app runs on 3100 and `E2E_MAP_3000_TO=3100` makes Chromium open `http://localhost:3000` while it connects to port 3100 (the other app is never contacted):
```
npm run build ; npx next start -p 3100                         # terminal 1
$env:E2E_ALLOW_MUTATIONS="1"; $env:E2E_MAP_3000_TO="3100"       # terminal 2
npx playwright test --output=test-results/pw-artifacts --trace=off
```
Without the mutation specs and without the mapping: `PLAYWRIGHT_BASE_URL=http://localhost:3100` (then product save is not run).
Run order (the QA API keeps one live session per account: a login / logout by the same user revokes the earlier token): `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, setup and then the chromium specs in a safe order. By hand: `--project=setup` (runs guest first), then each chromium spec file with `--no-deps`.
Playwright is pinned to 1.64.1 (its Chromium build is the only one allowed on the author's laptop) — do not upgrade it.

## 4. Prompts and skills used, and one problem you solved

Source: `docs/session-prompts.md`.

**My prompts (verbatim, Claude Code in VS Code, 2026-11-13):**
1. `https://divii.slack.com/archives/D0ADCGKUNSK/p1794491160704229 ye check kro or ab kya kam karna hai`
2. `@Kakali Dinda ( Frontend ) ka last msg dekho vo kya bol rhi hai`
3. (pasted Kakali's HW3 DM — login removed) `ye msg tha ab dekho or btao kya krana hai`
4. `kya kya kar sakte hai jo bhi karna hai kar do`
5. `ab try kro` / `fir se try karna` / `try kro shi chal rha hai` (resuming after network errors)

**What Claude did (plan-first):** read the Slack DM, the TL page, my submission page and the training page (Notion), the Figma frames (login 4019:78447, shopping 5498:98250 → 8.1.0–8.1.3, 8.2.0) and the real API code (`talking-club-backend`, `release/qa`). Wrote the plan first (`docs/hw3-plan.md`, `docs/design-questions.md`), then built in steps — foundation (auth, one nav / permission config, light/dark tokens, layout, services + hooks) → three screens (categories / product list + details / multi-step form) → fixes → lint, type-check, build, Playwright → QA documents. On 16–17 Nov, when the QA API was back, Claude ran the live read-only specs one command at a time, then the mutation specs, then updated the QA docs so every number is true.
**Skills / tools:** Notion, Slack and Figma connectors; Claude Code subagents for the foundation, each screen and the QA documents; Playwright for tests and screenshots.

**Problems solved**
1. *The QA API was down (Cloudflare 521) on the build day.* Every screen got a mocked spec (`*-states.spec.ts`, `page.route` + injected session) and a `mocked` Playwright project without a login dependency, so loading / empty / 403 / 500 / network / rollback states were tested while the server was down. When the API came back (16–17 Nov) the live read-only specs passed 5 + 6 + 4 + 4, plus the category mutation spec.
2. *Refresh token vs CORS.* The refresh token is an httpOnly cookie but the QA CORS is `origin: *`, so a browser on another domain never sends it. Expiry is handled by decoding `exp` from the JWT and going to `/login?returnTo=<same page>`.
3. *Live test order.* The first live `categories.spec.ts` run failed 5 of 5 with 401: the QA API keeps one live session per account and the guest login / logout tests had revoked the token saved by `setup`. Fixed by making `setup` depend on `guest` in `playwright.config.ts` (guest → setup → chromium).
4. *Playwright hung with no output on Windows* when its log files sat inside `test-results/` (Playwright empties that folder at start). Fixed with `--output=test-results/pw-artifacts`.

## 5. lint / type-check / build / Playwright output + HTML report

Final gates, 2026-11-17, PowerShell. The gates ran first with no server running; then the production build was served with `npx next start -p 3100`, and the whole Playwright suite ran as **one command** (so one HTML report holds every test):

```
npm run type-check    exit 0   tsc --noEmit, 0 errors
npm run lint          exit 0   0 errors, 0 warnings
npm run build         exit 0   Compiled successfully, 10 routes + middleware
npx playwright test --list     81 tests in 13 files (same environment as the run below)

E2E_ALLOW_MUTATIONS=1  E2E_MAP_3000_TO=3100
npx playwright test --output=test-results/pw-artifacts --trace=off
                      exit 0   81 passed (3.6m) · 0 failed · 0 flaky · 0 skipped · first attempt, 10:43 to 10:47
  guest      13 passed   auth.spec 9 (incl. 4 live login tests) · roles.spec 4
  mocked     44 passed   categories-states 18 · products-states 15 · product-form-states 10 · session-expiry-states 1
  setup       1 passed   live UI login
  chromium   23 passed   live: categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
                         · product-form.spec 4 · categories.mutation.spec 1 (add sub + 2 minor, rename, reorder, delete)
                         · products.mutation.spec 3 (register with a real image upload to S3, edit, bulk delete)
leftover check        0 products and 0 categories named HW3-Neeraj- remain (read-only GET after the run)
```

Why `E2E_MAP_3000_TO=3100`: the S3 bucket CORS allows the browser upload only from the origin `http://localhost:3000`, and port 3000 on the author's laptop is used by another app. With the variable set, origin `http://localhost:3000` is mapped to the server on port 3100: Chromium opens `http://localhost:3000` (the origin S3 accepts) but connects to this app on port 3100, and the other app is never contacted (opt-in, in `playwright.config.ts`).

Honest summary: every spec marked live above ran against the QA API, including product register / edit / delete with a real image upload to S3 (through the port-3000 mapping); the `mocked` project uses a mocked API. From the QA admin or Vercel origin the upload is still refused by the bucket CORS (section 7). Run notes: `docs/live-run-2026-11-16.md` (last section).

Raw output (verbatim excerpts from the run logs, 2026-11-17; the full logs are kept outside the repo):
```
> talking-club-admin-hw3@0.1.0 type-check
> tsc --noEmit
                                            (no output = 0 errors)
> talking-club-admin-hw3@0.1.0 lint
> eslint .
                                            (no output = 0 errors, 0 warnings)
> talking-club-admin-hw3@0.1.0 build
> next build
   ▲ Next.js 15.5.27
 ✓ Compiled successfully in 6.4s
 ✓ Generating static pages (10/10)
Route (app)                                  Size  First Load JS
┌ ○ /                                       127 B         103 kB
├ ○ /_not-found                             127 B         103 kB
├ ○ /403                                    899 B         209 kB
├ ○ /icon.svg                                 0 B            0 B
├ ○ /login                                5.38 kB         228 kB
├ ○ /shopping-mall/categories             8.63 kB         255 kB
├ ○ /shopping-mall/products               6.61 kB         245 kB
├ ○ /shopping-mall/products/create          234 B         272 kB
├ ƒ /shopping-mall/products/details/[id]  9.57 kB         226 kB
└ ƒ /shopping-mall/products/edit/[id]       779 B         272 kB
ƒ Middleware                              35.1 kB

Running 81 tests using 1 worker
  ok 59 [chromium] › e2e\categories.mutation.spec.ts:82:7 › Product categories — create / edit / reorder / delete (QA DB) › add subcategory + 2 minor categories, rename, reorder, delete — HW3-Neeraj-cat-<timestamp> @mutation (19.6s)
  ok 79 [chromium] › e2e\products.mutation.spec.ts:86:7 › Product register → list → edit → delete (shared QA DB) › register through all 4 steps with a real image, then find it in the list @mutation (14.2s)
  ok 80 [chromium] › e2e\products.mutation.spec.ts:117:7 › Product register → list → edit → delete (shared QA DB) › edit: change the name and selling price, save, check the API @mutation (8.8s)
  ok 81 [chromium] › e2e\products.mutation.spec.ts:140:7 › Product register → list → edit → delete (shared QA DB) › delete it with the list's bulk delete @mutation (4.6s)

  81 passed (3.6m)

leftover check   products: HTTP 200, 0 named HW3-Neeraj-*
                 categories: HTTP 200, 0 named HW3-Neeraj-*
```

HTML report: zipped `playwright-report/` of the full run above (`HW3-Neeraj-playwright-report.zip`, 81 tests), attached to the page; checked that it contains no login data (the QA login ID, the password and the saved session token were counted in `index.html` and in its embedded report data: 0 each). The login fields are filled by a test helper that does not write the typed value into the report.

## 6. Unit test case sheet link

`<Google Sheet link — import docs/test-cases.csv (File → Import → Upload), then paste the link>`
Content: `docs/test-cases.md` / `.csv` — 112 cases (59 positive, 53 negative) in the WM QA template columns; 81 are covered by a Playwright test, 31 are manual. Result column as of 2026-11-17: 6 Pass, 16 Pass (live), 18 Pass (mocked) + live Pass, 37 Pass (mocked) only, 4 mocked + screenshots, 4 screenshots only, 24 manual for QA, 2 no role account, 1 known issue. Every Pass comes from the one full run in section 5 (81 passed, including the product register / edit / delete cases PL-014, PF-008, PF-014, PF-015); the screenshot results come from the screenshots retaken on 2026-11-17 (section 8).

## 7. Build report for QA

Full text: `docs/qa-build-report.md` (10 parts, dated 2026-11-17) — post it as a comment on the TL task. Key points:

- **Verified live (QA API):** login, logout, wrong ID / password messages, returnTo; categories (read-only specs and the create / rename / reorder / delete flow under an existing main category); product list (search, filters, URL state, selection, CSV export); details tabs; form steps; product register (with the real image upload to S3) / edit / delete through the port-3000 mapping (section 5).
- **Verified only with a mocked API / injected session:** roles other than SUPER_ADMIN (no such account on QA), loading / empty / 401 (mid-session expiry to /login?returnTo, session-expiry-states.spec.ts) / 403 / 404 / 500 / network states.
- **Known issues, API side (request → observed):**
  - `PUT` to the signed S3 URL (`talking-club-dev` bucket) from `http://localhost:3100`, the QA admin origin or a `vercel.app` origin → preflight 403 `AccessForbidden`, no CORS headers; from `http://localhost:3000` → 200 (checked 2026-11-17). The browser upload works only from the origin `http://localhost:3000`; on the Vercel link it fails until the bucket CORS is changed. The automated run proves the upload with that origin mapped to the server on port 3100 (section 5). Request: add the QA admin and Vercel origins to the bucket CORS.
  - After a login or logout by the same user, the earlier token answers 401 on the next authenticated request although `exp` is still 24 h ahead (one live session per account).
  - `GET /products` has no sort parameter (always `id DESC`) → sort works within the current page only.
  - Category list has no paging or sort parameter — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (design question 7).
  - The category tree allows at most 3 main categories; QA already has 3 → main-category create cannot be tried on QA.
  - Removing every option on edit is not saved by the API (old options stay).
  - CORS `origin: *` → the refresh cookie cannot be used; after the 1-day token the user logs in again and returns to the same page.
- Not covered: Firefox / Safari, concurrent edits, drag reorder on touch screens (Alt + ↑ / ↓ alternative).

## 8. Side-by-side screenshots (design | your screen) at 1440 / 768 / 375, light and dark

Files in `docs/screenshots/` (25 PNGs and `README.md`; retaken 2026-11-17 by `scripts/screenshots/compare.mjs` against the production build on port 3100, mocked API, Chromium). At 1440 each screen is design | build light | build dark. The 375 px product list shows the 5-link pager that fits on one line.

| Screen | 1440 design \| build | 768 | 375 |
|---|---|---|---|
| Login | `compare-1440-login.png` | `build-768-light-login.png` · `build-768-dark-login.png` | `build-375-light-login.png` · `build-375-dark-login.png` |
| Product list | `compare-1440-product-list.png` | `build-768-light-product-list.png` · `build-768-dark-product-list.png` | `build-375-light-product-list.png` · `build-375-dark-product-list.png` |
| Product form, step 1 | `compare-1440-product-form.png` | `build-768-light-product-form.png` · `build-768-dark-product-form.png` | `build-375-light-product-form.png` · `build-375-dark-product-form.png` |
| Product details | `compare-1440-product-details.png` | `build-768-light-product-details.png` · `build-768-dark-product-details.png` | `build-375-light-product-details.png` · `build-375-dark-product-details.png` |
| Categories | `compare-1440-categories.png` | `build-768-light-categories.png` · `build-768-dark-categories.png` | `build-375-light-categories.png` · `build-375-dark-categories.png` |

Not in Figma (written as design questions, `docs/design-questions.md`, 19 questions): the details page, dark mode, the 768 / 375 frames. They are built from the same tokens. Upload the PNGs to the Notion page (or link the pushed files) — upload step is in the checklist.

## 9. Your explanation: auth flow, route guard, table state in URL, multi-step form, image upload

Source: `docs/explain-notes.md` (open the files while explaining).

- **Auth flow.** `POST /auth/login { loginId, password }` returns `data.token` (JWT, 1 day) and `data.user`. Non-HQ roles get the "no admin permission" popup and the session is dropped. Otherwise token + user go to localStorage ("Auto login" ticked) or sessionStorage, and a small cookie lets the server middleware see the login. Then the user goes to `returnTo` — relative paths only, so a link cannot send users to another site. Every call adds `Authorization: Bearer` and the three Talking Club headers (`CoreAPIService`). Expiry: `exp` is decoded from the JWT; if expired or the API answers 401, the session is cleared and the user goes to `/login?returnTo=<page>`. The refresh token is not used because the QA CORS is `origin: *`, so the cookie is never sent cross-site. Logout: `GET /auth/logout`, clear storage and cookie.
- **Route guard.** One config, `src/config/navigation.ts`, lists each page with roles and permission module; the sidebar, both guards and the buttons (`useCan`) read it, so they cannot disagree. Layer 1: `middleware.ts` on the server (no / expired cookie → login with returnTo; role not allowed → `/403`). Layer 2: `RouteGuard` on the client (also GENERAL_ADMIN's `shopping_mall` permission). Layer 3: buttons via `useCan`. No role is checked by hand in a screen. Tested in `e2e/roles.spec.ts`.
- **Table state in the URL.** The list has no `useState` for page / search / filters / sort; the URL is the state (`?page=2&limit=10&q=…&categoryId=…&sort=…`). `parseListParams()` reads it into one typed object, `toSearchString()` writes it back, every control calls `update()` → `router.replace`, and a filter change resets `page` to 1. Refresh and shared links show the same list; filter clicks use replace, so they do not fill the browser history. `toApiQuery()` builds the API query that is also the TanStack Query cache key. Sort is current-page only because the API has no sort parameter.
- **Multi-step form.** One react-hook-form `useForm` for all 4 steps, all sections inside one `<form>` and only the current one visible, so nothing unmounts and values survive Back / Next. The step is in the URL (`?step=`). "Next" runs `trigger()` on that step's fields only (`STEP_FIELDS`) and focuses the first error. Rules match the API (e.g. selling price < unit price). A draft is saved in sessionStorage after half a second and restored after a reload. On an API error nothing is cleared: field errors go back onto their field with `setError` and the stepper jumps to that step.
- **Image upload.** The browser checks type (JPG / PNG / GIF / WEBP), size (≤ 10 MB) and count (≤ 4) first — a bad file sends no request. `POST /utils/upload-file-urls` returns `{ url, preview, filePath }`; the browser `PUT`s the file straight to S3 with the signed URL; only after S3 answers OK are `filePath` (stored by the product API) and `preview` (thumbnail) added to the form. Remove = trash icon with Undo; a failed upload shows Retry. Current limitation: the bucket CORS refuses the preflight from origins other than `http://localhost:3000` (section 7), so the upload works on that origin only; the live test (`products.mutation.spec.ts`) proves it there through the port-3000 mapping (`E2E_MAP_3000_TO`).

---

## Still to do at submission

- [ ] Commit the work on `hw3/neeraj` (never commit `.env.local`; check `git status` first) and push the branch.
- [ ] Open the PR to `main` (never merge it); body from `docs/pr-description.md`; fill the Commit and Demo fields in `docs/qa-build-report.md` and `docs/pr-description.md`.
- [ ] Create your own Vercel project from the company repo, deploy `hw3/neeraj`, set `NEXT_PUBLIC_API_BASE_URL` (API URL only, no logins), turn deployment protection off, open the link once.
- [x] HTML report of the full run (81 passed, 2026-11-17) zipped as `HW3-Neeraj-playwright-report.zip` (kept outside the repo); secret check done: login ID 0, password 0, session token 0.
- [ ] Attach `HW3-Neeraj-playwright-report.zip` to section 5. If the tests are run again, check the new report the same way before attaching it.
- [ ] Import `docs/test-cases.csv` into a Google Sheet and put the link in section 6.
- [x] Screenshots retaken on 2026-11-17 (25 PNGs in `docs/screenshots/`).
- [ ] Upload the 25 screenshots to section 8 (or link the pushed files).
- [ ] Tell the backend team about the S3 bucket CORS (add the QA admin and Vercel origins) and decide with Kakali how the S3 limitation is to be judged.
- [ ] Fill the nine sections of the Notion page from this file, then the four properties: HW3 status → Submitted, Submitted on, Vercel link, Branch / PR link.
- [ ] Post the build report (`docs/qa-build-report.md`) as a comment on the TL task.
- [ ] Comment on the TL page "HW3 submitted" + link, tagging Kakali.
- [ ] After the final result on 20 Nov: delete the Vercel project.
