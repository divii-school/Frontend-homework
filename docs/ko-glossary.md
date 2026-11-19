# Korean UI glossary (HW3 admin app)

This file gives the exact Korean text for every user-visible string under `src/`, so that the UI can be switched from English to Korean consistently. One engineer takes one section (A, B, C or D). Section E lists the open points.

## How to read the tables

- **File** is the path under `src/`.
- **English now (exact)** is copied from the code as it is, so it can be searched. Each code span in that column is an exact substring of the file. Where one sentence is split over two places in the code, the cell has two code spans. In two cells a pipe is written `\|` because of the table syntax; in the code it is a plain `|`.
- **Korean to use** is the text to put in the code. Placeholders (`${...}`, `{...}`) stay exactly as they are in the English. Text after a dash is a note in English and is not part of the string. `lit.` gives the literal meaning when the Korean is not a direct translation of the English.
- **Source**
  - A Figma node id (for example `8010:59065`): the Korean is copied from that Korean frame, character for character. `desc` means it comes from the DESCRIPTION panel of the frame, not from the screen area. A sample value in the frame (a number, a name) is replaced by the variable.
  - `admin-frontend · file:line`: wording taken from the real product's frontend (`D:\projects\talking-club-admin-frontend`, read on its working branch `feature/figma-gap-2026-11`). The spacing of "해주세요" is normalised to "해 주세요".
  - `new`: written for this glossary, in the tone of the frames. "based on" names the frame or file the wording follows.

## Sources

Figma file `4wQgaju5jbb5BNRCeNmGZ0`, page "1. DEV ( Admin_v0.4_Eng )". Korean frames are the truth; English frames were used only to pair strings.

| Screen | Korean frame | English reference frame |
|---|---|---|
| 1.1.0 Login | `4019:78451` | `2752:33676` |
| Login, ID states | `4019:78535` | |
| Login, password states | `4019:78592` | |
| No-permission popup | `17108:76615` | |
| 8.1.0 Product list | `8010:59065` | `8703:84533` |
| 8.1.1 Product registration | `8010:57833` (current), `5498:84592` (older) | `8714:87124` |
| 8.1.2 Product edit | `5498:84860` | `5498:99190` |
| 8.1.3 Single-item option selection | `8034:61058` (`8703:84767` is an identical copy) | `8741:62477` |
| 8.2.0 Product category management | `5498:84158` | `5498:98488` |
| Sidebar menu names | sidebar instance inside `8010:59065` (section "Common" `4019:78244` holds only the menu structure chart) | sidebar inside `8703:84533` |

Short file names used for `admin-frontend` (all under `talking-club-admin-frontend/src`):

| Short name | File |
|---|---|
| `category/page.tsx` | `app/(main)/(shopping-mall-management)/product-category-management/page.tsx` |
| `list/page.tsx` | `app/(main)/(shopping-mall-management)/shopping-mall-management/list/page.tsx` |
| `create/page.tsx` | `app/(main)/(shopping-mall-management)/shopping-mall-management/create/page.tsx` |
| `edit/page.tsx` | `app/(main)/(shopping-mall-management)/shopping-mall-management/edit/[id]/page.tsx` |
| `ProductRegisterForm/index.tsx` | `components/shoppingMall/ProductRegisterForm/index.tsx` |
| `SingleVolumeOptionModal.tsx` | `components/shoppingMall/ProductRegisterForm/SingleVolumeOptionModal.tsx` |
| `productFormApi.ts` | `components/shoppingMall/ProductRegisterForm/productFormApi.ts` |
| `login/page.tsx` | `app/(full-page)/auth/login/page.tsx` |
| `notfound/page.tsx` | `app/(full-page)/pages/notfound/page.tsx` |
| `shop-details/page.tsx` | `app/(main)/(shopping-cart)/products/details/page.tsx` |
| `CoreAPIService.ts` | `api-services/CoreAPIService.ts` |
| `CurriculumForm.tsx` | `components/CurriculumManagement/CurriculumForm.tsx` |
| `teacherErrorMessages.ts` | `app/(main)/(user-management)/teachers/teacherErrorMessages.ts` |

## Tone rules

1. Formal admin style. Statements end in "~습니다 / ~입니다", requests in "~해 주세요" (with the space), questions in "~하시겠습니까?".
2. Buttons, labels, table headers, page titles and toast titles are noun phrases without a full stop (`등록`, `상품 삭제`, `저장 완료`). Full sentences end with a full stop.
3. Text copied from a Korean frame keeps the frame's spelling, spacing and punctuation even where it is unusual: `문의해주세요` (no space), `갯수`, `파일추가`, `상품코드`, `상세설명`, `총 게시물 : `, `등록된 아이디가 아닙니다` (no full stop).
4. Korean has no plural. Remove the `s` logic and use a counter after the number: `건` for rows of a list (frame: "최대 100건"), `개` for a count of categories or options (frame: "(2개 중분류)"), `장` for images (frame: "최대 4장"), `자` for characters.
5. A Korean particle changes with the last sound of the word before it. Every sentence with a variable is written so that the particle follows a fixed word, never the variable. Keep the word order given in the table.
6. Keep as they are: `TalkingClub`, `Admin`, `ERP`, `CSV`, `ID` (CSV column), the `₩` sign, the date format `YYYY/MM/DD HH:mm`, the `-` for an empty value, and the phone number `02-2014-8374`.
7. The ellipsis is the single character `…` as in the code today.

## Terminology decisions (one Korean term per concept)

| Concept | Korean | Where it comes from |
|---|---|---|
| product | 상품 | `8010:59065` |
| product name / product code | 상품명 / 상품코드 | `8010:57833` |
| category | 카테고리 | `5498:84158` |
| category level 1 (main, major, top-level) | 대분류 | `5498:84158`, `8010:57833` |
| category level 2 (sub, middle, medium) | 중분류 | same |
| category level 3 (minor, child) | 소분류 | same |
| name of a category | 명칭 | `5498:84158` desc |
| register (create) | 등록. Only the button of the single-item option popup is 등록하기 | `8010:57833`, `8034:61058` |
| add (a child, an option, a file) | 추가 | `8010:57833` (카테고리 옵션 추가, 단권 옵션 추가, 파일추가) |
| edit | 수정 | `5498:84860` (상품 수정) |
| delete / remove | 삭제 | `8010:59065` |
| save | 저장 | `5498:84860` |
| cancel | 취소 | `8010:57833` |
| OK / confirm | 확인 | `4019:78451` desc |
| yes / no | 예 / 아니오 | `8010:57833`, `8010:59065` desc |
| search / search term | 검색 / 검색어 | `8010:59065` |
| list | 목록 | `8010:59065` desc |
| exposure status | 노출상태. The column caption of the list (header, mobile label, CSV column) is 노출여부 because frame 8.1.0 says so | `8010:57833`; `8010:59065` |
| sale status | 판매상태 | `8010:57833` |
| selling price | 판매가. The column caption of the list (header, CSV column) is 판매금액 because frame 8.1.0 says so | `8010:57833`; `8010:59065` |
| unit price (list price before discount, API field `price`) | 단가 | `8010:57833` |
| ERP unit price | 단가 as the field label inside the ERP block; written ERP 단가 in sentences and outside the ERP block | `8010:57833` (label; desc uses "ERP 단가") |
| option | 옵션 | `8010:57833` |
| single-item option | 단권 옵션 | `8034:61058` |
| category option | 카테고리 옵션 | `8010:57833` |
| required option for purchase | 상품 구매 필수 옵션 선택 | `8010:57833` |
| ERP code | ERP 코드 | `8010:57833` |
| ERP product name | 상품ERP명 | `8010:57833` |
| quantity | 갯수 | `8010:57833` |
| tax type | 비과세 (field label), values 과세 / 비과세 | `8010:57833`, `5498:84860` desc |
| image / thumbnail | 이미지 / 썸네일 | `8010:57833`, `8010:59065` |
| detailed description | 상세설명 | `8010:57833` |
| registration category | 등록 카테고리 | `8010:57833` |
| registration date | 등록일자 | `8010:59065` |
| login / logout | 로그인 / 로그아웃 | `4019:78451` |
| ID / password | 아이디 / 비밀번호 | `4019:78451` |
| customer center | 고객센터 | `17108:76615` |
| super admin | 최고관리자 | `8010:59065` desc |
| permission | 권한 | `17108:76615` |
| loading | 불러오는 중… | admin-frontend · `SingleVolumeOptionModal.tsx:207` |
| no search results | 검색 결과가 없습니다 | `8010:59065` desc |

## A. Shared (layout, login, errors, common components, api-messages)

| # | File (path under src) | English now (exact) | Korean to use | Source |
|---|---|---|---|---|
| A1 | `app/layout.tsx` | `lang="en"` | `lang="ko"` — HTML attribute, not screen text; needed so that browsers and screen readers treat the page as Korean | new |
| A2 | `app/layout.tsx` | `default: "TalkingClub Admin"` | `TalkingClub Admin` — keep, brand name | new |
| A3 | `app/layout.tsx` | `template: "%s \| TalkingClub Admin"` | `%s \| TalkingClub Admin` — keep; `%s` is the Korean page title | new |
| A4 | `app/layout.tsx` | `Talking Club admin — Shopping Mall: product and product category management (HW3).` | `토킹클럽 관리자 — 쇼핑몰 관리: 상품 관리 및 상품 카테고리 관리 (HW3).` | new |
| A5 | `app/error.tsx` | `title="Something went wrong"` | `오류가 발생했습니다` | new |
| A6 | `app/error.tsx` | `suffix="Admin"` | `Admin` — keep | 4019:78535 |
| A7 | `app/(main)/error.tsx` | `title="Something went wrong"` | `오류가 발생했습니다` | new |
| A8 | `app/not-found.tsx` | `Page not found` | `페이지를 찾을 수 없습니다` — metadata title and page title | admin-frontend · notfound/page.tsx:24 |
| A9 | `app/not-found.tsx` | `The page you are looking for does not exist or has moved.` | `요청하신 페이지가 존재하지 않거나 이동되었습니다.` | admin-frontend · notfound/page.tsx:26 |
| A10 | `app/not-found.tsx` | `Go to Product Management` | `상품 관리로 이동` | new |
| A11 | `app/not-found.tsx` | `suffix="Admin"` | `Admin` — keep | 4019:78535 |
| A12 | `app/(full-page)/login/page.tsx` | `title: "Login"` | `로그인` | 4019:78451 |
| A13 | `app/(full-page)/login/page.tsx` | `label="Loading login…"` | `로그인 화면을 불러오는 중…` | new |
| A14 | `app/(full-page)/403/page.tsx` | `title: "No permission"` | `권한 없음` | new |
| A15 | `config/navigation.ts` | `label: "Dashboard"` | `대시보드` | 8010:59065 |
| A16 | `config/navigation.ts` | `label: "User Management"` | `유저관리` — no space in the frame | 8010:59065 |
| A17 | `config/navigation.ts` | `label: "Academy Management"` | `학원 관리` | 8010:59065 |
| A18 | `config/navigation.ts` | `label: "Academic Management"` | `학사관리` — no space in the frame | 8010:59065 |
| A19 | `config/navigation.ts` | `label: "Curriculum Management"` | `교육과정 관리` | 8010:59065 |
| A20 | `config/navigation.ts` | `label: "Shopping Mall Management"` | `쇼핑몰 관리` — menu group and first breadcrumb item (see E1) | 8010:59065 |
| A21 | `config/navigation.ts` | `label: "Product Management"` | `상품 관리` — menu item, breadcrumb, also used by the 403 page | 8010:59065 |
| A22 | `config/navigation.ts` | `label: "Product Category Management"` | `상품 카테고리 관리` | 8010:59065 |
| A23 | `config/navigation.ts` | `label: "Order Delivery Management"` | `주문 배송 관리` | 8010:59065 |
| A24 | `config/navigation.ts` | `label: "Reward Points Management"` | `적립금 관리` | 8010:59065 |
| A25 | `config/navigation.ts` | `label: "Notice Management"` | `공지사항 관리` | 8010:59065 |
| A26 | `config/navigation.ts` | `label: "Payment Management"` | `결제 관리` | 8010:59065 |
| A27 | `config/navigation.ts` | `label: "Branch Manager Menu"` | `지사장 메뉴` | 8010:59065 |
| A28 | `config/navigation.ts` | `label: "Permission Management"` | `권한 관리` | 8010:59065 |
| A29 | `components/layout/AppShell.tsx` | `Skip to content` | `본문 바로가기` | new |
| A30 | `components/layout/AppShell.tsx` | `aria-label="Close menu"` | `메뉴 닫기` | new |
| A31 | `components/layout/AppSidebar.tsx` | `aria-label="Sidebar"` | `사이드바` | new |
| A32 | `components/layout/AppSidebar.tsx` | `"Expand menu"` | `메뉴 펼치기` | new |
| A33 | `components/layout/AppSidebar.tsx` | `"Collapse menu"` | `메뉴 접기` | new |
| A34 | `components/layout/AppSidebar.tsx` | `aria-label="Close menu"` | `메뉴 닫기` | new |
| A35 | `components/layout/AppSidebar.tsx` | `aria-label="Main menu"` | `주 메뉴` | new |
| A36 | `components/layout/AppSidebar.tsx` | `title="Not part of this homework"` | `이번 과제 범위에 포함되지 않은 메뉴입니다` — two places in the file | new |
| A37 | `components/layout/AppSidebar.tsx` | `(not available in this app)` | `(이 앱에서는 사용할 수 없음)` — screen-reader text, two places in the file | new |
| A38 | `components/layout/AppTopbar.tsx` | `aria-label="Open menu"` | `메뉴 열기` | new |
| A39 | `components/layout/AppTopbar.tsx` | `Log out` | `로그아웃` — `aria-label` and `title` | new |
| A40 | `components/layout/AppTopbar.tsx` | `Signed in as ` | `로그인 계정: ` — screen-reader text placed before the user name | new |
| A41 | `components/BrandLogo.tsx` | `TalkingClub` | `TalkingClub` — keep, word mark (in the frames the logo is a picture, not text) | new |
| A42 | `components/BrandLogo.tsx` | `aria-label="TalkingClub home"` | `TalkingClub 홈` | new |
| A43 | `components/AlertDialog.tsx` | `title = "Notice"` | `알림` | admin-frontend · CurriculumForm.tsx:88 |
| A44 | `components/AlertDialog.tsx` | `confirmLabel = "OK"` | `확인` | 4019:78451 desc |
| A45 | `components/ComingSoon.tsx` | `Coming soon` | `준비 중` — `aria-label` and title | new |
| A46 | `components/ComingSoon.tsx` | `This screen is part of HW3 and is being built next.` | `이 화면은 HW3 범위에 포함되며 곧 제공될 예정입니다.` | new |
| A47 | `components/EmptyState.tsx` | `title = "No search results found"` | `검색 결과가 없습니다` | 8010:59065 desc |
| A48 | `components/EmptyState.tsx` | `description = "Try a different search term or clear the filters."` | `다른 검색어를 입력하거나 필터를 초기화해 주세요.` | new |
| A49 | `components/ErrorState.tsx` | `title: "No permission"` | `권한 없음` | new |
| A50 | `components/ErrorState.tsx` | `message: "Your account does not have permission to see this. Ask a super admin if you need access."` | `이 화면을 볼 수 있는 권한이 없습니다. 권한이 필요하면 최고관리자에게 문의해 주세요.` | new |
| A51 | `components/ErrorState.tsx` | `title: "Not found"` | `찾을 수 없음` | new |
| A52 | `components/ErrorState.tsx` | `message: "This item does not exist or has been deleted."` | `존재하지 않거나 삭제된 항목입니다.` | new |
| A53 | `components/ErrorState.tsx` | `title: "Server error"` | `서버 오류` | new |
| A54 | `components/ErrorState.tsx` | `message: "Something went wrong on the server. Please try again."` | `서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` — same text as `serverError` (A113) | new |
| A55 | `components/ErrorState.tsx` | `title: "Connection problem"` | `연결 오류` | new |
| A56 | `components/ErrorState.tsx` | `message: "Cannot reach the server. Check your connection and try again."` | `서버에 연결할 수 없습니다. 네트워크 연결을 확인한 후 다시 시도해 주세요.` — same text as `networkError` (A108) | new |
| A57 | `components/ErrorState.tsx` | `title: "Could not load data"` | `데이터를 불러오지 못했습니다` | new, based on admin-frontend · list/page.tsx:492 |
| A58 | `components/ErrorState.tsx` | `message: "Something went wrong. Please try again."` | `오류가 발생했습니다. 다시 시도해 주세요.` | new |
| A59 | `components/ErrorState.tsx` | `Error code {code}` | `오류 코드 {code}` | new |
| A60 | `components/ErrorState.tsx` | `label="Try again"` | `다시 시도` | new |
| A61 | `components/ListPagination.tsx` | `aria-label="Pagination"` | `페이지네이션` | 8010:59065 desc |
| A62 | `components/PageHeader.tsx` | `aria-label="Breadcrumb"` | `현재 위치` — lit. "current location" | new |
| A63 | `components/PageLoader.tsx` | `label = "Loading…"` | `불러오는 중…` | admin-frontend · SingleVolumeOptionModal.tsx:207 |
| A64 | `components/TableSkeleton.tsx` | `label = "Loading…"` | `불러오는 중…` | admin-frontend · SingleVolumeOptionModal.tsx:207 |
| A65 | `components/ThemeToggle.tsx` | `"Switch to light mode"` | `라이트 모드로 전환` — `aria-label` and `title` | new |
| A66 | `components/ThemeToggle.tsx` | `"Switch to dark mode"` | `다크 모드로 전환` — `aria-label` and `title` | new |
| A67 | `components/auth/LoginForm.tsx` | `loginIdRequired: "Please enter your ID."` | `아이디를 입력해 주세요.` | 4019:78451 |
| A68 | `components/auth/LoginForm.tsx` | `passwordRequired: "Please enter your password."` | `비밀번호를 입력해 주세요.` | new, based on 4019:78451 |
| A69 | `components/auth/LoginForm.tsx` | `loginIdUnknown: "This ID is not registered."` | `등록된 아이디가 아닙니다` — no full stop in the frame | 4019:78535 |
| A70 | `components/auth/LoginForm.tsx` | `passwordMismatch: "The password does not match."` | `비밀번호가 일치하지 않습니다` — no full stop in the frame | 4019:78592 |
| A71 | `components/auth/LoginForm.tsx` | `TalkingClub Admin login` | `TalkingClub Admin 로그인` — screen-reader heading | new |
| A72 | `components/auth/LoginForm.tsx` | `suffix="Admin"` | `Admin` — keep | 4019:78535 |
| A73 | `components/auth/LoginForm.tsx` | `placeholder="ID"` | `아이디` — the hidden `<label>` text `ID` gets the same word | 4019:78451 |
| A74 | `components/auth/LoginForm.tsx` | `placeholder="Password"` | `비밀번호` — the hidden `<label>` text `Password` gets the same word | 4019:78451 |
| A75 | `components/auth/LoginForm.tsx` | `"Hide password"` | `비밀번호 숨기기` | new |
| A76 | `components/auth/LoginForm.tsx` | `"Show password"` | `비밀번호 표시` | new |
| A77 | `components/auth/LoginForm.tsx` | `Auto login` | `자동 로그인` | 4019:78451 |
| A78 | `components/auth/LoginForm.tsx` | `label="Login"` | `로그인` | 4019:78451 |
| A79 | `components/auth/NoPermissionDialog.tsx` | `suffix="Admin"` | `Admin` — keep | 17108:76615 |
| A80 | `components/auth/NoPermissionDialog.tsx` | `You do not have admin permission.` | `관리자 권한이 없습니다.` | 17108:76615 |
| A81 | `components/auth/NoPermissionDialog.tsx` | `Please contact the customer center.` | `고객센터로 문의해주세요.` — no space before 주세요 in the frame | 17108:76615 |
| A82 | `components/auth/NoPermissionDialog.tsx` | `label="Go to Talking Club home"` | `토킹클럽 홈으로` — lit. "To Talking Club home" | 17108:76615 |
| A83 | `components/auth/ForbiddenView.tsx` | `No permission` | `권한 없음` — `aria-label` and `title` | new |
| A84 | `components/auth/ForbiddenView.tsx` | `suffix="Admin"` | `Admin` — keep | 4019:78535 |
| A85 | `components/auth/ForbiddenView.tsx` | `Your account cannot open “${refusedLabel}”. Ask a super admin if you need access.` | `“${refusedLabel}” 화면을 열 수 있는 권한이 없습니다. 권한이 필요하면 최고관리자에게 문의해 주세요.` — the menu name comes first, then the fixed word 화면을 | new |
| A86 | `components/auth/ForbiddenView.tsx` | `"Your account cannot open this page. Ask a super admin if you need access."` | `이 페이지를 열 수 있는 권한이 없습니다. 권한이 필요하면 최고관리자에게 문의해 주세요.` | new |
| A87 | `components/auth/ForbiddenView.tsx` | `Go to {homeLabel}` | `{homeLabel}로 이동` — the menu name first, then `로 이동`; correct for both possible names (상품 관리, 상품 카테고리 관리) | new |
| A88 | `components/auth/ForbiddenView.tsx` | `label="Log in with another account"` | `다른 계정으로 로그인` | new |
| A89 | `components/auth/ForbiddenView.tsx` | `Go to login` | `로그인 화면으로 이동` | new |
| A90 | `providers/AuthGate.tsx` | `label="Checking your session…"` | `로그인 정보를 확인하는 중…` | new |
| A91 | `providers/RouteGuard.tsx` | `label="Checking permissions…"` | `권한을 확인하는 중…` | new |
| A92 | `utils/confirm.ts` | `header = "Confirm"` | `확인` | 4019:78451 desc |
| A93 | `utils/confirm.ts` | `acceptLabel = "OK"` | `확인` | 4019:78451 desc |
| A94 | `utils/confirm.ts` | `rejectLabel = "Cancel"` | `취소` | 8010:57833 |
| A95 | `utils/confirm.ts` | `header = "Delete"` <br> `acceptLabel: "Delete"` | `삭제` | 8010:59065 |
| A96 | `utils/api-messages.ts` | `invalidCredentials: "This account is not registered."` | `등록되지 않은 계정입니다.` | 4019:78451 desc |
| A97 | `utils/api-messages.ts` | `invalidPassword: "The ID and password do not match. Please check and try again."` | `아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.` | 4019:78451 desc |
| A98 | `utils/api-messages.ts` | `userSuspended: "This account is suspended. Please contact the customer center."` | `이용이 정지된 계정입니다. 고객센터로 문의해 주세요.` | new |
| A99 | `utils/api-messages.ts` | `userDeleted: "This account has been deleted. Please contact the customer center."` | `삭제된 계정입니다. 고객센터로 문의해 주세요.` | new |
| A100 | `utils/api-messages.ts` | `tooManyRequests: "Too many attempts. Please wait a moment and try again."` | `요청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.` | admin-frontend · login/page.tsx:156 |
| A101 | `utils/api-messages.ts` | `Unauthorized: "Your session has expired. Please log in again."` | `세션이 만료되었습니다. 다시 로그인해 주세요.` | new |
| A102 | `utils/api-messages.ts` | `loginSuccess: "Logged in."` | `로그인되었습니다.` | new |
| A103 | `utils/api-messages.ts` | `adminLogout: "Logged out."` | `로그아웃되었습니다.` | new |
| A104 | `utils/api-messages.ts` | `noAdminPermission: "You do not have admin permission. Please contact the customer center."` | `관리자 권한이 없습니다. 고객센터로 문의해주세요.` | 17108:76615 |
| A105 | `utils/api-messages.ts` | `"You do not have permission to access this resource": "You do not have permission to do this."` | `권한이 없습니다.` | admin-frontend · CoreAPIService.ts:181 |
| A106 | `utils/api-messages.ts` | `"Something went wrong": "Something went wrong on the server. Please try again."` | `서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` | new |
| A107 | `utils/api-messages.ts` | `"Internal server error": "Something went wrong on the server. Please try again."` | `서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` | new |
| A108 | `utils/api-messages.ts` | `networkError: "Cannot reach the server. Check your connection and try again."` | `서버에 연결할 수 없습니다. 네트워크 연결을 확인한 후 다시 시도해 주세요.` | new |
| A109 | `utils/api-messages.ts` | `"Validation Error": "Please check the highlighted fields."` | `표시된 항목을 다시 확인해 주세요.` | new |
| A110 | `utils/api-messages.ts` | `requestTimeout: "The server took too long to answer. Please try again."` | `서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.` | new |
| A111 | `utils/api-messages.ts` | `sessionExpired: "Your session has expired. Please log in again."` | `세션이 만료되었습니다. 다시 로그인해 주세요.` | new |
| A112 | `utils/api-messages.ts` | `forbidden: "You do not have permission to do this."` | `권한이 없습니다.` | admin-frontend · CoreAPIService.ts:181 |
| A113 | `utils/api-messages.ts` | `serverError: "Something went wrong on the server. Please try again."` | `서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` | new |
| A114 | `utils/api-messages.ts` | `notFound: "The requested data could not be found."` | `요청하신 데이터를 찾을 수 없습니다.` | new |
| A115 | `utils/api-messages.ts` | `noRecordFound: "No data was found."` | `조회된 데이터가 없습니다.` | new |
| A116 | `utils/api-messages.ts` | `categoryAlreadyExists: "A category with this name already exists."` | `이미 존재하는 대분류 카테고리입니다.` — this key is sent for level 1 only | admin-frontend · category/page.tsx:534 |
| A117 | `utils/api-messages.ts` | `subCategoryAlreadyExists: "A middle category with this name already exists in this category."` | `이미 존재하는 중분류 카테고리입니다.` | admin-frontend · category/page.tsx:536 |
| A118 | `utils/api-messages.ts` | `childSubcategoryAlreadyExists: "A minor category with this name already exists in this middle category."` | `이미 존재하는 소분류 카테고리입니다.` | admin-frontend · category/page.tsx:538 |
| A119 | `utils/api-messages.ts` | `maximumCategoryLimitReached: "You can register up to 3 top-level categories."` | `대분류는 최대 3개까지 등록할 수 있습니다.` | new |
| A120 | `utils/api-messages.ts` | `categoryNotFound: "This category no longer exists."` | `존재하지 않는 대분류 카테고리입니다.` | new |
| A121 | `utils/api-messages.ts` | `subCategoryNotFound: "This middle category no longer exists."` | `존재하지 않는 중분류 카테고리입니다.` | new |
| A122 | `utils/api-messages.ts` | `childSubcategoryNotFound: "This minor category no longer exists."` | `존재하지 않는 소분류 카테고리입니다.` | new |
| A123 | `utils/api-messages.ts` | `categoryAddedSucessFully: "Category added."` | `대분류가 등록되었습니다.` | new |
| A124 | `utils/api-messages.ts` | `categoryUpdatedSucessFully: "Category updated."` | `대분류가 수정되었습니다.` | new |
| A125 | `utils/api-messages.ts` | `categoryDeletedSuccessFull: "Category deleted."` | `대분류가 삭제되었습니다.` | new |
| A126 | `utils/api-messages.ts` | `subCategoryAddedSucessFully: "Middle category added."` | `중분류가 등록되었습니다.` | new |
| A127 | `utils/api-messages.ts` | `subCategoryUpdatedSucessFully: "Middle category updated."` | `중분류가 수정되었습니다.` | new |
| A128 | `utils/api-messages.ts` | `subCategoryDeletedSuccessFull: "Middle category deleted."` | `중분류가 삭제되었습니다.` | new |
| A129 | `utils/api-messages.ts` | `childSubcategoryAddedSucessFully: "Minor category added."` | `소분류가 등록되었습니다.` | new |
| A130 | `utils/api-messages.ts` | `childSubcategoryUpdatedSucessFully: "Minor category updated."` | `소분류가 수정되었습니다.` | new |
| A131 | `utils/api-messages.ts` | `childSubcategoryDeletedSuccessFull: "Minor category deleted."` | `소분류가 삭제되었습니다.` | new |
| A132 | `utils/api-messages.ts` | `orderSwappedSuccessfully: "Order saved."` | `카테고리 순서가 변경되었습니다.` | admin-frontend · category/page.tsx:344 |
| A133 | `utils/api-messages.ts` | `productNotFound: "This product no longer exists."` | `존재하지 않는 상품입니다.` | new |
| A134 | `utils/api-messages.ts` | `unitPriceMustBeLessThanPrice: "The selling price must be lower than the unit price."` | `판매가는 단가보다 낮아야 합니다.` — see E7 | new |
| A135 | `utils/api-messages.ts` | `someProductDoesNotExist: "One of the selected option products no longer exists."` | `선택한 옵션 상품 중 존재하지 않는 상품이 있습니다.` | new |
| A136 | `utils/api-messages.ts` | `productOptionsRequired: "Add at least one option."` | `옵션을 1개 이상 추가해 주세요.` | new |
| A137 | `utils/api-messages.ts` | `productCreatedSucessFully: "Product saved."` | `상품이 저장되었습니다.` — the API sends this key for add and for edit | new |
| A138 | `utils/api-messages.ts` | `productDeletedSucessFully: "Product deleted."` | `상품이 삭제되었습니다.` | admin-frontend · list/page.tsx:261 |
| A139 | `utils/api-messages.ts` | `productStatusUpdatedSuccessfully: "Visibility updated."` | `노출상태가 변경되었습니다.` | new |
| A140 | `utils/api-messages.ts` | `erpCodeAlreadyExists: "This ERP code is already in use."` | `이미 등록된 ERP 코드입니다.` | admin-frontend · productFormApi.ts:40 |
| A141 | `utils/api-messages.ts` | `erpCodeAvailable: "This ERP code is available."` | `사용 가능한 ERP 코드입니다.` | new |
| A142 | `utils/api-messages.ts` | `"At least one image is required": "Add at least one image."` | `이미지를 1장 이상 등록해 주세요.` | new |
| A143 | `utils/api-messages.ts` | `urlGeneratedSuccessfully: "Upload URL ready."` | `업로드 URL이 생성되었습니다.` | new |
| A144 | `utils/api-messages.ts` | `fileFormatNotAllowed: "This file type is not allowed."` | `허용되지 않는 파일 형식입니다.` | new |
| A145 | `utils/api-messages.ts` | `FileSizeExceeded: "The file is too large."` | `파일 용량이 너무 큽니다.` | new |
| A146 | `utils/api-messages.ts` | `uploadFailed: "The image could not be uploaded. Please try again."` | `이미지 업로드에 실패했습니다. 다시 시도해 주세요.` | new, based on admin-frontend · create/page.tsx:41 |
| A147 | `api-services/CoreAPIService.ts` | `"NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local and fill it in."` | `NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env.example 파일을 .env.local로 복사한 후 값을 입력해 주세요.` — developer message, shown only when the app is not configured | new |
| A148 | `api-services/CoreAPIService.ts` | `"The request was cancelled."` | `요청이 취소되었습니다.` | new |
| A149 | `utils/constants.ts` | `"02-2014-8374"` | `02-2014-8374` — keep | 17108:76615 |
| A150 | `utils/format.ts` | `"YYYY/MM/DD HH:mm"` | keep — the frame asks for "YYYY/MM/DD HH:MM" (see E20) | 8010:59065 desc |
| A151 | `utils/format.ts` | `"YYYY/MM/DD"` | keep | new |
| A152 | `utils/format.ts` | `EMPTY_VALUE = "-"` | keep — the frame says "없으면 ‘-’" | 8010:59065 desc |
| A153 | `utils/format.ts` | `"en-US"` | keep — only gives the three-digit comma; `ko-KR` gives the same result | new |
| A154 | `utils/format.ts` | `${sign}₩${formatNumber(Math.abs(numeric))}` | keep the `₩` sign in front of the number (see E19 for the space) | 8010:59065 desc |
| A155 | `utils/format.ts` | `" > "` | keep — category path "대분류 > 중분류 > 소분류" | 8010:59065 desc |
| A156 | `styles/components/_page-header.scss` | `content: '/';` | keep — breadcrumb separator `/` | 8010:59065 |
| A157 | `utils/api-messages.ts` | `uploadTooLarge: "The image is too large to upload. Please choose a smaller file."` | `이미지 용량이 너무 커서 업로드할 수 없습니다. 더 작은 파일을 선택해 주세요.` | new |
| A158 | `utils/api-messages.ts` | `uploadUrlNotAllowed: "The upload address was not accepted. Please try again."` | `업로드 주소가 올바르지 않습니다. 다시 시도해 주세요.` | new |
| A159 | `utils/query-client.ts` | `query: "The data could not be loaded"` | `데이터를 불러오지 못했습니다` — title of the default error toast for a failed load; the second line is the API message | new, based on admin-frontend · list/page.tsx:492 |
| A160 | `utils/query-client.ts` | `mutation: "The action was not completed"` | `요청을 처리하지 못했습니다` — title of the default error toast for a failed save / delete | new |

## B. Product Category Management

| # | File (path under src) | English now (exact) | Korean to use | Source |
|---|---|---|---|---|
| B1 | `app/(main)/shopping-mall/categories/page.tsx` | `Product Category Management` | `상품 카테고리 관리` — metadata title and page title | 5498:84158 |
| B2 | `app/(main)/shopping-mall/categories/page.tsx` | `label="Loading categories…"` | `카테고리를 불러오는 중…` | admin-frontend · category/page.tsx:1024 |
| B3 | `components/categories/CategoryToolbar.tsx` | `Search categories` | `카테고리 검색` — screen-reader label of the search box | new, based on 5498:84158 |
| B4 | `components/categories/CategoryToolbar.tsx` | `aria-label="Search"` | `검색` | admin-frontend · category/page.tsx:975 |
| B5 | `components/categories/CategoryToolbar.tsx` | `placeholder="Category search..."` | `카테고리 검색...` — three plain dots as in the frame | 5498:84158 |
| B6 | `components/categories/CategoryToolbar.tsx` | `aria-label="Clear search"` | `검색 초기화` | new |
| B7 | `components/categories/CategoryToolbar.tsx` | `label="Expand all"` | `모두 펼치기` | 5498:84158 |
| B8 | `components/categories/CategoryToolbar.tsx` | `label="Collapse all"` | `모두 접기` | 5498:84158 |
| B9 | `components/categories/CategoryToolbar.tsx` | `label="Register main category"` | `대분류 등록` | 5498:84158 |
| B10 | `components/categories/category-nodes.ts` | `badge: "Main"` | `대분류` | 5498:84158 desc |
| B11 | `components/categories/category-nodes.ts` | `noun: "main category"` | `대분류` | 5498:84158 desc |
| B12 | `components/categories/category-nodes.ts` | `addLabel: "Subcategory"` | `중분류` — the pill on a level-1 row; the plus icon stays in front (see E14) | 5498:84158 |
| B13 | `components/categories/category-nodes.ts` | `childSingular: "subcategory"` | `중분류` | 5498:84158 |
| B14 | `components/categories/category-nodes.ts` | `childPlural: "subcategories"` | `중분류` — no plural in Korean | 5498:84158 |
| B15 | `components/categories/category-nodes.ts` | `badge: "Sub"` | `중분류` | 5498:84158 desc |
| B16 | `components/categories/category-nodes.ts` | `noun: "subcategory"` | `중분류` | 5498:84158 desc |
| B17 | `components/categories/category-nodes.ts` | `addLabel: "Minor category"` | `소분류` — the pill on a level-2 row | 5498:84158 |
| B18 | `components/categories/category-nodes.ts` | `childSingular: "minor category"` | `소분류` | 5498:84158 |
| B19 | `components/categories/category-nodes.ts` | `childPlural: "minor categories"` | `소분류` — no plural in Korean | 5498:84158 |
| B20 | `components/categories/category-nodes.ts` | `badge: "Minor"` | `소분류` | 5498:84158 desc |
| B21 | `components/categories/category-nodes.ts` | `noun: "minor category"` | `소분류` | 5498:84158 desc |
| B22 | `components/categories/category-nodes.ts` | `(${count} ${count === 1 ? info.childSingular : info.childPlural})` | `(${count}개 ${info.childSingular})` — gives "(2개 중분류)", "(6개 소분류)": number, then 개, a space, then the level name; no singular / plural choice | 5498:84158 |
| B23 | `components/categories/CategoryNode.tsx` | `aria-roledescription="drag handle"` | `드래그 핸들` | new, based on 5498:84158 desc |
| B24 | `components/categories/CategoryNode.tsx` | `Reorder ${label}` | `${label} 순서 변경` | new |
| B25 | `components/categories/CategoryNode.tsx` | `title="Drag to reorder (or Alt + ↑ / Alt + ↓)"` | `드래그하여 순서 변경 (또는 Alt + ↑ / Alt + ↓)` | new, based on admin-frontend · category/page.tsx:605 |
| B26 | `components/categories/CategoryNode.tsx` | `${info.childPlural.charAt(0).toUpperCase()}${info.childPlural.slice(1)} of ${label}` | `${label} 하위 ${info.childPlural}` — gives "[67] 주교재 하위 중분류"; drop the upper-case logic | new |
| B27 | `components/categories/CategoryNode.tsx` | `Add ${LEVEL_INFO[info.childLevel].noun} to ${label}` | `${label}에 ${LEVEL_INFO[info.childLevel].noun} 추가` — the row label first, then `에` | new, based on 5498:84158 desc |
| B28 | `components/categories/CategoryNode.tsx` | `Edit ${label}` | `${label} 수정` | new, based on admin-frontend · category/page.tsx:624 |
| B29 | `components/categories/CategoryNode.tsx` | `Delete ${label}` | `${label} 삭제` | new, based on admin-frontend · category/page.tsx:632 |
| B30 | `components/categories/CategoryTree.tsx` | `Moved ${nodeLabel(node)} to position ${toIndex + 1} of ${siblings.length}.` | `${nodeLabel(node)} 항목을 ${siblings.length}개 중 ${toIndex + 1}번째 위치로 이동했습니다.` — the total comes before the position; the fixed word 항목을 carries the particle | new |
| B31 | `components/categories/CategoryTree.tsx` | `Drag a row by its handle to change the order within the same level,` <br> `or focus a row and press Alt + ↑ / Alt + ↓.` | `핸들을 드래그하여 동일 레벨 내에서 순서를 변경하거나, 행에 포커스를 두고 Alt + ↑ / Alt + ↓ 키를 눌러 주세요.` — one sentence; the two English lines become one text | new, based on 5498:84158 desc |
| B32 | `components/categories/CategoryTree.tsx` | `Clear the search to change the order.` | `순서를 변경하려면 검색을 초기화해 주세요.` | new |
| B33 | `components/categories/CategoryTree.tsx` | `aria-label="Product categories"` | `상품 카테고리` | new |
| B34 | `components/categories/CategoryTreeSkeleton.tsx` | `Loading categories…` | `카테고리를 불러오는 중…` | admin-frontend · category/page.tsx:1024 |
| B35 | `components/categories/CategoryFormDialog.tsx` | `Edit ${noun}` | `${noun} 수정` — gives "대분류 수정" | new |
| B36 | `components/categories/CategoryFormDialog.tsx` | `"Register main category"` | `대분류 등록` | 5498:84158 |
| B37 | `components/categories/CategoryFormDialog.tsx` | `Add ${noun}` | `${noun} 추가` — gives "소분류 추가" | 5498:84158 desc |
| B38 | `components/categories/CategoryFormDialog.tsx` | `"Saved."` | `저장되었습니다.` | admin-frontend · list/page.tsx:305 |
| B39 | `components/categories/CategoryFormDialog.tsx` | `"Could not save the category"` | `카테고리 저장 실패` — toast title; the detail line is the API message | new |
| B40 | `components/categories/CategoryFormDialog.tsx` | `label="Cancel"` | `취소` | admin-frontend · category/page.tsx:943 |
| B41 | `components/categories/CategoryFormDialog.tsx` | `"Save"` | `저장` — edit mode | admin-frontend · category/page.tsx:949 |
| B42 | `components/categories/CategoryFormDialog.tsx` | `"Register"` | `등록` — add mode | 8010:57833 |
| B43 | `components/categories/CategoryFormDialog.tsx` | `Parent: ` | `상위 카테고리: ` | new |
| B44 | `components/categories/CategoryFormDialog.tsx` | `Category name <span aria-hidden="true">*</span>` | `명칭` — replace only the words "Category name"; the `*` span stays | admin-frontend · category/page.tsx:1076 |
| B45 | `components/categories/CategoryFormDialog.tsx` | `placeholder="Please enter the category name."` | `명칭을 입력해 주세요.` — see E13 | admin-frontend · category/page.tsx:1080 |
| B46 | `components/categories/CategoryFormDialog.tsx` | `"Please enter a category name."` | `명칭을 입력해 주세요.` | admin-frontend · category/page.tsx:451 |
| B47 | `components/categories/CategoryFormDialog.tsx` | `Use ${MAX} characters or fewer.` | `명칭은 ${MAX}자 이내로 입력해 주세요.` | new, based on admin-frontend · category/page.tsx:35 |
| B48 | `components/categories/CategoryFormDialog.tsx` | `"This name is already used at this level."` | `동일 레벨에 이미 사용 중인 명칭입니다.` | new |
| B49 | `components/categories/CategoryFormDialog.tsx` | `Up to {MAX} characters. Spaces at the start and end are removed.` | `최대 {MAX}자까지 입력할 수 있습니다. 앞뒤 공백은 자동으로 제거됩니다.` | new, based on 5498:84158 desc |
| B50 | `components/categories/CategoryManager.tsx` | `Cannot delete "${nodeLabel(node)}": it has ${info.childPlural}. Delete them first.` | `"${nodeLabel(node)}" 카테고리에 하위 항목이 있습니다. 하위 항목을 먼저 삭제해 주세요.` — `info.childPlural` is not used any more (see E16) | admin-frontend · category/page.tsx:549 |
| B51 | `components/categories/CategoryManager.tsx` | `Delete the ${info.noun} "${nodeLabel(node)}"? This cannot be undone.` | `"${nodeLabel(node)}" ${info.noun}를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.` — the label first, then the level name + `를` (대분류 / 중분류 / 소분류 all take 를) | new, based on admin-frontend · category/page.tsx:553 |
| B52 | `components/categories/CategoryManager.tsx` | `Delete ${info.noun}` | `${info.noun} 삭제` — dialog title, gives "중분류 삭제" | new |
| B53 | `components/categories/CategoryManager.tsx` | `"Deleted."` | `삭제되었습니다.` | new |
| B54 | `components/categories/CategoryManager.tsx` | `"Could not delete the category"` | `카테고리 삭제 실패` — toast title | new |
| B55 | `components/categories/CategoryManager.tsx` | `"Order saved."` | `카테고리 순서가 변경되었습니다.` | admin-frontend · category/page.tsx:344 |
| B56 | `components/categories/CategoryManager.tsx` | `"Could not save the new order"` | `순서 변경 실패` — toast title | admin-frontend · category/page.tsx:348 |
| B57 | `components/categories/CategoryManager.tsx` | `"Your account cannot register categories."` | `카테고리 등록 권한이 없습니다.` | new, based on admin-frontend · teacherErrorMessages.ts:22 |
| B58 | `components/categories/CategoryManager.tsx` | `Up to ${CATEGORY_RULES.maxTopLevel} main categories can be registered. Delete one to add another.` | `대분류는 최대 ${CATEGORY_RULES.maxTopLevel}개까지 등록할 수 있습니다. 새로 등록하려면 기존 대분류를 삭제해 주세요.` | new |
| B59 | `components/categories/CategoryManager.tsx` | `aria-label="Product categories"` | `상품 카테고리` | new |
| B60 | `components/categories/CategoryManager.tsx` | `Searching…` | `검색 중…` | new |
| B61 | `components/categories/CategoryManager.tsx` | `"No search results found"` | `검색 결과가 없습니다` | 5498:84158 desc |
| B62 | `components/categories/CategoryManager.tsx` | `"No categories yet"` | `등록된 카테고리가 없습니다` | admin-frontend · category/page.tsx:1033 |
| B63 | `components/categories/CategoryManager.tsx` | `No category matches "${searchTerm}". Try another name.` | `"${searchTerm}" 검색어에 해당하는 카테고리가 없습니다. 다른 명칭으로 검색해 주세요.` | new |
| B64 | `components/categories/CategoryManager.tsx` | `"Register a main category to start the tree."` | `대분류를 등록하여 카테고리를 구성해 주세요.` | new |
| B65 | `components/categories/CategoryManager.tsx` | `label="Clear search"` | `검색 초기화` | new |
| B66 | `components/categories/CategoryManager.tsx` | `title="Cannot delete"` | `삭제 불가` — alert title | new, based on 5498:84158 desc |

## C. Product list and product details

| # | File (path under src) | English now (exact) | Korean to use | Source |
|---|---|---|---|---|
| C1 | `app/(main)/shopping-mall/products/page.tsx` | `title: "Product Management"` | `상품 관리` | 8010:59065 |
| C2 | `app/(main)/shopping-mall/products/page.tsx` | `label="Loading product list…"` | `상품 목록을 불러오는 중…` | new |
| C3 | `components/products/list/ProductListScreen.tsx` | `${formatNumber(count)} ${word}${count === 1 ? "" : "s"}` | `${formatNumber(count)}건` — the helper `plural()` no longer needs the word or the "s"; the counter 건 follows the number | new, based on 8010:59065 desc |
| C4 | `components/products/list/ProductListScreen.tsx` | `"Selection limit reached"` | `선택 제한` — toast title | admin-frontend · list/page.tsx:270 |
| C5 | `components/products/list/ProductListScreen.tsx` | `You can select up to ${selection.max} products. ${plural(skipped, "row")} not selected.` | `한번에 최대 ${selection.max}건까지 선택 가능합니다. ${formatNumber(skipped)}건은 선택되지 않았습니다.` | new, based on 8010:59065 desc |
| C6 | `components/products/list/ProductListScreen.tsx` | `Delete ${plural(ids.length, "product")}? This deletes ${ids.length === 1 ? "it" : "them"} for everyone who uses the admin, not only for you.` | `선택한 상품 ${formatNumber(ids.length)}건을 삭제하시겠습니까? 삭제한 상품은 모든 관리자 화면에서 삭제되며 되돌릴 수 없습니다.` — no "it / them" choice | new, based on admin-frontend · list/page.tsx:286 |
| C7 | `components/products/list/ProductListScreen.tsx` | `"Delete products"` | `상품 삭제` — dialog title | admin-frontend · list/page.tsx:285 |
| C8 | `components/products/list/ProductListScreen.tsx` | `${plural(ids.length, "product")} deleted.` | `${formatNumber(ids.length)}건 삭제 완료` — toast detail under "상품이 삭제되었습니다." | new |
| C9 | `components/products/list/ProductListScreen.tsx` | `"Delete failed"` | `삭제에 실패했습니다.` — toast title | admin-frontend · list/page.tsx:272 |
| C10 | `components/products/list/ProductListScreen.tsx` | `title="Product Management"` | `상품 관리` | 8010:59065 |
| C11 | `components/products/list/ProductListScreen.tsx` | `Register` | `등록` — the link in the page header | 8010:59065 |
| C12 | `components/products/list/ProductListScreen.tsx` | `aria-label="Product list"` | `상품 목록` | new |
| C13 | `components/products/list/ProductListScreen.tsx` | `Total: <strong>` | `총 게시물 : ` — replace only "Total: "; lit. "Total posts : "; a space on both sides of the colon as in the frame | 8010:59065 |
| C14 | `components/products/list/ProductListScreen.tsx` | `Rows per page` | `페이지당 행 수` | new |
| C15 | `components/products/list/ProductListScreen.tsx` | `label="Delete"` | `삭제` | 8010:59065 |
| C16 | `components/products/list/ProductListScreen.tsx` | `</strong> selected` | `건 선택됨` — written right after the number: "3건 선택됨" | new |
| C17 | `components/products/list/ProductListScreen.tsx` | ` (maximum ${selection.max})` | ` (최대 ${selection.max}건)` | new, based on 8010:59065 desc |
| C18 | `components/products/list/ProductListScreen.tsx` | `label="Clear"` | `선택 해제` | new |
| C19 | `components/products/list/ProductListScreen.tsx` | `Sorted within this page (API returns newest first).` | `현재 페이지 안에서만 정렬됩니다. (기본 순서: 최신 등록순)` | new |
| C20 | `components/products/list/ProductListScreen.tsx` | `label="Loading products…"` | `상품 목록을 불러오는 중…` | new |
| C21 | `components/products/list/ProductListScreen.tsx` | `emptyTitle="No products found"` | `검색 결과가 없습니다` when a search or filter is active; `등록된 상품이 없습니다` when there is none — the title has to become conditional (see E22) | 8010:59065 desc; admin-frontend · list/page.tsx:493 |
| C22 | `components/products/list/ProductListScreen.tsx` | `"No product matches this search or these filters."` | `검색어 또는 필터 조건을 변경해 주세요.` — lit. "Please change the search term or the filter conditions." | new |
| C23 | `components/products/list/ProductListScreen.tsx` | `"No product has been registered yet."` | `상품을 등록하면 이 목록에 표시됩니다.` — lit. "Registered products are shown in this list." | new |
| C24 | `components/products/list/ProductListScreen.tsx` | `label="Reset filters"` | `필터 초기화` | new |
| C25 | `components/products/list/ProductListScreen.tsx` | `Register a product` | `상품 등록` | 8010:57833 |
| C26 | `components/products/list/ProductListScreen.tsx` | `Products, page ${state.page}` <br> ` of ${totalPage}` | `상품 목록, ${state.page}페이지` when the total is unknown; `상품 목록, 전체 ${totalPage}페이지 중 ${state.page}페이지` when it is known — table caption for screen readers; the total comes first | new |
| C27 | `components/products/list/ProductListToolbar.tsx` | `label: "Product name"` | `상품명` — search type | 8010:59065 |
| C28 | `components/products/list/ProductListToolbar.tsx` | `label: "Category"` | `카테고리` — search type | 8010:59065 desc |
| C29 | `components/products/list/ProductListToolbar.tsx` | `label: "Main"` | `메인 상품` — product type MAIN = a product that has options (see E27) | new |
| C30 | `components/products/list/ProductListToolbar.tsx` | `label: "Supplementary"` | `단권 상품` — product type SUPPLEMENTARY = a product without options (see E27) | new |
| C31 | `components/products/list/ProductListToolbar.tsx` | `"Loading…"` | `불러오는 중…` | admin-frontend · SingleVolumeOptionModal.tsx:207 |
| C32 | `components/products/list/ProductListToolbar.tsx` | `"Could not load"` | `불러오기 실패` | new |
| C33 | `components/products/list/ProductListToolbar.tsx` | `"All"` | `전체` | new |
| C34 | `components/products/list/ProductListToolbar.tsx` | `aria-label="Product search"` | `상품 검색` | new |
| C35 | `components/products/list/ProductListToolbar.tsx` | `Search by` | `검색 조건` — screen-reader label of the search-type select | new |
| C36 | `components/products/list/ProductListToolbar.tsx` | `Search term` | `검색어` — screen-reader label of the search box | 8010:59065 |
| C37 | `components/products/list/ProductListToolbar.tsx` | `"Enter a category name"` | `검색어 입력` — the frame has one placeholder for both search types (see E21) | 8010:59065 |
| C38 | `components/products/list/ProductListToolbar.tsx` | `"Enter a product name"` | `검색어 입력` | 8010:59065 |
| C39 | `components/products/list/ProductListToolbar.tsx` | `aria-label="Search"` | `검색` | admin-frontend · category/page.tsx:975 |
| C40 | `components/products/list/ProductListToolbar.tsx` | `aria-label="Filters"` | `필터` | new |
| C41 | `components/products/list/ProductListToolbar.tsx` | `label="Major category"` | `대분류` | 8010:57833 |
| C42 | `components/products/list/ProductListToolbar.tsx` | `label="Medium category"` | `중분류` | 8010:57833 |
| C43 | `components/products/list/ProductListToolbar.tsx` | `label="Minor category"` | `소분류` | 8010:57833 |
| C44 | `components/products/list/ProductListToolbar.tsx` | `label="Product type"` | `상품 유형` | new |
| C45 | `components/products/list/ProductListToolbar.tsx` | `label="Reset filters"` | `필터 초기화` | new |
| C46 | `components/products/list/ProductListToolbar.tsx` | `A category search looks at every category level, so the filters are off.` | `카테고리 검색은 대분류·중분류·소분류 전체를 대상으로 하므로 필터를 사용할 수 없습니다.` | new |
| C47 | `components/products/list/ProductTable.tsx` | `aria-label="Select all products on this page"` | `현재 페이지의 상품 전체 선택` — the frame's column header for this column is `선택` | new |
| C48 | `components/products/list/ProductTable.tsx` | `Thumbnail` | `썸네일` | 8010:59065 |
| C49 | `components/products/list/ProductTable.tsx` | `label="Product Name"` | `상품명` | 8010:59065 |
| C50 | `components/products/list/ProductTable.tsx` | `label="Selling Price"` | `판매금액` — lit. "sales amount"; list column caption only | 8010:59065 |
| C51 | `components/products/list/ProductTable.tsx` | `Category (Course)` | `카테고리(과정)` — no space before the bracket | 8010:59065 |
| C52 | `components/products/list/ProductTable.tsx` | `Exposure Status` | `노출여부` — lit. "exposed or not"; list column caption only | 8010:59065 |
| C53 | `components/products/list/ProductTable.tsx` | `label="Registration Date"` | `등록일자` | 8010:59065 |
| C54 | `components/products/list/ProductTable.tsx` | `Select ${row.productName}` | `${row.productName} 선택` | new, based on 8010:59065 |
| C55 | `components/products/list/ProductTable.tsx` | `List price </span>` | `단가 ` — screen-reader text before the crossed-out price; keep the trailing space | 8010:57833 |
| C56 | `components/products/list/ProductTable.tsx` | `data-label="Category"` | `카테고리(과정)` — label of the cell in the phone card layout | 8010:59065 |
| C57 | `components/products/list/ProductTable.tsx` | `data-label="Exposure"` | `노출여부` | 8010:59065 |
| C58 | `components/products/list/ProductTable.tsx` | `data-label="Registered"` | `등록일자` | 8010:59065 |
| C59 | `components/products/list/ProductStatusSelect.tsx` | `"Exposure status saved"` | `저장 완료` — toast title; lit. "Saved" | admin-frontend · list/page.tsx:305 |
| C60 | `components/products/list/ProductStatusSelect.tsx` | `${productName}: ${next ? "Yes" : "No"}` | `${productName}: ${next ? "예" : "아니오"}` | 8010:59065 desc |
| C61 | `components/products/list/ProductStatusSelect.tsx` | `"Exposure status not saved"` | `저장에 실패했습니다.` — toast title | admin-frontend · list/page.tsx:307 |
| C62 | `components/products/list/ProductStatusSelect.tsx` | `Exposure status of ${productName}` | `${productName} 노출여부` | new, based on 8010:59065 |
| C63 | `components/products/list/ProductStatusSelect.tsx` | `<option value="yes">Yes</option>` | `예` | 8010:59065 |
| C64 | `components/products/list/ProductStatusSelect.tsx` | `<option value="no">No</option>` | `아니오` | 8010:59065 desc |
| C65 | `components/products/list/ExportCsvButton.tsx` | `"CSV exported"` | `CSV 다운로드 완료` | new |
| C66 | `components/products/list/ExportCsvButton.tsx` | `${formatNumber(products.length)} products` | `상품 ${formatNumber(products.length)}건` | new |
| C67 | `components/products/list/ExportCsvButton.tsx` | `"Export failed"` | `CSV 다운로드에 실패했습니다.` | new |
| C68 | `components/products/list/ExportCsvButton.tsx` | `Exporting ${progress.done}/${progress.total}…` | `다운로드 중 ${progress.done}/${progress.total}…` | new |
| C69 | `components/products/list/ExportCsvButton.tsx` | `"Export CSV"` | `CSV 다운로드` | new |
| C70 | `components/products/list/ExportCsvButton.tsx` | `Exporting page ${progress.done} of ${progress.total}` | `전체 ${progress.total}페이지 중 ${progress.done}페이지 다운로드 중` — the total comes first | new |
| C71 | `components/products/list/export-csv.ts` | `"ID"` | `ID` — keep | new |
| C72 | `components/products/list/export-csv.ts` | `"Product code"` | `상품코드` | 8010:57833 |
| C73 | `components/products/list/export-csv.ts` | `"Product name"` | `상품명` | 8010:59065 |
| C74 | `components/products/list/export-csv.ts` | `"List price"` | `단가` | 8010:57833 |
| C75 | `components/products/list/export-csv.ts` | `"Selling price"` | `판매금액` — the CSV repeats the list's column captions | 8010:59065 |
| C76 | `components/products/list/export-csv.ts` | `"Category path"` | `카테고리(과정)` | 8010:59065 |
| C77 | `components/products/list/export-csv.ts` | `"Visible"` | `노출여부` | 8010:59065 |
| C78 | `components/products/list/export-csv.ts` | `"On sale"` | `판매상태` | 8010:57833 |
| C79 | `components/products/list/export-csv.ts` | `"Registered at"` | `등록일자` | 8010:59065 |
| C80 | `components/products/list/export-csv.ts` | `"Yes" : "No"` | `"예" : "아니오"` | 8010:59065 desc |
| C81 | `components/products/list/export-csv.ts` | `products-${dayjs(now).format("YYYYMMDD-HHmm")}.csv` | keep — the file name stays in plain letters | new |
| C82 | `app/(main)/shopping-mall/products/details/[id]/page.tsx` | `title: "Product Details"` | `상품 상세` | admin-frontend · shop-details/page.tsx:758 |
| C83 | `app/(main)/shopping-mall/products/details/[id]/page.tsx` | `label="Loading product…"` | `상품 정보를 불러오는 중…` | admin-frontend · edit/page.tsx:263 |
| C84 | `components/products/details/ProductDetailsScreen.tsx` | `"Details"` | `상품 상세` — last breadcrumb item | admin-frontend · shop-details/page.tsx:758 |
| C85 | `components/products/details/ProductDetailsScreen.tsx` | `Back to list` | `목록으로` | admin-frontend · shop-details/page.tsx:781 |
| C86 | `components/products/details/ProductDetailsScreen.tsx` | `Product details` | `상품 상세` — page title (before the name is loaded) and `aria-label`; three places in the file | admin-frontend · shop-details/page.tsx:758 |
| C87 | `components/products/details/ProductDetailsScreen.tsx` | `title="Product not found"` | `상품을 찾을 수 없습니다` | new |
| C88 | `components/products/details/ProductDetailsScreen.tsx` | `message="This product does not exist or has been deleted."` | `존재하지 않거나 삭제된 상품입니다.` | new |
| C89 | `components/products/details/ProductDetailsScreen.tsx` | `Edit` | `수정` — the link in the page header | new, based on 5498:84860 |
| C90 | `components/products/details/DetailsTabs.tsx` | `label: "Overview"` | `상품 정보` — lit. "product information" | new |
| C91 | `components/products/details/DetailsTabs.tsx` | `label: "Options"` | `옵션` | new, based on 8010:57833 |
| C92 | `components/products/details/DetailsTabs.tsx` | `label: "Same category"` | `동일 카테고리 상품` — lit. "products of the same category" | new |
| C93 | `components/products/details/DetailsTabs.tsx` | `aria-label="Product details sections"` | `상품 상세 탭` | new |
| C94 | `components/products/details/OverviewTab.tsx` | `tax: "Taxable"` | `과세` | 5498:84860 desc |
| C95 | `components/products/details/OverviewTab.tsx` | `tax_free: "Tax-exempt"` | `비과세` | 5498:84860 desc |
| C96 | `components/products/details/OverviewTab.tsx` | `"Yes" : "No"` | `"예" : "아니오"` | 8010:59065 desc |
| C97 | `components/products/details/OverviewTab.tsx` | `title="Basic information"` | `기본 정보` | new, based on 8010:57833 desc |
| C98 | `components/products/details/OverviewTab.tsx` | `label: "Product name"` | `상품명` | 8010:57833 |
| C99 | `components/products/details/OverviewTab.tsx` | `label: "Product code"` | `상품코드` | 8010:57833 |
| C100 | `components/products/details/OverviewTab.tsx` | `label: "Product type"` | `상품 유형` | new |
| C101 | `components/products/details/OverviewTab.tsx` | `"Main (with options)"` | `메인 상품 (옵션 있음)` — see E27 | new |
| C102 | `components/products/details/OverviewTab.tsx` | `"Supplementary"` | `단권 상품` — see E27 | new |
| C103 | `components/products/details/OverviewTab.tsx` | `label: "Category"` | `카테고리` | 5498:84860 |
| C104 | `components/products/details/OverviewTab.tsx` | `label: "Registered"` | `등록일자` | 8010:59065 |
| C105 | `components/products/details/OverviewTab.tsx` | `label: "Last updated"` | `수정일자` | new |
| C106 | `components/products/details/OverviewTab.tsx` | `title="Price and status"` | `가격 및 상태` | new |
| C107 | `components/products/details/OverviewTab.tsx` | `label: "List price"` | `단가` | 8010:57833 |
| C108 | `components/products/details/OverviewTab.tsx` | `label: "Selling price"` | `판매가` | 8010:57833 |
| C109 | `components/products/details/OverviewTab.tsx` | `label: "Exposure status"` | `노출상태` | 8010:57833 |
| C110 | `components/products/details/OverviewTab.tsx` | `label: "Sales status"` | `판매상태` | 8010:57833 |
| C111 | `components/products/details/OverviewTab.tsx` | `title="ERP"` | `ERP` — keep | 8010:57833 |
| C112 | `components/products/details/OverviewTab.tsx` | `label: "ERP code"` | `ERP 코드` | 8010:57833 |
| C113 | `components/products/details/OverviewTab.tsx` | `label: "ERP name"` | `상품ERP명` | 8010:57833 |
| C114 | `components/products/details/OverviewTab.tsx` | `label: "Quantity"` | `갯수` | 8010:57833 |
| C115 | `components/products/details/OverviewTab.tsx` | `label: "Tax type"` | `비과세` — lit. "tax-exempt"; the value next to it is 과세 or 비과세 (see E9) | 8010:57833 |
| C116 | `components/products/details/OverviewTab.tsx` | `label: "ERP unit price"` | `ERP 단가` — outside the form the full name is used (see E10) | 8010:57833 desc |
| C117 | `components/products/details/OverviewTab.tsx` | `>Description<` | `상세설명` | 8010:57833 |
| C118 | `components/products/details/OverviewTab.tsx` | `label="Loading product…"` | `상품 정보를 불러오는 중…` | admin-frontend · edit/page.tsx:263 |
| C119 | `components/products/details/OptionsTab.tsx` | `SINGLE_VOLUME: "Single item"` | `단권 옵션` — lit. "single-volume option" | 8034:61058 |
| C120 | `components/products/details/OptionsTab.tsx` | `CATEGORY_OPTION: "Category option"` | `카테고리 옵션` — the term is taken from the frame's button `카테고리 옵션 추가` | 8010:57833 |
| C121 | `components/products/details/OptionsTab.tsx` | `label="Loading options…"` | `옵션을 불러오는 중…` | new |
| C122 | `components/products/details/OptionsTab.tsx` | `emptyTitle="No options"` | `옵션 없음` | admin-frontend · ProductRegisterForm/index.tsx:1201 |
| C123 | `components/products/details/OptionsTab.tsx` | `"This main product has no option sets yet."` | `이 상품에는 아직 등록된 옵션이 없습니다.` | new |
| C124 | `components/products/details/OptionsTab.tsx` | `"Supplementary products have no options."` | `단권 상품에는 옵션이 없습니다.` | new |
| C125 | `components/products/details/OptionsTab.tsx` | `Option group {group.optionGroup}` | `옵션 {group.optionGroup}번` — gives "옵션 1번"; lit. "option no. 1" | 8010:57833 |
| C126 | `components/products/details/OptionsTab.tsx` | `No options in this group.` | `이 옵션에 등록된 상품이 없습니다.` | new |
| C127 | `components/products/details/OptionsTab.tsx` | `Options of group {group.optionGroup} ({typeLabel})` | `옵션 {group.optionGroup}번 ({typeLabel}) 상품 목록` — table caption for screen readers | new |
| C128 | `components/products/details/OptionsTab.tsx` | `Option code` | `상품코드` — option table header | 8010:57833 |
| C129 | `components/products/details/OptionsTab.tsx` | `Option name` | `도서명` — lit. "book title" | 8010:57833 |
| C130 | `components/products/details/OptionsTab.tsx` | `>Price<` | `판매가` — option table header (see E28) | 8010:57833 |
| C131 | `components/products/details/SameCategoryTab.tsx` | `label="Loading products of this category…"` | `동일 카테고리의 상품을 불러오는 중…` | new |
| C132 | `components/products/details/SameCategoryTab.tsx` | `emptyTitle="No other products"` | `다른 상품이 없습니다` | new |
| C133 | `components/products/details/SameCategoryTab.tsx` | `No other product is registered in ${path}.` | `${path} 카테고리에 등록된 다른 상품이 없습니다.` | new |
| C134 | `components/products/details/SameCategoryTab.tsx` | `{formatNumber(othersTotal)} other product{othersTotal === 1 ? "" : "s"} in <strong>{path}</strong>` <br> ` — the newest ${others.length} are shown` | `<strong>{path}</strong> 카테고리의 다른 상품 {formatNumber(othersTotal)}건` then, only when not all are shown, ` (최신 ${others.length}건만 표시)` — the path comes first; no "s" choice; the full stop after it stays | new |
| C135 | `components/products/details/SameCategoryTab.tsx` | `Open in product list` | `상품 목록에서 보기` | new |
| C136 | `components/products/details/SameCategoryTab.tsx` | `"Visible"` | `노출` | 5498:84860 desc |
| C137 | `components/products/details/SameCategoryTab.tsx` | `"Hidden"` | `미노출` — lit. "not exposed" | 5498:84860 desc |
| C138 | `components/products/details/SameCategoryTab.tsx` | `label="Loading product…"` | `상품 정보를 불러오는 중…` | admin-frontend · edit/page.tsx:263 |
| C139 | `components/products/details/SameCategoryTab.tsx` | `emptyTitle="No minor category"` | `소분류가 지정되지 않았습니다` | new |
| C140 | `components/products/details/SameCategoryTab.tsx` | `emptyDescription="This product has no minor category, so there are no related products to show."` | `이 상품에는 소분류가 지정되어 있지 않아 동일 카테고리의 상품을 표시할 수 없습니다.` | new |
| C141 | `components/products/details/ProductGallery.tsx` | `${productName} — image ${index + 1} of ${list.length}` | `${productName} 이미지 ${index + 1}/${list.length}` | new |
| C142 | `components/products/details/ProductGallery.tsx` | `No image registered` | `등록된 이미지가 없습니다` | new |
| C143 | `components/products/details/ProductGallery.tsx` | `aria-label="Product images"` | `상품 이미지` | new |
| C144 | `components/products/details/ProductGallery.tsx` | `Show image ${position + 1}` | `이미지 ${position + 1} 보기` | admin-frontend · shop-details/page.tsx:509 |

## D. Product register / edit form

| # | File (path under src) | English now (exact) | Korean to use | Source |
|---|---|---|---|---|
| D1 | `app/(main)/shopping-mall/products/create/page.tsx` | `Product Registration` | `상품 등록` — metadata title and page title | 8010:57833 |
| D2 | `app/(main)/shopping-mall/products/create/page.tsx` | `"Register"` | `상품 등록` — last breadcrumb item | 8010:57833 |
| D3 | `app/(main)/shopping-mall/products/create/page.tsx` | `label="Loading the form…"` | `입력 화면을 불러오는 중…` | new |
| D4 | `app/(main)/shopping-mall/products/edit/[id]/page.tsx` | `Product Edit` | `상품 수정` — metadata title and page title | 5498:84860 |
| D5 | `app/(main)/shopping-mall/products/edit/[id]/page.tsx` | `"Edit"` | `상품 수정` — last breadcrumb item | 5498:84860 |
| D6 | `app/(main)/shopping-mall/products/edit/[id]/page.tsx` | `label="Loading the form…"` | `입력 화면을 불러오는 중…` | new |
| D7 | `components/products/form/ProductEditScreen.tsx` | `Back to list` | `목록으로` | admin-frontend · shop-details/page.tsx:781 |
| D8 | `components/products/form/ProductEditScreen.tsx` | `message="This product address is not valid."` | `올바르지 않은 상품 주소입니다.` | new |
| D9 | `components/products/form/ProductEditScreen.tsx` | `label="Loading the product…"` | `상품 정보를 불러오는 중…` | admin-frontend · edit/page.tsx:263 |
| D10 | `components/products/form/ProductForm.tsx` | `"The product was not registered"` | `상품 등록에 실패했습니다.` — toast title | admin-frontend · create/page.tsx:87 |
| D11 | `components/products/form/ProductForm.tsx` | `"The changes were not saved"` | `상품 수정에 실패했습니다.` — toast title | admin-frontend · edit/page.tsx:237 |
| D12 | `components/products/form/ProductForm.tsx` | `"Product registered"` | `상품이 성공적으로 등록되었습니다.` — toast title; the detail line is the product name | admin-frontend · create/page.tsx:84 |
| D13 | `components/products/form/ProductForm.tsx` | `"Product saved"` | `상품 정보가 성공적으로 수정되었습니다.` — toast title | admin-frontend · edit/page.tsx:234 |
| D14 | `components/products/form/ProductForm.tsx` | `"Register" : "Save"` | `"등록" : "저장"` — main button of the last step | 8010:57833; 5498:84860 |
| D15 | `components/products/form/ProductForm.tsx` | `"Product registration form"` | `상품 등록 입력 양식` | new |
| D16 | `components/products/form/ProductForm.tsx` | `"Product edit form"` | `상품 수정 입력 양식` | new |
| D17 | `components/products/form/ProductForm.tsx` | `Draft restored (saved {formatDateTime(draftSavedAt)}).` | `임시 저장된 내용을 불러왔습니다. (저장 시각: {formatDateTime(draftSavedAt)})` | new |
| D18 | `components/products/form/ProductForm.tsx` | `label="Discard"` | `임시 저장 삭제` — lit. "delete the draft" | new |
| D19 | `components/products/form/ProductForm.tsx` | `Your account cannot {mode === "create" ? "register" : "edit"} products.` | `상품 {mode === "create" ? "등록" : "수정"} 권한이 없습니다.` — gives "상품 등록 권한이 없습니다." | new, based on admin-frontend · teacherErrorMessages.ts:22 |
| D20 | `components/products/form/ProductForm.tsx` | `1. Basic info` | `1. 기본 정보` | new, based on 8010:57833 desc |
| D21 | `components/products/form/ProductForm.tsx` | `2. Images &amp; status` | `2. 이미지 및 상태` | new |
| D22 | `components/products/form/ProductForm.tsx` | `3. Category &amp; options` | `3. 카테고리 및 옵션` | new |
| D23 | `components/products/form/ProductForm.tsx` | `4. ERP &amp; review` | `4. ERP 정보 및 확인` | new |
| D24 | `components/products/form/ProductForm.tsx` | `"The product was not registered."` | `상품 등록에 실패했습니다.` — bold start of the error box | admin-frontend · create/page.tsx:87 |
| D25 | `components/products/form/ProductForm.tsx` | `"The changes were not saved."` | `상품 수정에 실패했습니다.` | admin-frontend · edit/page.tsx:237 |
| D26 | `components/products/form/ProductForm.tsx` | `Everything you entered is kept — fix it and press {submitLabel} again.` | `입력한 내용은 그대로 유지됩니다. 수정한 후 [{submitLabel}] 버튼을 다시 눌러 주세요.` | new |
| D27 | `components/products/form/ProductForm.tsx` | `label="Cancel"` | `취소` | 8010:57833 |
| D28 | `components/products/form/ProductForm.tsx` | `label="Back"` | `이전` | new |
| D29 | `components/products/form/ProductForm.tsx` | `label="Next"` | `다음` | new |
| D30 | `components/products/form/useLeaveGuard.ts` | `"All entered information will be deleted. Do you want to cancel?"` | `입력한 정보가 모두 삭제됩니다. 취소하시겠습니까?` | 8010:57833 desc |
| D31 | `components/products/form/useLeaveGuard.ts` | `header: "Cancel"` | `취소` | 8010:57833 |
| D32 | `components/products/form/useLeaveGuard.ts` | `acceptLabel: "Yes"` | `예` | 8010:57833 desc |
| D33 | `components/products/form/useLeaveGuard.ts` | `rejectLabel: "No"` | `아니오` | 8010:57833 desc |
| D34 | `components/products/form/ProductFormStepper.tsx` | `aria-label="Form steps"` | `입력 단계` | new |
| D35 | `components/products/form/ProductFormStepper.tsx` | `Step {current} of {STEPS.length} · {currentLabel}` | `{STEPS.length}단계 중 {current}단계 · {currentLabel}` — the total comes first | new |
| D36 | `components/products/form/ProductFormStepper.tsx` | `Step {step}: </span>` | `{step}단계: ` | new |
| D37 | `components/products/form/ProductFormStepper.tsx` | ` (has errors)` | ` (오류 있음)` | new |
| D38 | `components/products/form/ProductFormStepper.tsx` | ` (completed)` | ` (완료)` | new |
| D39 | `components/products/form/product-form.model.ts` | `label: "Basic info"` | `기본 정보` | new, based on 8010:57833 desc |
| D40 | `components/products/form/product-form.model.ts` | `label: "Images & status"` | `이미지 및 상태` | new |
| D41 | `components/products/form/product-form.model.ts` | `label: "Category & options"` | `카테고리 및 옵션` | new |
| D42 | `components/products/form/product-form.model.ts` | `label: "ERP & review"` | `ERP 정보 및 확인` | new |
| D43 | `components/products/form/product-form.model.ts` | `label: "Taxable"` | `과세` | 5498:84860 desc |
| D44 | `components/products/form/product-form.model.ts` | `label: "Tax-exempt"` | `비과세` | 5498:84860 desc |
| D45 | `components/products/form/product-form.model.ts` | `label: "Yes"` | `예` | 8010:57833 |
| D46 | `components/products/form/product-form.model.ts` | `label: "No"` | `아니오` | 8010:57833 desc |
| D47 | `components/products/form/product-form.model.ts` | `productNameRequired: "Enter the product name."` | `상품명을 입력해 주세요.` | admin-frontend · ProductRegisterForm/index.tsx:158 |
| D48 | `components/products/form/product-form.model.ts` | `The product name can be up to ${FORM_LIMITS.productNameMax} characters.` | `상품명은 최대 ${FORM_LIMITS.productNameMax}자까지 입력할 수 있습니다.` | admin-frontend · ProductRegisterForm/index.tsx:161 |
| D49 | `components/products/form/product-form.model.ts` | `productCodeMissing: "The product code could not be generated. Press Regenerate."` | `상품코드를 생성하지 못했습니다. [다시 생성] 버튼을 눌러 주세요.` | new |
| D50 | `components/products/form/product-form.model.ts` | `priceRequired: "Enter the unit price."` | `단가를 입력해 주세요.` | new |
| D51 | `components/products/form/product-form.model.ts` | `pricePositive: "The unit price must be greater than ₩0."` | `단가는 0보다 큰 값을 입력해 주세요.` | new, based on admin-frontend · ProductRegisterForm/index.tsx:192 |
| D52 | `components/products/form/product-form.model.ts` | `unitPriceRequired: "Enter the selling price."` | `판매가를 입력해 주세요.` | new |
| D53 | `components/products/form/product-form.model.ts` | `unitPricePositive: "The selling price must be greater than ₩0."` | `판매가는 0보다 큰 값을 입력해 주세요.` | new, based on admin-frontend · ProductRegisterForm/index.tsx:192 |
| D54 | `components/products/form/product-form.model.ts` | `unitPriceNotLower: "The selling price must be lower than the unit price."` | `판매가는 단가보다 낮아야 합니다.` — see E7 | new |
| D55 | `components/products/form/product-form.model.ts` | `moneyTooLarge: "The amount can be up to ₩2,147,483,647."` | `금액은 최대 ₩2,147,483,647까지 입력할 수 있습니다.` | new |
| D56 | `components/products/form/product-form.model.ts` | `descriptionRequired: "Enter the detailed description."` | `상세설명을 입력해 주세요.` | new |
| D57 | `components/products/form/product-form.model.ts` | `imagesRequired: "Add at least one image."` | `이미지를 1장 이상 등록해 주세요.` | new |
| D58 | `components/products/form/product-form.model.ts` | `imagesUploading: "Wait until the images finish uploading."` | `이미지 업로드가 완료될 때까지 기다려 주세요.` | new |
| D59 | `components/products/form/product-form.model.ts` | `isVisibleRequired: "Select the exposure status."` | `노출상태를 선택해 주세요.` | new |
| D60 | `components/products/form/product-form.model.ts` | `onSaleRequired: "Select the sales status."` | `판매상태를 선택해 주세요.` | new |
| D61 | `components/products/form/product-form.model.ts` | `categoryRequired: "Select a major category."` | `대분류를 선택해 주세요.` | admin-frontend · ProductRegisterForm/index.tsx:301 |
| D62 | `components/products/form/product-form.model.ts` | `subCategoryRequired: "Select a medium category."` | `중분류를 선택해 주세요.` | admin-frontend · ProductRegisterForm/index.tsx:312 |
| D63 | `components/products/form/product-form.model.ts` | `childCategoryRequired: "Select a minor category."` | `소분류를 선택해 주세요.` | admin-frontend · ProductRegisterForm/index.tsx:323 |
| D64 | `components/products/form/product-form.model.ts` | `optionPriceRequired: "Enter the option price (₩0 or more)."` | `옵션 판매가를 입력해 주세요. (₩0 이상)` | new |
| D65 | `components/products/form/product-form.model.ts` | `optionsRequired: "Add at least one option, or turn off “Required option for purchase”."` | `옵션을 1개 이상 추가하거나 “상품 구매 필수 옵션 선택”을 해제해 주세요.` | new |
| D66 | `components/products/form/product-form.model.ts` | `erpNameRequired: "Enter the ERP product name."` | `상품ERP명을 입력해 주세요.` | new |
| D67 | `components/products/form/product-form.model.ts` | `The ERP product name can be up to ${FORM_LIMITS.erpNameMax} characters.` | `상품ERP명은 최대 ${FORM_LIMITS.erpNameMax}자까지 입력할 수 있습니다.` | new |
| D68 | `components/products/form/product-form.model.ts` | `quantityRequired: "Enter the quantity."` | `갯수를 입력해 주세요.` | new |
| D69 | `components/products/form/product-form.model.ts` | `quantityPositive: "The quantity must be greater than 0."` | `갯수는 1 이상의 숫자여야 합니다.` — lit. "The quantity must be a number of 1 or more." | admin-frontend · ProductRegisterForm/index.tsx:220 |
| D70 | `components/products/form/product-form.model.ts` | `quantityTooLarge: "The quantity is too large."` | `입력할 수 있는 갯수를 초과했습니다.` | new |
| D71 | `components/products/form/product-form.model.ts` | `taxTypeRequired: "Select the tax type."` | `비과세를 선택해 주세요.` — same sentence as the frame's placeholder of this field | new, based on 8010:57833 |
| D72 | `components/products/form/product-form.model.ts` | `erpUnitPriceRequired: "Enter the ERP unit price (₩0 or more)."` | `ERP 단가를 입력해 주세요. (₩0 이상)` | new |
| D73 | `components/products/form/StepBasicInfo.tsx` | `"Generating a product code…"` | `상품코드를 생성하는 중…` | new |
| D74 | `components/products/form/StepBasicInfo.tsx` | `Could not generate a code: ${codeQuery.error.message}` | `상품코드를 생성하지 못했습니다: ${codeQuery.error.message}` | new |
| D75 | `components/products/form/StepBasicInfo.tsx` | `"Assigned automatically when the product is registered."` | `상품코드는 상품 등록 시 자동 생성됩니다.` | new, based on 8010:57833 desc |
| D76 | `components/products/form/StepBasicInfo.tsx` | `"The product code cannot be changed."` | `상품코드는 변경할 수 없습니다.` | new, based on 5498:84860 desc |
| D77 | `components/products/form/StepBasicInfo.tsx` | `label="Product name"` | `상품명` | 8010:57833 |
| D78 | `components/products/form/StepBasicInfo.tsx` | `Shared QA data: start the name with ${HW3_RECORD_PREFIX}` | `공용 QA 데이터입니다. 상품명은 반드시 ${HW3_RECORD_PREFIX} 접두어로 시작해 주세요.` — the fixed word 접두어로 follows the prefix | new |
| D79 | `components/products/form/StepBasicInfo.tsx` | `placeholder="Product name"` | `상품명` | 5498:84592 |
| D80 | `components/products/form/StepBasicInfo.tsx` | `label="Product code"` | `상품코드` | 8010:57833 |
| D81 | `components/products/form/StepBasicInfo.tsx` | `"Generating…"` | `생성 중…` | new |
| D82 | `components/products/form/StepBasicInfo.tsx` | `"Product code"` | `상품코드` — placeholder of the read-only field | 8010:57833 |
| D83 | `components/products/form/StepBasicInfo.tsx` | `label="Regenerate"` | `다시 생성` | new |
| D84 | `components/products/form/StepBasicInfo.tsx` | `label="Unit price"` | `단가` | 8010:57833 |
| D85 | `components/products/form/StepBasicInfo.tsx` | `hint="List price before discount."` | `할인 전 정가입니다.` | new |
| D86 | `components/products/form/StepBasicInfo.tsx` | `placeholder="₩0"` | `₩0` — keep | 8010:57833 |
| D87 | `components/products/form/StepBasicInfo.tsx` | `label="Selling price"` | `판매가` — see E3 for the edit screen | 8010:57833 |
| D88 | `components/products/form/StepBasicInfo.tsx` | `hint="The price the customer pays — lower than the unit price."` | `고객이 결제하는 실제 판매가입니다. 단가보다 낮아야 합니다.` | new, based on 8010:57833 desc |
| D89 | `components/products/form/StepBasicInfo.tsx` | `label="Detailed description"` | `상세설명` | 8010:57833 |
| D90 | `components/products/form/StepBasicInfo.tsx` | `placeholder="Describe the product"` | `상품 상세설명을 입력해 주세요.` | new, based on admin-frontend · ProductRegisterForm/index.tsx:1055 |
| D91 | `components/products/form/StepImagesStatus.tsx` | `label="Images"` | `이미지` | 8010:57833 |
| D92 | `components/products/form/StepImagesStatus.tsx` | `Recommended 800×800 px (square).` <br> `up to ${maxSizeMB} MB each, ${MIN_IMAGES}–${MAX_IMAGES} images. The first image is the main image.` | `권장 사이즈 : 800x800px ( 정사각형 ) / 최대 ${MAX_IMAGES}장까지 등록 가능합니다.` then ` ${extensions} 형식, 파일당 최대 ${maxSizeMB}MB. 첫 번째 이미지가 대표 이미지입니다.` — the first sentence is the frame's hint (the frame has the number 4 where `${MAX_IMAGES}` is); `${extensions}` is the upper-case extension list the code already builds; `${MIN_IMAGES}` is no longer shown | 8010:57833 (first sentence); new (second part) |
| D93 | `components/products/form/StepImagesStatus.tsx` | `label="Exposure status"` | `노출상태` | 8010:57833 |
| D94 | `components/products/form/StepImagesStatus.tsx` | `hint="Yes = customers can see the product."` | `예: 고객에게 상품이 노출됩니다.` | new, based on 8010:57833 desc |
| D95 | `components/products/form/StepImagesStatus.tsx` | `placeholder="Select"` | `선택` — two places in the file | new |
| D96 | `components/products/form/StepImagesStatus.tsx` | `label="Sales status"` | `판매상태` | 8010:57833 |
| D97 | `components/products/form/StepImagesStatus.tsx` | `hint="No = the product cannot be ordered."` | `아니오: 상품을 주문할 수 없습니다.` | new, based on 8010:57833 desc |
| D98 | `components/products/form/ImageUploadField.tsx` | `"${fileName}" was not added: up to ${MAX_IMAGES} images can be registered.` | `"${fileName}" 파일은 추가되지 않았습니다. 이미지는 최대 ${MAX_IMAGES}장까지 등록 가능합니다.` | new, based on 8010:57833 |
| D99 | `components/products/form/ImageUploadField.tsx` | `"${removed.image.name}" cannot come back: ${MAX_IMAGES} images are already registered.` | `"${removed.image.name}" 파일은 되돌릴 수 없습니다. 이미 이미지 ${MAX_IMAGES}장이 등록되어 있습니다.` | new |
| D100 | `components/products/form/ImageUploadField.tsx` | `aria-label="Product images"` | `상품 이미지` | new |
| D101 | `components/products/form/ImageUploadField.tsx` | `Image ${index + 1}: ${image.name}` | `이미지 ${index + 1}: ${image.name}` | new |
| D102 | `components/products/form/ImageUploadField.tsx` | `>Main<` | `대표` — badge on the first image; lit. "representative (image)" | new, based on 8010:59065 desc |
| D103 | `components/products/form/ImageUploadField.tsx` | `Remove image ${index + 1}: ${image.name}` | `이미지 ${index + 1} 삭제: ${image.name}` | new |
| D104 | `components/products/form/ImageUploadField.tsx` | `"upload failed" : "uploading"` | `"업로드 실패" : "업로드 중"` | new |
| D105 | `components/products/form/ImageUploadField.tsx` | `label="Retry"` | `다시 시도` | new |
| D106 | `components/products/form/ImageUploadField.tsx` | `label="Remove"` | `삭제` | new |
| D107 | `components/products/form/ImageUploadField.tsx` | `Uploading ${item.file.name}` | `${item.file.name} 업로드 중` | new |
| D108 | `components/products/form/ImageUploadField.tsx` | `"Waiting…"` | `대기 중…` | new |
| D109 | `components/products/form/ImageUploadField.tsx` | `"Uploading…"` | `업로드 중…` | new |
| D110 | `components/products/form/ImageUploadField.tsx` | `label="Add file"` | `파일추가` — no space in the frame | 8010:57833 |
| D111 | `components/products/form/ImageUploadField.tsx` | `{value.length} / {MAX_IMAGES} images` | `{value.length} / {MAX_IMAGES}장` | new |
| D112 | `components/products/form/ImageUploadField.tsx` | `${uploadingCount} image${uploadingCount > 1 ? "s" : ""} uploading` | `이미지 ${uploadingCount}장 업로드 중` — no "s" choice | new |
| D113 | `components/products/form/ImageUploadField.tsx` | `aria-label="Files not added"` | `추가되지 않은 파일` | new |
| D114 | `components/products/form/ImageUploadField.tsx` | `Removed &quot;{removed.image.name}&quot;.` | `&quot;{removed.image.name}&quot; 이미지를 삭제했습니다.` | new |
| D115 | `components/products/form/ImageUploadField.tsx` | `label="Undo"` | `되돌리기` | new |
| D116 | `components/products/form/ImageUploadField.tsx` | `aria-label="Dismiss"` | `닫기` | new |
| D117 | `api-services/UploadService.ts` | `"${file.name}" is not a supported image. Use ${acceptExtensions.join(", ").toUpperCase()}.` | `"${file.name}" 파일은 지원하지 않는 이미지 형식입니다. ${acceptExtensions.join(", ").toUpperCase()} 형식의 파일을 사용해 주세요.` | new |
| D118 | `api-services/UploadService.ts` | `"${file.name}" is larger than ${maxSizeMB} MB.` | `"${file.name}" 파일의 용량이 ${maxSizeMB}MB를 초과합니다.` | new |
| D119 | `components/products/form/StepCategoryOptions.tsx` | `"Loading…"` | `불러오는 중…` | admin-frontend · SingleVolumeOptionModal.tsx:207 |
| D120 | `components/products/form/StepCategoryOptions.tsx` | `Could not load the list: ${error.message}` | `목록을 불러오지 못했습니다: ${error.message}` | new, based on admin-frontend · list/page.tsx:492 |
| D121 | `components/products/form/StepCategoryOptions.tsx` | `Registration category` | `등록 카테고리` — see E4 for the edit screen | 8010:57833 |
| D122 | `components/products/form/StepCategoryOptions.tsx` | `Cannot be changed after registration` | `등록 후 변경 불가` | 5498:84860 |
| D123 | `components/products/form/StepCategoryOptions.tsx` | `"Major category"` | `대분류` — two places in the file | 8010:57833 |
| D124 | `components/products/form/StepCategoryOptions.tsx` | `"Medium category"` | `중분류` — two places in the file | 8010:57833 |
| D125 | `components/products/form/StepCategoryOptions.tsx` | `"Minor category"` | `소분류` — two places in the file | 8010:57833 |
| D126 | `components/products/form/StepCategoryOptions.tsx` | `placeholder="Select"` | `선택` — three places in the file | new |
| D127 | `components/products/form/StepCategoryOptions.tsx` | `emptyMessage="No categories"` | `등록된 카테고리가 없습니다` | admin-frontend · category/page.tsx:1033 |
| D128 | `components/products/form/StepCategoryOptions.tsx` | `"Select a major category first."` | `대분류를 먼저 선택해 주세요.` | new |
| D129 | `components/products/form/StepCategoryOptions.tsx` | `emptyMessage="No medium categories"` | `등록된 중분류가 없습니다` | new |
| D130 | `components/products/form/StepCategoryOptions.tsx` | `"Select a medium category first."` | `중분류를 먼저 선택해 주세요.` | new |
| D131 | `components/products/form/StepCategoryOptions.tsx` | `emptyMessage="No minor categories"` | `등록된 소분류가 없습니다` | new |
| D132 | `components/products/form/StepCategoryOptions.tsx` | `Options <span className="product-options-optional">(optional)</span>` | `옵션선택` for "Options" and `(선택 사항)` for "(optional)" — the frame's section heading is 옵션선택, lit. "option selection"; no space in the frame | 8010:57833 (heading); new ("(선택 사항)") |
| D133 | `components/products/form/StepCategoryOptions.tsx` | `Required option for purchase` | `상품 구매 필수 옵션 선택` | 8010:57833 |
| D134 | `components/products/form/StepCategoryOptions.tsx` | `This product also has {keptOptionCount} category option{keptOptionCount > 1 ? "s" : ""} from the admin. They are kept as they are.` | `이 상품에는 관리자 화면에서 등록한 카테고리 옵션 {keptOptionCount}건이 있으며, 그대로 유지됩니다.` — no "s" choice | new |
| D135 | `components/products/form/StepCategoryOptions.tsx` | `Single-item options` | `단권 옵션` — table caption for screen readers | 8034:61058 |
| D136 | `components/products/form/StepCategoryOptions.tsx` | `>Product code<` | `상품코드` — option table header | 8010:57833 |
| D137 | `components/products/form/StepCategoryOptions.tsx` | `>Book title<` | `도서명` — option table header | 8010:57833 |
| D138 | `components/products/form/StepCategoryOptions.tsx` | `>Option price<` | `판매가` — option table header; lit. "selling price" (see E28) | 8010:57833 |
| D139 | `components/products/form/StepCategoryOptions.tsx` | `>Remove<` | `삭제` — screen-reader header of the last column | admin-frontend · ProductRegisterForm/index.tsx:1285 |
| D140 | `components/products/form/StepCategoryOptions.tsx` | `Option price for {row.optionName}` | `{row.optionName} 판매가` | new, based on 8010:57833 |
| D141 | `components/products/form/StepCategoryOptions.tsx` | `Remove option ${row.optionName}` | `${row.optionName} 옵션 삭제` | new |
| D142 | `components/products/form/StepCategoryOptions.tsx` | `No options. Options are other products sold together with this one (e.g. a workbook).` | `등록된 옵션이 없습니다. 옵션은 이 상품과 함께 판매하는 다른 상품입니다. (예: 워크북)` | new |
| D143 | `components/products/form/StepCategoryOptions.tsx` | `" Note: the API keeps the old options when every option is removed on edit."` | `" 참고: 수정 화면에서 옵션을 모두 삭제하면 기존 옵션이 그대로 유지됩니다."` — keep the leading space | new |
| D144 | `components/products/form/StepCategoryOptions.tsx` | `label="Add single-item option"` | `단권 옵션 추가` | 8010:57833 |
| D145 | `components/products/form/OptionPickerDialog.tsx` | `label="Cancel"` | `취소` | 8034:61058 |
| D146 | `components/products/form/OptionPickerDialog.tsx` | `Register (${selected.size})` | `등록하기 (${selected.size})` | new, based on 8034:61058 |
| D147 | `components/products/form/OptionPickerDialog.tsx` | `"Register"` | `등록하기` — this popup only; every other "Register" is 등록 | 8034:61058 |
| D148 | `components/products/form/OptionPickerDialog.tsx` | `Single-item option` | `단권 옵션` — popup title | 8034:61058 |
| D149 | `components/products/form/OptionPickerDialog.tsx` | `Search by product name` | `상품명 검색` — hidden label and placeholder | 8034:61058 |
| D150 | `components/products/form/OptionPickerDialog.tsx` | `emptyTitle="No products found"` | `검색 결과가 없습니다` | admin-frontend · SingleVolumeOptionModal.tsx:238 |
| D151 | `components/products/form/OptionPickerDialog.tsx` | `Nothing matches “${debouncedSearch}”.` | `“${debouncedSearch}” 검색어에 해당하는 상품이 없습니다.` | new |
| D152 | `components/products/form/OptionPickerDialog.tsx` | `"There are no products yet."` | `등록된 상품이 없습니다.` | admin-frontend · list/page.tsx:493 |
| D153 | `components/products/form/OptionPickerDialog.tsx` | `aria-label="Products"` | `상품 목록` | new |
| D154 | `components/products/form/OptionPickerDialog.tsx` | `" · already added"` | `" · 이미 추가됨"` | new |
| D155 | `components/products/form/OptionPickerDialog.tsx` | `Showing the newest {rows.length} of {total}. Type a name to narrow the list.` | `전체 {total}건 중 최신 {rows.length}건만 표시됩니다. 상품명을 입력하여 검색해 주세요.` — the total comes first | new |
| D156 | `components/products/form/StepErpReview.tsx` | `"Product name"` | `상품명` | 8010:57833 |
| D157 | `components/products/form/StepErpReview.tsx` | `"Product code"` | `상품코드` | 8010:57833 |
| D158 | `components/products/form/StepErpReview.tsx` | `"Unit price"` | `단가` | 8010:57833 |
| D159 | `components/products/form/StepErpReview.tsx` | `"Selling price"` | `판매가` | 8010:57833 |
| D160 | `components/products/form/StepErpReview.tsx` | `"Detailed description"` | `상세설명` | 8010:57833 |
| D161 | `components/products/form/StepErpReview.tsx` | `"Images"` | `이미지` | 8010:57833 |
| D162 | `components/products/form/StepErpReview.tsx` | `${values.images?.length ?? 0} image${values.images?.length === 1 ? "" : "s"}` | `${values.images?.length ?? 0}장` — no "s" choice | new |
| D163 | `components/products/form/StepErpReview.tsx` | `"Exposure status"` | `노출상태` | 8010:57833 |
| D164 | `components/products/form/StepErpReview.tsx` | `"Sales status"` | `판매상태` | 8010:57833 |
| D165 | `components/products/form/StepErpReview.tsx` | `"Category"` | `등록 카테고리` — same name as the field in step 3 | 8010:57833 |
| D166 | `components/products/form/StepErpReview.tsx` | `"Options"` | `옵션` | new, based on 8010:57833 |
| D167 | `components/products/form/StepErpReview.tsx` | `${keptOptionCount} category option(s) kept` | `카테고리 옵션 ${keptOptionCount}건 유지` | new |
| D168 | `components/products/form/StepErpReview.tsx` | `"None"` | `없음` | new |
| D169 | `components/products/form/StepErpReview.tsx` | `"Required option for purchase"` | `상품 구매 필수 옵션 선택` | 8010:57833 |
| D170 | `components/products/form/StepErpReview.tsx` | `"Yes" : "No"` | `"예" : "아니오"` | 8010:57833 desc |
| D171 | `components/products/form/StepErpReview.tsx` | `"ERP code"` | `ERP 코드` — summary row and field label | 8010:57833 |
| D172 | `components/products/form/StepErpReview.tsx` | `"Assigned automatically"` | `등록 시 자동 부여` — lit. "assigned automatically at registration"; two places in the file | new |
| D173 | `components/products/form/StepErpReview.tsx` | `"The server assigns the next free ERP code when the product is registered."` | `ERP 코드는 상품 등록 시 서버에서 자동으로 부여됩니다.` | new |
| D174 | `components/products/form/StepErpReview.tsx` | `"The ERP code cannot be changed."` | `ERP 코드는 변경할 수 없습니다.` | new |
| D175 | `components/products/form/StepErpReview.tsx` | `["ERP product name",` <br> `label="ERP product name"` | `상품ERP명` — summary row and field label | 8010:57833 |
| D176 | `components/products/form/StepErpReview.tsx` | `placeholder="ERP product name"` | `상품명 입력해 주세요.` — lit. "Please enter the product name."; exact frame text, without the particle 을 (see E12) | 8010:57833 |
| D177 | `components/products/form/StepErpReview.tsx` | `"Quantity"` | `갯수` — summary row and field label | 8010:57833 |
| D178 | `components/products/form/StepErpReview.tsx` | `${formatNumber(values.quantity)} pcs` | `${formatNumber(values.quantity)}개` | new |
| D179 | `components/products/form/StepErpReview.tsx` | `hint="Number of pieces in one ERP unit."` | `ERP 1단위에 포함된 수량입니다.` | new |
| D180 | `components/products/form/StepErpReview.tsx` | `placeholder="1"` | `1` — keep | 8010:57833 |
| D181 | `components/products/form/StepErpReview.tsx` | `>pcs<` | `개` — unit after the quantity field | new |
| D182 | `components/products/form/StepErpReview.tsx` | `"Tax type"` | `비과세` — summary row and field label; lit. "tax-exempt" (see E9) | 8010:57833 |
| D183 | `components/products/form/StepErpReview.tsx` | `placeholder="Select taxable or tax-exempt"` | `비과세를 선택해 주세요.` — lit. "Please select tax-exempt." | 8010:57833 |
| D184 | `components/products/form/StepErpReview.tsx` | `label="ERP unit price"` | `단가` — field label inside the ERP block; lit. "unit price" (see E10) | 8010:57833 |
| D185 | `components/products/form/StepErpReview.tsx` | `["ERP unit price", formatWon(values.erpUnitPrice)]` | `ERP 단가` — summary row | 8010:57833 desc |
| D186 | `components/products/form/StepErpReview.tsx` | `placeholder="₩0"` | `₩0` — keep | 8010:57833 |
| D187 | `components/products/form/StepErpReview.tsx` | `Review before {mode === "create" ? "registering" : "saving"}` | `{mode === "create" ? "등록" : "저장"} 전 입력 내용 확인` — gives "등록 전 입력 내용 확인" | new |
| D188 | `components/products/form/StepErpReview.tsx` | ` — needs a fix` | ` — 수정 필요` | new |
| D189 | `components/products/form/StepErpReview.tsx` | `label="Edit"` | `수정` | new, based on 5498:84860 |
| D190 | `components/products/form/StepErpReview.tsx` | `Edit step ${step}: ${label}` | `${step}단계 ${label} 수정` | new |
| D191 | `components/products/form/product-form.model.ts` | `Up to ${PRODUCT_RULES.images.max} images can be registered. Remove the extra images.` | `이미지는 최대 ${PRODUCT_RULES.images.max}장까지 등록 가능합니다. 초과한 이미지를 삭제해 주세요.` — `FORM_MESSAGES.imagesTooMany` | new, based on 8010:57833 |
| D192 | `components/products/form/product-form.model.ts` | `draftOutdated: "Your saved draft was not restored: this product was changed after the draft was saved. The form shows the current data."` | `임시 저장된 내용을 불러오지 않았습니다. 임시 저장 이후 이 상품의 정보가 변경되어 현재 저장된 정보를 표시합니다.` | new |

## E. Notes for the translators

### E-I. Where the Korean frame says something different from the current English

- **E1. Breadcrumb.** All four Korean frames show the first breadcrumb item as `공지사항 관리` ("Notice Management"): `공지사항 관리 / 상품 관리`, `공지사항 관리 / 상품 카테고리 관리`, `공지사항 관리 / 상품 등록`, `공지사항 관리 / 상품 수정`. The English frames show the same ("Notice Management"). It is a left-over from the notice screens: the sidebar group is `쇼핑몰 관리`, and an older, covered header layer in frames 8.1.0 and 8.2.0 reads `쇼핑몰 관리 / 상품관리`. The glossary uses `쇼핑몰 관리` (A20). The frames have two levels (group / page); the app has three on register, edit and details (`쇼핑몰 관리 / 상품 관리 / 상품 등록`), the same as the real admin frontend.
- **E2. Menu spelling.** The sidebar in the frame writes `유저관리` and `학사관리` without a space, and `학원 관리`, `교육과정 관리`, `결제 관리`, `권한 관리` with a space. The glossary copies the frame. The grey information strip above each frame has `소핑몰 관리` (a typing mistake) and `상품관리`; those are not screen text and are not used.
- **E3. Selling price has three words in the frames.** List header (8.1.0): `판매금액` ("sales amount"). Registration form (8.1.1): `판매가` ("selling price"). Edit form (8.1.2): `할인가격` ("discount price"; its description says `할인가`). The app has one shared form for register and edit, so the glossary gives `판매가` for the form and `판매금액` only for the list column caption. A reviewer who compares the edit screen with frame 8.1.2 will see `할인가격` there. If that label is wanted, `label="Selling price"` in `StepBasicInfo.tsx` has to depend on `mode`.
- **E4. Category label on the edit screen.** Frame 8.1.1 says `등록 카테고리*`; frame 8.1.2 says `카테고리*` followed by `등록 후 변경 불가`. The glossary gives `등록 카테고리` for both modes (one string in the code) and `등록 후 변경 불가` for the note.
- **E5. Exposure status has two words.** List header (8.1.0): `노출여부` ("exposed or not"). Form label (8.1.1, 8.1.2): `노출상태` ("exposure status"). The glossary uses `노출여부` only as the list column caption (table header, phone card label, CSV column, the `aria-label` of the select in that column) and `노출상태` everywhere else. The toast after the inline change says only `저장 완료`, as the real admin frontend does, so the two words never meet in one message.
- **E6. Required marks.** In frame 8.1.1 `판매가` has no `*`; the app marks "Selling price" as required. In frame 8.1.2 `ERP 코드`, `상품ERP명` and `갯수` have no `*`, in frame 8.1.1 they have one. This is not text, but it shows next to the labels.
- **E7. Price rule.** The description of frame 8.1.2 says `판매가 ≤ 정가` (the selling price may be equal). The app and the API key `unitPriceMustBeLessThanPrice` say "must be lower". The glossary translates what the app does: `판매가는 단가보다 낮아야 합니다.` The same description calls the unit price `정가` once and `단가가` (a typing mistake) once; the label in the screen area is `단가`.
- **E8. Fields the Korean frames have and the app does not.** 8.1.1: `티켓유무*` with the value `없음` (ticket yes / no); a second picker `옵션 카테고리` (대분류 / 중분류 / 소분류) under the heading `옵션선택`; the button `카테고리 옵션 추가`; an `ERP 코드*` input with the placeholder `ERP 코드를 검색하세요` (in the app the ERP code is read-only and given by the server); the buttons `취소` and `등록` also at the top right of the page header. 8.1.2: `배송비설정*` with the value `무료배송` (description: dropdown 무료배송 / 조건부 / 개별); `옵션 카테고리*` with `등록 후 변경 불가`. If one of these is added later, use the frame text given here.
- **E9. Tax field.** The app says "Tax type"; the frame label is `비과세`, which literally means "tax-exempt", with the placeholder `비과세를 선택해 주세요.` and the two values `과세` (taxable) and `비과세` (tax-exempt). On the details page the row then reads "비과세: 과세" for a taxable product. The glossary keeps the frame word everywhere so that one concept has one word. A neutral label such as `과세 구분` would read better on the details page, but it is not in any frame; that is the reviewer's decision.
- **E10. Two fields are called 단가.** In frame 8.1.1 the first price field and the last ERP field both have the label `단가`. The description panel calls the second one `ERP 단가`. The glossary gives `단가` for the ERP field label in the form (D184) and `ERP 단가` in the summary, on the details page and in the validation message (D185, C116, D72).
- **E11. 갯수.** The frame writes `갯수`; the standard spelling is `개수`. The glossary copies the frame. The description of frame 8.1.1 calls the same field `수량` in the older variant.
- **E12. Placeholders that are not a translation of the English.** `placeholder="ERP product name"` → frame `상품명 입력해 주세요.` ("Please enter the product name.", written without the particle 을). `placeholder="Select taxable or tax-exempt"` → frame `비과세를 선택해 주세요.` `placeholder="Product name"` → the current frame shows the sample value `상품 1` in the field, the older frame `5498:84592` shows `상품명`; the glossary uses `상품명`.
- **E13. Category name field.** The frame has no add / edit dialog. It shows one inline row inside the tree with `[과정코드]` ("[course code]") and the placeholder `과정명을 입력해 주세요.` ("Please enter the course name."); its description speaks of a "명칭/코드 수정 모달" (a dialog to edit name and code). The app has a dialog with one field for all three levels and no code (the API has none; the id is shown in brackets). "과정명" fits only the third level, so the glossary uses `명칭` and `명칭을 입력해 주세요.` from the real admin frontend. If the reviewer wants the frame sentence, it is `과정명을 입력해 주세요.`
- **E14. Add buttons in the tree.** In the Korean frame a level-1 row has the pill `+ 중분류` (the layer is hidden in the frame, it is the hover state) and a level-2 row has `+ 소분류`. The app's English labels are "Subcategory" (level 1 row) and "Minor category" (level 2 row), which map to `중분류` and `소분류`. Do not map by the English frame: there "subcategory" is used for 소분류 and also for 중분류. The frame shows no text badge in front of a row; the app's badges "Main / Sub / Minor" become `대분류 / 중분류 / 소분류`.
- **E15. Count in the tree.** The frame writes `(2개 중분류)`, `(6개 소분류)`: number, `개`, a space, the level name. The English "(2 subcategories)" has another order.
- **E16. Delete a category that has children.** The frame description gives only a short phrase: “하위가 있어 삭제 불가” ("cannot delete because there are children") "or a guide to bulk delete". The glossary uses the full sentence of the real admin frontend (B50) and `삭제 불가` as the alert title (B66). The Korean sentence no longer names the kind of children, so `${info.childPlural}` is not needed in it.
- **E17. 수정 and 편집.** The frame description names the pencil action `편집` ("노드/편집(연필)") and in the next line calls the dialog `수정 모달`; frame 8.1.2 is `상품 수정`; the real admin frontend uses `수정` for the pencil and `카테고리 편집` for the dialog title. The glossary uses `수정` everywhere.
- **E18. Total and selection.** Frame: `총 게시물 : 15` ("Total posts : 15", with a space on both sides of the colon). App: "Total: N". The frame has no page-size select, no filters, no CSV button, no selection bar and no sort; their texts are `new`.
- **E19. Money format.** The frame shows `₩ 4,000` and `₩ 23,900` (a space after ₩) in the list and in the first form fields, `₩0` and `₩12,000` (no space) in the ERP block, and `23,000원` (no ₩, the word 원 after the number) in the option tables. The description only says "통화표기(₩, 천단위 콤마)". The app writes `₩4,000` everywhere. The glossary keeps the app format; see "could not decide" below.
- **E20. Date format.** The rows of frame 8.1.0 show seconds (`2025/09/12 17:10:18`) on two lines; the description says `YYYY/MM/DD HH:MM`. The app follows the description.
- **E21. Search placeholder.** The frame has one placeholder, `검색어 입력` ("Enter search term"), for both search types. The app has two English placeholders; both become `검색어 입력` (C37, C38), so the condition in the code is no longer needed.
- **E22. Empty list.** The frame asks for `검색 결과가 없습니다` when a search finds nothing. The app shows one title, "No products found", for two cases. With one fixed Korean title one of the two cases reads wrong, so the title should depend on `filtersActive`, as `CategoryManager.tsx` already does with `searchTerm`: `검색 결과가 없습니다` with a search or filter, `등록된 상품이 없습니다` without. The two description lines (C22, C23) were rewritten to fit under these titles and are not literal translations.
- **E23. Login.** The frame shows the placeholders `아이디` and `비밀번호`, the field errors `등록된 아이디가 아닙니다` and `비밀번호가 일치하지 않습니다` without a full stop, and the two alert sentences with a full stop. The alert has only the button `확인`; it has no title in the frame, so `알림` (A43) is from the real admin frontend. The frame also contains the sentence `아이디를 입력해 주세요.`; the matching password sentence (A68) is not in the frame and was written the same way.
- **E24. No-permission popup.** The frame text is `관리자 권한이 없습니다.` / `고객센터로 문의해주세요.` / `02-2014-8374` and the button `토킹클럽 홈으로`. The frame writes `문의해주세요` without a space; new sentences in this glossary write `문의해 주세요`. The brand is written `토킹클럽` in this button and `TalkingClub` in the logo.
- **E25. Option popup and option table.** The confirm button of the popup is `등록하기`, not `등록`. The option table headers in the frame are `상품코드 / 도서명 / 판매가`; the group caption is `옵션 1번`; the switch is `상품 구매 필수 옵션 선택`; the section heading is `옵션선택`.
- **E26. Leave question.** The current frame says “입력한 정보가 모두 삭제됩니다. 취소하시겠습니까?” with the answers 예 / 아니오. The older variant `5498:84592` says “입력하신 내용이 전부 삭제됩니다. 취소하시겠습니까?”. The glossary uses the current one. The browser's own "Leave site?" dialog on closing the tab cannot be translated by the app.

### E-II. Could not decide

- **E27. Product type (MAIN / SUPPLEMENTARY).** No frame shows this filter. In the code MAIN is a product that has options and SUPPLEMENTARY is a product without options (the kind that can be picked as a single-item option). The glossary proposes `메인 상품` and `단권 상품` with `상품 유형` as the label. `주교재 / 부교재` were not used because the frames use these two words as category names. Another possible pair is `세트 상품 / 단권 상품`. Please confirm with the reviewer.
- **E28. Option price.** The app says "Option price"; the frame header of that column is `판매가` and the glossary follows it (D138, C130). The real admin frontend later renamed the column to `옵션 설정가` on the edit screen. If the reviewer finds two columns called 판매가 confusing, `옵션 설정가` is the alternative.
- **E29. ₩ with or without a space** (see E19). Changing it means changing `formatWon` and `MoneyInput`, which is behaviour, not text. Not decided here.
- **E30. Edit-screen labels** `할인가격` (E3) and `카테고리` (E4): one shared form now gives the registration wording on both screens.
- **E31. `Admin` and `TalkingClub`** are kept in Latin letters because the frames show them so. The browser tab title `%s | TalkingClub Admin` is also kept.

### E-III. Things to change in the code together with the text

- **E32. Unknown API keys.** `getApiMessage()` in `utils/api-messages.ts` turns an unknown key into English words (`humanizeKey`, "someNewKey" → "Some new key") and passes class-validator sentences such as "name should not be empty" through in English. With a Korean UI both paths still show English. Fall back to the Korean `serverError` text (or to the caller's fallback) instead.
- **E33. Language switches that are not strings.** `lang="en"` in `app/layout.tsx` (A1). The request header `"accept-language": "en"` in `api-services/CoreAPIService.ts`: the QA backend answers with keys, so the header does not change the text today; `ko` is the honest value for a Korean UI.
- **E34. PrimeReact's own texts** are not in `src/` and are not in the tables: the paginator's button labels for screen readers, the default "No available options" / "No results found" of `Dropdown`, the close button label of `Dialog` and `ConfirmDialog`. They need a Korean locale (`addLocale("ko", …)` and `locale("ko")`, or `PrimeReactProvider value={{ locale: "ko" }}` in `providers/AppProviders.tsx`).
- **E35. Plural logic.** `plural()` in `ProductListScreen.tsx` and every `=== 1 ? "" : "s"` (C3, C6, C134, D112, D134, D162) must go; Korean uses a counter after the number (tone rule 4).
- **E36. Word order.** In Korean the total comes before the part ("전체 5페이지 중 2페이지"), a name comes before the action ("[67] 주교재 수정"), and a label comes before its particle. The rows with variables (A85, A87, B26, B27, B30, B51, C26, C70, C134, D35, D155, D187, D190) give the new order; a plain word-for-word replacement inside the old template will not work.
- **E37. Two English lines that become one Korean sentence:** B31 (reorder help) and D92 (image hint).
- **E38. `utils/constants.ts` has no option labels.** The option labels are in `components/products/form/product-form.model.ts` (D43 to D46), `components/products/list/ProductListToolbar.tsx` (C27 to C30), `components/products/details/OverviewTab.tsx` (C94, C95) and `components/products/details/OptionsTab.tsx` (C119, C120).
- **E39. Not text, but visible next to the text:** in frame 8.1.0 a click on the product name opens the edit screen; the app opens the details page. The frame limits the selection to 100 rows ("한번에 최대 100건까지 선택 가능"), which the app already does.
- **E40. Tests and docs.** Unit and e2e tests that look for the English strings, and the screenshots in `docs/`, will need the Korean text after the switch. This glossary did not change them.
- **E41. State of the code.** The strings were read from the working tree of branch `hw3/neeraj` on 2026-11-17, including changes that were not committed yet (the upload route `app/api/upload/route.ts`, the default error toast in `utils/query-client.ts`, the draft check in the product form). Rows A157 to A160, D191 and D192 come from those changes and stand at the end of their table so that the other numbers did not move. The route `app/api/upload/route.ts` and `middleware.ts` answer with message keys only (`sessionExpired`, `uploadTooLarge`, `uploadFailed`, `uploadUrlNotAllowed`, `fileFormatNotAllowed`); their text is in `utils/api-messages.ts`. If the code changes again before the switch, search each "English now" string once more.
