# Talking Club Admin — HW3 (Neeraj)

Shopping Mall screens of the Talking Club admin rebuilt for the WM Advanced Frontend Homework (HW3):
**Product Category Management** (8.2.0) and **Product Management** (8.1.0–8.1.3), with login,
role-based menu / buttons / URLs, light and dark theme. Spec: [`docs/hw3-plan.md`](docs/hw3-plan.md),
open design questions: [`docs/design-questions.md`](docs/design-questions.md).

Demo: https://tc-admin-hw3-neeraj.vercel.app (branch `hw3/neeraj`, build `adb5df2`). The browser tab title is `… | 토킹클럽 관리자`.

**Look.** The logo, the colours and the font follow the Figma frames (design review, 18 Nov): the TalkingClub logo image, the Figma colour styles and the font Pretendard. The rules are in "Rules for the look" below.

**UI language.** The whole UI text is Korean and follows the Korean Figma frames. The exact Korean text of every string (with the English it replaced and its source) is in [`docs/ko-glossary.md`](docs/ko-glossary.md). Docs for non-Korean readers write a label as the Korean text followed by the English meaning in brackets, for example `등록 (Register)`. PrimeReact's built-in texts use a Korean locale (`src/providers/primereact-locale.ts`) and `<html lang="ko">` is set. The `accept-language` request header stays `en` on purpose: the API answers with message keys and the app maps them to Korean text.

## Run

Requirements: Node 20+ (tested on 24), npm.

```bash
npm install                 # legacy-peer-deps is set in .npmrc; postinstall copies the PrimeReact themes
cp .env.example .env.local  # then fill it in (see below)
npm run dev                 # http://localhost:3000 → login
```

`.env.local`:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Talking Club QA admin API root incl. `/api/v1` (URL in `docs/hw3-plan.md`) |
| `NEXT_PUBLIC_TC_HOME_URL` | optional — target of "Go to Talking Club home" in the no-permission popup |
| `NEXT_PUBLIC_MAX_IMAGE_MB` | optional — largest product image in MB, default `4` (Vercel functions refuse request bodies above 4.5 MB, so 4 is safe everywhere). Used by the browser check, the server route and the hint text. Set a higher value only where the server accepts bigger bodies. Read at build time (rebuild after a change) |
| `UPLOAD_S3_BUCKET` | optional, server only — the only S3 bucket `/api/upload` sends images to, default `talking-club-dev` |
| `E2E_ADMIN_ID` / `E2E_ADMIN_PASSWORD` | QA admin login for Playwright — **logins come by DM**, never commit them |

Log in with an HQ admin account (SUPER / MASTER / GENERAL admin). Other roles see the
"no admin permission" popup. The QA database is shared by 5 developers: everything this app creates is
named `HW3-Neeraj-…`, and only those records are edited or deleted.

## Checks

```bash
npm run lint
npm run type-check
npm run build
npx playwright install chromium   # once (Playwright is pinned to 1.64.1)
npm run test:e2e                  # guest → setup (login once) → mocked + read-only specs; starts `npm run dev` on 3000
npm run test:e2e:mutations        # create / edit / delete specs (HW3-Neeraj- records only)
npm run test:e2e:report
```

115 Playwright tests in 15 files (guest 15, mocked 76, setup 1, chromium 23).

- Final run of the whole suite against the Vercel link (build `adb5df2`, mutations on): 2026-11-20, 12:29 to 12:34 IST, build adb5df2, one command with --retries=2: 115 tests, 115 passed on the first attempt, 0 retried, 0 failed (4.4 min). Leftover check: 0 products and 0 categories named HW3-Neeraj-*. The HTML report attached to the submission is from this run (login ID 0, password 0, session token 0). Before the last fix, on build 636e258: 2026-11-19, 10:33 to 10:42 IST, build 636e258, one command with --retries=2: 114 tests, 113 passed on the first attempt, 1 passed on a retry, 0 failed (8.8 min). The retried test is categories-states.spec.ts › add dialog: required / spaces / 51 chars / duplicate are refused before the API; API duplicate shows on the field: its page load (page.goto) timed out twice after 30 s while the connection from the developer PC to the Vercel link stalled, then it passed. Leftover check: 0 products and 0 categories named HW3-Neeraj-*. A first attempt at 10:25 without retries is not a result: three page loads ended with net::ERR_TIMED_OUT, so the live tests did not start.
- Earlier run, before the design fixes (105 tests at that time): 105 passed on the Vercel link, build `586b91a`,
  2026-11-18, 12:07 to 12:14, first attempt.
- Local production build of the design-fix build `792ef82` (2026-11-18): type-check, lint and build exit 0; mocked 75 passed;
  the whole suite with mutations 113 passed, 1 failed (the QA API list still returned a deleted product after 5 s; the wait
  is 30 s now); `products.mutation` again: 19 passed. Local build of the font change (2026-11-19): type-check, lint and
  build exit 0; mocked 75 passed; guest tests without the API 11 passed.

`e2e/roles.spec.ts`, the "no API" part of `e2e/auth.spec.ts` and the `*-states.spec.ts` files mock the API, so they
run without the QA server. Set `PLAYWRIGHT_BASE_URL=http://localhost:3100` to test an app you started yourself on
another port (no `npm run dev` is started then). The full suite, including the mutation specs (PowerShell):

```powershell
npm run build; npx next start -p 3100            # terminal 1
$env:E2E_ALLOW_MUTATIONS="1"; $env:PLAYWRIGHT_BASE_URL="http://localhost:3100"
npx playwright test --output=test-results/pw-artifacts --trace=off   # terminal 2
```

Against the deployed app use `PLAYWRIGHT_BASE_URL=https://tc-admin-hw3-neeraj.vercel.app` (and, for example,
`--output=test-results/pw-vercel`). On Vercel the 5 MB part of `upload-route-states.spec.ts › a file above the size limit → 413`
is skipped, because Vercel itself refuses bodies above 4.5 MB (`413 FUNCTION_PAYLOAD_TOO_LARGE`, not JSON); the one-byte-over
part still runs. The two live login-error tests wait up to 15 s, because the shared QA API is sometimes slow on the first login of a run.

**Image upload.** The browser does not send the image to S3. `UploadService` posts the file and the signed URL to this
app's own route `POST /api/upload` (`src/app/api/upload/route.ts`), and the server sends the file to S3. So the S3 bucket
CORS does not matter and the upload works on any address, also on a deployed app (Vercel). The route checks the login
session (401), that the address is the `talking-club-dev` bucket (400), the file type (415), the size (413), and the S3 answer (502).
It is left out of the middleware matcher on purpose (Next 15.5 passes only the first 10 MB of a body through middleware)
and checks the session itself. No special port is needed for the tests. The option `E2E_MAP_3000_TO=<port>` still exists
in `playwright.config.ts` (it maps the origin `http://localhost:3000` to another port), but it is no longer needed for
the upload and was not used in the last run.

The tests type the QA login with a helper that does not record the value, so the HTML report holds no login.

## Rules for prices, dates and titles (QA round, 18 Nov)

- **Prices:** `판매가 (Selling price)` = API `price`, `단가 (Unit price)` = API `unitPrice`, and `unitPrice < price`.
  The shopping cart and the order charge `price`; the API refuses a product unless `unitPrice < price`
  (`unitPriceMustBeLessThanPrice`). The list column `판매금액 (Selling price)` and the CSV column `판매금액` show `price`;
  the CSV column `단가` shows `unitPrice`. Step 1 asks for `단가` first, then `판매가`.
- **Dates:** always Korea time (KST, `Asia/Seoul`) for every viewer, through `src/utils/format.ts`
  (`formatDateTime`, `formatDate`, `DISPLAY_TIME_ZONE`). Do not format a date with dayjs in a screen.
- **Titles:** the browser tab title is `%s | 토킹클럽 관리자` (`src/app/layout.tsx`). There is no text next to the logo
  (see the next section).

## Rules for the look (design review, 18 Nov)

- **Colours only from the Figma styles.** `src/styles/_tokens.scss` is the only file with colour values. Every light
  colour is the hex of a Figma style, and its comment starts with the style name (for example `Grayscale/Gray 130`).
  A value that Figma does not give is marked "kept". Components use only `var(--color-*)`. The dark palette is ours
  (the design has no dark frames).
- **Font: Pretendard**, the font of the Figma frames. It is self-hosted as the "dynamic subset" of the npm package
  pretendard 1.3.9 (licence SIL OFL 1.1; the package is not a dependency): 92 small files in `public/fonts/pretendard/`
  and one `@font-face` rule per file with its `unicode-range` in `src/styles/pretendard-font.css` (imported in
  `src/app/layout.tsx`). The family name `'Pretendard Variable'` is first in `$font-family-base`. The browser downloads
  only the files for the characters a page shows (about 190 KB of fonts on the login page). Do not load the font as
  one big file and do not add a font from a CDN.
- **Logo only through `BrandLogo`** (`src/components/BrandLogo.tsx`). It shows the TalkingClub logo image of the Figma
  frames (`public/brand/talkingclub-logo.png`: three-ring mark + wordmark) with no text next to it. The wordmark takes
  the text colour, so it stays readable in dark mode. Do not draw the logo again and do not put text next to it.
- **`word-break: keep-all`** on the whole page (`src/styles/globals.scss`): Korean text breaks between words.
- **Underline-only fields** where the frames draw them: put the class `field-underline` on the form or block
  (the product search and the product form use it). A textarea stays boxed.
- Known cost of the Figma colours: some are below WCAG AA (list in `docs/qa-build-report.md`, part 8; design question 27).

## Access rules

| Page | Roles | GENERAL_ADMIN also needs |
|---|---|---|
| Product Management `/shopping-mall/products` | SUPER_ADMIN, MASTER_ADMIN, GENERAL_ADMIN | `shopping_mall` → `product_management` |
| Product Category Management `/shopping-mall/categories` | SUPER_ADMIN, MASTER_ADMIN | — |

One config (`src/config/navigation.ts`) drives the sidebar, the route guards (middleware + RouteGuard) and the buttons.
