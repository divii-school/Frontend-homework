# HW3 — design and API questions (Sachin)

Things the design or the API does not answer, what I did meanwhile, and what I need decided.
"Not a design bug": the HW3 page asks to list these as questions.

## Design questions (for Bhagyashree)

| # | Question | What the build does now |
|---|---|---|
| Q1 | **Figma access.** The Talking Club file opens only for signed-in members, and I could not open the Shopping Management and Login frames while building. Can I get view access, or PNG exports of the 1440 / 768 / 375 frames? | Colours, type sizes and spacing were read from the live Talking Club QA admin (same design): primary `#ef325b`, table header `#fff1f3`, title 24px bold, body 14px, 4px button radius, 230px menu. **The build has not been compared with the Figma frames yet.** |
| Q2 | Dark mode is not in the design. Which night colours should be used? | One night colour per day colour, same token name (WM Light/Dark Mode Color System). Palette in `src/styles/_variables.scss`. |
| Q3 | Product details with tabs, and a multi-step create/edit form, are asked by HW3 but the live admin has a single long form and no details tabs. Is there a frame for them? | Tabs: 기본 정보 / 카테고리 / 같은 카테고리 상품. Steps: 기본 정보 → 가격·수량 → 카테고리 → 이미지·노출. |
| Q4 | Loading, empty, error, 403 and 404 states: are they designed? | One shared block (icon, title, description, action) used on every screen. |
| Q5 | Money and dates. The live admin shows `₩1,500` and `2026-11-13 11:09 AM`. WM says `1,500원` and `2026년 11월 13일 오전 11:09`. Which one should the screen follow? | WM formats (the training page says WM wins). |
| Q6 | Font. The live admin uses Pretendard. Is there a licensed web font file to ship? | Font stack starts with Pretendard and falls back to the system Korean font; no font file is shipped. |
| Q7 | The live description field is a rich-text editor. Is rich text required for HW3? | Plain multi-line text. |
| Q8 | Below 991px the menu: drawer, or hidden? | Drawer opened by the menu button, closed by the overlay or a menu click. |

## API questions (for the backend owner)

| # | Observation (QA API, 15 Nov) | Effect on the build |
|---|---|---|
| A1 | `GET /products` has no sort parameter (extra query parameters are ignored). | Sort is in the URL and applied to the rows of the current page only, not across pages. |
| A2 | `GET /product-category/list` returns the whole tree with no sort or paging parameter; only `search` works on the server. | 대분류 rows are sorted and paged in the browser. |
| A3 | `GET /auth/logout` ends **every** session of the account, not only the caller's. All HW3 developers share one account. | Pressing logout signs everyone out. Tests never send the real call. |
| A4 | Deleting a category that has ever held a product answers **500 "Something went wrong"**, even after the product is deleted. | The app shows the API's message. Two of my test categories cannot be removed: `HW3-Sachin-Unremovable-Sub` (id 578) and `HW3-Sachin-Fixture-Sub` (id 577, kept on purpose for tests). |
| A5 | A missing product or category answers HTTP 400 with `productNotFound` / `categoryNotFound`, not 404. | Mapped to the not-found state by message key. |
| A6 | The refresh-token cookie is set for the API own domain, and cross-site calls cannot carry cookies. A frontend on another domain (Vercel) cannot use `GET /auth/get-access-token`. | On 401 the app goes to login and returns to the same page. |
| A7 | `erpCode` is described as "auto-assigned by the server; ignored if sent", but the live admin has an ERP code field with a duplicate check. | No ERP code field in the form; the value is shown on the details page. |
| A8 | No length limits are given for any text field, and `price` is accepted independently of `quantity × unitPrice`. | Frontend rules are exactly the API's: required, number, at least one image. 판매가 is calculated as 수량 × 단가, as in the live admin. |
| A9 | The login answer for the QA admin has `permissions: []` and only SUPER_ADMIN exists. What does the array look like for a limited admin? | Both shapes are accepted: plain keys (`"product_management"`) and `{module, subModules}`. Limited roles are tested by simulating the stored user. |
| A10 | Delete permission by role is not defined anywhere. | Assumed: delete only for SUPER_ADMIN and ADMIN; other roles with the page permission can create and edit. One line in `config/navigation.ts`. |
| A11 | `GET /product-category/list` without search returns 3 대분류, while `totalRecords` is 12 and the product form's category list has 12. | The category screen shows what the list endpoint returns; searching a name finds the others. |
