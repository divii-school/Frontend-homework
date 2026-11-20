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

115 Playwright tests in 15 files: guest 15 (auth.spec 10, roles.spec 5), mocked 76, setup 1, chromium 23 (live; 4 of them
in the two `*.mutation.spec.ts` files).

Playwright is pinned to 1.64.1 on purpose: its Chromium build (rev 1248) is already trusted on this laptop;
newer downloads are blocked by Windows Smart App Control ("spawn UNKNOWN").

## Folders

```
src/app/(full-page)/login, /403        no admin chrome
src/app/(main)/shopping-mall/...        products, products/create, products/edit/[id], products/details/[id], categories
src/middleware.ts                       server guard: no/expired cookie → /login?returnTo=…; role not allowed → /403
                                        (/api/upload is NOT in its matcher — the route checks the session itself)
src/app/api/upload/route.ts             POST /api/upload: the server puts the image on S3 (session 401, talking-club-dev bucket only 400,
                                        type 415, size 413, S3 refusal 502); the browser never calls S3
src/config/navigation.ts                ONE config: sidebar menu + route guard + canDo() for buttons
src/api-services/                       CoreAPIService (axios, headers, ApiError, 401 → login), AuthService,
                                        ProductCategoryService, ProductService, UploadService, endpoints.ts, *.types.ts
src/hooks/API/{categories,products,upload}/   TanStack Query hooks — the only way a screen gets server data
src/hooks/                              useSession, useCan, useLogout, useDebounce
src/providers/                          AppProviders, ThemeProvider, ToastProvider (+ global ConfirmDialog), AuthGate, RouteGuard,
                                        primereact-locale.ts (Korean texts for PrimeReact's built-in strings)
src/components/                         PageHeader, StateWrapper, EmptyState, ErrorState, TableSkeleton, PageLoader,
                                        ListPagination, AlertDialog, ComingSoon, BrandLogo, ThemeToggle, layout/*, auth/*
src/utils/                              session, jwt, api-messages, query-keys, format, confirm, constants, theme,
                                        image-file.ts (image rules used by browser AND upload route; safeFileName removes commas),
                                        query-client.ts (QueryClient + default error toast, SHOWS_OWN_ERROR)
src/styles/                             _tokens.scss (ALL values; light colours = Figma styles), _mixins.scss, globals.scss,
                                        pretendard-font.css (the @font-face rules of the Pretendard dynamic subset), components/, pages/
public/brand/talkingclub-logo.png       the TalkingClub logo image (512 × 107, transparent) — used only by BrandLogo
public/fonts/pretendard/                92 small font files (Pretendard dynamic subset, pretendard 1.3.9, SIL OFL 1.1)
src/app/icon.png                        favicon = the logo mark
e2e/                                    helpers.ts, auth.setup.ts, auth.spec.ts, roles.spec.ts, <feature>.spec.ts, <feature>-states.spec.ts
                                        (mocked), <feature>.mutation.spec.ts, upload-route-states.spec.ts, default-error-toast-states.spec.ts
docs/                                   hw3-plan.md (spec), design/ (Korean Figma PNGs), design-questions.md,
                                        ko-glossary.md (every Korean UI string), test-cases.md/.csv, qa-build-report.md
```

## Rules

- **Plan first.** One step at a time → `npm run type-check` + `npm run lint` → next step. Show real output.
- **Shared QA DB (5 developers): every record we create is named `HW3-Neeraj-…`** (`HW3_RECORD_PREFIX`).
  Edit / delete only those. Mutation tests create → verify → delete their own record. Never touch other rows.
- **Never commit `.env.local`** (shared QA login). No passwords / tokens in code, docs or tests — read them from env.
  Never auto-run `git commit`, `git push`, deletes or deploys.
- **Reuse** `src/components/*`, the hooks and PrimeReact before creating anything. New components stay small.
- **Class names** lowercase-with-hyphens: `product-list-toolbar` ✅ `productListToolbar` ❌ `product_list` ❌.
- **Colours only through tokens.** Palette in `src/styles/_tokens.scss` is named colour + code (`$red-b1`
  light / `$red-n2` dark); components use only the semantic CSS variables `var(--color-*)` (`--color-surface`,
  `--color-text`, `--color-primary`, `--color-table-head`, `--color-accent-purple`, …). Every light colour has
  exactly one dark colour (`$theme-colors` map). No hex / rgb anywhere else.
- **Colours come only from the Figma styles** (design review, 18 Nov). Every light colour in `_tokens.scss` is the hex
  of a Figma style, and its comment starts with the style name (`Grayscale/Gray 130`, `Primary/Primary 80`, …).
  A new colour: read the hex from the Figma style first, write the style name in the comment, add one line with a dark
  value to `$theme-colors`. "frame fill" = the frame uses the hex without a style; "kept" = Figma gives no value
  (success, warning, info, overlay, shadow). The dark palette is ours (no dark frames). Some Figma colours are below
  WCAG AA; that is design question 27 — do not change them until it is answered.
- **Font: Pretendard** (the font of the Figma frames), self-hosted as the dynamic subset: `@font-face` rules with
  `unicode-range` in `src/styles/pretendard-font.css` (imported in `src/app/layout.tsx`), files in
  `public/fonts/pretendard/`. The family `'Pretendard Variable'` is first in `$font-family-base`; PrimeReact uses it
  too (`globals.scss`). No `next/font`, no single big font file (it made the Vercel link slow), no CDN font,
  no 'Inter var'.
- **Logo only through `BrandLogo`** (`src/components/BrandLogo.tsx`): the TalkingClub logo image of the Figma frames,
  with no text next to it. Accessible name of the image `TalkingClub`; the header link is `토킹클럽 홈`. The wordmark
  takes `currentColor` (`--color-logo-text`), the mark is brightened in dark mode (`$logo-mark-dark-filter`).
  Never draw the logo or write it as text in a screen.
- **Korean line breaks:** `word-break: keep-all` on `body` (`globals.scss`), so Korean text breaks between words.
  `overflow-wrap: break-word` next to it lets one very long word (a code, a URL) still break.
- **Fields:** underline-only where the frames draw them — class `field-underline` on the form / block (product search,
  product form); a textarea stays boxed. Disabled buttons are muted (grey fill, same-colour border, white label), never
  a faded danger outline. The focus ring is the brand colour (`--color-focus-ring`).
- **No hardcoded numbers in SCSS:** `$space-*`, `$font-size-*`, `$radius-*`, sizes in `_tokens.scss`;
  breakpoints only via `@include upto('sm-md')` (≤ 991px) / `above(…)` from `_mixins.scss`.
- **Breakpoints (WM):** 1920 → 1600 → 1366 → 1280 → 1024 → 991 → 768 → 640 → 480 → 375. Must work at
  1440 / 768 / 375 with no horizontal page scroll. Tables scroll inside `.table-scroll-box`.
- **Permissions:** never check roles in a screen by hand. Buttons: `useCan(ROUTE_KEYS.PRODUCTS, 'delete')`.
  New page = one entry in `src/config/navigation.ts` (href, roles, permission, subRoutes).
- **Every data block** shows loading / empty / error / filled — wrap it in `StateWrapper` (`error={query.error}`
  picks the 403 / 404 / 500 / network variant).
- **UI text is Korean.** Take every label, message and placeholder from `docs/ko-glossary.md` (one Korean term for one
  idea, copied from the Korean Figma frames). A new string that is not in the glossary: write it in the tone of the
  frames and add a row to the glossary. In docs for non-Korean readers write the Korean text followed by the English
  meaning in brackets, e.g. `등록 (Register)`. The `accept-language` header stays `en` on purpose: the API answers with
  message keys and `api-messages.ts` maps them to Korean text.
- **API errors** are `ApiError { status, kind, messageKey, message, fieldErrors? }`. Show `message`
  (already readable Korean via `src/utils/api-messages.ts`; an unknown key falls back to the Korean server-error text);
  add new keys there. Field errors → `setError`. Toast success with `getApiMessage(res.message)`.
- **Default error toast.** `QueryCache` / `MutationCache` in `src/utils/query-client.ts` show one toast for every failed
  query / mutation. A hook whose screen already shows its own error (inline `StateWrapper`, under a field, or its own
  toast) must set `meta: SHOWS_OWN_ERROR`, or the user sees the error twice. A 401 and a cancelled request never toast.
- **Image upload** goes browser → `POST /api/upload` (own route) → S3. Never `PUT` to S3 from the browser. Limits:
  JPG / PNG / GIF / WEBP, 1–4 images, `NEXT_PUBLIC_MAX_IMAGE_MB` (default 4, safe on Vercel). Use `safeFileName` and
  `checkImageFile` from `src/utils/image-file.ts` on both sides.
- **Edit drafts** are restored only if the product is unchanged on the server (`updatedAt` + option rows); create
  drafts have no such check.
- **URL state:** list filters / page / sort, form step and details tab live in the query string.
- **Formats (WM):** dates `formatDateTime` → `YYYY/MM/DD HH:mm`; money `formatWon` → `₩1,000`; `-` when empty.
- **Dates are always KST** (`Asia/Seoul`) for every viewer, via `src/utils/format.ts` (`formatDateTime` / `formatDate`,
  `DISPLAY_TIME_ZONE`). Never call `dayjs(...).format()` for a shown date in a screen (QA round, 18 Nov).
- **Prices:** `판매가` (selling price, list / CSV caption `판매금액`) = API `price` (the cart and the order charge it);
  `단가` (unit price) = API `unitPrice`; the API requires `unitPrice < price` (`unitPriceMustBeLessThanPrice`).
  Step 1 shows `단가` first, then `판매가`. The step-4 ERP field is `ERP 단가`.
- **Titles:** browser tab title `%s | 토킹클럽 관리자` (`app/layout.tsx`). No text next to the logo (the design review
  of 18 Nov removed the suffix `관리자`); the login page keeps its screen-reader heading `토킹클럽 관리자 로그인`.
- **Where data lives:** server data only in TanStack Query hooks; keys only from `src/utils/query-keys.ts`;
  screen-only state in `useState` / the URL. Mutations already invalidate the right keys.
- **PrimeReact 10.2:** no `invalid` prop — `className="p-invalid"`. One global Toast (`useToast()`) and
  ConfirmDialog (`confirmAction` / `confirmDelete` from `src/utils/confirm.ts`).
- **a11y:** every input has a label, icon buttons have `aria-label`, keyboard focus ring comes from tokens,
  errors use `role="alert"`, loading uses `role="status"`.
- **Comment above each main block** in plain words (WM HTML guideline).
