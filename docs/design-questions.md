# HW3 — Design check and questions for the designer

Figma file: Talking-club (`4wQgaju5jbb5BNRCeNmGZ0`) · screens 1.1.0 Login, 8.1.0 – 8.1.3 Product Management, 8.2.0 Product Category Management.
Labels of the UI are written as Korean text followed by the English meaning in brackets (the whole UI is Korean now; word list: `docs/ko-glossary.md`). The Korean Figma frames are the truth for wording (page "1. DEV ( Admin_v0.4_Eng )", section "8. 쇼핑몰 관리"). Checked against the WM design checklist (training page Step 2 Part A). Per the TL page: anything the design doesn't show is listed here and built with the same tokens; it is not reported as a design bug.

## Checklist

| # | Check | Result |
|---|---|---|
| 1 | Page width same as other pages | ✅ All admin frames are 1886 px with the same 230 px sidebar and 1213 px content header |
| 2 | Same element spaced the same way on every page | ⚠️ Page title → search row gap differs (8.1.0 ≈ 56 px, 8.2.0 ≈ 70 px). Built with one spacing token (`$space-*`) on both screens |
| 3 | Repeated parts look the same | ✅ ANSWERED (design review, 18 Nov): underline. Category screen uses a grey search box with the icon on the left. Product list (8.1.0) and form (8.1.1) use underline inputs in Figma. The build had boxed inputs there. Since commit `792ef82` the search type and the search input of 8.1.0, and the text inputs and dropdowns of the form (8.1.1 / 8.1.2), are underline-only; the textarea stays boxed, as drawn. Still boxed on purpose (not in the frames the designer named): the search of the 8.1.3 option picker and the input of the category add / edit dialog |
| 4 | One font, clear sizes | ✅ One family: Pretendard, the font of the Figma text nodes (self-hosted since the design review of 18 Nov); title 24/700, body 14, table header 14 bold. Field text is 14 px (Figma 16 px) and the −0.6 px letter-spacing of the frames is not applied |
| 5 | Long text wrapping on small screens | ❓ No tablet/mobile frames (see Q1) |
| 6 | Empty / loading / no-image states | ⚠️ Only the text `검색 결과가 없습니다 (No search results found)` and the grey thumbnail placeholder are described. Loading + error states not designed (Q3) |
| 7 | Button width from padding | ✅ Register / Delete / Expand all are padding-based |
| 8 | Images fit their box | ✅ Thumbnails 64×78 with placeholder |

## Questions

Questions 25 and 26 were added after the QA round of 18 Nov. Question 27 was added after the design review of 18 Nov.

**Answers from the design review of 18 Nov** (designer Bhagyashree, result "Resubmit"; she reviewed the Vercel build at 1440 / 768 / 375 px, light and dark, against the Korean frames 1.1.0, 8.1.0, 8.1.1 and 8.2.0). All are done in commit `792ef82`:

- Question 26 (the wordmark) → use the TalkingClub logo image of the Figma frames. See question 26.
- Question 13 (primary colour) → use the Figma colour styles as they are. See question 13 and the new question 27.
- Checklist row 3 (boxed or underline fields) → underline, where the frames draw it.
- The three small visual items that QA saw:
  - the rows-per-page select height → 40 px, the same as the buttons next to it;
  - the red border of the disabled `삭제 (Delete)` button → disabled buttons are muted: grey fill, border of the same colour, white label, in light and dark;
  - the indent of `필터 초기화 (Reset filters)` → it lines up with the fields at ≤ 1024 px.
- Question 1 (responsive) → two changes were asked and done: at ≤ 768 px the list filters sit behind a `필터 (Filters)` button, and at ≤ 640 px every category row is one line.

1. **Responsive frames** — the TL page asks for 1440 / 768 / 375. The shopping frames are desktop only. Built: sidebar → overlay drawer at ≤ 991 px; product table scrolls inside its own box at ≤ 1024 px and becomes cards at ≤ 768 px; forms become one column at < 768 px. Please confirm or share tablet/mobile frames. Design review of 18 Nov: the designer reviewed 768 and 375 px ("responsive (cards at ≤768, no sideways scroll) … very good"). Since then, at ≤ 768 px the four list filters and `필터 초기화 (Reset filters)` sit behind a `필터 (Filters)` button (the search row stays visible), and at ≤ 640 px every category row is one line. There are still no tablet / phone frames.
2. **Dark mode** — not in Figma. Built from the light tokens with one dark value per token (WM Light/Dark Mode Color System). Please confirm the dark brand pink and the table-header dark colour. Design review of 18 Nov: the dark palette was kept (the designer wrote that dark mode is "very good"); only the focus ring (now the brand colour, `#ff5c85` in dark mode) and the background of the active sub-menu row changed.
3. **Loading / error states** — not designed. Built: table skeleton rows, inline error box with "Try again", toast for save errors.
4. **Product details page** — the module has no details screen (8.1.0 says a product-name click opens *edit*). The TL page asks for a details page with tabs, so the list's name opens **details** (tabs: `상품 정보 (Overview)` / `옵션 (Options)` / `동일 카테고리 상품 (Same-category products)`) and details has an **`수정 (Edit)`** button. OK?
5. **Multi-step form** — 8.1.1 / 8.1.2 are one long page. The TL page asks for a multi-step form, so the same fields are split into 4 steps: ① `기본 정보 (Basic info)` ② `이미지 및 상태 (Images & status)` ③ `카테고리 및 옵션 (Category & options)` ④ `ERP 정보 및 확인 (ERP & review)`. OK?
6. **Sort** — 8.1.0 has no sort control, and the QA API (`release/qa`) always returns newest first (`id DESC`) with no sort parameter. Sort is offered on the table header and kept in the URL, but it can only sort the current page. Backend question raised: add `sortField/sortOrder` to `GET /products`.
7. **Category list paging / sort** — 8.2.0 is a tree; the API returns the whole tree (no paging). Search is server-side; order is changed by drag-and-drop (saved through the reorder API). Paging is not applicable.
8. **Register top-level category** — the API refuses a 4th top-level category (`isCreatable=false`, "maximumCategoryLimitReached"). The `대분류 등록 (Register main category)` button is disabled and the reason is shown as visible text under it (not a tooltip). Is the limit of 3 still intended?
9. **Category codes** — 8.2.0 shows `[Code] Name` and says "duplicate codes are not allowed", but the API has no code field (only `id` and `name`). The tree shows `[id] Name`; duplicate *names* are refused by the API.
10. **Login "Auto login"** — the design says "auto-login next time from the same IP". The front end can't see the IP; built as "keep me signed in" (session kept in localStorage when ticked, sessionStorage when not).
11. **Login language — ANSWERED (17 Nov).** Earlier the login frames were Korean and the shopping frames English, and the app UI was English. The reviewer decided that the **whole UI is Korean**. All text now follows the Korean Figma frames (`docs/ko-glossary.md`, 562 strings).
12. **Exposure status inline dropdown** — 8.1.0 #10 changes visibility inline with a toast. The API `update-status` changes visibility only; **sale status** has no inline control in the design, so it is only editable in the form.
13. **Primary colour contrast — ANSWERED (18 Nov, design review): use the Figma style.** Earlier text of the question: the design pink-red `#EE2E5D` is 4.05:1 on white (below WCAG AA 4.5:1 for button / menu text); buttons, links and the active menu use `#D41F4E` (5.1:1); OK, or keep `#EE2E5D` for buttons? Answer: the designer asked for the Figma colour styles as they are. Since commit `792ef82` buttons, links and the active menu use the Figma brand style "Talking Club", `#ef325b` (3.98:1 with white). The darker `#D41F4E` is gone. The contrast question is asked again, for all tokens that are below AA, as question 27.
14. **Menus outside HW3** (Dashboard, User Management, Order Delivery …) are shown greyed and not clickable, so the sidebar matches the design without pretending those pages exist.
15. **`토킹클럽 홈으로 (Go to Talking Club home)`** (no-permission popup 17108:76615) — the target URL is not in the design. Uses `NEXT_PUBLIC_TC_HOME_URL` when set, otherwise the button closes the popup. Which URL?
16. **Login errors** — the design shows an inline message under the field (states artboard) *and* a system alert with `확인 (OK)` (description). Both are shown; `확인 (OK)` returns focus to the wrong field. "Auto login" starts ticked because every design state shows it ticked.
17. **Main-category row actions** — 8.2.0 shows no edit/delete/add on the level-1 rows ([67] Main, [74] Main). The TL page asks for full create/edit/delete, so level-1 rows also have `+ 중분류 (+ Subcategory)`, edit and delete. OK?
18. **Reorder during search** — while a search is active only some siblings are visible, and the reorder API renumbers whatever ids it receives, so drag-and-drop / Alt+↑↓ is turned off during a search (a note says why).
19. **Reorder on phones** — native drag-and-drop is unreliable on touch screens; the keyboard alternative (Alt+↑/↓) is desktop-only. Should phones get visible "Move up / Move down" buttons?
20. **Selling-price and category wording on the edit screen** — the edit frame (8.1.2) calls the price `할인가격` ("discount price") and the category label `카테고리`. The registration frame (8.1.1) says `판매가` ("selling price") and `등록 카테고리` ("registration category"). The app has one shared form, so it uses the registration wording on both screens. Question: is that OK, or should the edit screen show the edit-frame words? (If yes, the label in `StepBasicInfo.tsx` has to depend on the mode.)
21. **Tax field label `비과세`** — the frame label is `비과세` ("tax-exempt"), with the values `과세` (taxable) and `비과세` (tax-exempt). The app follows the frame, but on the details page it reads oddly: "비과세: 과세" for a taxable product. A neutral label such as `과세 구분` ("tax type") would read better, but it is in no frame. Which word do you want?
22. **Money format** — the frames use three formats: `₩ 4,000` (a space after the sign), `₩0` / `₩12,000` (no space) and `23,000원` (the word 원 after the number). The frame description only says "currency sign, thousands comma". The app shows `₩4,000` everywhere. Which format is the rule?
23. **Product type filter** — no frame has this filter. The app uses the label `상품 유형` ("product type") with the values `메인 상품` ("main product", has options) and `단권 상품` ("single-item product", has no options). The words `주교재 / 부교재` were not used, because the frames use them as category names. Another possible pair is `세트 상품 / 단권 상품`. Which words do you want?
24. **First breadcrumb item** — in all Korean frames the first item is `공지사항 관리` ("Notice Management"). It is a left-over from the notice screens (an older, covered layer in frames 8.1.0 and 8.2.0 says `쇼핑몰 관리`). The app uses `쇼핑몰 관리` ("Shopping Mall Management"), the real sidebar group. The frames also have two breadcrumb levels, while the app has three on register, edit and details (`쇼핑몰 관리 / 상품 관리 / 상품 등록`). OK?

Added after the QA round of 18 Nov:

25. **Which price is `단가 (Unit price)` and which is `판매가 (Selling price)`?** The description of frame 8.1.2 says "판매가 ≤ 정가". So the frame reads `단가 (Unit price)` as a list price that is higher than `판매가 (Selling price)`. The API says the opposite. The shopping cart and the order charge the product field `price` (backend `release/qa`: `sellingPrice: product.price`). The API refuses a product unless `unitPrice < price` (`unitPriceMustBeLessThanPrice`). The app follows the API since 18 Nov: `판매가 (Selling price)` and the list column `판매금액 (Selling price)` show `price`; `단가 (Unit price)` shows `unitPrice`; step 1 asks for `단가` first and then `판매가` (the order of frame 8.1.1) and says `단가는 판매가보다 낮아야 합니다. (The unit price must be lower than the selling price.)`. Please confirm. If the frame meaning is wanted, the backend has to change first; the app can then swap the two fields back. (Question 20 is about the word on the edit screen, `할인가격` "discount price"; it is still open.)
26. **The TalkingClub wordmark — ANSWERED (18 Nov, design review): use the Figma logo image.** Earlier text of the question: since the QA round the browser tab title is `… | 토킹클럽 관리자` (it was `… | TalkingClub Admin`), and the small text next to the logo was `관리자 (Admin)`; the wordmark "TalkingClub" stays in Latin letters, because the Figma logo shows it so; should the logo stay as it is, or is there a Korean logo? Answer (must-fix 1 of the design review): show the TalkingClub logo of the Figma frames (three-ring mark + wordmark) as one image, with no text next to it. Done in commit `792ef82`:
    - The logo is on the header, the login page, the 403 page, the 404 page, the error page and the no-permission popup. The text `관리자` next to it is removed. The word "TalkingClub" inside the logo image stays in Latin letters.
    - Where the file comes from: the Figma file has no vector logo, only a 158 × 30 px bitmap on a white background (the same file as `loginLogo.png` of the real admin project). The same artwork with a transparent background (512 × 107 px) was taken from the company's own web project (`talking-club-web-frontend/public/images/logo.png`) and saved as `public/brand/talkingclub-logo.png`. The source was confirmed by the developer on 18 Nov.
    - `src/components/BrandLogo.tsx` shows it as an inline SVG. The mark is drawn from the file. The wordmark is filled with the current text colour through a mask, so it stays readable in dark mode; in dark mode the mark is made a little brighter (`$logo-mark-dark-filter`). On phones (≤ 480 px) the topbar shows the mark alone.
    - Unchanged: the accessible name of the header link `토킹클럽 홈 (Talking Club home)`, the hidden heading of the login page `토킹클럽 관리자 로그인 (Talking Club admin login)`, and the tab titles `… | 토킹클럽 관리자`. The accessible name of the image is `TalkingClub`. The favicon is now the mark (`src/app/icon.png`).

Added after the design review of 18 Nov:

27. **Some Figma tokens are below WCAG AA. Keep them?** The design review asked for the Figma colour styles, so the app uses them as they are since commit `792ef82`. Before that round the app used darker values that passed AA. WCAG AA asks for 4.5:1 for text and 3:1 for non-text parts. Measured:
    - primary `#ef325b` (Talking Club) with white: 3.98:1 — the labels of primary buttons, the current page in the pager, links, the active menu;
    - Danger 100 `#e66565` on white: 3.27:1 — the error text under a field, the label of the enabled `삭제 (Delete)`;
    - placeholder Gray 90 `#afafaf` on white: 2.19:1;
    - grey row icons `#99a1af` on white: 2.60:1;
    - Gray 80 underline / outline `#d9d9d9` on white: 1.41:1 (non-text).

    Question: should these tokens stay as they are in Figma, or should the app use darker values for text and for the field lines? (Designer: Bhagyashree.)
