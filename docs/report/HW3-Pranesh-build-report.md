# RP | HW3 Pranesh — build report for QA

Format: WM | Report, 10 parts from the training page Step 8 Part C.
For: Archana (QA) · Bhagyashree (design) · Kakali (code).
Items marked **[fill at hand-over]** are written in only once the final build is deployed.

## 1. Build

| | |
|---|---|
| Branch | `hw3/pranesh` (from `main`) in `divii-school/Frontend-homework` |
| Commit | **[fill at hand-over]** — `git log -1 --oneline` on the pushed branch |
| Link (Vercel) | **[fill at hand-over]** — frontend only, calls the Talking Club **QA** API |
| Date | **[fill at hand-over]** (target: 2026-11-17) |
| API | `NEXT_PUBLIC_API_BASE_URL` = QA server. Never production. |

## 2. TL task

- [TL | HW3 — Advanced Frontend Homework (Talking Club Shopping Management)](https://app.notion.com/p/416326b2d5fb81c1beccdac6b9b7730d)

## 3. What was built (plain words)

1. **Login** (Figma login 1.1.0): ID + password, 자동 로그인, show/hide password, the Figma messages for an
   unknown ID and a wrong password, and the "관리자 권한이 없습니다" popup for an admin without shopping rights.
2. **Logout** from the header. Pages behind login send you to login and back to the **same page** afterwards.
3. **Roles**: one file (`src/config/app-routes.ts`) decides the menu, which URLs open, and which buttons show.
   A URL the role can't use shows a **403** page.
4. **Session expiry**: the app renews the login quietly; if that fails it says "로그인이 만료되었습니다" and,
   after login, returns to the page you were on.
5. **상품 카테고리 관리** (8.2.0): the 3-level tree, search (kept in the URL), 모두 펼치기/접기,
   add / edit / delete per level with confirm. A category with children can't be deleted.
6. **상품 관리 list** (8.1.0): 10 per page, search by 상품명 or 카테고리, page and search kept in the URL,
   row checkboxes (max 100) with bulk delete, inline 노출 change, CSV export of the whole filtered result.
7. **상품 등록 / 수정** (8.1.1 / 8.1.2): 4 steps (기본 정보 → 이미지·노출 → 카테고리 → ERP). Each step is
   checked before 다음; going back keeps everything; an API error keeps everything typed.
8. **Image upload**: JPG/PNG/WEBP, max 4 MB, max 4 images, preview, X to remove, first image = 대표.
   Not 800×800 → a note, still allowed.
9. **상품 상세** (not in Figma, see questions D2): tabs 기본 정보 · 이미지 · ERP 정보 · 같은 카테고리 상품.
   The open tab is in the URL (`?tab=`); each tab has its own loading, empty and error state.
10. **Light / dark mode** (header button), remembered after reload.
11. **Error pages**: 401 → login, 403, 404, 500 (with 다시 시도), network loss.

## 4. Fixed issues

First build — no QA tickets yet. After each QA round this part lists every ticket: what changed and the commit.

## 5. Test account / roles

- The shared QA admin account is **sent by DM** (not written here). It is a `SUPER_ADMIN` and sees everything.
- No limited-role account exists on the QA server (questions A9). Limited roles are proven by Playwright
  with a mocked login: `e2e/roles.spec.ts`.
- ⚠ **Logging out signs out everyone using that account** (questions A4). Please tell the team before you log out.

## 6. Data to prepare

None. The build uses existing QA data (about 1,700 products).
For create/edit/delete checks, please **only use names starting with `HW3-Pranesh-`** and delete them afterwards;
five people share this server. My own test category branch: 학원 Shop › `HW3-Pranesh-Sub` › `HW3-Pranesh-Child`.

## 7. What to test

Full list with steps and expected results: `docs/qa/HW3-Pranesh-unit-test-cases.csv` (82 cases, 44 positive /
38 negative, each mapped to its Playwright test). Main points:

1. Login: empty, unknown ID, wrong password, network down; 자동 로그인 on/off.
2. Open a page while logged out → login → back to the same URL (with its search).
3. Logout → protected pages need login again.
4. Categories: search + reload, expand/fold, add / rename / delete a `HW3-Pranesh-` 소분류, delete blocked with children, empty name.
5. Product list: search by 상품명 and 카테고리, page 2 + reload + back, no result, select + 삭제 cancel, 노출 change, CSV.
6. Register: every step's errors, 단가 ≥ 판매가 refused, image type / size / count, go back and forth, register.
7. Edit and delete your `HW3-Pranesh-` product from the details page.
8. Details tabs: switch, reload keeps the tab, 같은 카테고리 상품.
9. 404: `/shopping/products/abc` and `/shopping/products/99999999`.
10. Dark mode on every screen; sizes in part 10.

## 8. Known issues / not covered

- **No sort** on either list: the API has no sort parameter (questions A1).
- **No 768 / 375 design** to compare with (questions D1); layout was built to WM rules.
- **No details-page design** (questions D2).
- **8.1.3 options** not built: no API (questions D9).
- 대분류 등록 disabled: the API caps top-level categories (questions A3).
- Drag-reorder of categories is shown only where every sibling is a `HW3-Pranesh-` record, so other people's
  order can't be changed by accident.
- Limited roles checked with a mocked login only (questions A9).

## 9. Check results

**[fill at hand-over]** — real output pasted from the final commit:

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | |
| Type-check | `npm run typecheck` | |
| Unit tests | `npm run test` | |
| Build | `npm run build` | |
| Playwright read-only | `npm run test:e2e` | |
| Playwright mutation | `npm run test:e2e:mutation` | |

HTML report: zipped `playwright-report/` attached to the submission page.

## 10. Screen sizes and browsers checked

**[fill at hand-over]** — planned: 1920, 1440, 1366, 768, 375 in light and dark; Chrome (Playwright Chromium)
and Edge on Windows 11. Side-by-side screenshots (design | build) are on the submission page.
