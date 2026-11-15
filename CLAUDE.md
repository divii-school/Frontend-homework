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
npm run test:e2e            # Playwright read-only tests (logs in once through e2e/auth.setup.ts)
npm run test:e2e:mutation   # create/edit/delete; only HW3-Sachin-… records; tell the team first
npm run screenshots         # 1440 / 768 / 375, light + dark -> docs/screenshots/
```

## Folders
```
src/app/(main)/...          pages inside the shell; (main) adds nothing to the URL
src/app/auth/login          login page (public)
src/middleware.ts           authentication only: valid token or redirect to login with ?redirect=
src/config/navigation.ts    menu + route guard + action permissions, ONE config
src/api-services/           axios calls, one file per domain
src/hooks/API/<domain>/     TanStack Query hooks; components use these, never the services
src/components/<area>/      providers, layout, common, auth, products, categories
src/constants/              routes, limits, options, messages; no magic values in components
src/utils/                  api-client, api-integration (endpoints + query keys), session, rules, params, format
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
- No secrets in the repo. `.env.local` is never committed.

## Known traps
- A constant imported from a `"use client"` file into a server file is not the value on the server. Shared
  constants live in `src/constants/`.
- A PrimeReact select does not open while its options are loading; tests wait for the options.
- Two `npm run dev` servers at once give a blank page: stop all, delete `.next`, start one.
