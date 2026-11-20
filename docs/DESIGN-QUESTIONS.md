# Design and API questions — HW3 (Sandip)

Places where the Figma file, the HW3 brief and the QA API disagree, or where Figma is silent.
For each: what I found, what the build does now, and the question. Not design bugs — decisions to confirm.

## Design (Figma "Talking club", page 1. DEV (Admin_v0.4_Eng))

| # | Topic | Found | Build does | Question |
| --- | --- | --- | --- | --- |
| D1 | Responsive frames | Login and Shopping Mall sections only have desktop spec frames (1886 px wide). No 768 or 375 frames. | Below 1024 the sidebar becomes a drawer (menu button, backdrop, Escape); forms go to one column; wide tables scroll inside their card; no sideways page scroll at 375. | Are tablet / phone frames planned? Is the drawer pattern OK? |
| D2 | Dark mode | No dark frames. | Dark tokens of our own (`src/styles/_tokens.scss`), same structure as light; the logo PNG is inverted on dark. | Dark palette and a dark logo asset? |
| D3 | Date format | 8.1.0 shows `2025/09/12 17:10:18` and says "YYYY/MM/DD HH:MM (server time)". | WM format `YYYY-MM-DD h:mm AM` (as in HW2), in KST. | Which wins for this admin — WM or the frame? |
| D4 | Language | Login frame is Korean (아이디, 비밀번호, 자동 로그인); shopping frames are English. | English throughout (ID, Password, Auto login, Log in). | Final UI language? |
| D5 | Login error | State frames show "등록된 아이디가 아닙니다" under ID and "비밀번호가 일치하지 않습니다" under the password; the description says a system alert. | The API returns one code (`invalidCredentials`) for both, so one message under the password, both fields red. | Inline or alert? One combined message is all the API allows. |
| D6 | Sidebar | Frames show the whole admin menu (Dashboard, User, Academy, … Permission). | Only the HW3 pages (Shopping Mall → Product / Product Category). The menu comes from one config with roles. | Fine to show only built pages? |
| D7 | Product details page | No frame. | Tabs Overview / Sessions / Same category, styled from 8.1.0 / 8.2.0 parts. | Is a details page wanted, and with which tabs? (HW3 brief asks for one.) |
| D8 | Product form | 8.1.1 is one long page. | 4 steps (Basic · Images · Display & category · ERP) because the HW3 brief asks for a multi-step form. Same fields and order. | OK as steps? |
| D9 | Option products (8.1.1 #11–15, 8.1.3) | Category options, required-option toggle, single-volume options. | Not built (API `productSets` / `isOptions` optional; sent as `isOptions: "no"`). | In scope for HW3? |
| D10 | ERP code (8.1.1 #16) | Required field "Please search for the ERP code". | API says the code is assigned by the server and ignored if sent → shown read-only. | Remove the input from the design? |
| D11 | Category code (8.2.0 #9, #12) | "Modify name/code", "duplicate codes not allowed". | The API only takes a name; the code is the id. | Is a separate category code planned? |
| D12 | Category list vs tree | HW3 brief: list with server-side search, sort and paging. 8.2.0: a tree with search, Expand / Fold all, drag to reorder. | The tree with server search (the API has no paging / sort for it). Drag reorder not built (reorder endpoints exist). | Tree is right? Is drag reorder required for HW3? |
| D13 | Image tiles | 4 tiles with × ; "800×800 recommended". | Tiles + × ; JPG / PNG / WebP ≤ 3 MB (3 MB is our limit: hosting body limit 4.5 MB). First image = thumbnail badge. | Max file size and formats? |
| D14 | Loading / empty / error states | Only "No search results found" is in the notes. | Skeleton rows, empty messages, error + Try again on every list and tab. | Any designed states to follow? |

## API (Talking Club QA API) — found while building, worth passing to the backend

| # | Found on QA (2026-11-16/17) | Effect / what the frontend does |
| --- | --- | --- |
| A1 | `GET /products` ignores every sort parameter (`sortBy`, `sort`, `orderBy`, …). | HW3 asks for server-side sort; not possible. No sort controls (8.1.0 has none either). |
| A2 | `type=categoryName` search returns soft-deleted products (`isDeleted: true`); `productName` search doesn't. | List hides them; "Total Posts" can be a little high on category searches. |
| A3 | `GET /products/details/{id}` returns image **URLs**; add/edit expect **keys** (`products/…`). Sending URLs back makes the server store a doubled URL. | Edit converts URLs back to keys. |
| A4 | Refresh token is an httpOnly cookie on `.dvconsulting.org`; CORS is `Access-Control-Allow-Origin: *` without credentials, so a browser on another origin can't refresh. | No refresh: on 401 the user logs in again and returns to the same page (`?next=`). |
| A5 | S3 bucket CORS allows only `http://localhost:3000`. | Images go through the app's `/api/upload` route (server-side PUT to the signed URL). |
| A6 | `erpCode` is "auto-assigned by the server; ignored if sent". | Read-only in the form (see D10). |
| A7 | Login returns 400 `invalidCredentials` for both unknown ID and wrong password; 401 `Unauthorized` for empty body. | One message (see D5). |
| A8 | `GET /auth/get-access-token` with a Bearer access token returns 500. | Not used (A4). |
