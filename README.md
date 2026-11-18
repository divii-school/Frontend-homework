# Talking Club Admin — HW3 (Neeraj)

Shopping Mall screens of the Talking Club admin rebuilt for the WM Advanced Frontend Homework (HW3):
**Product Category Management** (8.2.0) and **Product Management** (8.1.0–8.1.3), with login,
role-based menu / buttons / URLs, light and dark theme. Spec: [`docs/hw3-plan.md`](docs/hw3-plan.md),
open design questions: [`docs/design-questions.md`](docs/design-questions.md).

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

All 104 Playwright tests passed in one run on 2026-11-17 (production build on port 3100, mutations on). `e2e/roles.spec.ts`, the "no API" part of `e2e/auth.spec.ts` and the `*-states.spec.ts` files mock the API, so they
run without the QA server. Set `PLAYWRIGHT_BASE_URL=http://localhost:3100` to test an app you started yourself on
another port (no `npm run dev` is started then). The full suite, including the mutation specs (PowerShell):

```powershell
npm run build; npx next start -p 3100            # terminal 1
$env:E2E_ALLOW_MUTATIONS="1"; $env:PLAYWRIGHT_BASE_URL="http://localhost:3100"
npx playwright test --output=test-results/pw-artifacts --trace=off   # terminal 2
```

**Image upload.** The browser does not send the image to S3. `UploadService` posts the file and the signed URL to this
app's own route `POST /api/upload` (`src/app/api/upload/route.ts`), and the server sends the file to S3. So the S3 bucket
CORS does not matter and the upload works on any address, also on a deployed app (Vercel). The route checks the login
session (401), that the address is the `talking-club-dev` bucket (400), the file type (415), the size (413), and the S3 answer (502).
It is left out of the middleware matcher on purpose (Next 15.5 passes only the first 10 MB of a body through middleware)
and checks the session itself. No special port is needed for the tests. The option `E2E_MAP_3000_TO=<port>` still exists
in `playwright.config.ts` (it maps the origin `http://localhost:3000` to another port), but it is no longer needed for
the upload and was not used in the last run.

The tests type the QA login with a helper that does not record the value, so the HTML report holds no login.

## Access rules

| Page | Roles | GENERAL_ADMIN also needs |
|---|---|---|
| Product Management `/shopping-mall/products` | SUPER_ADMIN, MASTER_ADMIN, GENERAL_ADMIN | `shopping_mall` → `product_management` |
| Product Category Management `/shopping-mall/categories` | SUPER_ADMIN, MASTER_ADMIN | — |

One config (`src/config/navigation.ts`) drives the sidebar, the route guards (middleware + RouteGuard) and the buttons.
