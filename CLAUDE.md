# Talking Club Admin — Shopping Management (HW3)

Admin screens for Product Management and Product Category Management of Talking Club, with login and
role-based access. Used by head-office administrators. Built as HW3 of the AI Frontend Training.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · PrimeReact 10 · SCSS · TanStack Query 5 · Playwright · Vitest
Backend API: Talking Club **QA** admin API, origin in `NEXT_PUBLIC_API_BASE_URL` (read only in `src/config/env.ts`). Never production.
Every answer is `{success, message, data}`; lists add `totalRecords`, `totalPage`, `page`. Errors carry a message key
(`invalidPassword`) or, for validation, a list of sentences. A missing record is 400 + `productNotFound`, not 404.
Company rules: WM (Work Manual) on Notion wins over anything written here.

## Commands
```
npm run dev                 # localhost:3000 ("/" redirects to /products)
npm run typecheck           # tsc --noEmit — run after every change
npm run lint
npm run test:unit           # Vitest
npm run build
npm run test:e2e            # Playwright read-only tests on Chromium (e2e/auth.setup.ts logs in once and warms up every route)
npm run test:e2e:webkit     # the same tests on WebKit (Safari's engine)
npm run test:e2e:mutation   # create/edit/delete; only HW3-Sachin-… records; tell the team first (skipped without this script)
npm run screenshots         # 1920 / 1440 / 1366 / 768 / 375, light + dark -> docs/screenshots/
```

## Folders
```
src/app/(main)/...          pages inside the shell; (main) adds nothing to the URL
src/app/auth/login          login page (public)
src/app/api/upload/route.ts server route: asks the API for a signed address and stores the image (never called by a page directly)
src/middleware.ts           authentication only: valid token or redirect to login with ?redirect=
src/config/navigation.ts    menu + route guard + action permissions, ONE config
src/api-services/           axios calls, one file per domain
src/hooks/API/<domain>/     TanStack Query hooks; components use these, never the services
src/components/<area>/      providers, layout, common, auth, products, categories
src/constants/              routes, limits, options, messages; no magic values in components
src/utils/                  api-client (apiClient for the QA API, appClient for our own routes), api-integration, session, rules, params, format, korean
src/styles/                 tokens in _variables.scss; _prime.scss skins PrimeReact from tokens
e2e/                        *.spec.ts read-only, *.mutation.spec.ts writes, screenshots.spec.ts
```

## Rules
- Flow is always service -> hook -> component. No `any`. Types are written from a real API response.
- A new page: add it to `NAV_ITEMS` in `config/navigation.ts` (menu, guard and permission follow). A new action
  that needs a permission: add it to `ACTIONS` there and ask `canDo(user, action)`.
- No hardcoded colours or sizes in components or SCSS partials: use `token("pink-b1")`, `$space-4`,
  `@include mq-down("mobile")`. Every day colour has one night colour with the same name.
- Class names are lowercase-with-hyphens. Colour variables are colour + code (`pink-b1`).
- List state lives in the URL (`useProductListParams`, `useUrlParam`), never only in `useState`.
- Every screen shows loading, empty and error (`StateBlock`, `ErrorState`). Show the API's message.
- Submit buttons are disabled while saving. A form keeps its values on an API error.
- WM formats: `formatWon` (1,980,000원), `formatDateTime` (2026년 11월 13일 오전 11:09), `formatCount`.
- Shared QA data: only create/edit/delete records named `HW3-Sachin-…`.
- Never call the real `/auth/logout` from a test: it signs out every user of the shared account.
- Editing keeps the saved 판매가 until 수량 or 단가 changes (`formPrice` in utils/product-rules.ts). 수량 0 is valid:
  the API's rule is only "a number", and many saved products have 0.
- Images are uploaded through `/api/upload`, not from the browser to storage: the bucket refuses uploads from sites
  that are not on its list (a Vercel address is not). Max 4 MB per image (Vercel's request body limit is 4.5 MB).
- Korean messages use the helpers in `utils/korean.ts` for 을/를 and 로/으로, never "을(를)".
- Type the login in tests with `typeSecret` (e2e/helpers.ts): `fill()` would print it in the report.
- No secrets in the repo. `.env.local` is never committed.

## Known traps
- A constant imported from a `"use client"` file into a server file is not the value on the server. Shared
  constants live in `src/constants/`.
- A PrimeReact select does not open while its options are loading; tests wait for the options.
- The login button is disabled until the page is interactive; tests wait for it to be enabled before typing.
- The QA API now and then gives no answer for 15 seconds or more. Reads retry once (`AppProviders.tsx`), read-only
  tests retry once (`playwright.config.ts`). Attach a report only when `npm run report:check` passes: a failed
  attempt stores a snapshot and a trace that can contain the typed login.
- For a final check, test the production build: `npm run build`, `npx next start -p 3100`, then
  `PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run test:e2e`. The dev server adds hot-reload noise in WebKit.
- Two `npm run dev` servers at once give a blank page: stop all, delete `.next`, start one.
