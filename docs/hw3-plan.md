# HW3 plan — Talking Club Admin (Shopping: Product Category + Product Management)

Source of truth: TL page "HW3 — Advanced Frontend Homework" (Notion 416326b2d5fb81c1beccdac6b9b7730d).
Submit Tue 2026-11-17 EOD · reviews 18–19 Nov · final 20 Nov.

## Stack (fixed by the TL page)
Next.js 15 (App Router) · React 19 · TypeScript strict (no `any`) · PrimeReact 10 · SCSS · TanStack Query 5 · react-hook-form · Playwright.
App lives at the repo root of branch `hw3/neeraj`. `.env.local` is never committed.

## Design (Figma file 4wQgaju5jbb5BNRCeNmGZ0) — PNG copies in docs/design/
| Screen | Node | PNG |
|---|---|---|
| 1.1.0 Login | 4019:78451 (card 4019:78509) | 1.1.0-login.png |
| Login ID states / PW states | 4019:78535 / 4019:78592 | 1.1.0-login-id-states.png / -pw-states.png |
| No admin permission popup | 17108:76615 | 1.1.0-no-permission-popup.png |
| 8.1.0 Product list | 8703:84533 | 8.1.0-product-list.png |
| 8.1.1 Product registration | 8714:87124 | 8.1.1-product-registration.png |
| 8.1.2 Product edit | 5498:99190 | 8.1.2-product-edit.png |
| 8.1.3 Single-item option select | 8741:62477 | 8.1.3-option-select.png |
| 8.2.0 Product category management | 5498:98488 | 8.2.0-category-management.png |
Brand: primary pink/red (Register button, active menu), purple "+ subcategory" pill, pink table header row. Sidebar 230px, topbar 54px.
The design has no product *details* page, no dark mode and no tablet/mobile frames → build them from the same tokens and list them under "design questions" (docs/design-questions.md). Not a design bug.

## API (QA server, `NEXT_PUBLIC_API_BASE_URL` = https://tkclub-admn-api-qa.dvconsulting.org/api/v1)
Backend = talking-club-backend branch `release/qa`. Every response: `{ success, message, data, totalRecords?, totalPage?, page?, isCreatable? }`.
Errors: `{ success:false, message, data, errors, statusCode }` — `message` is an i18n key (e.g. `productNotFound`) or, for DTO validation, an array/object of field messages. Map keys → readable English in `src/utils/api-messages.ts` (fallback: humanise the key).
Send headers on every call: `accept-language: en`, `x-talking-club-platform: web`, `x-talking-club-version: 1.0.0`, `Authorization: Bearer <token>`.
CORS on QA is `origin:*` (no credentials) → the httpOnly refresh-token cookie can't be used cross-site. Token expiry strategy: access token lives 1 day; decode `exp` from the JWT; on expiry or any 401 → clear session, go to `/login?returnTo=<current path+query>`, after login return there.

### Auth
- `POST /auth/login` body `{ loginId, password }` → `data.token`, `data.user { id, uuid, fullName, email, role, userId, permissions:[{module, subModules}] }`.
- `GET /auth/logout` (Bearer).
- Roles: SUPER_ADMIN, MASTER_ADMIN, GENERAL_ADMIN, REGIONAL_MANAGER, PRINCIPAL, TEACHER, STUDENT, GUARDIAN. Only HQ admins (SUPER/MASTER/GENERAL) may use this app. Figma: Product Management = Super Admin/General Admin; Category = Super Admin (treat MASTER_ADMIN like SUPER_ADMIN). GENERAL_ADMIN additionally needs `permissions` to include module `shopping_mall` (check real key names in ../talking-club-admin-frontend/src/utils/constants.ts ~line 495).
- Non-admin role logs in → show the "no admin permission" popup (design 17108:76615), don't enter the app.
- Login error keys from the API (wrong ID / wrong password) → show the API message (design: alert "등록되지 않은 계정입니다." / "아이디와 비밀번호가 일치하지 않습니다…" — UI language is English, use English equivalents + keep the API key mapping).

### Product categories (3-level tree)
- `GET /product-category/list?search=` → `data: Category[]` (Category {id,name,sortOrder,subCategories:[{id,name,sortOrder,childCategories:[{id,name,sortOrder}]}]}), `isCreatable` (false when ≥3 top-level exist — top-level create is blocked on QA: show the reason, disable the button).
- Top: `POST /product-category/add {name}` · `PUT /product-category/edit/:id {name}` · `DELETE /product-category/delete/:id`
- Middle: `POST /product-category/subcategory/add {name, categoryId}` · `PUT /product-category/subcategory/edit/:id {name, categoryId}` · `DELETE /product-category/subcategory/delete/:id`
- Minor: `POST /product-category/subcategory-child/add {name, subCategoryId}` · `PUT .../subcategory-child/edit/:id {name, subCategoryId}` · `DELETE .../subcategory-child/delete/:id`
- Reorder (same level): `PUT /product-category/reorder-categories|reorder-subcategories|reorder-subsubcategories {ids:number[]}` (new order).
- Errors: categoryAlreadyExists / subCategoryAlreadyExists / childSubcategoryAlreadyExists, maximumCategoryLimitReached, *NotFound.
- No server paging/sort for the tree → "search" is server-side; order = drag-and-drop reorder (server). Write that in design-questions.

### Products
- List A: `GET /products/get-products-by-category?page&limit&search&categoryId&subCategoryId&childCategoryId&productType(MAIN|SUPPLEMENTARY)` (product-name search + category filters).
- List B: `GET /products?page&limit&type=categoryName&search=` (search by category name).
- Both return `data: Product[]` (+ `image` = first image URL, `category/subCategory/childCategory {id,name}`), `totalRecords`, `totalPage`, `page`. Server order is always `id DESC`; there is no server sort param on release/qa → sort UI changes the URL and sorts the current page only; documented as an API limitation + question.
- `GET /products/details/:id` → `data` product (images = full URLs, `productOptions:[{optionGroup,type,option:[{optionId,optionName,optionCode,price}]}]`).
- `POST /products/add` / `PUT /products/edit/:id` body: productName, productCode (add only), price (판매가 (Selling price): what the cart and the order charge), unitPrice (단가 (Unit price), must be < price → else `unitPriceMustBeLessThanPrice`; corrected 18 Nov after the QA round, the plan first read these the other way round), description, erpName, erpUnitPrice, taxType (`tax` | `tax_free`), quantity, categoryId, subCategoryId, childCategoryId (all three required), images (S3 keys, min 1, max 4), isVisible / onSale / isOptions (`"yes"|"no"`), productSets? `[{optionGroup, type, option:[{optionId, price}]}]`.
- `DELETE /products/delete {ids:number[]}` (bulk) · `PUT /products/update-status/:id/:status` (status yes/no = visibility) · `GET /products/generate-code` · `GET /products/missing-erp-codes?erpCode=` (erpCodeAlreadyExists).
- Category pickers: `GET /products/categories`, `/products/subcategories/:id`, `/products/childcategories/:id`.
- Image upload: `POST /utils/upload-file-urls {location:'products', extension, count, fileName}` → `data.urls[]: {url, preview, filePath}`; `PUT url` with the file body + `Content-Type`; keep `filePath` for the API and `preview` for display. Reference: ../talking-club-admin-frontend/src/utils/fileUpload.ts.

## Shared-data rule (5 developers on one QA DB)
Every record we create is named `HW3-Neeraj-…`. Edit/delete only those. Mutation tests create → verify → delete their own record. Never touch other rows.

## Routes
```
/login                                   (full page)
/403                                     (no permission)
/shopping-mall/products?page&limit&q&searchType&categoryId&subCategoryId&childCategoryId&productType&sort&order
/shopping-mall/products/create?step=1..4
/shopping-mall/products/edit/[id]?step=1..4
/shopping-mall/products/details/[id]?tab=overview|options|related
/shopping-mall/categories?q=
```
One config (`src/config/navigation.ts`) drives the sidebar menu, the route guard (middleware + client RouteGuard) and the permission check (`can(user, routeKey)`). Adding a page = one entry.

## Features checklist (TL page §4)
A Login (validation, API error, logout, protected routes, returnTo, role-based menu/buttons/URLs, 403 page, token expiry).
B Categories: tree, server search, expand/collapse all, add top/sub/minor (modal), edit (modal), delete (confirm; block when children exist), drag reorder, validation (trim, required, ≤50 chars, no duplicates – API).
C Products: table (URL state, server filter + paging, sort, row selection ≤100, bulk delete with confirm, export current filtered result as CSV with BOM, inline visibility dropdown with toast), multi-step create/edit (4 steps, per-step validation, values kept when going back, draft survives API error, image upload type/size/preview/remove), details with tabs (each tab own query, tab in URL, per-tab loading/empty/error).
D Tokens for light/dark (no hardcoded colours), a11y (labels, keyboard, focus ring, contrast), 401/403/404/500/network handling, zero console errors, 1440/768/375, WM formats (date `YYYY/MM/DD HH:mm`, money `₩1,000`).
E Unit test case sheet (CSV → Google Sheet, WM QA template), Playwright read-only + `*.mutation.spec.ts`, HTML report, lint/type-check/build green, PR text, build report (10 parts).
