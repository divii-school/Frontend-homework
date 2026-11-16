# HW3 — design and API questions (Sachin)

Things the design or the API does not answer, what the build does meanwhile, and what I need decided.
The HW3 page asks to list these as questions; they are not design bugs.

## Design questions (for Bhagyashree)

| # | Question | What the build does now |
|---|---|---|
| Q1 | **Figma access.** The Talking Club file opens only for signed-in members and I could not open the Login and Shopping Management frames while building. Can I get view access, or PNG exports of the 1440 / 768 / 375 frames? | Colours, type sizes and spacing were read from the live Talking Club QA admin, which is built from the same design: primary `#ef325b`, table header `#fff1f3`, title 24px bold, body 14px, 4px button radius, 230px menu, login card 500px with underlined inputs and 자동 로그인. **The build has not been compared with the Figma frames yet.** |
| Q2 | Dark mode is not in the design. Which night colours should be used? | One night colour for every day colour, with the same token name (WM Light/Dark Mode Color System). The palette is in `src/styles/_variables.scss`. Every pair I chose is 4.5:1 or better. |
| Q3 | HW3 asks for a details page with tabs and a multi-step create/edit form. The live admin has one long form and no details tabs. Is there a frame for them? | Tabs: 기본 정보 / 카테고리 / 같은 카테고리 상품. Steps: 기본 정보 → 가격·수량 → 카테고리 → 이미지·노출. |
| Q4 | Are the loading, empty, error, 403 and 404 states designed? | One shared block (icon, title, description, action) on every screen. |
| Q5 | Money and dates. The live admin shows `₩1,500` and `2026-11-13 11:09 AM`. WM says `1,500원` and `2026년 11월 13일 오전 11:09`. Which should the screen follow? | The WM formats (the training page says WM wins). |
| Q6 | Font. The live admin uses Pretendard. Is there a licensed web font file to ship? | The font stack starts with Pretendard and falls back to the system Korean font. No font file is shipped. |
| Q7 | The live description field is a rich-text editor. Is rich text required for HW3? | Plain multi-line text. |
| Q8 | Below 991px, is the menu a drawer or hidden? | A drawer opened by the menu button and closed by the overlay or a menu click. |
| Q9 | **Contrast of the brand pink.** White text on `#ef325b` is 3.98:1, and `#ef325b` text on white is 3.98:1 (3.62:1 on the pink tint of the active menu). WCAG AA asks 4.5:1 for text of this size. Keep the brand colour, or use a darker pink for text and buttons? | The brand colour is used as designed. In dark mode the text on the (lighter) pink is dark, which gives 5.7:1. |
| Q10 | The live login has no visible field labels (placeholders only) and its button is disabled until both fields are filled. | Labels exist for screen readers but are not drawn. The button stays enabled so that an empty submit can show "아이디를 입력해 주세요." under the field. |
| Q11 | The live product list shows 노출여부 as a 예 / 아니오 dropdown in each row. | A switch in each row (one click, same API call). |
| Q12 | Some labels of the live admin differ between screens or from standard spelling: 판매금액 (list) and 판매가 (form, details); 노출여부 (list) and 노출상태 (form, details); 총 게시물 above a product list; 아니오 (standard: 아니요); 썸네일 (standard: 섬네일); 파일추가, 상품코드, 상세설명 without a space. Keep them, or use one word per field and the standard spelling? | Kept exactly as in the live admin, so the screens match the design. |
| Q13 | WM \| Error Message List has no wording yet (only a table header). Every Korean error and validation sentence in the app is mine (`src/constants/messages.ts`, `src/utils/product-rules.ts`). Can you confirm them or give the wording? | Short sentences in the polite style of the live admin, for example "상품명을 입력해 주세요." |

## API questions (for the backend owner)

Observed on the QA API on 15–16 Nov 2026.

| # | Observation | Effect on the build |
|---|---|---|
| A1 | `GET /products` has no sort parameter; extra query parameters are ignored. | Sort is kept in the URL and applied to the rows of the current page only, not across pages. |
| A2 | `GET /product-category/list` returns the whole tree with no sort or paging parameter; only `search` works on the server. | 대분류 rows are sorted and paged in the browser. |
| A3 | `GET /auth/logout` ends **every** session of the account, not only the caller's. All HW3 developers share one account. | Pressing logout signs everyone out. My tests never send the real call. |
| A4 | Deleting a category that has ever held a product answers **500 "Something went wrong"**, even after the product is deleted. | The app shows its sentence for a server error ("서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."). Two of my test categories stay on the server: `HW3-Sachin-Fixture-Sub` (id 577, kept on purpose for tests) and `HW3-Sachin-Unremovable-Sub` (id 578). |
| A5 | A missing product or category answers HTTP 400 with `productNotFound` / `categoryNotFound`, not 404. | Mapped to the not-found state by message key. |
| A6 | The refresh-token cookie is set for the API's own domain, and cross-site calls cannot carry cookies. A frontend on another domain (Vercel) cannot use `GET /auth/get-access-token`. | On 401 the app goes to login and returns to the same page. |
| A7 | **The image storage accepts browser uploads only from a fixed list of sites.** `localhost:3000` is allowed; another port or a Vercel address gets 403 on the upload's preflight. | The browser sends the image to the app's own route (`/api/upload`), which asks the API for the signed address and stores the file from the server. Vercel accepts request bodies up to 4.5 MB, so the limit per image is 4 MB. |
| A8 | `erpCode` is described as "auto-assigned by the server; ignored if sent", but the live admin has an ERP code field with a duplicate check. | No ERP code field in the form; the value is shown on the details page. |
| A9 | No length limit is given for any text field, and `price` is accepted independently of `quantity × unitPrice`. | The frontend rules are exactly the API's: required, number (0 allowed), at least one image. A new product's 판매가 is 수량 × 단가, as in the live admin. When editing, the saved 판매가 is kept until 수량 or 단가 is changed: many saved products have a price that is not 수량 × 단가, and 수량 0. |
| A10 | The login answer for the QA admin has `permissions: []`, and only SUPER_ADMIN exists. What does the array look like for a limited admin? | Both shapes are accepted: plain keys (`"product_management"`) and `{module, subModules}`. Limited roles are tested by simulating the stored user. |
| A11 | Nothing defines which roles may delete. | Assumed: delete only for SUPER_ADMIN and ADMIN; other roles with the page permission can create and edit. It is one line in `config/navigation.ts`. |
| A12 | The category list answers `isCreatable: false`, and the live admin shows no button to add a 대분류. | Read as "no more 대분류 may be added": the 대분류 등록 button is drawn only when the flag is true. |
| A13 | `GET /product-category/list` without a search returns 3 대분류 while `totalRecords` is 12 and the product form's category list has 12. | The category screen shows what the list endpoint returns; searching a name finds the others. |
| A14 | The live admin can reorder categories by dragging (`reorder-categories` and two more endpoints). | Not built: reordering changes the order of records that other people own on the shared server, and HW3 does not ask for it. |
| A15 | One category name arrives HTML-encoded: `Intro A/B/C/D &amp; Jump Up &amp; Fly High`. | Shown as it arrives, as the live admin does. Decoding it here would hide a data problem that belongs to the API. |
