# HW3 — Design check and questions for the designer

Figma file: Talking-club (`4wQgaju5jbb5BNRCeNmGZ0`) · screens 1.1.0 Login, 8.1.0 – 8.1.3 Product Management, 8.2.0 Product Category Management.
Checked against the WM design checklist (training page Step 2 Part A). Per the TL page: anything the design doesn't show is listed here and built with the same tokens; it is not reported as a design bug.

## Checklist

| # | Check | Result |
|---|---|---|
| 1 | Page width same as other pages | ✅ All admin frames are 1886 px with the same 230 px sidebar and 1213 px content header |
| 2 | Same element spaced the same way on every page | ⚠️ Page title → search row gap differs (8.1.0 ≈ 56 px, 8.2.0 ≈ 70 px). Built with one spacing token (`$space-*`) on both screens |
| 3 | Repeated parts look the same | ⚠️ Category screen uses a grey search box with the icon on the left. Product list (8.1.0) and form (8.1.1) use underline inputs in Figma. The build uses boxed inputs on the list and form to match the new filter dropdowns, which are not in Figma. Question: OK to keep boxed, or should they be underline as in 8.1.0 / 8.1.1? |
| 4 | One font, clear sizes | ✅ One sans-serif family; title 24/700, body 14, table 14/600 header |
| 5 | Long text wrapping on small screens | ❓ No tablet/mobile frames (see Q1) |
| 6 | Empty / loading / no-image states | ⚠️ Only "No search results found" text and the grey thumbnail placeholder are described. Loading + error states not designed (Q3) |
| 7 | Button width from padding | ✅ Register / Delete / Expand all are padding-based |
| 8 | Images fit their box | ✅ Thumbnails 64×78 with placeholder |

## Questions

1. **Responsive frames** — the TL page asks for 1440 / 768 / 375. The shopping frames are desktop only. Built: sidebar → overlay drawer at ≤ 991 px; product table scrolls inside its own box at ≤ 1024 px and becomes cards at ≤ 768 px; forms become one column at < 768 px. Please confirm or share tablet/mobile frames.
2. **Dark mode** — not in Figma. Built from the light tokens with one dark value per token (WM Light/Dark Mode Color System). Please confirm the dark brand pink and the table-header dark colour.
3. **Loading / error states** — not designed. Built: table skeleton rows, inline error box with "Try again", toast for save errors.
4. **Product details page** — the module has no details screen (8.1.0 says a product-name click opens *edit*). The TL page asks for a details page with tabs, so the list's name opens **details** (tabs: Overview / Options / Same-category products) and details has an **Edit** button. OK?
5. **Multi-step form** — 8.1.1 / 8.1.2 are one long page. The TL page asks for a multi-step form, so the same fields are split into 4 steps: ① Basic info ② Images & status ③ Category & options ④ ERP & review. OK?
6. **Sort** — 8.1.0 has no sort control, and the QA API (`release/qa`) always returns newest first (`id DESC`) with no sort parameter. Sort is offered on the table header and kept in the URL, but it can only sort the current page. Backend question raised: add `sortField/sortOrder` to `GET /products`.
7. **Category list paging / sort** — 8.2.0 is a tree; the API returns the whole tree (no paging). Search is server-side; order is changed by drag-and-drop (saved through the reorder API). Paging is not applicable.
8. **Register top-level category** — the API refuses a 4th top-level category (`isCreatable=false`, "maximumCategoryLimitReached"). The "Register main category" button is disabled and the reason is shown as visible text under it (not a tooltip). Is the limit of 3 still intended?
9. **Category codes** — 8.2.0 shows `[Code] Name` and says "duplicate codes are not allowed", but the API has no code field (only `id` and `name`). The tree shows `[id] Name`; duplicate *names* are refused by the API.
10. **Login "Auto login"** — the design says "auto-login next time from the same IP". The front end can't see the IP; built as "keep me signed in" (session kept in localStorage when ticked, sessionStorage when not).
11. **Login language** — login frames are Korean, shopping frames English. The app UI is English; the two Korean alerts are shown in English with the same meaning.
12. **Exposure status inline dropdown** — 8.1.0 #10 changes visibility inline with a toast. The API `update-status` changes visibility only; **sale status** has no inline control in the design, so it is only editable in the form.
13. **Primary colour contrast** — the design pink-red `#EE2E5D` is 4.05:1 on white (below WCAG AA 4.5:1 for button / menu text). Buttons, links and the active menu use `#D41F4E` (5.1:1); `#EE2E5D` stays for the logo and decorative accents. OK, or keep `#EE2E5D` for buttons?
14. **Menus outside HW3** (Dashboard, User Management, Order Delivery …) are shown greyed and not clickable, so the sidebar matches the design without pretending those pages exist.
15. **"Go to Talking Club home"** (no-permission popup 17108:76615) — the target URL is not in the design. Uses `NEXT_PUBLIC_TC_HOME_URL` when set, otherwise the button closes the popup. Which URL?
16. **Login errors** — the design shows an inline message under the field (states artboard) *and* a system alert with [OK] (description). Both are shown; [OK] returns focus to the wrong field. "Auto login" starts ticked because every design state shows it ticked.
17. **Main-category row actions** — 8.2.0 shows no edit/delete/add on the level-1 rows ([67] Main, [74] Main). The TL page asks for full create/edit/delete, so level-1 rows also have "+ Subcategory", edit and delete. OK?
18. **Reorder during search** — while a search is active only some siblings are visible, and the reorder API renumbers whatever ids it receives, so drag-and-drop / Alt+↑↓ is turned off during a search (a note says why).
19. **Reorder on phones** — native drag-and-drop is unreliable on touch screens; the keyboard alternative (Alt+↑/↓) is desktop-only. Should phones get visible "Move up / Move down" buttons?
