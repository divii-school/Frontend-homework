# Explanation notes — for the 15-minute call (study these, then explain in your own words)

Open each file while reading. Kakali will ask "why", not only "what".

## 1. Auth flow
- **Login:** `src/features/auth/LoginForm.tsx` → `useAuth().login()` (`src/features/auth/AuthProvider.tsx`) →
  `authService.login()` (`src/services/auth.ts`) → `POST /api/v1/auth/login`. The response is checked with zod:
  `data.token` + `data.user.role`. A non-admin role → server logout + "no permission" popup.
- **Where the token lives:** `src/lib/auth/tokenStorage.ts`. Auto login on → localStorage, off → sessionStorage.
  An expired JWT (`exp`) counts as logged out.
- **How React knows:** `useSyncExternalStore(tokenStorage.subscribe, …)` — the storage is a tiny store; login /
  logout emit, so every component re-renders. Also reacts to other tabs (`storage` event).
- **Every request:** `src/services/http.ts` `request()` adds `Authorization: Bearer …` via hooks registered in
  `src/lib/auth/session.ts` (so `http.ts` never imports auth code).
- **Token expiry:** on a 401 for a logged-in request → `onSessionExpired()` clears storage and goes to
  `/login?next=<this page>&expired=1`. Why no refresh: the refresh token is an httpOnly cookie on
  `.dvconsulting.org` and the API's CORS has no credentials → the browser can't send it (tested).

## 2. Route guard + one config
- `src/config/navigation.ts` is the single list of pages with their roles. From it: the sidebar
  (`navigationFor(role)` in `AdminShell.tsx`), the guard (`canAccess(path, role)`), breadcrumbs, `isAdminRole`.
- `src/app/(admin)/layout.tsx` wraps every admin page in `RequireAuth` (`src/features/auth/RequireAuth.tsx`):
  logged out → `router.replace(/login?next=…)`; wrong role → `<Forbidden />` (403).
- `?next=` is checked by `safeReturnPath()` (`src/lib/auth/redirect.ts`): only paths inside the app, no `//evil.com`.

## 3. Table state in the URL
- `src/features/products/useProductListParams.ts`: reads `page`, `search`, `type` from `useSearchParams()`;
  `update()` builds a new query string and `router.push`es it (defaults left out).
- `useProducts(params)` (`src/hooks/useProducts.ts`) uses the params in the **query key** → each URL state is its
  own cache entry; `keepPreviousData` keeps the old page visible while the next loads.
- Why URL and not `useState`: reload, Back / Forward and shared links keep the same table.
- The search box is a child (`ProductSearch.tsx`) rendered with `key={type|search}`, so Back refills it from the
  URL without a setState-in-effect.
- Same idea for the categories search (`?search=`) and the details tabs (`?tab=…&page=…`).

## 4. Multi-step form keeps values
- `src/features/product-form/ProductForm.tsx`: **one** `values` object in the parent; each step only renders
  inputs bound to it. Changing steps never unmounts the state → Back / Next keep everything.
- Validation per step: `validateStep(step, values)` in `validation.ts` runs when you press Next; errors show only
  for steps you tried to leave (`attempted`). Before saving, `firstInvalidStep()` re-checks all steps.
- Failed save: the error is shown, `values` untouched → nothing lost. Success: toast + list.
- Edit: `ProductFormPage.tsx` loads `/products/details/{id}`, `detailToForm()` maps it, the form is rendered
  with `key={id}` so it starts from those values once.

## 5. Image upload
- `ImageUploader.tsx`: `checkImageFile()` (type JPG/PNG/WebP, ≤ 3 MB) before anything is sent; max 4.
- `uploadProductImage()` (`src/services/uploads.ts`): 1) `POST /utils/upload-file-urls` (with our token) gives a
  signed S3 URL + `filePath`; 2) the file goes to **our** `/api/upload` route (`src/app/api/upload/route.ts`),
  which PUTs it to the signed URL server-side.
- Why the route: the bucket's CORS only allows the original admin's origin, so a browser PUT from our domain is
  blocked (tested). The route checks host, `/products/` path, type and size; it holds no secrets.
- The form stores `{ filePath, preview }`; the request sends keys (`products/…`). `imageKey()` turns URLs from the
  details API back into keys (otherwise the server doubles the URL — found by the mutation test).
- Preview: `next/image` with the bucket in `next.config.ts` `remotePatterns`; remove = filter it out of `values.images`.
