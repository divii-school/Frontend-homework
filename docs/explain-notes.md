# HW3 — explanation notes (for the 15-minute call with Kakali)

Open each file while you explain. Say it in your own words; these are only reminders.

## 1. Auth flow — "how does login work?"
Files: `src/components/auth/LoginForm.tsx`, `src/api-services/AuthService.ts`, `src/utils/session.ts`, `src/utils/jwt.ts`

1. The user types ID + password. The Login button stays disabled until both are filled; empty fields show a message after they are touched.
2. `POST /auth/login { loginId, password }`. The API returns `data.token` (JWT, valid 1 day) and `data.user` (role + permissions).
3. If the role is not an HQ admin (SUPER / MASTER / GENERAL) → the "no admin permission" popup, and the session is thrown away.
4. Otherwise the session is saved: token + user in **localStorage** if "Auto login" is ticked, **sessionStorage** if not (closes with the tab). A small cookie `tc_hw3_token` is also set so the server-side middleware can see that the user is logged in.
5. Then we go to `returnTo` (the page the user wanted before login) — only relative paths on our own site are accepted, so nobody can use the link to send users to another website.
6. Every API call adds `Authorization: Bearer <token>` + the 3 Talking Club headers (`src/api-services/CoreAPIService.ts`).
7. **Token expiry:** we decode `exp` from the JWT. If it is expired, or the API answers 401, we clear the session and go to `/login?returnTo=<current page>`; after logging in again the user is back on the same page.
   *Why not the refresh token?* The API sends the refresh token as an httpOnly cookie, but the QA server's CORS is `origin: *`, and browsers never send cookies to a `*` origin from another site (our Vercel domain). So silent refresh can't work here; "login again and come back" is the safe option the TL page allows.
8. Logout: `GET /auth/logout`, then clear storage + cookie and any unsaved product form draft of this tab → login page. A 401 / expiry does not remove the draft, so the same user gets it back after logging in again.

## 2. Route guard — "how is a page protected?"
Files: `src/config/navigation.ts`, `src/middleware.ts`, `src/providers/RouteGuard.tsx`, `src/hooks/useCan.ts`

- **One config** (`navigation.ts`) lists every page: path, label, icon, which roles may open it, and the permission module. The **sidebar menu**, the **route guard** and the **buttons** all read this one list, so they can never disagree. Adding a page = one entry.
- Layer 1, **middleware** (runs on the server before the page): no `tc_hw3_token` cookie or expired token → redirect to `/login?returnTo=…`. A role that can't open the URL → `/403`. The path is decoded first (`/shopping-mall/%63ategories` is the same page as `/shopping-mall/categories`), the same way the server reads it.
- Layer 2, **RouteGuard** (client): checks `canAccess(user, pathname)` again with the full user from storage (GENERAL_ADMIN also needs the `shopping_mall` permission from the login payload) → `/403` if not allowed.
- Layer 3, **buttons**: `useCan(ROUTE_KEYS.PRODUCTS, 'delete')` hides Delete / Register / Edit for roles that can't do them. No component checks a role by hand.
- Test: `e2e/roles.spec.ts` injects a TEACHER and a GENERAL_ADMIN-without-permission session → menu hidden, direct URL shows 403. One test opens `/shopping-mall/%63ategories` as a GENERAL_ADMIN and expects 403 too.

## 3. Table state in the URL — "why does refresh keep my filters?"
Files: `src/components/products/list/list-url-state.ts`, `useProductListUrlState.ts`, `ProductListScreen.tsx`

- The list has no `useState` for page / search / filters / sort. The **URL is the state**: `?page=2&limit=10&q=book&searchType=productName&categoryId=3&sort=name&order=asc`.
- `parseListParams()` reads the URL into one typed object (bad values fall back to defaults, and the URL is cleaned). `toSearchString()` writes it back (defaults are left out).
- Every control calls `update({...})` → `router.replace(newUrl)`. Changing a filter always resets `page` to 1.
- Refresh, a shared link, and Back to list from a details page show the same list. Filter changes use replace, so they do not fill the browser history (the browser Back button leaves the list).
- `toApiQuery(state)` turns the URL state into the API query; that query object is also the TanStack Query cache key, so each filter combination is cached separately.
- Sort: the QA API has no sort parameter (always newest first), so sort only re-orders the rows of the current page, and the screen says so.
- Selection is a `Set` of product ids, kept across pages (max 100). Bulk delete sends those ids to `DELETE /products/delete`.
- CSV export loops over all pages with the same filters (limit 100), adds a UTF-8 BOM so Excel shows Korean correctly, and downloads `products-YYYYMMDD-HHmm.csv`.

## 4. Multi-step form — "how are values kept between steps?"
Files: `src/components/products/form/ProductForm.tsx`, `product-form.model.ts`, `product-form-draft.ts`

- There is **one** react-hook-form `useForm` for all 4 steps. All four step sections are inside one `<form>`; only the current one is visible. Nothing is unmounted, so Back / Next never lose a value.
- The step is in the URL (`?step=2`), so the browser Back button goes to the previous step. You can't jump ahead (typed URL or stepper) past a step that is not valid.
- **Per-step validation:** `STEP_FIELDS` lists the fields of each step. "Next" calls `trigger(fieldsOfThisStep)` — only that step's rules run — then focus moves to the first invalid field.
- Rules match the API: name required ≤ 100, prices whole numbers > 0, selling price < unit price (`unitPriceMustBeLessThanPrice`), at least 1 image, all three category levels, ERP name, quantity > 0, tax type.
- **Draft:** half a second after a change, values are saved in `sessionStorage` (`hw3-product-draft-create` / `-edit-<id>`). Reload → "Draft restored · Discard". Cleared after a successful save, Cancel or Log out.
- **API error:** nothing is cleared. A field error (e.g. selling price) goes back onto its field with `setError`, the stepper marks that step and jumps there. A 500 / network error stays on the review step with an error box + toast. The user fixes it and presses Register again.
- Edit mode loads `GET /products/details/:id`; product code and category are read-only (design 8.1.2).
- Create: the product code comes from `GET /products/generate-code` (read-only, Regenerate button). Register asks for a fresh code right before the POST, because another admin may have taken the code on screen; a restored draft also shows the fresh code.

## 5. Image upload — "how does the file reach S3?"
Files: `src/components/products/form/ImageUploadField.tsx`, `src/api-services/UploadService.ts`, `src/hooks/API/upload/useUploadImage.ts`

1. Check in the browser first: JPG / PNG / GIF / WEBP, ≤ 10 MB, max 4 images. A bad file gets its own message and **no request** is sent.
2. `POST /utils/upload-file-urls { location: 'products', extension, fileName }` → the API returns a **signed S3 URL** + `filePath` (the S3 key) + `preview` (public URL).
3. The browser `PUT`s the file **directly to S3** with that signed URL (the file never goes through our API server).
4. Only after S3 says OK, `{ filePath, preview }` is added to the form. `filePath` is what the product API stores; `preview` is shown as the thumbnail.
5. Remove = trash icon (with Undo). A failed upload shows Retry.

## 6. Categories — quick points
Files: `src/components/categories/*`
- The API returns 3 shapes (category / subCategory / childCategory); `toNodes()` turns them into one node shape and `CategoryNode` draws itself recursively. Depth limit 3 → no "add" button on level 3.
- Search is server-side and kept in `?q=`. Reorder (drag handle or Alt+↑/↓) sends the new id order of one sibling group to the reorder API; it is optimistic and rolls back on error, and is off during a search.
- Delete: a node with children never sends a request ("delete them first"); a leaf asks for confirmation.
- "Register main category" is disabled with the reason shown when the API says the 3-category limit is reached (`isCreatable=false`).

## 7. Things to say about quality
- Colours only from tokens (`var(--color-*)`), each light token has one dark value → dark mode with no extra code. Brand pink for buttons darkened to `#D41F4E` for 4.5:1 contrast (design question 13).
- Details tabs: each tab mounts its own query hook and has its own loading / empty / error state. Overview and Options share one cached details query (`useGetProductDetails`, the API returns the options inside the product details); Same category has its own list query (`useGetProductList`).
- Every list/tab has its own loading, empty and error state; errors are typed (`ApiError.kind` = unauthorized / forbidden / not-found / validation / server / network).
- Playwright: mocked `*-states.spec.ts` (run even when the API is down), live read-only specs, and `*.mutation.spec.ts` that only run with `E2E_ALLOW_MUTATIONS=1` and only touch `HW3-Neeraj-` records. All 84 tests passed in one command on 17 Nov (12:11 to 12:17; the first attempt stopped because the QA API answered a login later than the 5 s the test waits, and the same command passed when run again).
- Two test details people may ask about: (1) the S3 bucket accepts the upload only from the origin `http://localhost:3000`, so `E2E_MAP_3000_TO=3100` makes Chromium open `http://localhost:3000` but connect to the app on port 3100 (port 3000 is used by another app); on Vercel the upload fails until the bucket CORS is changed. (2) The login fields are filled with `setInputValueQuietly` (native value setter + input / change events) instead of `fill()`, because `fill()` writes the typed text into the report step title; the Login button only enables after the form reads both values, so the test still proves the form reacts.
