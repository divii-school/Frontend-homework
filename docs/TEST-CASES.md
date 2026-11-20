# Test cases — HW3 Talking Club Admin · Shopping Management (Sandip)

Format follows the WM QA Template (ID, type, precondition, steps, expected result), as in HW2.
Google Sheet version: `docs/TEST-CASES.csv` (same rows; File → Import in Google Sheets).

**Build:** `29e011f` on branch `hw3/sandip` · **URL:** https://hw3-sandip.vercel.app (or `npm run dev` → http://localhost:3003)
**Account:** QA admin login from the DM (role SUPER_ADMIN). **Data:** Talking Club **QA** server, shared by 5 people —
create / edit / delete only records named `HW3-Sandip-…` and delete them afterwards.
**Type:** **P** = positive (the happy path works) · **N** = negative (wrong input, wrong role, missing data, failure handled).
**Automation:** the Playwright test that covers the case (`tests/<file>` › test name), or "manual".

## 1. Login and session

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| LG-01 | P | Logged out | Open `/login` | Card with Talking Club logo + "Admin", ID and Password fields, Auto login (checked), Log in button disabled | login.spec › login button stays disabled… |
| LG-02 | N | `/login` | Type only an ID | Log in stays disabled until both fields are filled; spaces-only ID counts as empty | login.spec › login button stays disabled… |
| LG-03 | P | `/login` | Type a password → click the eye icon → click again | Password shown as text, then hidden again; button label switches Show / Hide password | login.spec › password visibility toggle |
| LG-04 | N | `/login` | Wrong ID or password → Log in | Red underline on both fields and "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요."; still on `/login`; typing again clears the message | login.spec › wrong ID/password… |
| LG-05 | P | Logged out | Open `/shopping/categories?search=abc` → log in with the DM account | Redirected to `/login?next=…`; after login back on `/shopping/categories?search=abc`; header shows the admin's name | auth-roles.spec › successful login… · login.spec › protected page redirects… |
| LG-06 | N | Account without an admin role | Log in | Popup "You don't have admin permission. Please contact customer service. 02-2014-8374"; stays logged out (server session ended too) | auth-roles.spec › an account without an admin role… |
| LG-07 | P | Logged in | Header → Log out icon | `/login`; protected pages ask for login again; the old token no longer works on the API | auth-roles.spec › logout calls the API… |
| LG-08 | N | Logged in, token revoked or expired (24 h) | Do anything that calls the API | Sent to `/login?next=<same page>&expired=1` with "로그인이 만료되었습니다. 다시 로그인해 주세요."; after login back on the same page | auth-roles.spec › a 401 from the API… · an expired token in storage… |
| LG-09 | P | Auto login checked / unchecked | Log in, close the browser, open the app again | Checked: still logged in (localStorage). Unchecked: logged out (sessionStorage) | manual |

## 2. Roles and menu

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| RO-01 | P | SUPER_ADMIN | Look at the sidebar | Shopping Mall Management → Product Management, Product Category Management | auth-roles.spec › GENERAL_ADMIN… (inverse) |
| RO-02 | N | GENERAL_ADMIN | Look at the sidebar; open `/shopping/categories` by URL | Category page not in the menu; URL shows the 403 page with "Go to my admin home" | auth-roles.spec › GENERAL_ADMIN: category page… |
| RO-03 | N | Logged out | Open `/` or any `/shopping/…` URL | Redirected to `/login?next=…` | smoke.spec · categories.spec › logged-out user… |

## 3. Product Category Management (8.2.0)

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| CA-01 | P | Logged in | Open `/shopping/categories` | 3-level tree, all open: `[code] name (N subcategories)`; main rows tinted; no count on rows without children | categories.spec › renders the 3-level tree… · products.real.spec › category tree… |
| CA-02 | P | CA-01 | Fold all → toggle one main row → Expand all | All collapse; only that row opens; all open again | categories.spec › Fold all / Expand all… |
| CA-03 | P | CA-01 | Type a name → Enter (or the magnifier) → reload | Server search; URL `?search=…`; reload keeps the term and the result | categories.spec › search goes to the server… |
| CA-04 | N | CA-01 | Search a term that matches nothing | "No search results found." | categories.spec › empty search result message |
| CA-05 | N | API down / 500 | Open the page | Error message + Try again; Try again reloads | categories.spec › server error… |
| CA-06 | P | CA-01 | Registration → name `HW3-Sandip-Main` → Add | Toast "“HW3-Sandip-Main” was added."; tree reloads with it | categories-crud.spec › register a main category… |
| CA-07 | N | Registration dialog | Leave the name empty / spaces only → Add | "Please enter a category name."; nothing sent | categories-crud.spec › register a main category… |
| CA-08 | P | Own main + sub category | "+ Subcategory" on a main row, then on a sub row | Dialog shows "Parent: [id] name"; sub sent with `categoryId`, child with `subCategoryId` | categories-crud.spec › add a subcategory and a child… |
| CA-09 | P | Own category | Pencil → change the name → Save | Save disabled until the name changes; saved with its parent id | categories-crud.spec › edit keeps the parent id… |
| CA-10 | N | Dialog open | API rejects the save | Korean message in the dialog (never the API's own text); typed name kept | categories-crud.spec › API error keeps the dialog… |
| CA-11 | N | Category with subcategories | Trash icon | "Can't delete this category — It still has N subcategories"; nothing deleted | categories-crud.spec › delete: blocked… |
| CA-12 | P | Own leaf category | Trash → Delete | Confirm dialog (focus on Cancel) → toast, row gone | categories-crud.spec › delete: … a leaf is deleted |
| CA-13 | N | Any dialog open | Press Escape | Dialog closes, nothing saved | categories-crud.spec › Escape closes the dialog… |

## 4. Product list (8.1.0)

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| PL-01 | P | Logged in | Open `/shopping/products` | 10 rows: checkbox, thumbnail (+ code), name, `₩4,000`, Major > Middle > Sub (or `-`), Yes/No, `YYYY-MM-DD h:mm AM` (KST); "Total Posts: N"; pages 1–10 | products.spec › renders 10 rows… · products.real.spec › product list… |
| PL-02 | P | PL-01 | Page 2 → reload → browser Back | URL `?page=2`; reload keeps page 2; Back returns to the previous page | products.spec › paging and search live in the URL… |
| PL-03 | P | PL-01 | Search by Product Name / Category Name → Enter | URL `?search=…&type=…`; results from the server; Back restores the previous search in the box | products.spec › paging and search… · products.real.spec |
| PL-04 | N | PL-01 | Search a term with no match | "No search results found." | products.spec › no results message |
| PL-05 | N | URL `?page=999` | Open it | Jumps to the last page | products.spec › a page past the end… |
| PL-06 | P | Own `HW3-Sandip-…` products | Select rows on page 1 and 2 → Delete → Delete | "N selected"; confirm dialog (focus on Cancel); `DELETE {ids:[…numbers]}`; toast; total drops | products.spec › select rows… · products.mutation.spec |
| PL-07 | N | 100 rows selected | Select one more | "You can select up to 100 products at once."; not added | manual |
| PL-08 | P | Own product | Exposure dropdown Yes ↔ No | Changes at once, toast "… is now shown / hidden"; survives reload | products.spec › exposure status changes… · products.mutation.spec |
| PL-09 | N | API fails | Change exposure | Korean error toast ("서버에 문제가 발생했습니다…"); dropdown goes back to the old value | products.spec › exposure status rolls back… |
| PL-10 | P | Any search | Export CSV | Downloads `products-YYYY-MM-DD.csv` with every matching row (all pages), Korean readable in Excel | products.spec › export downloads… |
| PL-11 | N | A name starting with `=` | Export CSV | Cell starts with `'` (no spreadsheet formula) | products.spec › CSV guards… |
| PL-12 | N | Category-name search returns deleted rows (API) | Search by category | Rows marked deleted by the API are not shown | products.spec › soft-deleted rows… |

## 5. Product register / edit form (8.1.1, 8.1.2)

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| PF-01 | P | Logged in | Register → step 1 | Product code generated (`PRD-…`, read-only); stepper shows 4 steps | product-form.spec › step 1 validates… |
| PF-02 | N | Step 1 | Next with empty fields | Errors under each field; stays on step 1 | product-form.spec › step 1 validates… |
| PF-03 | N | Step 1 | Type letters in a ₩ field | Letters dropped; commas allowed | product-form.spec › step 1 validates… |
| PF-04 | P | Steps 1–2 filled | Back → Next | Every value kept | product-form.spec › values are kept… |
| PF-05 | N | Step 3 | Next without categories | "Please select a major category." (etc.) | product-form.spec › full create… |
| PF-06 | P | Step 3 | Pick Major → Medium → Minor, then change Major | Medium and Minor reset | product-form.spec › full create… |
| PF-07 | P | All steps valid | Register | Request body as the API expects; toast "… was registered."; back on the list | product-form.spec › full create… · products.mutation.spec |
| PF-08 | N | Save fails (API error) | Register | Korean message for the API code (e.g. "이미 사용 중인 상품 코드입니다…") + "입력한 내용은 그대로 남아 있습니다."; raw key never shown; every step still filled (images too) | product-form.spec › a failed save keeps… |
| PF-09 | P | Own product | Edit | Form filled from the details; product code read-only; PUT without productCode; image keys (not URLs) sent | product-form.spec › edit loads the product… · products.mutation.spec |
| PF-10 | P | Any | Step 4 ERP code | Read-only ("Assigned automatically after registration" / the assigned code); never sent | product-form.spec › ERP code is server-assigned… |
| PF-11 | N | Typed values | Cancel → No / Yes | No keeps the form; Yes goes to the list | product-form.spec › cancel asks first… |
| PF-12 | N | `/shopping/products/404404/edit` | Open | "상품을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다." | product-form.spec › unknown product… |

## 6. Images (form step 2)

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| IM-01 | P | Step 2 | Add File → a PNG/JPG/WebP ≤ 3 MB | Uploads; preview shown; first image marked "Thumbnail" | product-form.spec › images… · products.mutation.spec (real upload) |
| IM-02 | N | Step 2 | Add a .txt file | "“notes.txt” is not a JPG, PNG or WebP image."; nothing uploaded | product-form.spec › images… |
| IM-03 | N | Step 2 | Add an image > 3 MB | "“….png” is larger than 3 MB." | product-form.spec › images… |
| IM-04 | N | 4 images | Add another | Add File disabled; extra files skipped with a message | manual |
| IM-05 | P | Images added | × on an image | Removed | product-form.spec › images… |
| IM-06 | N | Step 2 | Next with no image | "Please add at least one image." | product-form.spec › images… |

## 7. Product details with tabs

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| PD-01 | P | Logged in | Click a product name in the list | `/shopping/products/{id}`: Overview with images, information, description; Back to list, Edit | product-detail.spec › overview… · products.real.spec › product details… |
| PD-02 | P | PD-01 | Sessions tab → page 2 → reload | URL `?tab=sessions&page=2`; reload keeps both | product-detail.spec › active tab lives in the URL… |
| PD-03 | P | PD-01 | Same category tab | Other products of the minor category (not the product itself), each linking to its own page | product-detail.spec › same-category tab… |
| PD-04 | N | Sessions API fails | Open Sessions | Error + Try again in that tab only; Overview still works | product-detail.spec › a failing tab… |
| PD-05 | N | Product with no sessions | Open Sessions | "This product isn't linked to any class session yet." | product-detail.spec › empty sessions tab |
| PD-06 | N | Details API fails | Open the page | Overview shows the error; Sessions tab still loads | product-detail.spec › overview error does not block… |
| PD-07 | P | Focus on a tab | Arrow Right / Left / Home / End | Focus and active tab move; wraps around | product-detail.spec › keyboard… |
| PD-08 | N | `?tab=nope` | Open | Overview | product-detail.spec › unknown tab… |

## 8. Screen sizes and themes

| ID | Type | Precondition | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- |
| SZ-01 | P | — | Every screen at 1440, 768, 375 in light and dark | No sideways page scroll; under 1024 the sidebar is a drawer (menu button, Escape closes); wide tables scroll inside their card | screens.real.spec (screenshots in `screenshots/`) |
| SZ-02 | P | OS dark mode | Open any screen | Dark colours from the design tokens; logo readable | screens.real.spec |
| SZ-03 | P | Keyboard only | Tab through login, list, form, dialogs | Visible focus ring; dialogs focus the name field or the safe button; Escape closes | manual + categories-crud.spec / products.spec focus checks |
| SZ-04 | P | Any page | Open DevTools console | No errors or warnings from the app (the browser's own "Failed to load resource: 400" on a wrong login is a network log) | smoke.spec · products.real.spec (console check) |

**Totals:** 67 cases — 35 P · 32 N (counted from the tables; the CSV has the same 67 rows).
