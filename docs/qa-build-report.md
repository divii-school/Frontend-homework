# QA build report — Talking Club Admin · Shopping Mall (HW3)

Format: WM | Report (the 10 parts of training Step 8 Part C). Written as the hand-over to QA; post it as a comment on the TL task.

How to read the labels: the whole UI is Korean. A label, button or message is written as the Korean text followed by the English meaning in brackets, for example `등록 (Register)`. The full word list is `docs/ko-glossary.md`.

## 1. Build

| | |
|---|---|
| Repo / branch | https://github.com/divii-school/Frontend-homework · `hw3/neeraj` (PR to `main`, never merged) |
| Commits | `b2e2974` first build · `85e0572` earlier review fixes · `8c968d7` docs · `8b2f596` code-review fixes · `356dc8d` Korean UI · `b25769b` docs · `355d2ae` code re-check points (4 MB default, upload only to the `talking-club-dev` bucket) · `586b91a` QA round fixes · `733655c` two layout bugs · `792ef82` design review fixes · `636e258` font as a dynamic subset · `adb5df2` the first mouse click on a footer button of the product form is no longer lost · one more docs commit follows (branch head). The branch head of `hw3/neeraj` is the build under test (PR https://github.com/divii-school/Frontend-homework/pull/2) |
| Demo (Vercel) | https://tc-admin-hw3-neeraj.vercel.app (runs `adb5df2`, `NEXT_PUBLIC_MAX_IMAGE_MB=4`) |
| API | QA server, talking-club-backend `release/qa` (`NEXT_PUBLIC_API_BASE_URL` → `…/api/v1`). The QA API is in maintenance (notice of 18 Nov): API problems are listed as "API issue" in part 8 and do not block Pass |
| Date | 2026-11-18: QA round fixes (`586b91a`), two layout fixes (`733655c`) and design review fixes (`792ef82`), with the local gates and runs of that day. 2026-11-19: the font is loaded as a dynamic subset (`636e258`), with the local gates again. The last fix (`adb5df2`, a lost first click in the product form) followed the manual re-run of that day. The run of the whole suite against the Vercel link on the final build `adb5df2` (2026-11-20) is in part 9 |
| Review status | Code review: **Pass** (Kakali, 18 Nov; the explanation call is still to come). QA (Archana): Resubmit on 18 Nov; the fixes are done; to be re-tested on the final build `adb5df2`. Design (Bhagyashree): Resubmit on 18 Nov; the fixes are done in `792ef82` (the way the font is loaded was changed after it, in `636e258`); re-check on 20 Nov: **Pass** (on build `636e258`). Final result: Friday 20 Nov |

## 2. TL tasks covered

- HW3 — Advanced Frontend Homework (TL task): https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d
- Submission page: https://app.notion.com/p/416326b2d5fb814c8b75c984a7f3317e

## 3. What changed, in plain words

Two Talking Club admin screens from the Shopping Mall menu (`쇼핑몰 관리`) were rebuilt as a new Next.js app on the real QA API, plus the login in front of them. The whole UI text is Korean and follows the Korean Figma frames:

- **Login (1.1.0)** — sign in with ID (`아이디`) and password (`비밀번호`), `자동 로그인 (Auto login)`, the right message for an unknown ID or a wrong password, and a `관리자 권한이 없습니다. (You do not have admin permission.)` popup for accounts that are not HQ admins. Pages are protected: opening a page while signed out goes to login and comes back to the same page afterwards. When the session expires the user is sent to login the same way.
- **Who sees what** — Super / Master admin see both pages; a General admin sees `상품 관리 (Product Management)` only if their permission includes it; every other role gets a `권한 없음 (No permission)` page. The menu only shows what the user may open.
- **`상품 카테고리 관리 (Product Category Management)` (8.2.0)** — the 3-level category tree (`대분류 (Main)` → `중분류 (Sub)` → `소분류 (Minor)`): search, expand / collapse, add, rename and delete in small dialogs, and change the order by dragging a row (or Alt + arrow keys). A category with children cannot be deleted.
- **`상품 관리 (Product list)` (8.1.0)** — search by product or category name, category and product type filters, paging, rows per page, sorting, row selection with bulk delete, inline exposure status, and CSV export of the filtered result. Filters live in the address bar, so a reload or a shared link shows the same list. The column `판매금액 (Selling price)` shows one price: the selling price (API `price`).
- **`상품 상세 (Product details)` (new)** — opens from a product name: `상품 정보 (Overview)` (images, `단가 (Unit price)` and `판매가 (Selling price)`, status, ERP), `옵션 (Options)` and `동일 카테고리 상품 (Same category)` tabs.
- **`상품 등록 / 상품 수정 (Product register / edit)` (8.1.1 – 8.1.3)** — the long form split into 4 steps (`기본 정보 (Basic info)` → `이미지 및 상태 (Images & status)` → `카테고리 및 옵션 (Category & options)` → `ERP 정보 및 확인 (ERP & review)`). Each step checks its fields before `다음 (Next)`, going back keeps the values, a draft survives a reload, and a server error never loses what was typed. Step 1 asks for `단가 (Unit price)` and then `판매가 (Selling price)`; the unit price must be lower than the selling price (the API rule). Images (JPG / PNG / GIF / WEBP, 1–4 images, up to 4 MB each) are sent to the app's own route `/api/upload`, and the server puts them on S3.
- Every screen has loading, empty and error states, works at 1440 / 768 / 375 px, and has light and dark mode. Dates show as `YYYY/MM/DD HH:mm` in Korea time (KST) for every viewer, money as `₩1,000`. The browser tab title is `… | 토킹클럽 관리자`. A failed request that a screen does not show itself gets a default error toast.
- **Look (design review, 18 Nov)** — the logo is the TalkingClub logo image of the Figma frames. The colours are the Figma styles and the font is Pretendard, the font of the frames. The search of the product list and the fields of the product form are underline-only, as drawn. On a phone or tablet (≤ 768 px) the list filters sit behind a `필터 (Filters)` button, and on a phone (≤ 640 px) every category row is one line.

## 4. Fixed issues

**Fixed after the design review (18 Nov)** — designer Bhagyashree, result "Resubmit". She reviewed the Vercel build at 1440 / 768 / 375 px, light and dark, against the Korean Figma frames 1.1.0, 8.1.0, 8.1.1 and 8.2.0. Her words: "A strong build: responsive (cards at ≤768, no sideways scroll), dark mode and the category tree are very good, and the 1440 layout follows the Figma frames closely." Three must-fix items, four should-fix items and some minor items. All are done in commit `792ef82`. One follow-up on 19 Nov, commit `636e258`: the font is loaded as a dynamic subset (item 2, "Font").

1. **Logo (must-fix).** Before: a drawn single ring and the text "TalkingClub" on the header, and "TalkingClub | 관리자" on the login page. Now: the TalkingClub logo of the Figma frames (three-ring mark + wordmark) as one image, with no text next to it. It is on the header, the login page, the 403 page, the 404 page, the error page and the no-permission popup.
   - Where the file comes from: the Figma file has no vector logo. It has only a 158 × 30 px bitmap on a white background (the same file as `loginLogo.png` of the real admin project). The same artwork with a transparent background (512 × 107 px) was taken from the company's own web project (`talking-club-web-frontend/public/images/logo.png`) and saved as `public/brand/talkingclub-logo.png`. The source was confirmed by the developer on 18 Nov.
   - `src/components/BrandLogo.tsx` shows it as an inline SVG. The mark is drawn from the file. The wordmark is filled with the current text colour through a mask, so it stays readable in dark mode. In dark mode the mark is made a little brighter (`$logo-mark-dark-filter` in `_tokens.scss`).
   - On phones (≤ 480 px) the topbar shows the mark alone.
   - Names for screen readers: the image is `TalkingClub`; the header link keeps `토킹클럽 홈 (Talking Club home)`; the login page keeps the hidden heading `토킹클럽 관리자 로그인 (Talking Club admin login)`. The tab titles stay `… | 토킹클럽 관리자`. The favicon is now the mark (`src/app/icon.png`; it was a drawn `icon.svg`).
   - This answers design question 26 (the wordmark).
2. **Colours and font follow the Figma styles (must-fix).** The light palette in `src/styles/_tokens.scss`:

   | Role | Before | Now | Figma style |
   |---|---|---|---|
   | Text | `#1f2024` | `#181818` | Gray 130 |
   | Secondary text | `#4f535b` | `#505050` | Gray 110 |
   | Muted text | `#6b7079` | `#737373` | Gray 100 |
   | Placeholder (new role) | `#6b7079` | `#afafaf` | Gray 90 |
   | Border | `#e4e5e8` | `#eaeaea` | Background 100 |
   | Strong border / input underline | `#c4c6cc` | `#d9d9d9` | Gray 80 |
   | Page background | `#f6f6f8` | `#ffffff` | White |
   | Hover / subtle fill | `#f6f6f8` | `#f7f7f7` | Background 90 |
   | Brand and primary | `#ee2e5d` / `#d41f4e` | `#ef325b` | Talking Club |
   | Primary hover | `#b3173f` | `#ac0c18` | Primary 110 |
   | Table header and soft primary | `#fdeef2` | `#fff1f3` | Primary 80 |
   | Danger | `#c81e1e` | `#e66565` | Danger 100 |
   | Danger strong (new role: filled danger button in confirm dialogs) | — | `#a92e2e` | Danger 110 |
   | Danger soft | `#fdecec` | `#ffdcdc` | Danger 90 |
   | Disabled background | `#d9d9dc` | `#d9d9d9` | Gray 80 |
   | Focus ring | `#1d5fd0` (blue) | `#ef325b` (brand; dark mode `#ff5c85`) | Talking Club |

   - Kept, because Figma gives no value: the success, warning and info colours, the overlay, the shadow and the dark palette. The design has no dark frames. In dark mode only the focus ring and the background of the active sub-menu row changed.
   - What you see: the light page background is white with bordered cards, as in the frames. The active sub-menu row is grey, not pink. The enabled `삭제 (Delete)` outline is the lighter Danger 100.
   - Font: the Figma text nodes use Pretendard. The font is self-hosted, so no request leaves the app. It is the "dynamic subset" of the npm package pretendard 1.3.9 (licence SIL OFL 1.1; the package is not a dependency): 92 small files in `public/fonts/pretendard/`, and one `@font-face` rule per file with its `unicode-range` in `src/styles/pretendard-font.css` (imported in `src/app/layout.tsx`). The family name is `'Pretendard Variable'`. It is first in `$font-family-base` (`src/styles/_tokens.scss`), and PrimeReact uses it too. 'Inter var' is no longer loaded.
   - The font is loaded as a dynamic subset: the browser downloads only the files for the characters a page shows (about 190 KB of fonts on the login page: 187 KB in 7 files, 6 Pretendard files + the icon font). In `792ef82` the font was one 2.06 MB file, preloaded on every page (2,058 KB of fonts on the login page). On the Vercel link that made the first page load several seconds slower, so it was changed on 19 Nov in `636e258`. The look is the same.
   - Contrast: the Figma tokens are used as they are, and some are below WCAG AA. They are listed in part 8 and asked as design question 27.
3. **Disabled buttons are muted (must-fix).** A disabled `삭제 (Delete)` is now a grey fill with a border of the same colour and a white label, like a disabled `CSV 다운로드 (Export CSV)`, in light and dark. It was one of the three open visual items of the QA round.
4. **Korean line breaks (should-fix).** `word-break: keep-all` on the whole page: Korean text breaks between words, not inside a word.
5. **Underline-only fields where the frames draw them (should-fix).** The search type and the search input of 8.1.0, and the text inputs and dropdowns of the product form (8.1.1 / 8.1.2). The textarea stays boxed, as drawn. The height stays 40 px. Error = danger line + message. Focus = 2 px brand line. Left boxed on purpose, because they are not in the frames she named: the search of the 8.1.3 option picker and the input of the category add / edit dialog.
6. **Product list at ≤ 768 px (should-fix).** The search row stays visible. The four filters, `필터 초기화 (Reset filters)` and the hint sit behind a button `필터 (Filters)` (`aria-expanded`, `aria-controls`). The panel starts closed, also when filters are in the URL. The button shows the number of active filters; its accessible name is then `필터 N개 적용 중 (Filters, N in use)`. Desktop is unchanged. The open / closed state is not remembered across reloads. The search term is not counted as a filter.
7. **Category rows at ≤ 640 px are one line (should-fix).** `[code] name` together, the count under the name, the three actions at the right. The level badge is hidden there, and `+ 소분류 (+ Minor category)` becomes a 40 × 40 px `+` button with the same accessible name.
8. **Minor items.** The focus ring is the brand colour (it was blue). The tab bar of the details page no longer shows a native scrollbar. The rows-per-page select is 40 px high, the same as the buttons next to it (it was lower before). `필터 초기화 (Reset filters)` lines up with the fields at ≤ 1024 px. The pencil and trash icons of a category row are grey; the trash turns red on hover or keyboard focus. Together with item 3 this closes all three "visual items still open" of the QA round: the select height, the border of the disabled `삭제`, and the indent of `필터 초기화`.

What is still different from the frames is listed in part 8.

**Fixed after the QA round (18 Nov)** — QA Archana, result "Resubmit". The build was praised: 90 checks passed on the Vercel build. Four must-fix and three should-fix items. Items 1, 2, 4 and 5 are fixed in commit `586b91a`; item 3 is done in the test sheet; item 6 is the run in part 9; item 7 was fixed after the design review (commit `792ef82`); item 8 is commit `733655c`.

1. **`단가 (Unit price)` / `판매가 (Selling price)` were mapped the wrong way round (must-fix).** Checked in the backend (talking-club-backend, branch `release/qa`): the shopping cart and the order charge the product field `price` (`sellingPrice: product.price`, `lineTotal(product.price, quantity, …)`), and the API refuses a product unless `unitPrice < price`. So now:
   - `판매가 (Selling price)` and the list column `판매금액 (Selling price)` = API `price`; `단가 (Unit price)` = API `unitPrice`.
   - Step 1 rule: `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)`. The API error key `unitPriceMustBeLessThanPrice` shows the same text.
   - Step 1 shows `단가` first, then `판매가` (the order of Figma 8.1.1).
   - The list shows only `판매금액` = `price` (the crossed-out second price is gone). Sort by `판매금액` sorts by `price`.
   - CSV columns: `단가` = `unitPrice`, `판매금액` = `price`. The details page shows `단가` / `판매가` the same way, and so does the step-4 review summary.
   - A picked single-item option starts at that product's own `price`.
   - The earlier docs and the glossary said the opposite (`단가` = list price before discount = `price`), because the description of Figma frame 8.1.2 says "판매가 ≤ 정가". The app now follows the API and the backend. The conflict is design question 25.
2. **Dates followed the viewer's time zone (must-fix).** Now every date is shown in Korea time (KST, `Asia/Seoul`) for every viewer: the list, the details page (`등록일자 (Registration date)`, `수정일자 (Last updated)`), the CSV column `등록일자` and the CSV file name, and the draft "saved at" time. Done once, in `src/utils/format.ts` (dayjs `utc` + `timezone` plugins, `DISPLAY_TIME_ZONE = "Asia/Seoul"`).
3. **Test sheet not in the WM format (must-fix).** The sheet now follows the WM DEV template, and the developer ran the manual rows on 18 Nov. Details: `docs/test-cases.md` and `docs/manual-run-2026-11-18.md`.
4. **English text on screen (must-fix).** The browser tab titles are now `… | 토킹클럽 관리자` (they were `… | TalkingClub Admin`). The text next to the logo is `관리자 (Admin)` (it was `Admin`) on the login page, the 403 page, the 404 page, the error page and the no-permission popup. Changed again by the design review: the logo is now the Figma logo image with no text next to it, so the text `관리자` next to the logo is gone (see the design review list above, item 1). The tab titles stay Korean.
5. **Step-4 label (should-fix).** The ERP price field is now labelled `ERP 단가 (ERP unit price)` (it was `단가`), so the form no longer has two fields called `단가`.
6. **Run against the Vercel link (should-fix).** The whole suite (105 tests at that time, with mutations) ran against https://tc-admin-hw3-neeraj.vercel.app on build `586b91a`: 105 passed. The run on the final build is in part 9.
7. **Three visual items (should-fix): fixed after the design review (commit `792ef82`).** The rows-per-page select is 40 px high, like the buttons next to it. A disabled `삭제 (Delete)` button is grey and has no red border. `필터 초기화 (Reset filters)` lines up with the fields.
8. **Two layout bugs found by the developer's own manual run (18 Nov), fixed in CSS (commit `733655c`):**
   - The `노출여부 (Exposure Status)` select in a list row cut `아니오 (No)` to `아니…` when the table was narrow (1024 px, or 1440 px with 50 rows per page). The select had `width: 100%` inside a cell without a width, so the cell could shrink it. Now the select keeps its own width (88 px) and the cell does not wrap (`src/styles/pages/_product-list.scss`). Test case PL-023.
   - On long pages (category tree, 50 product rows, step 4 of the form) the sidebar and the topbar scrolled away at desktop width. `body` had `overflow-x: hidden`, which makes `body` its own scroll box, so `position: sticky` had no effect. Now `html` keeps `overflow-x: hidden` (it moves to the viewport) and `body` uses `overflow-x: clip`, which cuts without a scroll box (`src/styles/globals.scss`). The page still never scrolls sideways. Test case LG-031.
9. **One bug found by the developer's manual re-run on the final build (19 Nov), fixed in commit `adb5df2`:** with the cursor in an empty field of the product form, the first mouse click on `다음 (Next)` did nothing. The form checks a field when it loses focus, so the field's message appeared on mouse-down, the footer moved 26 px down before the mouse button was released, and the click never reached the button (the second click worked; keyboard use and a click with no field focused were not affected, so the automated tests did not see it). Now `취소 (Cancel)`, `이전 (Back)`, `다음 (Next)` and `등록 (Register)` / `저장 (Save)` keep the focus in the field on mouse-down, so the first click arrives and the step is checked as a whole. New test: `product-form-states.spec.ts › the first mouse click on 다음 is not lost when the cursor is in an empty field` (it fails on the build before the fix). Test case PF-035.

Code review: result **Pass** (Kakali, 18 Nov). The explanation call is still to come.

Fixed before the QA round:

**After the code review of 17 Nov (reviewer Kakali, result "Resubmit": the code was praised, 2 must-fix and 4 should-fix items; all six are done):**

1. **UI language (must-fix).** The whole UI text is Korean and follows the Korean Figma frames (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리 (Shopping Mall Management)": 8.1.0 `8010:59065`, 8.1.1 `8010:57833`, 8.1.2 `5498:84860`, 8.1.3 `8034:61058`, 8.2.0 `5498:84158`; login `4019:78451`). `docs/ko-glossary.md` lists all 562 strings (English before, Korean now, source). PrimeReact's built-in texts use a Korean locale (`src/providers/primereact-locale.ts`), `<html lang="ko">`, and an unknown API message key falls back to the Korean server-error text. The `accept-language` request header is still `en` on purpose: the API answers with message keys, and the app maps the keys to Korean text.
2. **Image upload (must-fix).** The browser no longer sends the file to S3. `UploadService` posts the file and the signed URL to the app's own route `POST /api/upload` (`src/app/api/upload/route.ts`), and the server sends it to S3, so the bucket CORS no longer matters. The route checks: logged-in session (401 JSON), only the `talking-club-dev` bucket (400), file type (415), size (413), S3 refusal (502). It is left out of the middleware matcher because Next 15.5 passes only the first 10 MB of a body through middleware; the route checks the session itself. Size limit: `NEXT_PUBLIC_MAX_IMAGE_MB` (default 4, because Vercel functions refuse request bodies above 4.5 MB).
3. **A 5th image (should-fix)** can no longer be added or saved (a guard on every add / Undo / Retry path plus a form rule).
4. **Commas in image file names (should-fix)** are removed before the upload (`src/utils/image-file.ts`, `safeFileName`).
5. **Edit draft (should-fix).** An edit draft is restored only if the product was not changed on the server since the draft was saved (the check compares `updatedAt` plus the option rows). Otherwise the draft is dropped with a notice, and the edit screen always loads a fresh copy. Create drafts are unchanged.
6. **Default error toast (should-fix).** `QueryCache` and `MutationCache` in `src/utils/query-client.ts` show a default error toast. Hooks whose screen shows its own error opt out with `meta: SHOWS_OWN_ERROR`. A 401 and a cancelled request never toast.

**After the code re-check of 18 Nov (code result Pass; two small points, both done):**

1. The image size limit defaults to **4 MB** (Vercel functions refuse request bodies above 4.5 MB, so a deployment without `NEXT_PUBLIC_MAX_IMAGE_MB` still works).
2. `/api/upload` sends files **only to the `talking-club-dev` bucket** (server-only setting `UPLOAD_S3_BUCKET`; any other host, including another S3 bucket, gets 400).

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

Full list with IDs: `docs/test-cases.md` / `docs/test-cases.csv` (WM DEV template since 18 Nov; the manual rows were run by the developer on 18 Nov, see `docs/manual-run-2026-11-18.md`).

Steps 20 to 25 are new after the design review of 18 Nov. Steps 7, 9, 14, 16, 18 and 19 were updated for it.

1. Open any page signed out → login with `?returnTo=`. The login page shows the TalkingClub logo image alone, with no text next to it. Wrong ID / wrong password → the matching alert and field message (`등록된 아이디가 아닙니다 (This ID is not registered.)`, `비밀번호가 일치하지 않습니다 (The password does not match.)`). Correct login → back on the page you asked for.
2. `로그아웃 (Log out)` → plain login page; protected URLs ask to log in again. `자동 로그인 (Auto login)` off → a new tab asks to log in.
3. Sidebar: only `상품 관리 (Product Management)` and `상품 카테고리 관리 (Product Category Management)` are links; the other menus are greyed. Open `/shopping-mall/does-not-exist` → `페이지를 찾을 수 없습니다 (Page not found)`.
4. Categories: search ("Phonics"), `모두 펼치기 (Expand all)` / `모두 접기 (Collapse all)`, the chevron of one row. A search with no match → `검색 결과가 없습니다 (No search results found)` → `검색 초기화 (Clear search)`.
5. Categories: under an existing main category add a subcategory `HW3-Neeraj-…` (`+ 중분류 (+ Subcategory)`), add 2 minor categories under it (`+ 소분류 (+ Minor category)`), rename one, drag one above the other (and Alt + ↓ with the keyboard), reload → order kept. Delete the minors, then the subcategory.
6. Categories: empty name, spaces only, 51 characters, a name that already exists at that level → message in the dialog, nothing saved. `삭제 (Delete)` on a category that has children → `삭제 불가 (Cannot delete)`.
7. Product list: search by `상품명 (Product name)` and by `카테고리 (Category)`, `대분류 (Major)` → `중분류 (Medium)` → `소분류 (Minor)` filters, `상품 유형 (Product type)` (`메인 상품 (Main)` / `단권 상품 (Supplementary)`), page 2, `페이지당 행 수 (Rows per page)` 20, sort by name and by `판매금액 (Selling price)`; reload → everything kept. The column `판매금액 (Selling price)` shows one price per row (the product's `판매가 (Selling price)`), with no crossed-out second price. Filter changes replace the URL (no extra history entries); `목록으로 (Back to list)` on the details page returns to the same filters. At 768 px and below the filters are behind the `필터 (Filters)` button: press it first (step 23).
8. Product list: tick rows (also across pages), `CSV 다운로드 (Export CSV)` (opens in Excel with Korean readable; a name that starts with `-`, `=`, `+` or `@` shows as plain text; the column `단가 (Unit price)` holds the unit price and the column `판매금액 (Selling price)` the selling price), change `노출여부 (Exposure Status)` of an `HW3-Neeraj-` product → toast `저장 완료 (Exposure status saved)`.
9. `상품 등록 (Register)`: `다음 (Next)` on an empty step 1 → 4 messages (an invalid underline field also gets a danger-colour line, step 22); step 1 shows `단가 (Unit price)` first, then `판매가 (Selling price)`; type a `단가 (Unit price)` that is equal to or higher than the `판매가 (Selling price)` → `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)` under `단가`; then a lower `단가` (for example `단가` 15,000 and `판매가` 20,000) → `다음 (Next)` works. Add a `.txt` file and an image above the size limit (4 MB) → refused before any request; add a real small PNG with `파일추가 (Add file)`; pick the category path; in step 4 fill the ERP fields (the price field is `ERP 단가 (ERP unit price)`) and check the summary (`단가` and `판매가` as typed); `등록 (Register)` → list with toast `상품이 성공적으로 등록되었습니다. (Product registered)`. The new row shows the `판매가` you typed under `판매금액`, and its details page shows `단가` and `판매가` as typed. In DevTools → Network the browser sends the file to `/api/upload` of the app, never to amazonaws.com.
10. Images: add 4 images, try a 5th → refused with a message; add a file named `photo,1.png` → the stored name has no comma; make one upload fail (offline) → `다시 시도 (Retry)` works.
11. Edit that product (`수정 (Edit)`): product code and category are read-only; change the name and the `판매가 (Selling price)` (for example to 25,000) → `저장 (Save)` → details page with toast `상품 정보가 성공적으로 수정되었습니다. (Product saved)`; the details page shows the new `판매가` and the unchanged `단가 (Unit price)`.
12. Draft: fill half of step 1, reload → `임시 저장된 내용을 불러왔습니다. (Draft restored)`; `임시 저장 삭제 (Discard)` empties it. `취소 (Cancel)` → `입력한 정보가 모두 삭제됩니다. 취소하시겠습니까? (All entered information will be deleted. Do you want to cancel?)` (`아니오 (No)` / `예 (Yes)`). Edit draft: change a name in the edit screen, then change the same product in another tab and save it, come back and reload → the draft is not restored and the notice `임시 저장된 내용을 불러오지 않았습니다. … (Your saved draft was not restored …)` is shown.
13. Details: tabs `상품 정보 (Overview)` / `옵션 (Options)` / `동일 카테고리 상품 (Same category)`, `?tab=` in the URL, arrow keys move between tabs; `목록으로 (Back to list)` returns to the same filters. `/details/999999999` → `상품을 찾을 수 없습니다 (Product not found)`.
14. Bulk delete your `HW3-Neeraj-` product from the list (`취소 (Cancel)` first, then `삭제 (Delete)`). Before a row is ticked, `삭제 (Delete)` is disabled and grey: grey fill, white label, no red border, in light and dark mode. After a row is ticked it is a danger-colour outline button.
15. Errors: DevTools → Offline on the list, the category page and on Register → `연결 오류 (Connection problem)` / connection message, values kept; back online → `다시 시도 (Try again)`. An error that a screen does not show itself must give exactly one toast, never a silent failure.
16. Language: every visible text, including the paginator, dropdown messages and dialog buttons, is Korean; the browser tab title is `… | 토킹클럽 관리자`. The logo is an image with no text next to it (step 20); the word "TalkingClub" inside the logo image is the only Latin text.
17. Time zone: set the computer to a time zone outside Korea (for example India) and open the list, a details page and the CSV → `등록일자 (Registration date)` and `수정일자 (Last updated)` show Korea time (KST), the same as on a computer in Korea; the CSV file name `products-YYYYMMDD-HHmm.csv` also uses Korea time. Example: a product created at 11:09 India time shows 14:39.
18. Resize 1440 → 1024 → 768 → 375: the sidebar becomes a drawer at ≤ 991 px; the product table scrolls inside its own box between 769 and 1024 px and becomes cards at ≤ 768 px; forms become one column at ≤ 768 px; no sideways page scroll at any width. At ≤ 768 px the list filters go behind the `필터 (Filters)` button (step 23); at ≤ 640 px every category row is one line (step 24); at ≤ 480 px the topbar shows the logo mark alone.
19. Toggle dark mode (moon icon) on each screen; reload keeps the choice. In dark mode the word in the logo is light and the rings are a little brighter, so the logo stays readable.
20. Logo: the header, the login page, the 403 page (`/403`), the 404 page and the no-permission popup show the same TalkingClub logo image (three rings + the word "TalkingClub"), as in the Figma frames, with no text next to it. The logo in the header is a link to the product list. The browser tab icon is the three-ring mark.
21. Colours and font, light mode, next to the Figma frames 8.1.0 and 8.2.0: the page background is white and the cards have a thin border; the text is near black (`#181818`); the table header row is light pink (`#fff1f3`); primary buttons and the current page of the pager are the brand colour (`#ef325b`); the current page in the sidebar is a grey row with a brand-colour label. The font is Pretendard on every text, also inside buttons, inputs and dropdowns. Korean text breaks between words, not inside a word (look at long hints at 375 px).
22. Underline fields: the search type and the search input of the product list, and the text inputs and dropdowns of the product form, have no box, only a line under the value, and are 40 px high. Click into one → the line turns to the brand colour and gets thicker (2 px). An invalid field has a danger-colour line and a message under it. The textarea `상세설명 (Detailed description)` stays boxed. A read-only field (for example `상품코드 (Product code)`) has a dashed line. Still boxed on purpose: the search of the option picker and the name input of the category add / edit dialog.
23. Product list at 768 px and at 375 px: the search row is visible; the filters are not. Press `필터 (Filters)` → the four filters and `필터 초기화 (Reset filters)` open; press it again → they close. Choose a `상품 유형 (Product type)` → the list is filtered and the button shows the number `1`. Reload → the list is still filtered, the panel is closed, and the button still shows `1`. `필터 초기화 (Reset filters)` → the number is gone. A search term alone shows no number. Above 768 px there is no `필터` button and the filters are always visible.
24. Categories at 375 px: every row is one line: `[code] name` together, the count under the name, the action buttons at the right (`+` on main and sub rows, pencil, trash). The level badge is not shown. The pencil and trash icons are grey; the trash turns red on hover or keyboard focus. The `+` button is 40 × 40 px.
25. Keyboard focus: press Tab through the list page. The focus ring is the brand colour (pink-red), not blue, in light and dark mode. On the details page the tab bar shows no scrollbar at 1440, 768 and 375 px. On the product list the `페이지당 행 수 (Rows per page)` select is as high as the buttons next to it (40 px).

## 8. Known issues and what is not covered

**Fixed in the code review round of 17 Nov (no longer known issues):** the S3 CORS block of the browser upload (the upload now goes through `/api/upload`), a comma in an image file name, a 5th image, and an edit draft that could overwrite newer server data. **Fixed in the QA round of 18 Nov:** the swapped `단가 (Unit price)` / `판매가 (Selling price)`, dates in the viewer's time zone, English text in the tab title and next to the logo, the step-4 label (part 4). **Fixed after the developer's manual run of 18 Nov (commit `733655c`):** the cut `아니오` in the row status select and the sidebar / topbar that scrolled away on long pages (part 4, QA round list, item 8). **Fixed in the design review round of 18 Nov (commit `792ef82`):** the three small visual items that the QA round left open (the rows-per-page select was lower than the buttons next to it; the disabled `삭제 (Delete)` button kept its red border; `필터 초기화 (Reset filters)` was indented a little at 768 / 375 px), the drawn logo, the colours and the font that did not follow the Figma styles, and the native scrollbar on the tab bar of the details page (part 4, design review list).

**API issues.** Notice from Kakali (team lead), 18 Nov: the QA API is in maintenance. We do not fix or work around API problems. Each one is listed here with the label **"API issue"**, and an API issue does not block Pass.

- **Image size: 4 MB at most.** A Vercel function refuses request bodies above 4.5 MB, and every image goes through the app's route `/api/upload`. So the limit is 4 MB (`NEXT_PUBLIC_MAX_IMAGE_MB`, default 4 since 18 Nov); the check and the hint text use the same value. For the same reason the 5 MB part of the test `upload-route-states.spec.ts › a file above the size limit → 413` runs only against a local server: on Vercel the platform itself answers `413 FUNCTION_PAYLOAD_TOO_LARGE` (not JSON) before the route runs.
- **API issue — the QA API is sometimes slow.** The first login answer of a run sometimes took more than 5 s (seen on 17 and 18 Nov; the `로그인 (Login)` button was still busy; a probe measured 0.8 to 2.7 s). The two live login-error tests now wait up to 15 s. In the local run of 18 Nov the QA API did not answer `GET /products/categories` within 15 s once (in the setup of `products.mutation.spec.ts`; nothing was created); the re-run passed (part 9). In the local run of 18 Nov at 18:34 the API list still returned a product 5 s after it was deleted (the row was gone from the screen and the product was deleted; leftover check 0). The test `products.mutation.spec.ts › delete it with the list's bulk delete` now waits up to 30 s for that check (it was the default 5 s).
- **API issue — one live session per account (observed 2026-11-16).** After a login or a logout by the same user, the previously issued token answers 401 on the next authenticated request, although its `exp` is still 24 h ahead. On 18 Nov (manual run) only the logout part was seen: a second login in another browser did not end the first session, a logout did. The guest login / logout tests share the admin account with `setup`, so run order matters. `setup` depends on `guest` in `playwright.config.ts`, so the order guest, setup, chromium is automatic (see part 9).
- **API issue — no sort parameter** — `GET /products` always returns newest first (`id DESC`). Sort on the list header sorts the current page only; the screen says so (`현재 페이지 안에서만 정렬됩니다 (Sorted within this page)`). Backend question raised (design question 6).
- **API issue — the category list has no paging or sort parameter** — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (design question 7).
- **API issue — no refresh token** — the QA API answers CORS `origin: *` without credentials, so its httpOnly refresh-token cookie can't be used from this site. When the 1-day token expires the user logs in again (and returns to the same page).
- **Top-level category limit of 3** — the API refuses a 4th main category; QA already has 3, so main-category create can't be tested on QA (design question 8).
- **API issue — removing all options on edit is not saved** — when every single-item option is removed and saved, the API keeps the old options (backend behaviour). The form shows a note about it (test case PF-026).
- **Drag reorder on touch screens** — native drag-and-drop does not work reliably on phones / tablets; the keyboard alternative (Alt + ↑ / ↓) needs a keyboard (design question 19).
- **API issue — search by category name also returns deleted products.** Request: `GET /products?type=categoryName&search=<name>` (search type `카테고리 (Category)` on the list). Observed: products that were deleted (soft delete, `isDeleted` true) also come back when their medium or minor category name matches. In the release/qa backend code the three `name LIKE :search` conditions are joined with OR and added after `product.isDeleted = false` without brackets, so the AND is applied first. The list shows such rows like any other row and counts them in the total; opening one shows `상품을 찾을 수 없습니다 (Product not found)`, and deleting it fails. The screen does not hide them. Found by reading the backend code, not reproduced on QA. Request to the backend team: put the OR conditions in brackets (`new Brackets(...)`).
- **Row selection is kept when the search or the filters change (by design).** The selection is a set of product ids that stays across pages, searches and filter changes (up to 100), so products from different pages can be deleted together. The selection bar always shows how many rows are selected (`건 선택됨 (N selected)`) with a `선택 해제 (Clear)` action. Bulk delete deletes every selected product, also the ones that are no longer on screen. Press `선택 해제 (Clear)` before a new search when only the visible rows should be deleted.
- **Browser Back button and the form (known limitation).** The browser Back button leaves the form (on step 1) without the unsaved-changes dialog: the leave guard covers `취소 (Cancel)`, links and reload / close only. The draft then stays in the tab and comes back the next time that form is opened (an outdated edit draft is dropped with a notice); Log out removes it.
- **Contrast: some Figma tokens are below WCAG AA (design question 27).** The designer asked for the Figma tokens, so the app uses them as they are. Before this round the app used darker values that passed AA. WCAG AA asks for 4.5:1 for text and 3:1 for non-text parts. Measured:
  - primary `#ef325b` with white: 3.98:1 (the labels of primary buttons, the current page in the pager, links, the active menu);
  - Danger 100 `#e66565` on white: 3.27:1 (the error text under a field, the label of the enabled `삭제 (Delete)`);
  - placeholder Gray 90 `#afafaf` on white: 2.19:1;
  - grey row icons `#99a1af` on white: 2.60:1;
  - Gray 80 underline / outline `#d9d9d9` on white: 1.41:1 (non-text).
- **Still different from the frames.** The form has 4 steps, and the list has filters that Figma does not draw (both are earlier decisions). The enabled `삭제 (Delete)` is a danger outline; the frame draws a grey outline. Field text is 14 px (Figma 16 px), and the −0.6 px letter-spacing of the frames is not applied. Read-only fields have a dashed underline. Dark mode is not in Figma.
- **Visual polish: no open item.** The three small items of the QA round are fixed (first paragraph of this part). On the screenshots the cut step label at 768 px, the breadcrumb line starting with "/" at 375 px and the wrapped registration time also no longer appear (since 17 Nov).
- **Wording decisions where the Korean frames disagree** (design questions 20 to 25, `docs/design-questions.md`; question 26 is answered): the edit frame says `할인가격` / `카테고리`, the app uses `판매가` / `등록 카테고리` on both screens; the tax label `비과세` follows the frame; money is shown as `₩4,000`; the product type filter is not in any frame; the first breadcrumb item of the frames (`공지사항 관리`) is a left-over and the app uses `쇼핑몰 관리`; the description of frame 8.1.2 reads `단가` as a list price above `판매가`, while the app follows the API (`판매가` = `price`, `단가` = `unitPrice`, `unitPrice < price`; question 25). Question 26 (the wordmark) is answered by the design review: the logo is the Figma logo image, and the word "TalkingClub" inside it stays in Latin letters.
- No design for the details page, dark mode or tablet / phone layouts — built from the same tokens; all listed in `docs/design-questions.md` (27 questions).
- Not covered: concurrent edits by two admins, real MASTER_ADMIN / GENERAL_ADMIN / non-admin accounts (none on QA). Only a SUPER_ADMIN account exists on QA.
- Not checked: Safari and Firefox (Chromium only), a HiDPI screen, and the no-permission popup with a real non-admin login (no such account on QA).

## 9. Results of lint, type-check, build and tests

```
Final run against the Vercel link (build adb5df2), the whole suite with mutations, ONE command:
E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app npx playwright test --output=test-results/pw-vercel --trace=off
  → 2026-11-20, 12:29 to 12:34 IST, build adb5df2, one command with --retries=2: 115 tests, 115 passed on the first attempt, 0 retried, 0 failed (4.4 min). Leftover check: 0 products and 0 categories named HW3-Neeraj-*. The HTML report attached to the submission is from this run (login ID 0, password 0, session token 0). Before the last fix, on build 636e258: 2026-11-19, 10:33 to 10:42 IST, build 636e258, one command with --retries=2: 114 tests, 113 passed on the first attempt, 1 passed on a retry, 0 failed (8.8 min). The retried test is categories-states.spec.ts › add dialog: required / spaces / 51 chars / duplicate are refused before the API; API duplicate shows on the field: its page load (page.goto) timed out twice after 30 s while the connection from the developer PC to the Vercel link stalled, then it passed. Leftover check: 0 products and 0 categories named HW3-Neeraj-*. A first attempt at 10:25 without retries is not a result: three page loads ended with net::ERR_TIMED_OUT, so the live tests did not start.

The suite now has 115 tests in 15 files:
  guest      15  (auth.spec.ts 10 incl. 4 live "Login with the QA API" tests · roles.spec.ts 5)
  mocked     76  (categories-states 19 · default-error-toast-states 5 · product-form-states 22
                  · products-states 22 · session-expiry-states 1 · upload-route-states 7; mocked API)
  setup       1  (auth.setup: live UI login, writes e2e/.auth)
  chromium   23  (live) categories.spec 5 · products-list.spec 6 · products-details.spec 4 · product-form.spec 4
                  · categories.mutation.spec 1 · products.mutation.spec 3

2026-11-19, local production build of the font change (636e258, npx next start -p 3100):
npm run type-check    → exit 0
npm run lint          → exit 0
npm run build         → exit 0
mocked project        → 75 passed
guest tests without the API → 11 passed
in the browser        → the first font family is 'Pretendard Variable', Korean text is drawn with it,
                        'Inter var' is not loaded

2026-11-18, local production build of the design-fix build 792ef82 (port 3100, real QA API):
npm run type-check    → exit 0
npm run lint          → exit 0
npm run build         → exit 0
mocked project        → 75 passed
whole suite with mutations, ONE command, 18:34 to 18:39 → 113 passed, 1 failed. The failure:
                        products.mutation.spec.ts › delete it with the list's bulk delete. The row was gone from
                        the screen and the product was deleted (leftover check: 0), but the QA API list still
                        returned it after 5 s (the QA API is in maintenance and slow; API issue). The wait was
                        raised to 30 s
products.mutation again, 18:39 to 18:41 → 19 passed (guest 15, setup 1, products.mutation 3)
leftovers: 0 products and 0 categories named HW3-Neeraj-*

Not results: two runs of the whole suite against the Vercel link on build 792ef82 failed with timeouts in page
loads (18 Nov, 18:49 to 19:03: 102 passed, 10 failed, 2 did not run; 19 Nov, 09:50 to 10:06: failed the same way).
Cause: on that build one 2.06 MB font file was preloaded on every page, so the first page load on the Vercel link
was several seconds slower. Fixed in 636e258 (part 4, design review list, item 2). Run notes:
docs/live-run-2026-11-16.md, last section.
```

Earlier run, before the design fixes (history):

```
2026-11-18, against the Vercel link (build 586b91a), the whole suite with mutations (105 tests at that time), ONE command:
E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app npx playwright test --output=test-results/pw-vercel --trace=off
  → 105 passed (6.3 min) · 0 failed · 0 flaky · 0 skipped · 12:07 to 12:14 (first attempt)
  guest      14 passed  (auth.spec.ts 9 incl. 4 live "Login with the QA API" tests · roles.spec.ts 5)
  mocked     67 passed  (categories-states 18 · default-error-toast-states 5 · product-form-states 20
                         · products-states 16 · session-expiry-states 1 · upload-route-states 7; mocked API)
  setup       1 passed  (live UI login, writes e2e/.auth)
  chromium   23 passed  (live) categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
                        · product-form.spec 4 (no save) · categories.mutation.spec 1 (add sub + 2 minor, rename,
                        reorder, delete) · products.mutation.spec 3 (register with a real image through /api/upload,
                        edit, bulk delete)
  leftovers after the run: 0
  HTML report: HW3-Neeraj-playwright-report.zip (105 tests); checked: login ID 0, password 0, session token 0

Before it, on the local production build of the same code (npx next start -p 3100), 2026-11-18:
npm run type-check    → exit 0
npm run lint          → exit 0
npm run build         → exit 0
mocked project        → 66 passed, then the new test (products-states.spec.ts › list, CSV and details show
                        판매가 = price, 단가 = unitPrice and the time in KST) → 1 passed
guest tests without the API → 10 passed
full live run, 11:56 to 12:00 → 102 passed, 1 failed, 2 did not run. The failure: the QA API did not answer
                        GET /products/categories within 15 s in the setup of products.mutation.spec.ts (API issue;
                        nothing was created)
products.mutation again, 12:01 to 12:02 → 18 passed (guest 14, setup 1, products.mutation 3). The real API accepted
                        단가 15,000 / 판매가 20,000, and the edit of 판매가 to 25,000 (API price 25,000, unitPrice 15,000)
leftovers: 0
```

Tests changed in `586b91a`: the values typed into the form were swapped (`단가 (Unit price)` gets the smaller value), so the API bodies the tests check stay the same (the live edit now changes `판매가`, API `price`, to 25,000). Renamed: `product-form.spec.ts › step 1: required messages, unit price ≥ selling price, Next blocked until valid` and `product-form-states.spec.ts › 400 unitPriceMustBeLessThanPrice → back on the unit price, every value kept`. New mocked test: `products-states.spec.ts › list, CSV and details show 판매가 = price, 단가 = unitPrice and the time in KST` (the browser runs in India time, `Asia/Kolkata`). The two live login-error dialogs wait up to 15 s. The 5 MB part of `upload-route-states.spec.ts › a file above the size limit → 413` runs only against a local server. After that commit: 105 tests in 15 files.

Tests changed in `792ef82` (design review): nine new tests, and no title was renamed. Then 114 tests in 15 files. One more test came with `adb5df2` (`product-form-states.spec.ts › the first mouse click on 다음 is not lost when the cursor is in an empty field`): 115 tests now.

- `products-states.spec.ts` (mocked), six tests:
  - `Figma tokens: Pretendard web font, Gray 130 text, Primary 80 table header, Gray 80 underline search, keep-all`
  - `the header logo is the TalkingClub image and links to the home page`
  - `light: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`
  - `dark: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`
  - `filters sit behind the 필터 button: closed at first, opens, shows the number of active filters, filtering still works`
  - `the tab bar shows no native scrollbar at 1440 / 768 / 375`
- `categories-states.spec.ts` (mocked): `375px: every row is one line — [code] and name together, the buttons beside them; row icons are grey`
- `product-form-states.spec.ts` (mocked): `fields are underline-only (the textarea stays boxed): error = danger line + message, focus = brand-colour line`
- `auth.spec.ts` (guest, no API): `the logo is the TalkingClub image, alone as in frame 1.1.0; the page heading stays for screen readers`
- One wait changed: in `products.mutation.spec.ts › delete it with the list's bulk delete` the check "the API list no longer returns the product" now waits up to 30 s (it was the default 5 s). Reason: the run of 18:34 above.

The font change of 19 Nov (`636e258`) changed no test.

Older runs (history):

```
Final gates, 2026-11-17 (PowerShell). Gates first with no server running; then the production build served
with `npx next start -p 3100` and ALL Playwright tests in one command (104 tests at that time).
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

**Re-run after the re-check fixes (2026-11-18, before the QA round fixes):** gates again 0 / 0 / 0, then the same one command on the production build: **104 passed** (3.3 min), 10:06 to 10:09, including `products.mutation.spec.ts` (real image upload through `/api/upload` to the `talking-club-dev` bucket) and the stricter `upload-route-states.spec.ts` (another bucket is refused). The first attempt at 10:04 stopped on the live login-error test only: the QA API answered too slowly (the `로그인 (Login)` button was still busy after 5 s; a probe right after measured 0.8 to 2.7 s per login answer). No code or test was changed between the two attempts. Leftovers 0; the new report zip was checked: login ID 0, password 0, session token 0.

The mutation specs (`E2E_ALLOW_MUTATIONS=1`) create, edit and delete only `HW3-Neeraj-` records. The image upload goes through the app's own route `/api/upload`, so no special port is needed. The option `E2E_MAP_3000_TO` (opt-in, `playwright.config.ts`) was **not** used in these runs and is no longer needed for the upload. The new spec `upload-route-states.spec.ts` checks the route refusals (401 JSON, 400, 415, 413, 502 handling); `default-error-toast-states.spec.ts` checks the default error toast.

Run order with the one-session-per-account behaviour: `setup` depends on `guest` in `playwright.config.ts`, so one command runs guest, setup and then the chromium specs safely (`--project=setup` alone also runs guest first). Use `--output=test-results/pw-artifacts` when the logs are written inside `test-results/` (Playwright empties its output folder at start and the open log files made the runner hang on Windows).

What was verified how: login, categories (read-only and the create / rename / reorder / delete flow), product list (search, filters, URL state, selection, CSV export), details, the form steps, and product register (real image upload to S3 through `/api/upload`) / edit / delete — live against the QA API: on the local production build of `792ef82` (18 Nov) and on the Vercel link (the whole suite on build `586b91a`, 18 Nov; the run on the final build is the first block of this part). The new price mapping was also checked live: the real API accepted `단가` 15,000 / `판매가` 20,000 and the edit of `판매가` to 25,000. Roles other than SUPER_ADMIN, the upload route refusals, the default error toast, Korea time for a viewer in India, and error / empty / loading states — only with a mocked API or injected session. The design review items (the Figma colours, the Pretendard font, the header logo, the muted disabled `삭제`, the `필터` button, the tab bar, the one-line category rows, the underline fields) are checked by tests with a mocked API; the login logo is checked by a guest test that needs no API.

The category, product and product-form specs also fail on any browser console error or warning (`auth.spec.ts` / `roles.spec.ts` don't watch the console). HTML report: the attached report is the zipped `playwright-report/` of the final run against the Vercel link (`HW3-Neeraj-playwright-report.zip`, 2026-11-20, build `adb5df2`, 115 tests); it was checked for login data (QA login ID, password and saved session token: 0 each). The tests fill the login fields with a helper that does not write the value into the report. To open a local report: `npm run test:e2e:report`.

## 10. Screen sizes and browsers checked

- **Browser:** Chromium (Playwright 1.64.1, Desktop Chrome profile). Firefox / Safari not checked. A HiDPI screen was not checked (device scale 1 only).
- **Widths checked by tests** (no sideways page scroll, layout assertions):
  - `categories-states.spec.ts` › "375px: no horizontal page scroll and ≥ 40px action buttons" and "768px: …"
  - `products-states.spec.ts` › "rows become cards and the page never scrolls sideways" (375 px, list + details)
  - `products-states.spec.ts` › "filters sit behind the 필터 button: closed at first, opens, shows the number of active filters, filtering still works" (375 px)
  - `products-states.spec.ts` › "the tab bar shows no native scrollbar at 1440 / 768 / 375"
  - `categories-states.spec.ts` › "375px: every row is one line — [code] and name together, the buttons beside them; row icons are grey"
  - `product-form-states.spec.ts` › "375 px: compact stepper, one column, no horizontal page scroll"
- **Time zone checked by a test:** `products-states.spec.ts` › "list, CSV and details show 판매가 = price, 단가 = unitPrice and the time in KST" (the browser runs in India time, `Asia/Kolkata`).
- **Screenshots, 1440 / 768 / 375, light and dark** (`node scripts/screenshots/compare.mjs` against the production build of the design-fix code `792ef82` on port 3100, mocked API, Chromium; all 25 retaken on 2026-11-18 at 18:27 to 18:28. They show the design review changes: the TalkingClub logo image with no text next to it, the Figma colours and the Pretendard font, underline-only fields, the `필터 (Filters)` button at 768 / 375 px, one-line category rows at 375 px and the grey disabled `삭제 (Delete)`. They still show one price under `판매금액`, `단가` then `판매가` in step 1 and KST dates): login, product list, product form step 1, product details, categories → `docs/screenshots/` (25 PNGs, list in `docs/screenshots/README.md`). At 1440 each screen is shown next to its **Korean** Figma frame (design | build light | build dark). Category and product names in the screenshots are sample data and stay English.
