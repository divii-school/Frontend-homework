# Talking Club Admin — HW3 (Shopping Mall: Product Category + Product Management)

WM "Advanced Frontend Homework" (HW3) for backend developers building frontend with Claude Code.
Rebuilds two Talking Club admin screens against the real QA API: **8.2.0 Product Category Management**
and **8.1.0–8.1.3 Product Management** (list, 4-step register / edit, details), plus login and
role-based access. Full spec: `docs/hw3-plan.md`. Design PNGs: `docs/design/`.

Stack: Next.js 15.5 (App Router) · React 19.1 · TypeScript strict (no `any`) · PrimeReact 10.2.1 · SCSS ·
TanStack Query 5 · Axios · react-hook-form · dayjs · Playwright 1.64
API: `NEXT_PUBLIC_API_BASE_URL` (QA server, `…/api/v1`) — talking-club-backend branch `release/qa`.

## Commands

```
npm install                # .npmrc has legacy-peer-deps (PrimeReact 10 + React 19); postinstall copies themes
npm run dev                # localhost:3000 → /login → /shopping-mall/products
npm run type-check         # tsc --noEmit — run after every change
npm run lint               # eslint .
npm run build
npm run test:e2e           # Playwright: setup (UI login once) + guest specs (auth, roles) + read-only specs
npm run test:e2e:mutations # *.mutation.spec.ts only (E2E_ALLOW_MUTATIONS=1) — shared QA DB, HW3-Neeraj- records only
npm run test:e2e:report    # open the HTML report
```

Playwright is pinned to 1.64.1 on purpose: its Chromium build (rev 1248) is already trusted on this laptop;
newer downloads are blocked by Windows Smart App Control ("spawn UNKNOWN").

## Folders

```
src/app/(full-page)/login, /403        no admin chrome
src/app/(main)/shopping-mall/...        products, products/create, products/edit/[id], products/details/[id], categories
src/middleware.ts                       server guard: no/expired cookie → /login?returnTo=…; role not allowed → /403
src/config/navigation.ts                ONE config: sidebar menu + route guard + canDo() for buttons
src/api-services/                       CoreAPIService (axios, headers, ApiError, 401 → login), AuthService,
                                        ProductCategoryService, ProductService, UploadService, endpoints.ts, *.types.ts
src/hooks/API/{categories,products,upload}/   TanStack Query hooks — the only way a screen gets server data
src/hooks/                              useSession, useCan, useLogout, useDebounce
src/providers/                          AppProviders, ThemeProvider, ToastProvider (+ global ConfirmDialog), AuthGate, RouteGuard
src/components/                         PageHeader, StateWrapper, EmptyState, ErrorState, TableSkeleton, PageLoader,
                                        ListPagination, AlertDialog, ComingSoon, BrandLogo, ThemeToggle, layout/*, auth/*
src/utils/                              session, jwt, api-messages, query-keys, format, confirm, constants, theme
src/styles/                             _tokens.scss (ALL values), _mixins.scss, globals.scss, components/, pages/
e2e/                                    helpers.ts, auth.setup.ts, auth.spec.ts, roles.spec.ts, <feature>.spec.ts, <feature>.mutation.spec.ts
docs/                                   hw3-plan.md (spec), design/ (Figma PNGs), design-questions.md
```

## Rules

- **Plan first.** One step at a time → `npm run type-check` + `npm run lint` → next step. Show real output.
- **Shared QA DB (5 developers): every record we create is named `HW3-Neeraj-…`** (`HW3_RECORD_PREFIX`).
  Edit / delete only those. Mutation tests create → verify → delete their own record. Never touch other rows.
- **Never commit `.env.local`** (shared QA login). No passwords / tokens in code, docs or tests — read them from env.
  Never auto-run `git commit`, `git push`, deletes or deploys.
- **Reuse** `src/components/*`, the hooks and PrimeReact before creating anything. New components stay small.
- **Class names** lowercase-with-hyphens: `product-list-toolbar` ✅ `productListToolbar` ❌ `product_list` ❌.
- **Colours only through tokens.** Palette in `src/styles/_tokens.scss` is named colour + code (`$red-b2`
  light / `$red-n2` dark); components use only the semantic CSS variables `var(--color-*)` (`--color-surface`,
  `--color-text`, `--color-primary`, `--color-table-head`, `--color-accent-purple`, …). Every light colour has
  exactly one dark colour (`$theme-colors` map). No hex / rgb anywhere else.
- **No hardcoded numbers in SCSS:** `$space-*`, `$font-size-*`, `$radius-*`, sizes in `_tokens.scss`;
  breakpoints only via `@include upto('sm-md')` (≤ 991px) / `above(…)` from `_mixins.scss`.
- **Breakpoints (WM):** 1920 → 1600 → 1366 → 1280 → 1024 → 991 → 768 → 640 → 480 → 375. Must work at
  1440 / 768 / 375 with no horizontal page scroll. Tables scroll inside `.table-scroll-box`.
- **Permissions:** never check roles in a screen by hand. Buttons: `useCan(ROUTE_KEYS.PRODUCTS, 'delete')`.
  New page = one entry in `src/config/navigation.ts` (href, roles, permission, subRoutes).
- **Every data block** shows loading / empty / error / filled — wrap it in `StateWrapper` (`error={query.error}`
  picks the 403 / 404 / 500 / network variant).
- **API errors** are `ApiError { status, kind, messageKey, message, fieldErrors? }`. Show `message`
  (already readable English via `src/utils/api-messages.ts`); add new keys there. Field errors → `setError`.
  Toast success with `getApiMessage(res.message)`.
- **URL state:** list filters / page / sort, form step and details tab live in the query string.
- **Formats (WM):** dates `formatDateTime` → `YYYY/MM/DD HH:mm`; money `formatWon` → `₩1,000`; `-` when empty.
- **Where data lives:** server data only in TanStack Query hooks; keys only from `src/utils/query-keys.ts`;
  screen-only state in `useState` / the URL. Mutations already invalidate the right keys.
- **PrimeReact 10.2:** no `invalid` prop — `className="p-invalid"`. One global Toast (`useToast()`) and
  ConfirmDialog (`confirmAction` / `confirmDelete` from `src/utils/confirm.ts`).
- **a11y:** every input has a label, icon buttons have `aria-label`, keyboard focus ring comes from tokens,
  errors use `role="alert"`, loading uses `role="status"`.
- **Comment above each main block** in plain words (WM HTML guideline).
