# Talking Club Admin — HW3 (Neeraj)

Shopping Mall screens of the Talking Club admin rebuilt for the WM Advanced Frontend Homework (HW3):
**Product Category Management** (8.2.0) and **Product Management** (8.1.0–8.1.3), with login,
role-based menu / buttons / URLs, light and dark theme. Spec: [`docs/hw3-plan.md`](docs/hw3-plan.md),
open design questions: [`docs/design-questions.md`](docs/design-questions.md).

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
| `NEXT_PUBLIC_MAX_IMAGE_MB` | optional — largest product image in MB, default `10`. Images are uploaded through this app's server route `/api/upload`; a Vercel function refuses bodies above 4.5 MB, so set `4` on Vercel. Read at build time (rebuild after a change) |
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

`e2e/roles.spec.ts`, the "no API" part of `e2e/auth.spec.ts` and the `*-states.spec.ts` files mock the API, so they
run without the QA server. Set `PLAYWRIGHT_BASE_URL=http://localhost:3100` to test an app you started yourself on
another port (no `npm run dev` is started then).

**Image upload and port 3000.** The S3 bucket accepts the browser upload only from the origin
`http://localhost:3000`. If port 3000 is used by another app, start this app on another port and set
`E2E_MAP_3000_TO=<port>`: Chromium then opens `http://localhost:3000` but connects to your port, so the real upload
works and the other app is never contacted. The full suite, including the mutation specs (PowerShell):

```powershell
npm run build; npx next start -p 3100            # terminal 1
$env:E2E_ALLOW_MUTATIONS="1"; $env:E2E_MAP_3000_TO="3100"
npx playwright test --output=test-results/pw-artifacts --trace=off   # terminal 2
```

On a deployed app (Vercel) the upload fails until the backend team adds that origin to the bucket CORS.
The tests type the QA login with a helper that does not record the value, so the HTML report holds no login.

## Access rules

| Page | Roles | GENERAL_ADMIN also needs |
|---|---|---|
| Product Management `/shopping-mall/products` | SUPER_ADMIN, MASTER_ADMIN, GENERAL_ADMIN | `shopping_mall` → `product_management` |
| Product Category Management `/shopping-mall/categories` | SUPER_ADMIN, MASTER_ADMIN | — |

One config (`src/config/navigation.ts`) drives the sidebar, the route guards (middleware + RouteGuard) and the buttons.
