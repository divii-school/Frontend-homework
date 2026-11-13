# RP | HW3 Pranesh — design and API questions

Things the HW3 brief asks for that the Figma design or the QA API does not show or allow.
Each item says what I found, how I checked it, and what I built in the meantime.
None of them blocks the build; each needs an answer from design (Bhagyashree) or the API owner.

## Design (Figma `4wQgaju5jbb5BNRCeNmGZ0`, page "1. DEV ( Admin_v0.4_Eng )")

| # | Question | What I found | What I built meanwhile |
|---|---|---|---|
| D1 | Are there 768 / 375 frames for the admin? | The brief says the design includes responsive frames. I searched every admin section on the page and found 1440 frames only. | 768: side menu becomes a ☰ drawer; tables scroll inside their box. 375: one column, full-width buttons. No page-level horizontal scroll at any size. |
| D2 | Is there a design for the product details page with tabs? | No details screen exists (8.1.0 list, 8.1.1 register, 8.1.2 edit, 8.1.3 option, 8.2.0 category only). | Built from the edit screen's fields and spacing: tabs 기본 정보 · 이미지 · ERP 정보 · 같은 카테고리 상품. |
| D3 | English or Korean UI? | The HW3 link opens the English section (5498:98250); a Korean twin exists (5498:83920). Kakali said English is "for reference". | Korean UI from the Korean frames; behaviour checked against both. |
| D4 | Is there a dark-mode design? | No dark frames. | Every colour is a token in `_theme.scss` with a light and a dark value (WM Light/Dark). |
| D5 | Brand pink `#EF325B` with white text is 3.98:1 (WCAG AA needs 4.5:1). | Measured with axe; buttons failed the contrast rule. | Buttons use `#D9264F` (4.84:1). Logo and accents keep `#EF325B`. Please confirm or give a darker brand shade. |
| D6 | Breadcrumb on 8.1.x reads "공지사항 관리". | Looks copied from the notice screens. | Breadcrumb reads 쇼핑몰 관리 › 상품 관리. |
| D7 | Price and date format on 8.1.0. | The design shows `₩9,900` and `2024/05/07 13:20`; WM format is `9,900원` and `2024년 5월 7일`. | List and details follow the design annotation (₩ and YYYY/MM/DD HH:MM); both formats live in `src/lib/format.ts`, so switching is one change. Which one wins? |
| D8 | 8.1.1 says "판매가 ≤ 정가". | The API rule is stricter: 단가 must be **less than** 판매가 (`unitPriceMustBeLessThanPrice`, equal is refused). | The form checks the API rule before sending, so the user sees it on step 1. |
| D9 | 8.1.3 options. | The option section has no API (`isOptions` is always `no` in the API body). | Not built; noted as out of scope. |
| D10 | Image size "800×800 recommended". | Is a different size allowed? | Allowed, with a note under the uploader. Type (JPG/PNG/WEBP), size (4 MB) and count (4) are refused. |
| D11 | States not drawn: loading, empty, error per screen and per tab, 403, 404. | Only the login error states and "검색 결과가 없습니다" are drawn. | Built with one shared StateBlock in the same spacing and type scale. |

## API (QA server `tkclub-admn-api-qa.dvconsulting.org`)

| # | Question | How I checked | What I built meanwhile |
|---|---|---|---|
| A1 | No sort parameter on `GET /products`. | Sent `sort`, `sortBy`, `order` with several values; the order of results never changed. | No sort UI (a client-side sort of one page would be wrong for a paged list). Brief asks for server-side sort → needs the API. |
| A2 | `GET /product-category/list` without `search` returns 3 of the 12 대분류, and has no paging or sort. | Compared with `/products/categories` (12 rows). | Tree read level by level (`/products/categories` → `/subcategories/{id}` → `/childcategories/{id}`); search still uses `/product-category/list?search=`. |
| A3 | 대분류 are capped. | `isCreatable: false`; add returns `maximumCategoryLimitReached`. | 대분류 등록 disabled with the reason shown. |
| A4 | Logout ends every session of the account. | Logged out in one browser; the other browser's next call got 401. Everyone shares one QA admin account. | The app sends the user to login and back to the same page. Playwright mocks the logout call so tests don't sign others out. |
| A5 | Allowed values of `PUT /products/update-status/{id}/{status}`. | Not in the docs. `yes` sets 노출 on; any other value sets it off. | Sends `yes` / `no`. |
| A6 | Unknown product returns **400** `productNotFound`, not 404. | `GET /products/details/99999999`. | Mapped to the 404 view. |
| A7 | Category names come back HTML-escaped (`&amp;`). | Names with `&` in the list response arrive as `&amp;`. | Decoded for display only. |
| A8 | Image bucket CORS allows only `http://localhost:3000`. | Browser PUT from another origin is blocked. | Upload goes through our `/api/upload` route (server-side PUT), so it works on Vercel too. Vercel limits a request to 4.5 MB → max file 4 MB. |
| A9 | Only a SUPER_ADMIN test account exists. | The shared QA account has `role: SUPER_ADMIN`, `permissions: []`. | Limited roles proven by unit tests and Playwright with a mocked login (`roles.spec.ts`). A real limited account would let QA check it live. |
| A10 | The API's CORS is `*` without credentials, so a browser cannot send its refresh cookie. | Checked the preflight headers. | Our `/api/auth/*` routes keep the refresh token in an httpOnly cookie on our own domain. |
