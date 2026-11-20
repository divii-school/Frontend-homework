# Talking Club Admin — Shopping Management (HW3, Sachin)

Frontend for two parts of the Talking Club admin: **Product Management** and **Product Category Management**,
with login, protected routes and role-based access. It talks to the **Talking Club QA API only** (never production).

Stack: Next.js 15 (App Router) · React 19 · TypeScript · PrimeReact 10 · SCSS · TanStack Query 5 · Playwright · Vitest

## Run it

Needs Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local      # then fill in the values below
npm run dev                     # http://localhost:3000
```

`.env.local` (never committed):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Origin of the Talking Club QA API (the host of the API docs link on the HW3 page), without `/api/v1` |
| `E2E_LOGIN_ID`, `E2E_PASSWORD` | Only for Playwright: the QA admin login **from the DM**. Not needed to run the app |

Log in with the QA admin account from the DM. No login is stored in this repo.

## Check it

```bash
npm run lint
npm run typecheck            # tsc --noEmit
npm run test:unit            # Vitest: permission config, URL state, form rules, WM formats
npm run build
npm run test:e2e             # Playwright, read-only tests on Chromium (safe on the shared QA server)
npm run test:e2e:webkit      # the same tests on WebKit, the engine of Safari (first: npx playwright install webkit)
npm run test:e2e:mutation    # create / edit / delete tests, only through this script; see the warning below
npm run test:e2e:report      # open the HTML report
npm run report:check         # may this report be attached? (yes only if every test passed at the first attempt)
npm run screenshots          # every screen at 1920 / 1440 / 1366 / 768 / 375, light and dark -> docs/screenshots/
```

First time only: `npx playwright install chromium`. The tests log in once and open every page once before they
start, because the dev server compiles a page on its first visit.

To test a deployed build instead of local code: `PLAYWRIGHT_BASE_URL=https://<your-vercel-url> npm run test:e2e`.

**Shared QA server.** The mutation tests create, change and delete only records named `HW3-Sachin-…` and remove
what they create. One category pair stays on purpose (`HW3-Sachin-Fixture-Sub` / `HW3-Sachin-Fixture-Child`):
the API answers 500 when a category that has held a product is deleted, so products are created under this
permanent pair. Tell the team before running the mutation tests. They run only through `npm run test:e2e:mutation`
(and the screenshots only through `npm run screenshots`): a plain `npx playwright test` skips both.

**The QA API sometimes gives no answer.** The app tries a failed read once more by itself, and the read-only tests
get one more attempt. A failed attempt stores a page snapshot and a trace, which can contain the typed login, so
attach an HTML report only after `npm run report:check` says it is clean.

**Logout.** The QA API's logout ends every session of the account, and all developers share one account. Pressing
"로그아웃" in the app therefore signs everyone out. The Playwright logout test answers that call itself and never
sends it.

## What is where

```
src/app/                      pages: auth/login, (main)/products, products/create, products/[id], products/[id]/edit, (main)/categories
src/app/api/upload/route.ts   server route that stores a product image (see Decisions)
src/middleware.ts             no valid token -> /auth/login?redirect=<page>
src/config/navigation.ts      ONE config for the menu, the route guard and the button permissions
src/config/env.ts             the only place an env variable is read
src/api-services/             one service per domain (axios); components never call these
src/hooks/API/                TanStack Query hooks the screens use (service -> hook -> component)
src/hooks/                    useProductListParams (list state <-> URL), useUrlParam (tab / step <-> URL)
src/components/               providers, layout (shell, sidebar, top bar, RouteGuard), common, auth, products, categories
src/utils/                    api-client (token header, 401 handling, error mapping), session, product-rules, product-params, format, korean, csv
src/styles/                   _variables (tokens, day + night palettes), _prime (PrimeReact skin from tokens), _layout, _component, pages/
e2e/                          Playwright: auth, products, categories, roles-and-errors, quality (read-only), shopping.mutation, screenshots
docs/                         build-report, test-cases, design-questions, playwright-report.zip, screenshots/
```

## Decisions worth knowing

- **Token in a cookie, user in localStorage.** The cookie lets `middleware.ts` protect a page before it renders;
  role and permissions are not secret and are read in the browser by `RouteGuard`. With 자동 로그인 the cookie lives
  until the token expires; without it, until the browser closes.
- **Token expiry.** The API's refresh cookie belongs to another domain and the API allows no credentialed
  cross-site calls, so refresh cannot work from this app. On 401 the app goes to login and returns to the same
  page (`?redirect=`), the second option the homework allows.
- **List state in the URL**: page, page size, search, search type, category filter, sort. Refresh, Back and a
  shared link all keep it.
- **Sort.** The products API has no sort parameter and the category API has no sort or paging, so those are
  applied in the browser. Search, category filter and product paging are done by the server. See
  `docs/design-questions.md`.
- **Image upload goes through the app's own server route** (`/api/upload`). The storage bucket accepts browser
  uploads only from a fixed list of sites; `localhost:3000` is on it, a Vercel address is not. The route asks the
  API for the signed address and stores the file from the server. Vercel accepts request bodies up to 4.5 MB, so
  an image may be 4 MB at most.
- **No PrimeReact theme file.** Every colour of the PrimeReact parts comes from our tokens, so dark mode is
  consistent and no hex value comes from a third-party theme.
