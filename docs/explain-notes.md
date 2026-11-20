# HW3 — explanation notes (for the explanation call with Kakali, updated after the design review of 18 Nov and the font change of 19 Nov)

Open each file while you explain. Say it in your own words; these are only reminders. The whole UI is Korean now (code review of 17 Nov); section 8 helps you talk about it without reading Korean.

The code review result is Pass (Kakali, 18 Nov). In the call she wants two things in your own words: **the upload route** (section 5) and **the draft version check** (section 4, "Edit draft check"). The QA round of 18 Nov (Archana) changed the price fields and the time zone; be ready for "why is 판매가 the field `price`?" (section 4, "Prices") and "why Korea time?" (section 7, "Time zone"). The design review of 18 Nov (Bhagyashree) changed the logo, the colours, the font and the phone layout of the filters; be ready for "where do these values come from?" (section 9).

## 1. Auth flow — "how does login work?"
Files: `src/components/auth/LoginForm.tsx`, `src/api-services/AuthService.ts`, `src/utils/session.ts`, `src/utils/jwt.ts`

1. The user types ID (`아이디`) + password (`비밀번호`). The Login button (`로그인`) stays disabled until both are filled; empty fields show a message after they are touched.
2. `POST /auth/login { loginId, password }`. The API returns `data.token` (JWT, valid 1 day) and `data.user` (role + permissions).
3. If the role is not an HQ admin (SUPER / MASTER / GENERAL) → the "no admin permission" popup (`관리자 권한이 없습니다.`), and the session is thrown away.
4. Otherwise the session is saved: token + user in **localStorage** if "Auto login" (`자동 로그인`) is ticked, **sessionStorage** if not (closes with the tab). A small cookie `tc_hw3_token` is also set so the server-side middleware can see that the user is logged in.
5. Then we go to `returnTo` (the page the user wanted before login) — only relative paths on our own site are accepted, so nobody can use the link to send users to another website.
6. Every API call adds `Authorization: Bearer <token>` + the 3 Talking Club headers (`src/api-services/CoreAPIService.ts`). The `accept-language` header is still `en` **on purpose**: the API answers with message keys (like `invalidCredentials`), not with text, and the app maps each key to Korean text (`src/utils/api-messages.ts`). An unknown key shows the Korean "server error" text, never English words.
7. **Token expiry:** we decode `exp` from the JWT. If it is expired, or the API answers 401, we clear the session and go to `/login?returnTo=<current page>`; after logging in again the user is back on the same page.
   *Why not the refresh token?* The API sends the refresh token as an httpOnly cookie, but the QA server's CORS is `origin: *`, and browsers never send cookies to a `*` origin from another site (our Vercel domain). So silent refresh can't work here; "login again and come back" is the safe option the TL page allows.
8. Logout: `GET /auth/logout`, then clear storage + cookie and any unsaved product form draft of this tab → login page. A 401 / expiry does not remove the draft, so the same user gets it back after logging in again.

## 2. Route guard — "how is a page protected?"
Files: `src/config/navigation.ts`, `src/middleware.ts`, `src/providers/RouteGuard.tsx`, `src/hooks/useCan.ts`

- **One config** (`navigation.ts`) lists every page: path, label, icon, which roles may open it, and the permission module. The **sidebar menu**, the **route guard** and the **buttons** all read this one list, so they can never disagree. Adding a page = one entry.
- Layer 1, **middleware** (runs on the server before the page): no `tc_hw3_token` cookie or expired token → redirect to `/login?returnTo=…`. A role that can't open the URL → `/403`. The path is decoded first (`/shopping-mall/%63ategories` is the same page as `/shopping-mall/categories`), the same way the server reads it.
- **One exception on purpose:** `/api/upload` is left out of the middleware matcher (`matcher` in `middleware.ts`). Reason: Next 15.5 passes only the first 10 MB of a request body through middleware. The upload route checks the session itself (same cookie + `exp` check) and answers a JSON 401, not a redirect, because the caller is `fetch()`.
- Layer 2, **RouteGuard** (client): checks `canAccess(user, pathname)` again with the full user from storage (GENERAL_ADMIN also needs the `shopping_mall` permission from the login payload) → `/403` if not allowed.
- Layer 3, **buttons**: `useCan(ROUTE_KEYS.PRODUCTS, 'delete')` hides Delete / Register / Edit for roles that can't do them. No component checks a role by hand.
- Test: `e2e/roles.spec.ts` injects a TEACHER and a GENERAL_ADMIN-without-permission session → menu hidden, direct URL shows 403. One test opens `/shopping-mall/%63ategories` as a GENERAL_ADMIN and expects 403 too. `e2e/upload-route-states.spec.ts` checks that `/api/upload` without a session answers a JSON 401.

## 3. Table state in the URL — "why does refresh keep my filters?"
Files: `src/components/products/list/list-url-state.ts`, `useProductListUrlState.ts`, `ProductListScreen.tsx`

- The list has no `useState` for page / search / filters / sort. The **URL is the state**: `?page=2&limit=10&q=book&searchType=productName&categoryId=3&sort=name&order=asc`.
- `parseListParams()` reads the URL into one typed object (bad values fall back to defaults, and the URL is cleaned). `toSearchString()` writes it back (defaults are left out).
- Every control calls `update({...})` → `router.replace(newUrl)`. Changing a filter always resets `page` to 1.
- Refresh, a shared link, and Back to list from a details page show the same list. Filter changes use replace, so they do not fill the browser history (the browser Back button leaves the list).
- `toApiQuery(state)` turns the URL state into the API query; that query object is also the TanStack Query cache key, so each filter combination is cached separately.
- Sort: the QA API has no sort parameter (always newest first), so sort only re-orders the rows of the current page, and the screen says so. Sort by `판매금액 (Selling price)` sorts by the API field `price`.
- Selection is a `Set` of product ids, kept across pages (max 100). Bulk delete sends those ids to `DELETE /products/delete`.
- CSV export loops over all pages with the same filters (limit 100), adds a UTF-8 BOM so Excel shows Korean correctly, and downloads `products-YYYYMMDD-HHmm.csv` (Korea time). The CSV columns are `단가` = `unitPrice` and `판매금액` = `price`; `등록일자` is Korea time.

## 4. Multi-step form — "how are values kept between steps?"
Files: `src/components/products/form/ProductForm.tsx`, `product-form.model.ts`, `product-form-draft.ts`

- There is **one** react-hook-form `useForm` for all 4 steps. All four step sections are inside one `<form>`; only the current one is visible. Nothing is unmounted, so Back / Next never lose a value.
- The step is in the URL (`?step=2`), so the browser Back button goes to the previous step. You can't jump ahead (typed URL or stepper) past a step that is not valid.
- **Per-step validation:** `STEP_FIELDS` lists the fields of each step. "Next" (`다음`) calls `trigger(fieldsOfThisStep)` — only that step's rules run — then focus moves to the first invalid field.
- Rules match the API: name required ≤ 100, prices whole numbers > 0, unit price `단가` (`unitPrice`) < selling price `판매가` (`price`) (API key `unitPriceMustBeLessThanPrice`, message `단가는 판매가보다 낮아야 합니다.` "The unit price must be lower than the selling price."), at least 1 image and at most 4, all three category levels, ERP name, quantity > 0, tax type.
- **Prices (QA round, 18 Nov).** `판매가 (Selling price)` = API `price`, because the shopping cart and the order charge `price` (backend: `sellingPrice: product.price`). And the API refuses a product unless `unitPrice < price`, so `단가 (Unit price)` = `unitPrice`, the smaller one.
  The earlier build had it the other way round (it read the Figma 8.1.2 description "판매가 ≤ 정가" as "단가 = list price"). Now the list (`판매금액`, one price only), the details page, the CSV, the sort, the default price of a picked single-item option and the step-4 summary all use the same mapping. Step 1 shows `단가` first, then `판매가` (frame 8.1.1 order). The step-4 ERP field is now labelled `ERP 단가 (ERP unit price)`. The conflict with the frame is design question 25.
- **Draft:** half a second after a change, values are saved in `sessionStorage` (`hw3-product-draft-create` / `-edit-<id>`). Reload → "Draft restored" (`임시 저장된 내용을 불러왔습니다.`) with a Discard button (`임시 저장 삭제`). Cleared after a successful save, Cancel or Log out.
- **Edit draft check (new):** a draft in edit mode is restored only if the product on the server did not change after the draft was saved. The "version" of the product is `updatedAt` plus the option rows (`product-form-draft.ts`), because saving only the option rows does not change `updatedAt`. If the version differs, the draft is dropped and a notice says so (`임시 저장된 내용을 불러오지 않았습니다. …`). The edit screen always loads a fresh copy (so the check also works after the browser Back button). Create drafts have no such check; nothing on the server can change for a new product.
- **API error:** nothing is cleared. A field error (e.g. `unitPriceMustBeLessThanPrice` on the unit price `단가`) goes back onto its field with `setError`, the stepper marks that step and jumps there. A 500 / network error stays on the review step with an error box + toast. The user fixes it and presses Register (`등록`) again.
- **Default error toast (new):** `QueryCache` / `MutationCache` in `src/utils/query-client.ts` show one toast for any failed query or mutation, so a new screen cannot fail silently. A hook whose screen already shows its own error (inline, under a field, or its own toast) says so with `meta: SHOWS_OWN_ERROR` and gets no second toast. A 401 never toasts (the app is already going to the login page); a cancelled request never toasts.
- Edit mode loads `GET /products/details/:id`; product code and category are read-only (design 8.1.2).
- Create: the product code comes from `GET /products/generate-code` (read-only, Regenerate button `다시 생성`). Register asks for a fresh code right before the POST, because another admin may have taken the code on screen; a restored draft also shows the fresh code.

## 5. Image upload — "how does the file reach S3?"
Files: `src/components/products/form/ImageUploadField.tsx`, `src/api-services/UploadService.ts`, `src/app/api/upload/route.ts`, `src/utils/image-file.ts`, `src/hooks/API/upload/useUploadImage.ts`

1. Check in the browser first: JPG / PNG / GIF / WEBP, size ≤ `NEXT_PUBLIC_MAX_IMAGE_MB` (default 4 MB), max 4 images. A bad file gets its own message and **no request** is sent. The 4-image limit is guarded on every add / Undo / Retry path and again by a form rule, so a 5th image can not be saved.
2. The comma is removed from the file name (`safeFileName` in `image-file.ts`), because the product API keeps image keys in one comma-separated text; a comma in a name would split one image into two broken ones.
3. `POST /utils/upload-file-urls { location: 'products', extension, fileName }` → the API returns a **signed S3 URL** + `filePath` (the S3 key) + `preview` (public URL).
4. The browser does **not** call S3. `UploadService` posts the file and the signed URL (multipart form) to **our own route** `POST /api/upload`, and the server sends the file to S3 with the signed URL. Why: the S3 bucket CORS allowed only `http://localhost:3000`, so a browser upload failed on the Vercel link. CORS is a browser rule; a server is not bound by it.
5. The route is not an open proxy. It checks: logged-in session (401 JSON), only the `talking-club-dev` bucket host (400; another site or another S3 bucket is refused), file type (415), size (413), and the S3 answer (502). It uses the same rules as the browser check (`checkImageFile`), because a browser check can always be skipped. Its messages are keys (`sessionExpired`, `uploadTooLarge`, `uploadFailed`, `uploadUrlNotAllowed`, `fileFormatNotAllowed`); the app turns them into Korean text.
6. Only after the route answers OK, `{ filePath, preview }` is added to the form. `filePath` is what the product API stores; `preview` is shown as the thumbnail.
7. Remove = trash icon (with Undo `되돌리기`). A failed upload shows Retry (`다시 시도`).
8. Size limit on Vercel: a Vercel function refuses request bodies above 4.5 MB, so the default is 4 MB (code re-check, 18 Nov): a deployment that forgets `NEXT_PUBLIC_MAX_IMAGE_MB` still works. The check, the hint text and the route all read the same value. It is read at build time (redeploy after a change).

## 6. Categories — quick points
Files: `src/components/categories/*`
- The API returns 3 shapes (category / subCategory / childCategory); `toNodes()` turns them into one node shape and `CategoryNode` draws itself recursively. Depth limit 3 → no "add" button on level 3.
- Search is server-side and kept in `?q=`. Reorder (drag handle or Alt+↑/↓) sends the new id order of one sibling group to the reorder API; it is optimistic and rolls back on error, and is off during a search.
- Delete: a node with children never sends a request ("delete them first"); a leaf asks for confirmation.
- "Register main category" (`대분류 등록`) is disabled with the reason shown when the API says the 3-category limit is reached (`isCreatable=false`).

## 7. Things to say about quality
- Colours only from tokens (`var(--color-*)`), each light token has one dark value → dark mode with no extra code. Since the design review every light colour is the hex of a Figma style (section 9). The brand colour for buttons is the Figma value `#ef325b` (3.98:1 with white); the darker `#D41F4E` of the first build is gone (design question 13 is answered; the contrast is design question 27).
- Details tabs: each tab mounts its own query hook and has its own loading / empty / error state. Overview and Options share one cached details query (`useGetProductDetails`, the API returns the options inside the product details); Same category has its own list query (`useGetProductList`).
- Every list/tab has its own loading, empty and error state; errors are typed (`ApiError.kind` = unauthorized / forbidden / not-found / validation / server / network).
- **Time zone (QA round, 18 Nov).** Every date is shown in Korea time (KST, `Asia/Seoul`) for every viewer: list, details (`등록일자`, `수정일자`), the CSV column `등록일자`, the CSV file name and the draft "saved at" time. It is done once, in `src/utils/format.ts` (dayjs `utc` + `timezone` plugins, `DISPLAY_TIME_ZONE = "Asia/Seoul"`). Why: the admin tool is used by the Korean team, and QA in India must see the same time for the same record. Before, the browser's own time zone was used, so India saw 5.5 hours less. The test `products-states.spec.ts` runs the browser in India time (`Asia/Kolkata`) and still expects KST.
- Playwright: mocked `*-states.spec.ts` (run even when the API is down), live read-only specs, and `*.mutation.spec.ts` that only run with `E2E_ALLOW_MUTATIONS=1` and only touch `HW3-Neeraj-` records. 115 tests in 15 files (guest 15, mocked 76, setup 1, chromium 23); nine of them are new from the design review (colours and font, logo, disabled `삭제` in light and dark, the `필터` button, the tab bar, category rows at 375 px, underline fields, the login logo). The result of the final run against the Vercel link is in `docs/qa-build-report.md`, part 9. Earlier run, before the design fixes: all 105 tests of that time passed in one command against the Vercel link (build `586b91a`) on 18 Nov (12:07 to 12:14, first attempt, with mutations).
- Two test details people may ask about: (1) the real image upload now goes through `/api/upload`, so the tests need no special port any more (the option `E2E_MAP_3000_TO` still exists in the config, but it is not used). (2) The login fields are filled with `setInputValueQuietly` (native value setter + input / change events) instead of `fill()`, because `fill()` writes the typed text into the report step title; the Login button only enables after the form reads both values, so the test still proves the form reacts.
- Code review (Kakali, 17 Nov, "Resubmit"): the code was praised. Two must-fix items (Korean UI text; upload without the S3 CORS problem) and four should-fix items (5th image, comma in file name, edit draft check, default error toast) are done. Re-check on 18 Nov: code result **Pass** (two small points done: 4 MB default, upload only to the `talking-club-dev` bucket).
- QA round (Archana, 18 Nov, "Resubmit"; the build was praised, 90 checks passed on the Vercel build). Fixed in `586b91a`: the price fields (see section 4, "Prices"), Korea time for every date (above), the tab title `… | 토킹클럽 관리자`, the step-4 label `ERP 단가`. (The logo suffix `관리자` of that round was removed again by the design review.) The test sheet now follows the WM DEV template. The three small visual items that this round left open are fixed in `792ef82`.
- Two layout bugs from my own manual run (18 Nov, commit `733655c`): the row `노출여부 (Exposure Status)` select keeps its own width, so `아니오 (No)` is no longer cut on a narrow table; `body` uses `overflow-x: clip`, so the sticky sidebar and topbar stay in view (`overflow-x: hidden` on `body` made `body` a scroll box, and `position: sticky` then had no effect).
- Design review (Bhagyashree, 18 Nov, "Resubmit"; "A strong build … the 1440 layout follows the Figma frames closely"). Three must-fix items (logo, colours and font, muted disabled buttons), four should-fix items (`word-break: keep-all`, underline fields, the `필터 (Filters)` button at ≤ 768 px, one-line category rows at ≤ 640 px) and minor items. All done in `792ef82`; the font loading was changed on 19 Nov in `636e258`. Details to say: section 9.
- Review status: code Pass; QA to re-test the final build; design to re-review; final result Friday 20 Nov.
- **API issues (Kakali's notice, 18 Nov).** The QA API is in maintenance. We do not fix or work around API problems; each one is written in the known issues as "API issue", and an API issue does not block Pass. Example: the category-name search also returns deleted products.

## 8. Korean UI: how to talk about it

You do not need to read Korean. The whole UI text is Korean because the reviewer decided so; the words follow the Korean Figma frames (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리"). `docs/ko-glossary.md` lists all 564 strings (English before, Korean now, source; 562 at the code review, and two new ones from the design review: the button `필터 (Filters)` and its accessible name `필터 N개 적용 중 (Filters, N in use)`, rows C145 and C146). Say it like this: "The UI is Korean. Every string has one Korean term for one idea, taken from the Figma frames, and the glossary is the single list." Technical facts to say: `<html lang="ko">`; PrimeReact's own texts (paginator, dropdown empty text, dialog buttons) use a Korean locale (`src/providers/primereact-locale.ts`); an unknown API message key falls back to the Korean server-error text; the `accept-language` header stays `en` on purpose.

The 25 most important terms (from the glossary terminology table):

| # | Korean | Say it like | Meaning |
|---|---|---|---|
| 1 | 상품 | sangpum | product |
| 2 | 상품명 / 상품코드 | sangpum-myeong / sangpum-kodeu | product name / product code |
| 3 | 카테고리 | kategori | category |
| 4 | 대분류 | dae-bun-ryu | category level 1 (main, major) |
| 5 | 중분류 | jung-bun-ryu | category level 2 (sub, middle) |
| 6 | 소분류 | so-bun-ryu | category level 3 (minor) |
| 7 | 등록 | deung-nok | register (create) |
| 8 | 수정 | su-jeong | edit |
| 9 | 삭제 | sak-je | delete |
| 10 | 저장 | jeo-jang | save |
| 11 | 취소 | chwi-so | cancel |
| 12 | 확인 | hwa-gin | OK / confirm |
| 13 | 검색 | geom-saek | search |
| 14 | 목록 | mong-nok | list |
| 15 | 노출상태 | no-chul sang-tae | exposure status (is the product visible to customers) |
| 16 | 판매상태 | pan-mae sang-tae | sales status (can it be ordered) |
| 17 | 판매가 / 판매금액 | pan-mae-ga / pan-mae geu-maek | selling price (the amount the customer pays, API field `price`); 판매금액 is the list and CSV column caption for the same value |
| 18 | 단가 | dan-ga | unit price (API field `unitPrice`; must be lower than 판매가). `ERP 단가` = ERP unit price (step 4) |
| 19 | 옵션 | op-syeon | option |
| 20 | 단권 옵션 | dan-gwon op-syeon | single-item option (another product sold together, for example a workbook) |
| 21 | 비과세 | bi-gwa-se | tax-exempt (also the label of the tax field; values 과세 = taxable, 비과세 = tax-exempt) |
| 22 | 상세설명 | sang-se seol-myeong | detailed description |
| 23 | 등록 카테고리 | deung-nok kategori | registration category (the category path chosen at registration) |
| 24 | 로그인 / 로그아웃, 아이디 / 비밀번호 | login / logout, a-i-di / bi-mil-beon-ho | login / logout, ID / password |
| 25 | 권한 | gwon-han | permission (`권한 없음` = no permission) |

Also useful: 예 / 아니오 = yes / no; 이전 / 다음 = back / next; 필터 초기화 = reset filters; 목록으로 = back to the list; 다시 시도 = try again.

Wording decisions (why the app says what it says; the reviewer or the designer decides if a change is wanted — they are design questions 20 to 25 in `docs/design-questions.md`; question 26 is answered):

1. **One shared form for register and edit.** The edit frame (8.1.2) calls the price `할인가격` ("discount price") and the category label `카테고리`. The registration frame (8.1.1) says `판매가` and `등록 카테고리`. The app has one form, so it uses the registration wording on both screens. If the edit wording is wanted, the label in `StepBasicInfo.tsx` has to depend on the mode.
2. **Tax field `비과세`.** The frame label is `비과세` (it means "tax-exempt"), so the app uses it as the label. On the details page it reads oddly: "비과세: 과세" for a taxable product. A neutral label such as `과세 구분` would read better but is in no frame, so the frame word stays.
3. **Money format `₩4,000`.** The frames use three formats (`₩ 4,000` with a space, `₩0` without, and `23,000원`). The frame description only says "currency sign, thousands comma". The app uses `₩4,000` everywhere.
4. **Product type filter `상품 유형`.** No frame has this filter. The app uses the label `상품 유형` with `메인 상품` (main product, has options) and `단권 상품` (single-item product, without options). `주교재 / 부교재` was not used because the frames use those words as category names.
5. **Breadcrumb.** In the frames the first breadcrumb item is `공지사항 관리` ("Notice Management"). It is a left-over from the notice screens, so the app uses `쇼핑몰 관리` ("Shopping Mall Management"), the real sidebar group.
6. **Login language question is answered.** Earlier design question 11 asked about the login language ("the app UI is English"). The reviewer decided: the whole UI is Korean.
7. **Which price is 단가 and which is 판매가 (design question 25).** The frame 8.1.2 description reads `단가` as a list price above `판매가`. The API charges `price` and requires `unitPrice < price`. The app follows the API: `판매가` = `price`, `단가` = `unitPrice`.
8. **Logo and tab title (design question 26, answered on 18 Nov).** The tab title is `… | 토킹클럽 관리자`. The designer decided: show the TalkingClub logo image of the Figma frames, with no text next to it. So the suffix `관리자` next to the logo is gone, and the word "TalkingClub" inside the logo image is the only Latin text (section 9, "Logo").

## 9. Design tokens, font and logo — "where do these values come from?" (design review, 18 Nov)
Files: `src/styles/_tokens.scss`, `src/styles/pretendard-font.css`, `src/app/layout.tsx`, `src/components/BrandLogo.tsx`, `src/components/products/list/ProductListToolbar.tsx`, `src/styles/globals.scss`

- **What the designer said.** Result "Resubmit". The layout was good, but the logo, the colours and the font were not the ones of Figma. The lesson to say: read the exact values from the source (the Korean Figma frames, the Figma styles, the backend code, the WM template) before building. Do not build something that only looks similar.
- **Colours: where each value comes from.** Every light colour in `_tokens.scss` is the hex of a Figma paint style, and the comment starts with the style name. Examples: text `#181818` = `Grayscale/Gray 130`; table header `#fff1f3` = `Primary/Primary 80`; brand and primary `#ef325b` = `Talking Club/Talking Club`; input underline `#d9d9d9` = `Grayscale/Gray 80`. Two more words in the comments: "frame fill" = the frame uses this hex without a style (example: the purple of `+ 소분류`, `#7c3aed`); "kept" = Figma gives no value (success, warning, info, overlay, shadow). The dark palette is ours, because the design has no dark frames; there only the focus ring and the active sub-menu background changed.
- **How a colour reaches a component.** Palette variable (`$gray-b1`) → the `$theme-colors` map (one light and one dark value per role) → CSS variable (`--color-text`) → the component uses `var(--color-text)`. No hex in a component.
- **What looks different now.** A white page with bordered cards (it was a grey page). The active sub-menu row is grey, not pink. The enabled `삭제 (Delete)` outline is the lighter Danger 100. The focus ring is the brand colour (it was blue). New role `--color-danger-strong` (Danger 110, `#a92e2e`): the filled danger button of confirm dialogs, the required mark `*` and text on the soft danger fill.
- **Contrast (say it honestly).** The Figma tokens are used as they are, and some are below WCAG AA: primary with white 3.98:1, Danger 100 on white 3.27:1, placeholder 2.19:1, grey row icons 2.60:1, Gray 80 line 1.41:1. The first build used darker values that passed AA. The designer asked for the Figma tokens, so I changed them and wrote design question 27: "keep them?".
- **Font: why Pretendard, why self-hosted.** The Figma text nodes use Pretendard. Self-hosted means: the font files are in our own `public/fonts/pretendard/`, so no request goes to another server, and Korean text never falls back to a font of the visitor's PC. The files come from the npm package pretendard 1.3.9 (licence SIL OFL 1.1); the package is not a dependency, the files are copied into the repo.
- **Font: what "dynamic subset" means.** The font is cut into 92 small files. `src/styles/pretendard-font.css` has one `@font-face` rule per file, each with a `unicode-range` (the list of characters in that file). The browser reads the ranges and downloads only the files for the characters on the page. The login page loads 187 KB of fonts in 7 files (6 Pretendard files + the icon font). The family name is `'Pretendard Variable'`; it is first in `$font-family-base`; PrimeReact gets it through its `--font-family` variable in `globals.scss`. 'Inter var' is not loaded any more.
- **Font: why not one file.** In `792ef82` the font was one 2.06 MB file, loaded with `next/font/local`. `next/font` preloads the file on every page. On the Vercel link the first page load was several seconds slower (the file alone took 4.8 s to download on my network), and two Playwright runs against the Vercel link failed with timeouts in `page.goto`. The dynamic subset fixed it (commit `636e258`): 187 KB of fonts on the login page; before it was 2,058 KB.
- **Korean line breaks.** `word-break: keep-all` on `body`: Korean text breaks between words, not inside a word. `overflow-wrap: break-word` next to it lets one very long word (a code, a URL) still break, so the page never scrolls sideways.
- **Logo: where the file comes from.** Figma has no vector logo, only a 158 × 30 px bitmap on a white background (the same file as `loginLogo.png` of the real admin project). The same artwork with a transparent background (512 × 107 px) is in the company's own web project (`talking-club-web-frontend/public/images/logo.png`). It is saved here as `public/brand/talkingclub-logo.png`. The source was confirmed by the developer on 18 Nov.
- **Logo: how it adapts in dark mode.** `BrandLogo` draws an inline SVG with two parts from the one file. The mark (three rings) = the pixels of the file, unchanged. The wordmark = a rectangle filled with `currentColor`, cut out by a mask made from the same file. So the wordmark takes the text colour token `--color-logo-text`: the logo's own grey in light mode, a light grey in dark mode. The mark gets `filter: brightness(1.45)` in dark mode (`$logo-mark-dark-filter`), so the navy ring stays visible on the dark surface.
- **Logo: other details.** One image for screen readers: `role="img"`, name `TalkingClub`. The header link keeps the name `토킹클럽 홈`. `useId` gives each logo its own mask id, because the sidebar and the topbar both draw one. The two parts are two `<svg>` elements, so the phone topbar (≤ 480 px) can hide the wordmark and show the mark alone. Every screen uses `BrandLogo`; no screen draws the logo itself.
- **Phone filter panel (≤ 768 px): the state.** `ProductListToolbar` has `const [filtersOpen, setFiltersOpen] = useState(false)`. Open / closed is screen-only state, so it lives in the component, not in the URL. That is why it starts closed after every reload, also when the URL holds filters.
- **Phone filter panel: accessibility.** The button `필터 (Filters)` has `aria-expanded={filtersOpen}` and `aria-controls="product-filter-panel"`; the panel has that id and gets the class `is-open`. CSS decides who sees what: above 768 px the button is hidden and the panel is always shown; at 768 px and below the panel shows only with `is-open`.
- **Phone filter panel: the count.** The number on the button is not state. It is counted from the URL state: how many of `categoryId`, `subCategoryId`, `childCategoryId` and `productType` are set. So a shared link with filters shows the right number while the panel is closed. With a number, the accessible name is `필터 N개 적용 중 (Filters, N in use)`. The search term is not counted, because the search box is always visible.
- **Underline fields.** The class `field-underline` on the search form and on the product form. `globals.scss` turns every text input and dropdown inside it into a line-only field (mixin `underline-field`); a textarea stays boxed. Focus = the line takes the brand colour and a 1 px shadow under it makes it 2 px, so the height does not change. Invalid = danger line + message. Read-only = dashed line.
- **Disabled buttons.** One rule in `globals.scss`: `:disabled:not(.p-button-text):not(.p-button-link)` → grey fill, border of the same colour, white label. The `:not()` parts raise the specificity above the outlined and danger rules, so a disabled `삭제 (Delete)` no longer keeps its red border.
