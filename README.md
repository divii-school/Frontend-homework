# Talking Club Admin — HW3 (Shopping Management)

Saswat's HW3 build: **Login + roles**, **Product Category Management**, **Product Management**.
Stack: Next.js 15 (App Router) · TypeScript · PrimeReact 10 · SCSS · TanStack Query 5 · Playwright.

## Run locally

```bash
npm install
cp .env.example .env.local      # sets NEXT_PUBLIC_API_BASE_URL to the QA API
npm run dev                     # http://localhost:3000
```

Logins: **from DM** (never in the repo, Notion, Slack or screenshots).

## Checks

```bash
npm run lint
npm run type-check
npm run build

# Playwright (logins only through env vars, never committed)
npx playwright install chromium
E2E_LOGIN_ID=... E2E_PASSWORD=... npm run test:e2e            # read-only specs
E2E_LOGIN_ID=... E2E_PASSWORD=... npm run test:e2e:mutation   # *.mutation.spec.ts (creates + deletes HW3-Saswat- records only)
npm run test:report                                           # opens the HTML report
```

## Deploy (Vercel, own account)

1. Import `divii-school/Frontend-homework` and pick branch `hw3/saswat`.
2. Project settings → Environment Variables: `NEXT_PUBLIC_API_BASE_URL=https://tkclub-admn-api-qa.dvconsulting.org` (only the API URL — never logins).
3. Optional: `NEXT_PUBLIC_IMAGE_BASE_URL` if product images come back as S3 keys instead of full URLs.
4. Settings → Deployment Protection → turn **off** Vercel Authentication so QA can open the link.

## Folder structure

```
src/
  app/                         routes only (thin)
    login/  403/  (admin)/shopping/{products,categories}
  config/access.ts             ONE config: menu + route guard + permissions
  lib/api/client.ts            fetch wrapper: required headers, bearer token, 401 → refresh → retry
  lib/api/normalize.ts         reads the API envelope in one place
  lib/auth/tokenStore.ts       session/local storage (자동 로그인)
  features/auth/               AuthProvider, AuthGuard, authService
  features/categories/         service + hooks + tree page + dialog
  features/products/           service + hooks + list / multi-step form / detail tabs / upload / CSV
  styles/_tokens.scss          light/dark design tokens (no hardcoded colours in components)
e2e/                           Playwright specs (*.mutation.spec.ts separated)
```

## How it works (for the explanation call)

**Auth flow.** The login form posts `loginId/password` to `POST /auth/login`. The access and refresh tokens are saved in `sessionStorage`, or in `localStorage` when 자동 로그인 is ticked. Then `GET /admin/profile` loads the admin, and `normalizeRole()` maps the role to `SUPER_ADMIN`, `GENERAL_ADMIN` or `OTHER`. Every API call goes through `apiRequest()`, which adds the 3 required Talking Club headers and `Authorization: Bearer`. If a call returns **401**, the client calls `GET /auth/get-access-token` once with the refresh token. If that works, it retries the original call. If not, it clears the tokens and fires `onSessionExpired`, and the AuthProvider sends the user to `/login?returnTo=<current page + query>`. After the next login, the user lands back on that exact page.

**Route guard + permissions.** `src/config/access.ts` is the only place that knows who can do what. `ROLE_PERMISSIONS` maps roles to permissions, `MENU` builds the sidebar, and `ROUTE_RULES` covers routes such as `/new` and `/edit`. Three things read it:
- `AuthGuard` blocks a route: not logged in → `/login?returnTo=…`, no permission → `/403`
- `visibleMenu()` hides menus the role can't use
- `useCan()` hides buttons (등록, 삭제, 수정, 엑셀 다운로드)

To add a screen, I change only this file.

**Table state in the URL.** `useProductListUrlState()` reads and writes `?page&limit&type&search&sort&order`. The URL is the single source of truth: the TanStack Query key is built from it. Refresh, back/forward and shared links restore the same page, filter and sort.

**Multi-step form.** `ProductForm` owns one `values` object for all 3 steps (기본 정보 → 이미지·노출 → 카테고리·ERP). The steps only render parts of it, so going back never loses input. Each step is validated before 다음, and 등록 re-validates everything and jumps to the first bad step. `values` is also mirrored to `sessionStorage`, so an API error or a refresh keeps the input. The draft is cleared only on success or 취소.

**Image upload.** The file is checked first (PNG/JPG/WEBP, ≤10MB, max 4 images) and shown as a preview straight away. Then:
1. `POST /utils/upload-file-urls` returns a signed S3 URL.
2. The browser `PUT`s the file to that URL.
3. The S3 key goes into `images[]` of the product DTO.

Remove deletes the image from the list.

**Details tabs.** `?tab=info|images|related`. Each tab renders only when active and runs its own query (`related` calls `get-products-by-category`). Each tab has its own loading, empty and error state.

## API assumptions to verify on the QA server

The Swagger spec documents requests but **not response bodies**, so `lib/api/normalize.ts` and the `map*` functions read several common key names. Check these first with the real login:

| What | Assumed | Where to fix |
|---|---|---|
| Login response | `data.accessToken`, `data.refreshToken` | `features/auth/authService.ts` |
| Refresh call | refresh token sent as `Authorization: Bearer` | `lib/api/client.ts` `refreshAccessToken` |
| Role field in profile | `role` / `adminType` / `role.name` | `authService.ts` `findRole`, `config/access.ts` `normalizeRole` |
| List envelope | `data.data[]` + `data.totalRecords` | `lib/api/normalize.ts` `toPaged` |
| Category tree keys | `subCategories` / `childCategories` | `features/categories/categoryService.ts` |
| Status endpoint value | `/update-status/{id}/yes|no` | `productService.updateStatus` |
| Signed URL response | `[{ url, key }]` | `features/products/uploadService.ts` |
| Tax type values | `tax` / `tax_free` (confirmed on QA) | `features/products/types.ts` `TAX_TYPES` |

## Design / API questions (WM)

1. `GET /products` and `GET /product-category/list` have **no sort parameter**, and the category list has **no paging**. Sort state is kept in the URL and applied to the current page. Can the API add `sortField` / `sortOrder`?
2. Product options (`productSets`, 8.1.1 #11–15) are not in this build; `isOptions` is sent as `no`.
3. The product description uses a plain textarea. The design mentions an editor.
4. The design shows no dark mode or 403 page; tokens follow WM Light/Dark, and the 403 text is from the "권한없음 팝업" frame.
