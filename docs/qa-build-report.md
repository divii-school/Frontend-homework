# QA build report — Talking Club Admin · Shopping Mall (HW3)

Format: WM | Report (the 10 parts of training Step 8 Part C). Written as the hand-over to QA; post it as a comment on the TL task.

## 1. Build

| | |
|---|---|
| Repo / branch | https://github.com/divii-school/Frontend-homework · `hw3/neeraj` (PR to `main`, never merged) |
| Commit | `b2e2974` (first build) + the review-fix commit of 2026-11-17; the branch head of `hw3/neeraj` is the build under test (PR https://github.com/divii-school/Frontend-homework/pull/2) |
| Demo (Vercel) | https://tc-admin-hw3-neeraj.vercel.app |
| API | QA server, talking-club-backend `release/qa` (`NEXT_PUBLIC_API_BASE_URL` → `…/api/v1`) |
| Date | 2026-11-17 (lint, type-check, build and one full Playwright run of all 84 tests, 12:11 to 12:17, see part 9; live parts against the QA API) |

## 2. TL tasks covered

- HW3 — Advanced Frontend Homework (TL task): https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d
- Submission page: https://app.notion.com/p/416326b2d5fb814c8b75c984a7f3317e

## 3. What changed, in plain words

Two Talking Club admin screens from the Shopping Mall menu were rebuilt as a new Next.js app on the real QA API, plus the login in front of them:

- **Login (1.1.0)** — sign in with ID and password, "Auto login", the right message for an unknown ID or a wrong password, and a "no admin permission" popup for accounts that are not HQ admins. Pages are protected: opening a page while signed out goes to login and comes back to the same page afterwards. When the session expires the user is sent to login the same way.
- **Who sees what** — Super / Master admin see both pages; a General admin sees Product Management only if their permission includes it; every other role gets a "No permission" page. The menu only shows what the user may open.
- **Product Category Management (8.2.0)** — the 3-level category tree (main → sub → minor): search, expand / collapse, add, rename and delete in small dialogs, and change the order by dragging a row (or Alt + arrow keys). A category with children cannot be deleted.
- **Product list (8.1.0)** — search by product or category name, category and type filters, paging, rows per page, sorting, row selection with bulk delete, inline exposure status, and CSV export of the filtered result. Filters live in the address bar, so a reload or a shared link shows the same list.
- **Product details (new)** — opens from a product name: Overview (images, prices, status, ERP), Options and Same-category tabs.
- **Product register / edit (8.1.1 – 8.1.3)** — the long form split into 4 steps (Basic info → Images & status → Category & options → ERP & review). Each step checks its fields before Next, going back keeps the values, a draft survives a reload, and a server error never loses what was typed. Images are uploaded straight to S3 (JPG / PNG / GIF / WEBP, up to 10 MB, 1–4 images).
- Every screen has loading, empty and error states, works at 1440 / 768 / 375 px, and has light and dark mode. Dates show as `YYYY/MM/DD HH:mm`, money as `₩1,000`.

## 4. Fixed issues

None reported by QA — this is the first build handed to QA. Fixed on 2026-11-17 after two internal reviews, before the hand-over:

1. A second browser tab without a saved session no longer logs the first tab out (it used to delete the shared login cookie).
2. The list pager fits on one line at 375 px (5 page links on phones).
3. A percent-encoded URL such as `/shopping-mall/%63ategories` no longer gets past the route guards: a GENERAL_ADMIN gets 403 there too (new test in `roles.spec.ts`).
4. Log out removes the unsaved product form drafts of the tab, so the next account never sees them (new test in `product-form-states.spec.ts`).
5. Register asks the API for a fresh product code right before it sends the product, so a code that someone else took in the meantime no longer makes every Register fail; a restored draft also gets the fresh code (new test in `product-form-states.spec.ts`).
6. CSV export puts `'` before any text that starts with `-` (as before with `=`, `+`, `@`), so Excel shows it as text and never runs it as a formula.
7. Editing a main product that has "Required option for purchase" on but no option rows can be saved as it is.
8. Register / Save stays disabled after a successful save until the next page opens (no second request).
9. Tests and tools: the HTML report no longer holds the typed QA login; the screenshot script waits until the login page is hydrated; `E2E_MAP_3000_TO` lets the live tests use the origin `http://localhost:3000` that S3 accepts.

## 5. Test accounts / roles

| Role | Account | Where |
|---|---|---|
| SUPER_ADMIN | Shared QA admin account — **sent by DM, never written here** | QA server (`release/qa`) |
| MASTER_ADMIN, GENERAL_ADMIN, TEACHER, other roles | No account on QA | Verified with injected sessions (unsigned JWT + user in the browser, mocked API) in `e2e/roles.spec.ts` |

The only real account on QA is SUPER_ADMIN. The role rules (menu, URL guard, 403 page, no-admin popup) for the other roles can only be checked by the injected-session tests until QA gets accounts for them.

## 6. Data QA must prepare first

Nothing. Notes:

- The QA database is shared by 5 developers. Create records **only** with the prefix `HW3-Neeraj-` (e.g. `HW3-Neeraj-qa-product-1`) and edit / delete only those.
- The API allows at most **3 main (top-level) categories**, and QA already has 3, so "Register main category" is disabled on QA with the reason shown under it. Add / rename / delete can be tested on **subcategories and minor categories** under an existing main category.
- For a product, at least one main → sub → minor category path must exist (QA has them).

## 7. What to test (numbered)

Full list with IDs: `docs/test-cases.md` / `docs/test-cases.csv` (112 cases: 59 positive, 53 negative).

1. Open any page signed out → login with `?returnTo=`. Wrong ID / wrong password → the matching alert and field message. Correct login → back on the page you asked for.
2. Log out → plain login page; protected URLs ask to log in again. "Auto login" off → a new tab asks to log in.
3. Sidebar: only Product Management and Product Category Management are links; the other menus are greyed. Open `/shopping-mall/does-not-exist` → "Page not found".
4. Categories: search ("Phonics"), Expand all / Collapse all, the chevron of one row. A search with no match → "No search results found" → Clear search.
5. Categories: under an existing main category add a subcategory `HW3-Neeraj-…`, add 2 minor categories under it, rename one, drag one above the other (and Alt + ↓ with the keyboard), reload → order kept. Delete the minors, then the subcategory.
6. Categories: empty name, spaces only, 51 characters, a name that already exists at that level → message in the dialog, nothing saved. Delete on a category that has children → "Cannot delete".
7. Product list: search by product name and by category, Major → Medium → Minor filters, product type, page 2, rows per page 20, sort by name; reload → everything kept. Filter changes replace the URL (no extra history entries); Back to list on the details page returns to the same filters.
8. Product list: tick rows (also across pages), Export CSV (opens in Excel with Korean readable; a name that starts with `-`, `=`, `+` or `@` shows as plain text), change the exposure status of an `HW3-Neeraj-` product → toast.
9. Register (note: the real image upload only works from the origin `http://localhost:3000`, so it fails on the Vercel link; see part 8): Next on an empty step 1 → 4 messages; selling price ≥ unit price → message; upload a `.txt` and a > 10 MB file → refused; upload a real small PNG; pick the category path; fill ERP; Register → list with toast "Product registered".
10. Edit that product: product code and category are read-only; change name and selling price → Save → details page with toast "Product saved".
11. Draft: fill half of step 1, reload → "Draft restored"; Discard empties it. Cancel → "All entered information will be deleted…" (No / Yes).
12. Details: tabs Overview / Options / Same category, `?tab=` in the URL, arrow keys move between tabs; Back to list returns to the same filters. `/details/999999999` → "Product not found".
13. Bulk delete your `HW3-Neeraj-` product from the list (Cancel first, then Delete).
14. Errors: DevTools → Offline on the list, the category page and on Register → "Connection problem" / connection message, values kept; back online → Try again.
15. Resize 1440 → 1024 → 768 → 375: the sidebar becomes a drawer at ≤ 991 px; the product table scrolls inside its own box between 769 and 1024 px and becomes cards at ≤ 768 px; forms become one column at ≤ 768 px; no sideways page scroll at any width.
16. Toggle dark mode (moon icon) on each screen; reload keeps the choice.

## 8. Known issues and what is not covered

- **Image upload from the browser is blocked by the S3 bucket CORS (observed 2026-11-17).** `POST /utils/upload-file-urls` returns a signed URL; the browser then sends `PUT` to `talking-club-dev.s3.ap-northeast-2.amazonaws.com` with the headers `content-type`, `x-amz-acl`, `x-amz-checksum-crc32`, `x-amz-sdk-checksum-algorithm`. The preflight (OPTIONS) answers 403 `AccessForbidden` without CORS headers for origins `http://localhost:3100`, `https://tkclub-admin-qa.dvconsulting.org` and a `vercel.app` origin, and 200 with `Access-Control-Allow-Origin: http://localhost:3000` for `http://localhost:3000`. So the browser upload works only from the origin `http://localhost:3000` and fails on the Vercel link until the bucket CORS is changed. The automated run proves the upload from that origin: `http://localhost:3000` mapped to the server on port 3100, because port 3000 was in use (part 9). Request to the backend team: add the QA admin origin (and the Vercel origin) to the bucket CORS.
- **One live session per account (observed 2026-11-16).** After a login or a logout by the same user, the previously issued token answers 401 on the next authenticated request, although its `exp` is still 24 h ahead. The guest login / logout tests share the admin account with `setup`, so run order matters. Since the fix round, `setup` depends on `guest` in `playwright.config.ts`, so the order guest, setup, chromium is automatic (see part 9).
- **Live run notes:** on 2026-11-16 the first `categories.spec.ts` run after `guest` failed 5 of 5 with 401 for the reason above; after a fresh `setup` it passed 5 of 5. No code was changed for it. Since `setup` depends on `guest`, the run order is now automatic. The final run on 2026-11-17 (all 84 tests in one command, 12:11 to 12:17) passed on the second attempt. In the first attempt (12:06) the 2 live login-error tests ("an unknown ID …", "a wrong password …") did not see the error dialog within 5 s: the QA API had not answered yet (the Login button was still busy). Because `guest` failed, the 24 tests that depend on it did not run. A probe right after that got the same API answer in 0.8 to 2.6 s. No code or test was changed; the whole command was run again and passed.
- **No sort parameter in the API** — `GET /products` always returns newest first (`id DESC`). Sort on the list header sorts the current page only; the screen says "Sorted within this page". Backend question raised (design question 6).
- **Category list has no paging or sort parameter** — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (design question 7).
- **No refresh token** — the QA API answers CORS `origin: *` without credentials, so its httpOnly refresh-token cookie can't be used from this site. When the 1-day token expires the user logs in again (and returns to the same page).
- **Top-level category limit of 3** — the API refuses a 4th main category; QA already has 3, so main-category create can't be tested on QA (design question 8).
- **Removing all options on edit is not saved** — when every single-item option is removed and saved, the API keeps the old options (backend behaviour). The form shows a note about it (test case PF-026).
- **Drag reorder on touch screens** — native drag-and-drop does not work reliably on phones / tablets; the keyboard alternative (Alt + ↑ / ↓) needs a keyboard (design question 19).
- **Search by category name also returns deleted products (API side).** Request: `GET /products?type=categoryName&search=<name>` (search type "Category" on the list). Observed: products that were deleted (soft delete, `isDeleted` true) also come back when their medium or minor category name matches. In the release/qa backend code the three `name LIKE :search` conditions are joined with OR and added after `product.isDeleted = false` without brackets, so the AND is applied first. The list shows such rows like any other row and counts them in Total; opening one shows "Product not found", and deleting it fails. The screen does not hide them. Found by reading the backend code, not reproduced on QA. Request to the backend team: put the OR conditions in brackets (`new Brackets(...)`).
- **Row selection is kept when the search or the filters change (by design).** The selection is a set of product ids that stays across pages, searches and filter changes (up to 100), so products from different pages can be deleted together. The selection bar always shows how many rows are selected ("N selected") with a **Clear** action. Bulk delete deletes every selected product, also the ones that are no longer on screen; the confirm says "Delete N products?". Press Clear before a new search when only the visible rows should be deleted.
- **Edit draft and the browser Back button (known limitation).** In edit mode a draft saved earlier in the same tab is restored over the product that was just loaded, with the notice "Draft restored" and a Discard button. There is no check whether the product changed on the server after the draft was saved, so saving can put older values back. The browser Back button leaves the form (on step 1) without the unsaved-changes dialog: the leave guard covers Cancel, links and reload / close only. The draft then stays in the tab and comes back the next time that form is opened; Log out removes it.
- No design for the details page, dark mode or tablet / phone layouts — built from the same tokens; all listed in `docs/design-questions.md` (19 questions).
- Not covered: concurrent edits by two admins, real MASTER_ADMIN / GENERAL_ADMIN / non-admin accounts (none on QA), Firefox and Safari.

## 9. Results of lint, type-check, build and tests

```
Final gates, 2026-11-17 (PowerShell). Gates first with no server running; then the production build served
with `npx next start -p 3100` and ALL Playwright tests in one command.
npm run type-check    → exit 0 · tsc --noEmit, 0 errors
npm run lint          → exit 0 · 0 errors, 0 warnings
npm run build         → exit 0 · ✓ Compiled successfully, 10 routes + middleware
                        / · /403 · /login · /shopping-mall/categories · /shopping-mall/products
                        /shopping-mall/products/create · /details/[id] · /edit/[id] · /_not-found · /icon.svg
npx playwright test --list → 84 tests in 13 files

E2E_ALLOW_MUTATIONS=1 E2E_MAP_3000_TO=3100 npx playwright test --output=test-results/pw-artifacts --trace=off
  → exit 0 · 84 passed (6.4 min) · 0 failed · 0 flaky · 0 skipped · 12:11 to 12:17
    (second attempt; the first attempt at 12:06 stopped after 2 live login tests timed out waiting for the QA API, part 8)
  guest      14 passed  (auth.spec.ts 9 incl. 4 live "Login with the QA API" tests · roles.spec.ts 5)
  mocked     46 passed  (categories-states 18 · products-states 15 · product-form-states 12 · session-expiry-states 1; mocked API)
  setup       1 passed  (live UI login, writes e2e/.auth)
  chromium   23 passed  (live) categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
                        · product-form.spec 4 (no save) · categories.mutation.spec 1 (add sub + 2 minor, rename,
                        reorder, delete) · products.mutation.spec 3 (register with a real image upload to S3, edit,
                        bulk delete)
  clean-up check after the run: 0 products and 0 categories named HW3-Neeraj- left (read-only GET)
```

`E2E_MAP_3000_TO=3100` (opt-in, `playwright.config.ts`): the S3 bucket CORS allows the upload only from the origin `http://localhost:3000` (part 8), and port 3000 was in use by another app. So origin `http://localhost:3000` was mapped to the server on port 3100: Chromium opens `http://localhost:3000` but connects to this app on 3100. The mutation specs (`E2E_ALLOW_MUTATIONS=1`) create, edit and delete only `HW3-Neeraj-` records.

Run order with the one-session-per-account behaviour: `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, setup and then the chromium specs safely (`--project=setup` alone also runs guest first). Use `--output=test-results/pw-artifacts` when the logs are written inside `test-results/` (Playwright empties its output folder at start and the open log files made the runner hang on Windows).

What was verified how: login, categories (read-only and the create / rename / reorder / delete flow), product list (search, filters, URL state, selection, CSV export), details, the form steps, and product register (real image upload to S3) / edit / delete through the port-3000 mapping — live against the QA API. Roles other than SUPER_ADMIN and error / empty / loading states — only with a mocked API or injected session.

The category, product and product-form specs also fail on any browser console error or warning (`auth.spec.ts` / `roles.spec.ts` don't watch the console). HTML report: the zipped `playwright-report/` of this full run is attached to the submission page; it was checked for login data (QA login ID, password and saved session token: 0 each). The tests fill the login fields with a helper that does not write the value into the report. To open a local report: `npm run test:e2e:report`.

## 10. Screen sizes and browsers checked

- **Browser:** Chromium (Playwright 1.64.1, Desktop Chrome profile). Firefox / Safari not checked.
- **Widths checked by tests** (no sideways page scroll, layout assertions):
  - `categories-states.spec.ts` › "375px: no horizontal page scroll and ≥ 40px action buttons" and "768px: …"
  - `products-states.spec.ts` › "rows become cards and the page never scrolls sideways" (375 px, list + details)
  - `product-form-states.spec.ts` › "375 px: compact stepper, one column, no horizontal page scroll"
- **Screenshots, 1440 / 768 / 375, light and dark** (`node scripts/screenshots/compare.mjs` against the production build on port 3100, mocked API, Chromium; retaken 2026-11-17, the last time at 12:18 after the final run, with no visual change): login, product list, product form step 1, product details, categories → `docs/screenshots/` (25 PNGs, list in `docs/screenshots/README.md`). At 1440 each screen is shown next to its Figma frame (design | build light | build dark).
