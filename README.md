# HW3 — Talking Club Admin · 쇼핑몰 관리 (Pranesh)

Admin frontend for **Talking Club → 쇼핑몰 관리**: login with roles, **상품 카테고리 관리** (3-level tree)
and **상품 관리** (list, multi-step create/edit, details with tabs), connected to the **Talking Club QA API**.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · PrimeReact 10 · SCSS modules · TanStack Query 5 ·
react-hook-form + zod · Vitest · Playwright.

## Run it locally

Requires **Node.js 20+** (tested on 24).

```bash
npm install
cp .env.example .env.local      # then put the QA test login (from DM) into E2E_* if you run Playwright
npm run dev                     # http://localhost:3000  →  log in with the QA account from DM
```

`.env.local` (never committed):

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Talking Club **QA** API, e.g. `https://tkclub-admn-api-qa.dvconsulting.org` (never production) |
| `E2E_LOGIN_ID`, `E2E_PASSWORD` | Only for Playwright. The QA account from DM |
| `NEXT_PUBLIC_OWN_RECORD_PREFIX` | Optional, default `HW3-Pranesh-` (see "Shared QA data") |

## Checks

```bash
npm run lint
npm run typecheck
npm run test                    # Vitest unit tests (pure logic)
npm run build
npm run test:e2e                # Playwright, read-only (default; never changes data)
npm run test:e2e:mutation       # Playwright, create/edit/delete — only HW3-Pranesh-* records, cleaned up
npm run test:e2e:report         # open the HTML report
```

Playwright starts `npm run dev` itself if nothing is running on port 3000.
To test a deployed build: `PLAYWRIGHT_BASE_URL=https://<vercel-url> npm run test:e2e`.

## Folders

```
src/app/                    routes (App Router). (main)/ = pages behind login, with the side menu
  login/                    login screen
  (main)/shopping/categories  상품 카테고리 관리
  (main)/shopping/products    list · new · [id] (details, ?tab=) · [id]/edit
  api/auth/{login,refresh,logout}  same-origin routes that hold the refresh token (httpOnly)
  api/upload                same-origin image upload (S3 PUT happens on the server)
src/config/app-routes.ts    THE one config: menu + route guard + permissions
src/middleware.ts           route guard step 1: logged in? (server, before the page renders)
src/components/layout/      shell, side menu, header, page header, RouteGuard (step 2: permission → 403)
src/components/…            screens, split by feature
src/services/               API calls (axios), one file per domain
src/hooks/api/              TanStack Query hooks used by the screens
src/lib/                    api client + errors, auth/session, formats, URL state, CSV
src/styles/                 _theme.scss (colour tokens, light + dark) · _tokens.scss (spacing/type) · globals
e2e/                        Playwright: *.spec.ts (read-only) · *.mutation.spec.ts (writes)
```

## How the main parts work (short)

- **Auth:** `/api/auth/login` (our route) calls the QA API, stores the **refresh token in an httpOnly cookie on
  our domain**, and returns the access token, which goes in a cookie the middleware can read. Every API call
  adds `Authorization: Bearer …`. On a **401** the client asks `/api/auth/refresh` once and replays the call;
  if that fails it goes to `/login?returnTo=<page>` and comes back there after logging in.
  Why the extra routes: the QA API's CORS (`*`, no credentials) never lets a browser send its refresh cookie.
- **Route guard + roles:** `app-routes.ts` lists every page with its permission. The side menu, the
  `RouteGuard` (403 view) and the buttons all read it, so they cannot disagree. `SUPER_ADMIN` sees everything.
- **Table state in the URL:** `?q&type&page&size` is parsed by `parseListParams` (bad values fall back to
  defaults) and written back by `useProductListParams`, so refresh, back/forward and shared links keep it.
- **Multi-step form:** one `react-hook-form` instance for all four steps; every step stays mounted (only
  hidden), so going back keeps values; `다음` validates only that step's fields; an API error keeps everything
  and opens the step that owns the failing field.
- **Image upload:** checked in the browser (type, 4 MB, max 4) → `POST /api/upload` → our route asks the API
  for a signed URL and PUTs the file to S3 from the server (the bucket's CORS allows only `localhost:3000`).
  The form keeps S3 keys; previews use the returned URL; X removes one.

## Shared QA data

Five people use the same QA server. This app and its tests only **create, edit and delete records named
`HW3-Pranesh-…`**. Drag-reordering categories is enabled only when **every** sibling is such a record,
because a reorder rewrites the order of all siblings.

## Known API limits (reported, not worked around silently)

- `GET /products` has **no sort parameter** (tried `sort`, `sortBy`, `order`: ignored) → no sort UI.
- `GET /product-category/list` without a search term returns **3 of the 12** 대분류 → the tree is read
  level by level from `/products/categories`, `/subcategories/{id}`, `/childcategories/{id}`.
- 대분류 are **capped** (`isCreatable: false`, `maximumCategoryLimitReached`) → 대분류 등록 is disabled with a note.
- A **logout ends every session of the account** — all testers share one QA admin account, so one person's logout
  signs everyone out (the app then sends you to login and back to the same page).
