# HW3 submission draft — Neeraj Gurjar (updated 2026-11-19)

Built from the Notion assignment page (416326b2…) and the submission page (416326b2…3317e), both fetched on 2026-11-17: the page has **nine sections** (titles below are exact) and four properties (HW3 status, Submitted on, Vercel link, Branch / PR link). Paste each block under the matching heading. Placeholders in `<…>` need a value at submission. No logins, tokens or passwords anywhere in this file.

Status on 2026-11-19:
- **Code review: Pass** (Kakali, 18 Nov, after the re-check). The explanation call is still to come: she wants the upload route and the draft version check explained in my own words (`docs/explain-notes.md`, sections 4 and 5).
- **QA round** (Archana, 18 Nov): result "Resubmit". The build was praised: 90 checks passed on the Vercel build. The fixes are in commit `586b91a`; see "Fixed after the QA round (18 Nov)" below. To be re-tested on the final build `adb5df2`.
- **Design review** (Bhagyashree, 18 Nov): result "Resubmit". The fixes are in commit `792ef82`; see "Fixed after the design review (18 Nov)" right below. Re-check on 20 Nov: **Pass** (on build `636e258`).
- Final result: Friday 20 Nov.
- The QA API is in maintenance (notice from Kakali, 18 Nov). API problems are not fixed or worked around; each one is listed in the known issues as "API issue", and an API issue does not block Pass.

Labels of the UI are written as Korean text followed by the English meaning in brackets, because the whole UI is Korean now.

## Fixed after the design review (18 Nov)

Designer Bhagyashree, result "Resubmit". She reviewed the Vercel build at 1440 / 768 / 375 px, light and dark, against the Korean Figma frames 1.1.0, 8.1.0, 8.1.1 and 8.2.0. Her words: "A strong build: responsive (cards at ≤768, no sideways scroll), dark mode and the category tree are very good, and the 1440 layout follows the Figma frames closely." Three must-fix items, four should-fix items and some minor items. All are done in commit `792ef82`; the way the font is loaded was changed once more on 19 Nov (commit `636e258`).

1. **Logo (must-fix).** Before: a drawn single ring and the text "TalkingClub" on the header, and "TalkingClub | 관리자" on the login page. Now: the TalkingClub logo of the Figma frames (three-ring mark + wordmark) as one image with no text next to it, on the header, the login page, the 403 page, the 404 page, the error page and the no-permission popup. The Figma file has no vector logo, only a 158 × 30 px bitmap on a white background (the same file as `loginLogo.png` of the real admin project). So the same artwork with a transparent background (512 × 107 px) was taken from the company's own web project (`talking-club-web-frontend/public/images/logo.png`) and saved as `public/brand/talkingclub-logo.png` (source confirmed by the developer on 18 Nov). `src/components/BrandLogo.tsx` shows it as an inline SVG: the mark is drawn from the file, and the wordmark is filled with the current text colour through a mask, so it stays readable in dark mode. In dark mode the mark is made a little brighter (`$logo-mark-dark-filter` in `_tokens.scss`). On phones (≤ 480 px) the topbar shows the mark alone. The image has the accessible name `TalkingClub`; the header link keeps `토킹클럽 홈 (Talking Club home)`; the login page keeps the hidden heading `토킹클럽 관리자 로그인 (Talking Club admin login)`; the tab titles stay `… | 토킹클럽 관리자`. The favicon is now the mark (`src/app/icon.png`). This answers design question 26.
2. **Colours and font follow the Figma styles (must-fix).** Every light colour in `src/styles/_tokens.scss` is now the hex of a Figma style, for example text `#181818` (Gray 130), border `#eaeaea` (Background 100), input underline `#d9d9d9` (Gray 80), brand and primary `#ef325b` (Talking Club), table header `#fff1f3` (Primary 80), danger `#e66565` (Danger 100). The full list (old → new, style name) is in `docs/qa-build-report.md`, part 4. The focus ring is the brand colour (it was blue). Kept, because Figma gives no value: the success, warning and info colours, the overlay, the shadow and the dark palette. What you see: a white page with bordered cards, as in the frames; the active sub-menu row is grey, not pink; the enabled `삭제 (Delete)` outline is the lighter Danger 100. Some of these tokens are below WCAG AA; they are listed in the known issues (section 7) and asked as design question 27.
   Font: the Figma text nodes use Pretendard. It is self-hosted as the "dynamic subset" of the npm package pretendard 1.3.9 (licence SIL OFL 1.1; the package is not a dependency): 92 small files in `public/fonts/pretendard/` and one `@font-face` rule per file with its `unicode-range` in `src/styles/pretendard-font.css` (imported in `src/app/layout.tsx`). The family name is `'Pretendard Variable'`, first in `$font-family-base`; PrimeReact uses it too; 'Inter var' is no longer loaded. The font is loaded as a dynamic subset: the browser downloads only the files for the characters a page shows (about 190 KB of fonts on the login page). In `792ef82` it was one 2.06 MB file, preloaded on every page; that made the first page load on the Vercel link several seconds slower, so it was changed in `636e258`.
3. **Disabled buttons are muted (must-fix).** A disabled `삭제 (Delete)` is a grey fill with a border of the same colour and a white label, like a disabled `CSV 다운로드 (Export CSV)`, in light and dark.
4. **Korean line breaks (should-fix).** `word-break: keep-all` on the whole page: Korean text breaks between words.
5. **Underline-only fields where the frames draw them (should-fix):** the search type and the search input of 8.1.0, and the text inputs and dropdowns of the product form (8.1.1 / 8.1.2). The textarea stays boxed, as drawn. The height stays 40 px; error = danger line + message; focus = 2 px brand line. Left boxed on purpose (not in the frames she named): the search of the 8.1.3 option picker and the input of the category add / edit dialog.
6. **Product list at ≤ 768 px (should-fix).** The search row stays visible. The four filters, `필터 초기화 (Reset filters)` and the hint sit behind a button `필터 (Filters)` (`aria-expanded`, `aria-controls`). The panel starts closed, also when filters are in the URL, and the button shows the number of active filters (accessible name `필터 N개 적용 중 (Filters, N in use)`). Desktop is unchanged. The open / closed state is not remembered across reloads; the search term is not counted as a filter.
7. **Category rows at ≤ 640 px are one line (should-fix):** `[code] name` together, the count under the name, the three actions at the right. The level badge is hidden there, and `+ 소분류 (+ Minor category)` becomes a 40 × 40 px `+` button with the same accessible name.
8. **Minor items:** the focus ring is the brand colour; the tab bar of the details page no longer shows a native scrollbar; the rows-per-page select is 40 px high, like the buttons next to it; `필터 초기화 (Reset filters)` lines up with the fields at ≤ 1024 px; the pencil and trash icons of a category row are grey (the trash turns red on hover or keyboard focus). With item 3 this closes all three visual items that the QA round left open.

Still different from the frames, and not checked: see the known issues in section 7.

## Fixed after the QA round (18 Nov)

QA Archana, result "Resubmit"; the build was praised (90 checks passed on the Vercel build). Four must-fix and three should-fix items:

1. **`단가 (Unit price)` / `판매가 (Selling price)` were swapped (must-fix).** Checked in the backend (talking-club-backend, branch `release/qa`): the shopping cart and the order charge the product field `price` (`sellingPrice: product.price`, `lineTotal(product.price, quantity, …)`), and the API refuses a product unless `unitPrice < price`. Now `판매가 (Selling price)` and the list column `판매금액 (Selling price)` = API `price`, and `단가 (Unit price)` = API `unitPrice`. Step 1 rule: `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)`; the API error key `unitPriceMustBeLessThanPrice` shows the same text. Step 1 asks for `단가` first, then `판매가` (Figma 8.1.1 order). The list shows only `판매금액` = `price` (the crossed-out second price is gone); the CSV columns are `단가` = `unitPrice` and `판매금액` = `price`; the details page and the step-4 summary show `단가` / `판매가` the same way; sort by `판매금액` sorts by `price`; a picked single-item option starts at that product's `price`. The earlier docs and the glossary said the opposite, because the description of Figma frame 8.1.2 says "판매가 ≤ 정가"; the app now follows the API and the backend (design question 25).
2. **Dates in the viewer's time zone (must-fix).** Every date is now shown in Korea time (KST, `Asia/Seoul`) for every viewer: list, details (`등록일자 (Registration date)`, `수정일자 (Last updated)`), the CSV column `등록일자` and the CSV file name, and the draft "saved at" time. Done once in `src/utils/format.ts` (dayjs `utc` + `timezone`, `DISPLAY_TIME_ZONE = "Asia/Seoul"`).
3. **Test sheet format (must-fix).** The sheet now follows the WM DEV template, and I ran the manual rows on 18 Nov (details in `docs/test-cases.md` and `docs/manual-run-2026-11-18.md`).
4. **English on screen (must-fix).** Tab titles are now `… | 토킹클럽 관리자` (were `… | TalkingClub Admin`); the text next to the logo is `관리자 (Admin)` (was `Admin`) on the login page, the 403 page, the 404 page, the error page and the no-permission popup. Changed again by the design review: the logo is now the Figma logo image with no text next to it, so the text `관리자` next to the logo is gone (design review list above, item 1). The tab titles stay Korean.
5. **Step-4 label (should-fix).** The ERP price field is now `ERP 단가 (ERP unit price)` (was `단가`).
6. **Run on the Vercel link (should-fix).** The whole suite with mutations (105 tests at that time) ran against the Vercel link on build `586b91a`: 105 passed. The run on the final build is in section 5.
7. **Three visual items (should-fix): fixed after the design review (commit `792ef82`).** The rows-per-page select is 40 px high, like the buttons next to it; a disabled `삭제 (Delete)` button is grey and has no red border; `필터 초기화 (Reset filters)` lines up with the fields.
8. **Two layout bugs found by my own manual run, fixed (CSS only, commit `733655c`):** the row `노출여부 (Exposure Status)` select cut `아니오 (No)` on a narrow table (PL-023); the sidebar and topbar scrolled away on long pages at desktop width (LG-031).
9. **One bug found by the developer's manual re-run on the final build (19 Nov), fixed in commit `adb5df2`:** with the cursor in an empty field of the product form, the first mouse click on `다음 (Next)` did nothing. The form checks a field when it loses focus, so the field's message appeared on mouse-down, the footer moved 26 px down before the mouse button was released, and the click never reached the button (the second click worked; keyboard use and a click with no field focused were not affected, so the automated tests did not see it). Now `취소 (Cancel)`, `이전 (Back)`, `다음 (Next)` and `등록 (Register)` / `저장 (Save)` keep the focus in the field on mouse-down, so the first click arrives and the step is checked as a whole. New test: `product-form-states.spec.ts › the first mouse click on 다음 is not lost when the cursor is in an empty field` (it fails on the build before the fix). Test case PF-035.

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
- Commits on `origin/hw3/neeraj` (all pushed on 19 Nov): `b2e2974` (first build), `85e0572` (earlier review fixes), `8c968d7` (docs), `8b2f596` (code-review fixes: upload route, 5th image, comma, edit draft, error toast), `356dc8d` (Korean UI), `b25769b` (docs), `355d2ae` (re-check points: 4 MB default, upload only to the `talking-club-dev` bucket), `586b91a` (QA round fixes: price fields, KST dates, Korean title, ERP label), `733655c` (two layout bugs: status select width, sticky sidebar and topbar), `792ef82` (design review fixes: Figma logo, colours, Pretendard, underline fields, mobile filters), `636e258` (font as a dynamic subset), `adb5df2` (the first mouse click on a footer button of the product form is no longer lost). One more docs commit follows (branch head).
- PR description text: `docs/pr-description.md`

## 2. Vercel link (latest build)

https://tc-admin-hw3-neeraj.vercel.app (own Vercel project, branch `hw3/neeraj`, runs commit `adb5df2`; `NEXT_PUBLIC_API_BASE_URL` set to the QA API, `NEXT_PUBLIC_MAX_IMAGE_MB=4`, deployment protection off).

Note for the testers: product images are uploaded through the app's own route `/api/upload`, so the upload works on the Vercel link. On the Vercel link an image may be **at most 4 MB** (platform limit; since 18 Nov 4 MB is also the default for any build). On an earlier build (`586b91a`) the whole suite ran against the deployed link on 2026-11-18 (12:07 to 12:14, with mutations, 105 tests at that time): **105 passed**, 0 failed, 0 flaky, 0 skipped. So a product with an image was registered, edited and deleted on the Vercel link. Leftovers 0. The run on the final build is in section 5.

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
The full run of section 5 (all 115 tests, including the create / edit / delete specs) against the Vercel link:
```
E2E_ALLOW_MUTATIONS=1 PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app npx playwright test --output=test-results/pw-vercel --trace=off
```
The same run against a local production build on port 3100, in PowerShell:
```
npm run build ; npx next start -p 3100                         # terminal 1
$env:E2E_ALLOW_MUTATIONS="1"; $env:PLAYWRIGHT_BASE_URL="http://localhost:3100"   # terminal 2
npx playwright test --output=test-results/pw-artifacts --trace=off
```
On Vercel, the 5 MB part of `upload-route-states.spec.ts › a file above the size limit → 413` runs only against a local server, because Vercel itself refuses bodies above 4.5 MB (`413 FUNCTION_PAYLOAD_TOO_LARGE`, not JSON).
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

2026-11-18 (code re-check and QA round)
7. `bhai kakali ke new comment aaye hai dekho or btao kya ye ho sakta hai` (Kakali's re-check points)
8. `thik hai fix kar do`
9. `bhai archana ka new comment aaya hai dekho or kya improve karna hai kr do` (the QA round)

2026-11-18 (design review)
10. `commit kar do par sb check kar ke hi thik hai or comment bhi`
11. `start again or ek new comment aaya hai vo dekho or kam start kro.` (the design review; first sentence of the prompt)

**What Claude did (plan-first):** read the Slack DM, the TL page, my submission page and the training page (Notion), the Figma frames (login 4019:78447, shopping 5498:98250 → 8.1.0–8.1.3, 8.2.0) and the real API code (`talking-club-backend`, `release/qa`). Wrote the plan first (`docs/hw3-plan.md`, `docs/design-questions.md`), then built in steps — foundation (auth, one nav / permission config, light/dark tokens, layout, services + hooks) → three screens (categories / product list + details / multi-step form) → fixes → lint, type-check, build, Playwright → QA documents. On 16–17 Nov, when the QA API was back, Claude ran the live read-only specs one command at a time, then the mutation specs, then updated the QA docs so every number is true. After the code review of 17 Nov, Claude fixed the six review items (see the list at the top), switched the whole UI to Korean using the Korean Figma frames, wrote `docs/ko-glossary.md`, ran the full test suite once more and updated all documents. On 18 Nov Claude did Kakali's two re-check points (4 MB default, upload only to the `talking-club-dev` bucket). For the QA round it first read the backend code (`release/qa`) to find which price field the cart and the order charge, then fixed the price mapping, Korea time for all dates, the Korean tab title and logo suffix and the `ERP 단가` label, updated the tests, ran the whole suite locally and against the Vercel link (105 passed), retook the screenshots and updated the documents. For the design review of 18 Nov it did the three must-fix items, the four should-fix items and the minor items (list at the top of this file): the Figma logo image, colours from the Figma styles, the Pretendard font, muted disabled buttons, `word-break: keep-all`, underline-only fields, the `필터 (Filters)` button on phones and one-line category rows. It added nine tests (114 now), ran the checks and retook the 25 screenshots. On 19 Nov it changed the font to a dynamic subset, because one 2.06 MB font file made the Vercel link slow. The lesson written down in this round: read the exact values from the source (the Korean Figma frames, the Figma styles, the backend code, the WM template) before building, instead of building something that only looks similar.
**Skills / tools:** Notion, Slack and Figma connectors; Claude Code subagents for the foundation, each screen and the QA documents; Playwright for tests and screenshots.

**Problems solved**
1. *The QA API was down (Cloudflare 521) on the build day.* Every screen got a mocked spec (`*-states.spec.ts`, `page.route` + injected session) and a `mocked` Playwright project without a login dependency, so loading / empty / 403 / 500 / network / rollback states were tested while the server was down. When the API came back (16–17 Nov) the live read-only specs passed 5 + 6 + 4 + 4, plus the category mutation spec.
2. *Refresh token vs CORS.* The refresh token is an httpOnly cookie but the QA CORS is `origin: *`, so a browser on another domain never sends it. Expiry is handled by decoding `exp` from the JWT and going to `/login?returnTo=<same page>`.
3. *Live test order.* The first live `categories.spec.ts` run failed 5 of 5 with 401: the QA API keeps one live session per account and the guest login / logout tests had revoked the token saved by `setup`. Fixed by making `setup` depend on `guest` in `playwright.config.ts` (guest → setup → chromium).
4. *Playwright hung with no output on Windows* when its log files sat inside `test-results/` (Playwright empties that folder at start). Fixed with `--output=test-results/pw-artifacts`.
5. *The S3 bucket CORS blocked the browser upload* (it accepted only the origin `http://localhost:3000`, so the upload failed on the Vercel link). Fixed in the code review round: the browser posts the file to the app's own route `/api/upload` and the server sends it to S3. CORS is a browser rule, so the bucket settings no longer matter. The route is not an open proxy: it checks the session, accepts only the `talking-club-dev` bucket, and checks type and size again.
6. *Which price is 단가 and which is 판매가?* (QA round, 18 Nov.) The Figma description and the API disagree. The backend code decided it: the cart and the order charge `price`, and the API requires `unitPrice < price`. So `판매가 (Selling price)` = `price` and `단가 (Unit price)` = `unitPrice`; the conflict is design question 25.
7. *The build only looked similar to the design.* (Design review, 18 Nov.) The first build used its own drawn logo, its own darker colours and the font of the PrimeReact theme. The designer asked for the exact Figma values. Now the logo is the artwork of the frames, every light colour is the hex of a Figma style with the style name in a comment (`src/styles/_tokens.scss`), and the font is Pretendard, the font of the frames. Lesson: read the exact values from the source before building.
8. *The self-hosted font made the Vercel link slow.* (19 Nov.) In `792ef82` the font was one 2.06 MB file, preloaded on every page. On the Vercel link the first page load was several seconds slower (the file alone took 4.8 s to download on my network), and two Playwright runs against the Vercel link failed with timeouts in page loads. Fixed in `636e258`: the font is the "dynamic subset" of the same package (92 small files with `unicode-range`), so the browser downloads only the files it needs. The login page now loads 187 KB of fonts; before it was 2,058 KB.

## 5. lint / type-check / build / Playwright output + HTML report

Final run: the whole Playwright suite with mutations as **one command** against the Vercel link (build `adb5df2`), so one HTML report holds every test:

```
E2E_ALLOW_MUTATIONS=1  PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app
npx playwright test --output=test-results/pw-vercel --trace=off
                      2026-11-20, 12:29 to 12:34 IST, build adb5df2, one command with --retries=2: 115 tests, 115 passed on the first attempt, 0 retried, 0 failed (4.4 min). Leftover check: 0 products and 0 categories named HW3-Neeraj-*. The HTML report attached to the submission is from this run (login ID 0, password 0, session token 0). Before the last fix, on build 636e258: 2026-11-19, 10:33 to 10:42 IST, build 636e258, one command with --retries=2: 114 tests, 113 passed on the first attempt, 1 passed on a retry, 0 failed (8.8 min). The retried test is categories-states.spec.ts › add dialog: required / spaces / 51 chars / duplicate are refused before the API; API duplicate shows on the field: its page load (page.goto) timed out twice after 30 s while the connection from the developer PC to the Vercel link stalled, then it passed. Leftover check: 0 products and 0 categories named HW3-Neeraj-*. A first attempt at 10:25 without retries is not a result: three page loads ended with net::ERR_TIMED_OUT, so the live tests did not start.
```

The suite now has 115 tests in 15 files: guest 15 (`auth.spec` 10 incl. 4 live login tests, `roles.spec` 5), mocked 76 (`categories-states` 19, `default-error-toast-states` 5, `product-form-states` 22, `products-states` 22, `session-expiry-states` 1, `upload-route-states` 7), setup 1 (`auth.setup`), chromium 23 (live: `categories.spec` 5, `products-list.spec` 6, `products-details.spec` 4, `product-form.spec` 4, `categories.mutation.spec` 1, `products.mutation.spec` 3).

Before it, 19 Nov, on the local production build of the font change (`636e258`, port 3100): `npm run type-check` exit 0, `npm run lint` exit 0, `npm run build` exit 0; mocked project 75 passed; guest tests without the API 11 passed. In the browser the first font family is `Pretendard Variable`, Korean text is drawn with it, and 'Inter var' is not loaded.

18 Nov, on the local production build of the design-fix build `792ef82` (port 3100, real QA API): type-check 0, lint 0, build 0; mocked project 75 passed. Whole suite with mutations, one command, 18:34 to 18:39: 113 passed, 1 failed. The failure was `products.mutation.spec.ts › delete it with the list's bulk delete`: the row was gone from the screen and the product was deleted (leftover check: 0), but the QA API list still returned it after 5 s (the QA API is in maintenance and slow; an API issue). The wait was raised to 30 s, and `products.mutation` ran again, 18:39 to 18:41: 19 passed (guest 15, setup 1, products.mutation 3). Leftovers: 0 products and 0 categories named `HW3-Neeraj-*`.

Not results: two runs of the whole suite against the Vercel link on build `792ef82` failed with timeouts in page loads (18 Nov, 18:49 to 19:03: 102 passed, 10 failed, 2 did not run; 19 Nov, 09:50 to 10:06: failed the same way). The cause was the 2.06 MB font file that was preloaded on every page (problem 8 in section 4); it is fixed in `636e258`.

Tests changed in `792ef82` (design review): nine new tests, no title was renamed. `products-states.spec.ts`: `Figma tokens: Pretendard web font, Gray 130 text, Primary 80 table header, Gray 80 underline search, keep-all`; `the header logo is the TalkingClub image and links to the home page`; `light: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`; `dark: 삭제 with nothing selected is disabled and muted, exactly like a disabled CSV 다운로드`; `filters sit behind the 필터 button: closed at first, opens, shows the number of active filters, filtering still works`; `the tab bar shows no native scrollbar at 1440 / 768 / 375`. `categories-states.spec.ts`: `375px: every row is one line — [code] and name together, the buttons beside them; row icons are grey`. `product-form-states.spec.ts`: `fields are underline-only (the textarea stays boxed): error = danger line + message, focus = brand-colour line`. `auth.spec.ts` (guest): `the logo is the TalkingClub image, alone as in frame 1.1.0; the page heading stays for screen readers`. One wait changed: in `products.mutation.spec.ts › delete it with the list's bulk delete` the check "the API list no longer returns the product" now waits up to 30 s (it was the default 5 s). The font change of 19 Nov changed no test.

Earlier run on the Vercel link, before the design fixes (history): 2026-11-18, build `586b91a`, the whole suite with mutations as one command (105 tests at that time):

```
E2E_ALLOW_MUTATIONS=1  PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app
npx playwright test --output=test-results/pw-vercel --trace=off
                      105 passed (6.3 min) · 0 failed · 0 flaky · 0 skipped · 12:07 to 12:14 (first attempt)
  guest      14 passed   auth.spec 9 (incl. 4 live login tests) · roles.spec 5
  mocked     67 passed   categories-states 18 · default-error-toast-states 5 · product-form-states 20
                         · products-states 16 · session-expiry-states 1 · upload-route-states 7
  setup       1 passed   live UI login (auth.setup)
  chromium   23 passed   live: categories.spec 5 · products-list.spec 6 (incl. Export CSV) · products-details.spec 4
                         · product-form.spec 4 · categories.mutation.spec 1 (add sub + 2 minor, rename, reorder, delete)
                         · products.mutation.spec 3 (register with a real image through /api/upload, edit, bulk delete)
leftover check        0 products and 0 categories named HW3-Neeraj-* remain
```

Before it, on the local production build (port 3100) of the same code, 18 Nov: `npm run type-check` exit 0, `npm run lint` exit 0, `npm run build` exit 0; mocked project 66 passed and the new test 1 passed; guest tests without the API 10 passed. Full live run 11:56 to 12:00: 102 passed, 1 failed, 2 did not run. The failure was the QA API not answering `GET /products/categories` within 15 s in the setup of `products.mutation.spec.ts` (an API issue; nothing was created). Re-run of `products.mutation` 12:01 to 12:02: 18 passed (guest 14, setup 1, products.mutation 3). The real API accepted `단가 (Unit price)` 15,000 / `판매가 (Selling price)` 20,000 and the edit of `판매가` to 25,000 (API `price` 25,000, `unitPrice` 15,000). Leftovers 0.

Tests changed in `586b91a`: the values typed into the form were swapped (`단가` gets the smaller value), so the API bodies the tests check stay the same (the live edit now changes `판매가`, API `price`, to 25,000). Renamed: `product-form.spec.ts › step 1: required messages, unit price ≥ selling price, Next blocked until valid` and `product-form-states.spec.ts › 400 unitPriceMustBeLessThanPrice → back on the unit price, every value kept`. New mocked test: `products-states.spec.ts › list, CSV and details show 판매가 = price, 단가 = unitPrice and the time in KST` (the browser runs in India time, `Asia/Kolkata`). The two live login-error dialogs wait up to 15 s (the shared QA API sometimes needed more than 5 s for the first login answer of a run; seen on 17 and 18 Nov; a probe measured 0.8 to 2.7 s). The 5 MB part of `upload-route-states.spec.ts › a file above the size limit → 413` runs only against a local server, because Vercel itself refuses bodies above 4.5 MB (`413 FUNCTION_PAYLOAD_TOO_LARGE`, not JSON). After that commit: 105 tests in 15 files.

Earlier run (history), 2026-11-17, PowerShell. The gates ran first with no server running; then the production build was served with `npx next start -p 3100`, and the whole Playwright suite (104 tests at that time) ran as one command:

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

**Re-run after the re-check fixes (2026-11-18, before the QA round fixes):** gates again 0 / 0 / 0, then the same one command on the production build: **104 passed** (3.3 min), 10:06 to 10:09, including `products.mutation.spec.ts` (real image upload through `/api/upload` to the `talking-club-dev` bucket) and the stricter `upload-route-states.spec.ts` (another bucket is refused). The first attempt at 10:04 stopped on the live login-error test only: the QA API answered too slowly (the `로그인 (Login)` button was still busy after 5 s; a probe right after measured 0.8 to 2.7 s per login answer). No code or test was changed between the two attempts. Leftovers 0; the new report zip was checked: login ID 0, password 0, session token 0.

Honest summary: every spec marked live above ran against the QA API, including product register / edit / delete with a real image upload to S3 through the app's own route `/api/upload` (no special port is needed, `E2E_MAP_3000_TO` was not used). The `mocked` project uses a mocked API. The run of 18 Nov on build `586b91a` ran the whole suite (105 tests) on the deployed Vercel link and passed on the first attempt. The result of the run on the final build is the first block of this section. Two runs against the Vercel link on build `792ef82` failed with page-load timeouts and are not counted (see above). The full logs are kept outside the repo; the numbers above are copied from them. Run notes: `docs/live-run-2026-11-16.md` (last section).

Fixed earlier on 17 Nov after two internal reviews (details: `docs/qa-build-report.md` part 4): a second tab no longer logs the first tab out; the pager fits on one line at 375 px; a percent-encoded URL no longer gets past the route guards; Log out removes unsaved product form drafts; Register sends a fresh product code; CSV export guards text that starts with `-`; an edit with "상품 구매 필수 옵션 선택 (Required option for purchase)" on and no option rows can be saved; Register stays disabled after a successful save. The tests grew from 81 to 84 there, to 104 with the code-review fixes (new files `upload-route-states.spec.ts` and `default-error-toast-states.spec.ts`, more tests in `product-form-states.spec.ts`), to 105 in the QA round (the new price and KST test in `products-states.spec.ts`), and to 114 in the design review round (nine new tests).

HTML report: the attached report is the zipped `playwright-report/` of the final run against the Vercel link (`HW3-Neeraj-playwright-report.zip`, 2026-11-20, build `adb5df2`, 115 tests); checked that it contains no login data (the QA login ID, the password and the saved session token were counted in the report: 0 each). The login fields are filled by a test helper that does not write the typed value into the report.

## 6. Unit test case sheet link

`<Google Sheet link — import docs/test-cases.csv (File → Import → Upload), then paste the link>`
Content: `docs/test-cases.md` / `.csv`. Since the QA round of 18 Nov the sheet follows the WM DEV template (columns such as Platform, Role, Actual Result, Pass / Fail, Last Run Date), and I ran the manual rows on 18 Nov. The counts and the results are in `docs/test-cases.md`; the manual run is described in `docs/manual-run-2026-11-18.md`. Labels in the steps and expected results are Korean text followed by the English meaning in brackets.

## 7. Build report for QA

Full text: `docs/qa-build-report.md` (10 parts, dated 2026-11-18 and 2026-11-19) — post it as a comment on the TL task. Key points:

- **Fixed after the design review of 18 Nov** (part 4 of the report): the TalkingClub logo image of the Figma frames with no text next to it; colours from the Figma styles and the Pretendard font; grey disabled buttons; `word-break: keep-all`; underline-only fields on the list search and the product form; the `필터 (Filters)` button at ≤ 768 px; one-line category rows at ≤ 640 px; brand-colour focus ring; no scrollbar on the details tab bar; a 40 px rows-per-page select. The font is loaded as a dynamic subset (about 190 KB on the login page).
- **Fixed after the QA round of 18 Nov** (part 4 of the report): `판매가 (Selling price)` = API `price` and `단가 (Unit price)` = API `unitPrice` everywhere, with the rule `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)`; every date in Korea time (KST); tab title `… | 토킹클럽 관리자` (the text next to the logo was removed again by the design review); step-4 label `ERP 단가 (ERP unit price)`; the test sheet in the WM DEV template; the whole suite run on the Vercel link (105 passed on build `586b91a`). The three visual items that this round left open are fixed in `792ef82`.
- **Fixed after the code review of 17 Nov** (part 4 of the report): the UI is Korean; the image upload goes through the app's own route `/api/upload`; a 5th image is blocked; commas are removed from image file names; an outdated edit draft is dropped with a notice; a default error toast exists (see the list at the top of this file).
- **Verified live (QA API):** login, logout, wrong ID / password messages, returnTo; categories (read-only specs and the create / rename / reorder / delete flow under an existing main category); product list (search, filters, URL state, selection, CSV export); details tabs; form steps; product register (with the real image upload to S3 through `/api/upload`) / edit / delete, including the new price mapping (`단가` 15,000 / `판매가` 20,000, edit of `판매가` to 25,000) — the whole suite also on the Vercel link.
- **Verified only with a mocked API / injected session:** roles other than SUPER_ADMIN (no such account on QA), loading / empty / 401 (mid-session expiry to /login?returnTo, session-expiry-states.spec.ts) / 403 / 404 / 500 / network states, the `/api/upload` refusals (401 / 400 / 415 / 413 / 502), the default error toast, Korea time for a viewer in India.
- **Known issues now** (the QA API is in maintenance; API problems are labelled "API issue" and do not block Pass):
  - On the Vercel link an image may be at most **4 MB** (platform limit for function request bodies). Since 18 Nov 4 MB is also the default for any build.
  - API issue: the QA API is sometimes slow (the first login answer of a run took more than 5 s on 17 and 18 Nov; once `GET /products/categories` did not answer within 15 s).
  - API issue: after a login or logout by the same user, the earlier token answers 401 on the next authenticated request although `exp` is still 24 h ahead (one live session per account).
  - API issue: `GET /products` has no sort parameter (always `id DESC`) → sort works within the current page only.
  - API issue: the category list has no paging or sort parameter — `GET /product-category/list` (release/qa `filterCategoriesDto`) accepts only `search` and returns the whole 3-level tree. Search is server-side (`?q=`); order is the saved order, changed by drag-and-drop or Alt + ↑ / ↓ and saved through the reorder API; paging does not apply to a tree (design question 7).
  - The category tree allows at most 3 main categories; QA already has 3 → main-category create cannot be tried on QA.
  - API issue: removing every option on edit is not saved by the API (old options stay).
  - API issue: CORS `origin: *` → the refresh cookie cannot be used; after the 1-day token the user logs in again and returns to the same page.
  - API issue: `GET /products?type=categoryName&search=<name>` (search by category name) → also returns deleted products whose medium or minor category name matches (the OR conditions are not in brackets after `isDeleted = false`; seen in the release/qa backend code). The list shows them as normal rows.
  - Only a SUPER_ADMIN account exists on QA.
  - Contrast: some Figma tokens are below WCAG AA (4.5:1 for text, 3:1 for non-text parts). The designer asked for the Figma tokens, so the app uses them as they are; before this round the app used darker values that passed AA. Primary `#ef325b` with white 3.98:1 (labels of primary buttons, the current page in the pager, links, the active menu); Danger 100 `#e66565` on white 3.27:1 (error text under a field, the label of the enabled `삭제 (Delete)`); placeholder Gray 90 `#afafaf` 2.19:1; grey row icons `#99a1af` 2.60:1; Gray 80 underline / outline `#d9d9d9` 1.41:1 (non-text). Design question 27 asks if they should stay.
  - Still different from the frames: the form has 4 steps and the list has filters that Figma does not draw (both are earlier decisions); the enabled `삭제 (Delete)` is a danger outline (the frame draws a grey outline); field text is 14 px (Figma 16 px) and the −0.6 px letter-spacing of the frames is not applied; read-only fields have a dashed underline; dark mode is not in Figma.
  - Not checked: Safari and Firefox (Chromium only), a HiDPI screen, the no-permission popup with a real non-admin login (no such account on QA).
- **By design:** the row selection is kept when the search or the filters change; the selection bar always shows how many rows are selected, with a Clear action (`선택 해제`), and bulk delete deletes every selected product.
- **Known limitation:** the browser Back button leaves the form without the unsaved-changes dialog; drag reorder does not work on touch screens (Alt + ↑ / ↓ alternative).
- **Visual polish: no open item.** The three small items of the QA round (the rows-per-page select height, the red border of the disabled `삭제 (Delete)` button, the indent of "필터 초기화 (Reset filters)") are fixed in `792ef82`. On the screenshots the cut step label at 768 px, the breadcrumb line starting with "/" at 375 px and the wrapped registration time also no longer appear (since 17 Nov).
- **No longer known issues (fixed):** the S3 CORS block of the browser upload, a comma in a file name, the 5th image, the edit draft overwriting newer data; since 18 Nov also the swapped `단가` / `판매가`, dates in the viewer's time zone, English in the tab title and next to the logo, the cut `아니오 (No)` in the row status select and the sidebar / topbar that scrolled away (`733655c`), the drawn logo, colours and font that did not follow the Figma styles, and the three visual items (`792ef82`).

## 8. Side-by-side screenshots (design | your screen) at 1440 / 768 / 375, light and dark

Files in `docs/screenshots/` (25 PNGs and `README.md`; all 25 retaken on 2026-11-18 at 18:27 to 18:28 by `scripts/screenshots/compare.mjs` against the production build of the design-fix code `792ef82` on port 3100, mocked API, Chromium). They show the design review changes: the TalkingClub logo image with no text next to it, the Figma colours and the Pretendard font, a white page with bordered cards, underline-only fields on the list search and the form, the `필터 (Filters)` button at 768 / 375 px, one-line category rows at 375 px and the grey disabled `삭제 (Delete)`. They still show the QA round changes: one price under `판매금액 (Selling price)` in the list, `단가 (Unit price)` then `판매가 (Selling price)` in step 1 with the new hints, `단가` / `판매가` on the details page, and dates in Korea time. The design side now shows the **Korean** Figma frames (new exports in `docs/design/` for 8.1.0, 8.1.1, 8.1.2, 8.1.3 and 8.2.0; the login frame was already Korean). At 1440 each screen is design | build light | build dark. Category and product names in the screenshots are sample data and stay English.

| Screen | 1440 design \| build | 768 | 375 |
|---|---|---|---|
| Login | `compare-1440-login.png` | `build-768-light-login.png` · `build-768-dark-login.png` | `build-375-light-login.png` · `build-375-dark-login.png` |
| Product list | `compare-1440-product-list.png` | `build-768-light-product-list.png` · `build-768-dark-product-list.png` | `build-375-light-product-list.png` · `build-375-dark-product-list.png` |
| Product form, step 1 | `compare-1440-product-form.png` | `build-768-light-product-form.png` · `build-768-dark-product-form.png` | `build-375-light-product-form.png` · `build-375-dark-product-form.png` |
| Product details | `compare-1440-product-details.png` | `build-768-light-product-details.png` · `build-768-dark-product-details.png` | `build-375-light-product-details.png` · `build-375-dark-product-details.png` |
| Categories | `compare-1440-categories.png` | `build-768-light-categories.png` · `build-768-dark-categories.png` | `build-375-light-categories.png` · `build-375-dark-categories.png` |

Not in Figma (written as design questions, `docs/design-questions.md`, 27 questions): the details page, dark mode, the 768 / 375 frames, the wording decisions where the Korean frames disagree with each other (questions 20 to 24), the price mapping that follows the API (question 25) and the Figma tokens that are below WCAG AA (question 27, new). Question 26 (the TalkingClub wordmark) is answered by the design review: use the Figma logo image. They are built from the same tokens. Upload the PNGs to the Notion page (or link the pushed files) — upload step is in the checklist.

## 9. Your explanation: auth flow, route guard, table state in the URL, multi-step form, image upload

Source: `docs/explain-notes.md` (open the files while explaining).

- **Auth flow.** `POST /auth/login { loginId, password }` returns `data.token` (JWT, 1 day) and `data.user`. Non-HQ roles get the "관리자 권한이 없습니다. (You do not have admin permission.)" popup and the session is dropped. Otherwise token + user go to localStorage ("자동 로그인 (Auto login)" ticked) or sessionStorage, and a small cookie lets the server middleware see the login. Then the user goes to `returnTo` — relative paths only, so a link cannot send users to another site. Every call adds `Authorization: Bearer` and the three Talking Club headers (`CoreAPIService`); the `accept-language` header stays `en` on purpose, because the API answers with message keys and the app maps them to Korean text. Expiry: `exp` is decoded from the JWT; if expired or the API answers 401, the session is cleared and the user goes to `/login?returnTo=<page>`. The refresh token is not used because the QA CORS is `origin: *`, so the cookie is never sent cross-site. Logout: `GET /auth/logout`, clear storage, cookie and any unsaved product form draft of the tab (a 401 / expiry keeps the draft for the same user).
- **Route guard.** One config, `src/config/navigation.ts`, lists each page with roles and permission module; the sidebar, both guards and the buttons (`useCan`) read it, so they cannot disagree. Layer 1: `middleware.ts` on the server (no / expired cookie → login with returnTo; role not allowed → `/403`; the path is decoded first, so `/shopping-mall/%63ategories` is checked as `/shopping-mall/categories`). The upload route `/api/upload` is outside the middleware matcher and checks the session itself (JSON 401). Layer 2: `RouteGuard` on the client (also GENERAL_ADMIN's `shopping_mall` permission). Layer 3: buttons via `useCan`. No role is checked by hand in a screen. Tested in `e2e/roles.spec.ts`.
- **Table state in the URL.** The list has no `useState` for page / search / filters / sort; the URL is the state (`?page=2&limit=10&q=…&categoryId=…&sort=…`). `parseListParams()` reads it into one typed object, `toSearchString()` writes it back, every control calls `update()` → `router.replace`, and a filter change resets `page` to 1. Refresh and shared links show the same list; filter clicks use replace, so they do not fill the browser history. `toApiQuery()` builds the API query that is also the TanStack Query cache key. Sort is current-page only because the API has no sort parameter. The CSV file name and every date use Korea time (`src/utils/format.ts`, `Asia/Seoul`), so a viewer in India sees the same time as one in Korea.
- **Multi-step form.** One react-hook-form `useForm` for all 4 steps, all sections inside one `<form>` and only the current one visible, so nothing unmounts and values survive Back / Next. The step is in the URL (`?step=`). "다음 (Next)" runs `trigger()` on that step's fields only (`STEP_FIELDS`) and focuses the first error. Rules match the API (e.g. `단가 (Unit price)` = `unitPrice` must be lower than `판매가 (Selling price)` = `price`; the cart and the order charge `price`). A draft is saved in sessionStorage after half a second and restored after a reload. In edit mode the draft is restored only if the product was not changed on the server since the draft was saved (`updatedAt` plus the option rows are compared with a copy fetched now); otherwise it is dropped with a notice. In create mode "등록 (Register)" asks for a fresh product code right before the POST. On an API error nothing is cleared: field errors go back onto their field with `setError` and the stepper jumps to that step. Errors that a screen does not show itself get the default error toast from `QueryCache` / `MutationCache`; hooks that show their own error opt out with `meta: SHOWS_OWN_ERROR`.
- **Image upload.** The browser checks type (JPG / PNG / GIF / WEBP), size (≤ `NEXT_PUBLIC_MAX_IMAGE_MB`, default 4 MB) and count (≤ 4, guarded on every add / Undo / Retry path and by a form rule) first — a bad file sends no request. Commas are removed from the file name (`safeFileName`). `POST /utils/upload-file-urls` returns `{ url, preview, filePath }`; the browser then posts the file and the signed URL to the app's own route `POST /api/upload`, and **the server** sends the file to S3 (so the bucket CORS does not matter). The route checks the session (401), the S3 host (400, only the `talking-club-dev` bucket), the file type (415), the size (413) and the S3 answer (502). Only after the route answers OK are `filePath` (stored by the product API) and `preview` (thumbnail) added to the form. Remove = trash icon with Undo; a failed upload shows Retry.
- **Also ready to explain (design review): design tokens, font, logo, phone filters.** Every light colour in `src/styles/_tokens.scss` is the hex of a Figma style, with the style name in the comment; components use only `var(--color-*)`. The font is Pretendard, self-hosted as a dynamic subset (`src/styles/pretendard-font.css`, files in `public/fonts/pretendard/`). The logo is one image through `BrandLogo`; its wordmark takes the text colour, so it works in dark mode. The `필터 (Filters)` panel on phones is a `useState` in `ProductListToolbar`, with `aria-expanded` and a count that is read from the URL state. Notes: `docs/explain-notes.md`, section 9.

---

## Still to do at submission

- [x] Work committed on `hw3/neeraj` and pushed up to `586b91a` (`b2e2974`, `85e0572`, `8c968d7`, `8b2f596`, `356dc8d`, `b25769b`, `355d2ae`, `586b91a`; `.env.local` never committed).
- [x] Later commits pushed to `origin/hw3/neeraj` on 19 Nov: `733655c`, `792ef82`, `636e258`, `adb5df2` and the docs commit (PR #2 shows them).
- [x] PR to `main` opened (never merge it): https://github.com/divii-school/Frontend-homework/pull/2
- [x] Own Vercel project `tc-admin-hw3-neeraj`: production deploy of `hw3/neeraj`, `NEXT_PUBLIC_API_BASE_URL` set (API URL only, no logins), `NEXT_PUBLIC_MAX_IMAGE_MB=4`, deployment protection off. The final run of section 5 is against commit `adb5df2`.
- [x] HTML report of the earlier Vercel run (build `586b91a`, 105 passed, 2026-11-18, 12:07 to 12:14) zipped as `HW3-Neeraj-playwright-report.zip` (kept outside the repo); secret check done: login ID 0, password 0, session token 0.
- [x] HTML report of the final run (115 tests, build `adb5df2`) zipped and checked the same way (login ID, password, session token: 0 each); it is the report to attach in section 5 of the Notion page.
- [ ] Import `docs/test-cases.csv` (WM DEV template) into a Google Sheet and put the link in section 6 (the CSV file itself is attached to the page).
- [ ] Upload the 25 screenshots retaken on 18 Nov at 18:27 to 18:28 to section 8 of the Notion page, in place of the older ones.
- [ ] Update the nine sections of the Notion page from this file (the QA round and the design review changed sections 1, 2, 3, 4, 5, 6, 7, 8 and 9).
- [ ] Properties `HW3 status` → Submitted and `Submitted on`.
- [ ] Post the new build report (`docs/qa-build-report.md`) in section 7 of the Notion page.
- [ ] Answer Archana's QA comment ("fixed, resubmitted": the list "Fixed after the QA round (18 Nov)" at the top) and comment on the TL page "HW3 resubmitted" + link.
- [ ] Answer Bhagyashree's design comment ("fixed, resubmitted": the list "Fixed after the design review (18 Nov)" at the top, with the new screenshots).
- [ ] Explanation call with Kakali: the upload route and the draft version check in my own words (`docs/explain-notes.md`).
- [ ] Decide the open design questions with Kakali and the designer (Bhagyashree): wording questions 20 to 24, the price mapping (25) and the Figma tokens below WCAG AA (27). Question 26 (the wordmark) and the three visual items are answered by the design review.
- [ ] After the final result on Friday 20 Nov: delete the Vercel project.
