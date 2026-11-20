# Manual first run — 18 Nov 2026 (developer)

> **Newer run:** the final build 636e258 was run again on 19 Nov 2026 — see `docs/manual-run-2026-11-19.md`. This file stays as the record of 18 Nov (build 586b91a).

QA feedback of 18 Nov (A3): the developer runs the manual cases first and records Actual Result + Pass / Fail + date; QA then verifies. This file is the record of that run. The results are also in `docs/test-cases.csv` / `docs/test-cases.md` (columns Actual Result, Pass / Fail, Last Run Date, Run by / evidence).

| Item | Value |
|---|---|
| Date | 2026-11-18, 12:24 – 13:12 IST (after the automated run of 12:07 – 12:14 IST, 105 passed) |
| Platform | Web — Chromium (the Chromium of Playwright 1.64.1), Windows 11, browser time zone Asia/Kolkata (India); one check also with the time zone America/Los_Angeles |
| Build | https://tc-admin-hw3-neeraj.vercel.app, commit 586b91a |
| API | QA server (talking-club-backend `release/qa`), in maintenance since 18 Nov |
| Account | the shared QA admin (SUPER_ADMIN); no other role has a QA account |
| Screen sizes | 1440 × 900, 1024 × 768, 768 × 1024, 375 × 812; light and dark |
| Evidence | 116 screenshots of the run + 5 of the re-check after the CSS fix (`CSSFIX-…`) in the folder `manual-run-2026-11-18` of the submission (outside the repo). File names start with the case ID |

## How the run was done

- Every step was done in a Chromium session driven by the developer's own small Playwright scripts (not the test suite, no traces, no HTML report). After each step a screenshot was taken and looked at; what was seen is written in Actual Result.
- Signed-in cases used the session saved by the automated run of 12:07, so no extra login was needed. The cases about the login itself (LG-009, LG-013, LG-025) logged in through the login form (8 logins in total). The login was read from `.env.local` inside the scripts; it is not in any file, log or screenshot (screenshots of the form show only dummy values or empty fields).
- "API fails / offline" preconditions were made by blocking the one request in the browser (the same as DevTools request blocking): the login call (LG-026), the details call (PD-011), the reorder call (CT-017), the category save calls (CT-018), the product delete call (PL-015), the upload route (PF-009). Nothing reached the API for a blocked request. LG-027 answered one category list call with an unknown message key.
- Keyboard cases used real key presses (Tab, Shift+Tab, Space, Enter, Alt+↓, Ctrl+V) and read `document.activeElement` after each one.
- Data: only records named `HW3-Neeraj-manual-…` were created, changed, reordered and deleted, all through the UI: 1 product (id 20054, PF-023 → PD-002 / PL-025 / PL-026 / PD-013 → deleted in PL-015) and 1 subcategory with 2 minor categories under main category [67] (ids 606, 640, 641; CT-017 / CT-018 → deleted). No record of another developer was changed; no other category was reordered. The image files uploaded on step 2 (PF-009, PF-010, PF-023, PF-030) stay as files in the talking-club-dev bucket (no product record), as in every upload test.
- A guard in the form script aborted any product save request, so the form cases PF-004 / PF-009 – PF-013 / PF-022 / PF-030 could not create a product (0 save requests were sent).

## Result per case

| ID | Result | What happened (short) | Screenshot(s) |
|---|---|---|---|
| LG-009 | Pass | Auto login on: still signed in after a browser restart. Off: a new tab and a restart open the login page | LG-009a-auto-login-on-after-browser-restart.png, LG-009b-auto-login-off-new-tab.png |
| LG-013 | Pass | A second login elsewhere did not end the session; a logout in the other browser did: 401 → `/login?returnTo=…page%3D4`, no toast; after login back on page 4 | LG-013-a-after-second-login-elsewhere.png, LG-013-a-after-logout-elsewhere.png, LG-013-after-login-back-on-page.png |
| LG-020 | Pass | 404 card with "상품 관리로 이동"; tab title "페이지를 찾을 수 없습니다 \| 토킹클럽 관리자" | LG-020-404-page.png |
| LG-021 | Pass | Current page has aria-current; 11 out-of-scope menus are grey text, not links, skipped by Tab | LG-021-sidebar-current-page.png, LG-021-sidebar-tab-focus.png |
| LG-022 | Pass | Dark mode on list, dialog and toast; dark already at first paint after reload; back to light; OS dark without saved choice opens dark | LG-022-*.png (6) |
| LG-023 | Pass | Drawer over the page at 768 and 375; closes after a link and with "메뉴 닫기"; no sideways scroll | LG-023-*.png (4) |
| LG-024 | Pass | Login card centred and inside the screen at 1440 / 768 / 375, light and dark | LG-024-login-{1440,768,375}-{light,dark}.png |
| LG-025 | Pass | Tab order ID → password → eye → auto login → Login; Space toggles auto login; Enter logs in. Text fields show focus as a dark underline, buttons / checkbox as a ring | LG-025-*.png (6) |
| LG-026 | Pass | 521 and network down give the two Korean alerts; nothing stored; ID kept; Login usable again | LG-026-login-api-5xx.png, LG-026-login-network-down.png |
| LG-027 | Pass | `<html lang="ko">`, all UI text Korean (Latin only in data, wordmark, CSV / ERP / PRD, Alt); accept-language en; unknown message key → general Korean server message | LG-027-*.png (4) |
| LG-030 (new) | Pass | Every tab title "… \| 토킹클럽 관리자"; logo "TalkingClub 관리자" | LG-024-login-1440-light.png, LG-020-404-page.png |
| CT-017 | Pass | Alt+↓ on own minor category, reorder call fails → toast "순서 변경 실패", order goes back (also after reload), focus stays | CT-017-own-records-before.png, CT-017-reorder-failed-toast.png |
| CT-018 | Pass | Add and rename with the save call failing → toast "카테고리 저장 실패", dialog stays open with the typed name | CT-018-add-failed-dialog-stays.png, CT-018-rename-failed-dialog-stays.png |
| CT-023 | Pass | 1440 like design 8.2.0; 768 / 375 no sideways scroll, all 150 action buttons ≥ 40 × 40 px; dark readable | CT-023-categories-{1440,768,375}-{light,dark}.png |
| PL-002 | Pass | Columns of 8.1.0, one price (= price), "- > - > -" for no category, grey placeholder, KST dates; at 1440 default view "아니오" readable | PL-002-list-1440.png, PL-002-row-without-category.png, PL-002-status-dropdown-1440-default-page.png |
| PL-004 | Pass | Search by category "판촉물": 97 products, filters cleared and disabled with the hint; no deleted product on page 1 | PL-004-search-by-category.png |
| PL-006 | Pass | 중분류 / 소분류 enabled step by step; rows match; changing 대분류 clears the lower levels | PL-006-three-level-filter.png, PL-006-major-changed-clears-lower.png |
| PL-010 | Pass | Pasting 150 characters leaves 100 | PL-010-search-paste-150-chars.png |
| PL-013 | Pass | At 100 selected the other row checkboxes are disabled; select all on page 3 → toast "선택 제한 … 50건은 선택되지 않았습니다." and nothing added (sheet text corrected, see below) | PL-013-at-100-row-checkboxes-disabled.png, PL-013-selection-limit-toast.png |
| PL-015 | Pass | Delete call fails → toast "삭제에 실패했습니다." with the reason; row and selection stay; then the real delete of the own product worked | PL-015-delete-failed-toast.png, PL-015-real-delete-done.png |
| PL-023 | **Fail** on 586b91a → fixed, re-check **Pass** | Layout right at 1440 / 1024 / 768 / 375 and dark, but the 노출여부 dropdown cut "아니오" at 1024 and at 1440 with 50 rows per page. After the CSS fix: 88 px, "아니오" fully visible (see "Failed") | PL-023-list-*.png (8), PL-023-status-*.png (4), CSSFIX-*-status-*.png (3) |
| PL-024 | Pass | Tab through search, filters, page size, CSV, select all, sort headers, rows (ring everywhere); Space ticks; Enter sorts; Enter on page 2 changes the page | PL-024-*.png (3) |
| PL-025 (new) | Pass | List ₩20,000 only (= price); CSV 단가 15000, 판매금액 20000 | PL-025-list-price-and-csv.png |
| PL-026 (new) | Pass | 07:20 UTC shown 16:20 (KST) in India and in Los Angeles; CSV file name in KST | PL-026-*.png (2), PL-025-list-price-and-csv.png |
| PD-002 | Pass | "이미지 2 보기" switches the large image and outlines the thumbnail; ₩ and KST formats | PD-002-gallery-image-1.png, PD-002-gallery-image-2.png |
| PD-007 | Pass | Product without minor category → "소분류가 지정되지 않았습니다" (not an error) | PD-007-same-category-no-minor.png |
| PD-011 | Pass | 500 and offline show the error state with "다시 시도" inside the page; header and "목록으로" usable; retry loads | PD-011-*.png (3) |
| PD-012 | Pass | One column at 768 / 375, no sideways scroll, readable light and dark | PD-012-details-{1440,768,375}-{light,dark}.png |
| PD-013 (new) | Pass | 단가 ₩15,000 = unitPrice, 판매가 ₩20,000 = price; dates in KST | PD-002-gallery-image-2.png, PL-026-details-dates-viewer-los-angeles.png |
| PF-004 | Pass | 101-character name, ₩0 and ₩3,000,000,000 give the three messages | PF-004-name-101-unit-0.png, PF-004-unit-3-billion.png |
| PF-009 | Pass | Next during upload → "이미지 업로드가 완료될 때까지 기다려 주세요."; failed upload has 다시 시도 / 삭제; retry works | PF-009-*.png (3) |
| PF-010 | Pass | Status messages on step 2; category messages on step 3; lower levels disabled until the upper one is picked | PF-010-step2-statuses-missing.png, PF-010-step3-category-missing.png |
| PF-011 | Pass | Picker → 2 options with prices; required-option switch turns on; one removed (not saved) | PF-011-*.png (3) |
| PF-012 | Pass | Required option without options → message; step 4 empty → the 4 messages; no save request | PF-012-*.png (2) |
| PF-013 | Pass | Review lists all values; "1단계 기본 정보 수정" goes to step 1 with values kept | PF-013-step4-review.png, PF-013-back-on-step1-values-kept.png |
| PF-022 | Pass | Sidebar link → dialog, "아니오" stays; reload / close → browser leave dialog; Back on step 1 leaves without dialog (known limitation) | PF-022-leave-link-dialog.png, PF-022-browser-back-on-step1.png |
| PF-023 | Pass | Double-click 등록: button disabled + busy until the list opened; 1 POST; exactly 1 product | PF-023-*.png (3) |
| PF-025 | Pass | 1440 two columns, 768 one column, 375 compact stepper; Enter in 판매가 = Next; light and dark | PF-025-*.png (7) |
| PF-030 | Pass (Vercel) | 3 MB PNG uploaded; 5 MB PNG refused in the browser with no request; hint 4MB. Local build not repeated | PF-030-3mb-uploaded.png, PF-030-5mb-refused.png |
| LG-031 (new, after the run) | Pass after the fix | Sidebar and topbar stayed in view after scrolling 1500 px (category tree; product list with 50 rows). Before the fix the sidebar scrolled away (Other findings, 1) | OBS-sidebar-after-scrolling-categories-1440.png (before), CSSFIX-*-sidebar-*.png (2) |

Not run (unchanged): LG-008 and LG-019 — Blocked, no account with that role on QA; PF-026 — Fail — API issue (known backend behaviour, not re-run).

## Failed

**PL-023 — the 노출여부 (Exposure Status) dropdown is too narrow for "아니오 (No)".** The native select in the list row has a fixed padding for the arrow; when the table gives the status column little room, the text is cut to "아니…" behind the arrow. Seen at 1024 px on the default page (select 70 px wide, e.g. 분원교재주문_특 / PRD-020000) and at 1440 px with 50 rows per page (79 px). At 1440 with 10 rows (84 px) and in the 768 / 375 cards it is readable. Screenshots: PL-023-status-1024-clipped-zoom.png, PL-023-status-1440-50-rows-clipped-row.png, PL-023-status-1440-50-rows-clipped-zoom.png (and PL-023-status-768-zoom.png, PL-002-status-dropdown-1440-default-page.png for the readable cases). Not fixed during this run (the run does not change the app).

**Fixed after the run (18 Nov, CSS only).** The select had `width: 100%` inside a cell without a width; now it keeps its own width and the cell does not wrap. Re-checked on a local production build with the real QA API: the select is 88 px at 1024 px, at 1440 px with 50 rows per page and at 1440 px with 10 rows, and `아니오` fits (42 px of text in 42 px of room); the page does not scroll sideways. Screenshots: CSSFIX-local-status-1024.png, CSSFIX-local-status-1440-50-rows.png, CSSFIX-local-status-1440.png. The re-check on the Vercel link follows the deploy (see the test sheet, PL-023).

## Other findings (no case covers them)

1. **The sidebar scrolls away on long pages (desktop).** At 1440 px, after scrolling the category tree (or step 4 of the product form) down, the left column is empty grey: the sidebar is `position: sticky; height: 100vh`, but `body` has `overflow-x: hidden`, so sticky has no effect and the menu leaves the screen. Screenshot: OBS-sidebar-after-scrolling-categories-1440.png. **Fixed after the run (CSS only):** `html` keeps `overflow-x: hidden`, `body` uses `overflow-x: clip` (no scroll box). Re-checked on the local production build: after scrolling 1500 px on the category tree and on the product list with 50 rows, the sidebar and the topbar are still at the top of the screen (CSSFIX-local-sidebar-categories-1440.png, CSSFIX-local-sidebar-products-50-1440.png). New test case LG-031.
2. **Sessions on the QA API.** Today a second login of the same account in another browser did **not** end the first session (its token still answered 200); a logout in the other browser did (the first browser got 401 on its next request). `docs/qa-build-report.md` part 8 says "after a login or a logout … the previously issued token answers 401" (observed 16 Nov); today only the logout part was seen.
3. **PL-013 text corrected.** The old steps said "tick one more → warning toast". The app disables the checkboxes of unselected rows once 100 are selected (so one more row can not be ticked); the warning toast comes from "select all" on a further page. The case now describes that; please confirm it is the wanted behaviour.
4. **Image previews load slowly.** Right after an upload, and on the list / details, the S3 image is sometimes still a grey box for a few seconds (not the broken-image icon); it then appears (PF-023, PD-002). Not a failure.
5. **PL-004 known API issue** (deleted products in a category-name search) was not seen: page 1 of the search "판촉물" had no row with `isDeleted`.

## Leftover check

- `node tools/leftover-check.js` (outside the repo, GET only, counts only) after the last data-changing case: `products: HTTP 200, 0 named HW3-Neeraj-*` · `categories: HTTP 200, 0 named HW3-Neeraj-*`.
- The same check again at the very end (after the login cases): HTTP 200, 0 products, 0 categories; and once more with the session of the last login: 0 / 0.
