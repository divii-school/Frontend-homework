# Screenshots — design | build (HW3)

Made by `scripts/screenshots/compare.mjs`. All 25 were last retaken on **2026-11-18 at 18:27 to 18:28** after the design
review (the design-fix code of commit `792ef82`; earlier sets: 2026-11-13, 2026-11-17 at 17:40 for the Korean UI, and
2026-11-18 at 12:21 to 12:22 after the QA round, commit `586b91a`): Chromium (Playwright 1.64.1), full-page,
device scale 1, against the production build (`npm run build`, then `npx next start -p 3100`, `BASE=http://localhost:3100`).
The UI text in the screenshots is Korean (code review, 17 Nov) and the design side shows the **Korean** Figma frames: exports
in `docs/design/` for 8.1.0, 8.1.1, 8.1.2, 8.1.3 and 8.2.0 (the login frame was already Korean).

What the design review changed on the shots (designer Bhagyashree, 18 Nov). Every shot changed, because the logo, the
colours and the font are on every screen:
- **Logo:** every screen shows the TalkingClub logo image of the Figma frames (three-ring mark + wordmark) with no text next
  to it. The login page no longer shows `TalkingClub | 관리자`. In the dark shots the wordmark is light. At 375 px the topbar
  shows the mark alone.
- **Colours:** the Figma colour styles. The light page background is white and the cards have a border (the page was grey
  before). The table header is the light pink Primary 80. The current page in the sidebar is a grey row with a brand-colour
  label (it was a pink row). Primary buttons are the brand colour `#ef325b`.
- **Font:** Pretendard, the font of the frames, on every text.
- **Fields:** the search type and the search input of the product list, and the text inputs and dropdowns of the product
  form, are underline-only (a line under the value, no box). The textarea stays boxed. Korean text breaks between words.
- **Disabled buttons:** the disabled `삭제` (Delete) on the product list is grey with a white label and has no red border.
- **Product list at 768 and 375 px:** the search row is visible and the filters are behind the button `필터` (Filters). The
  shots show the panel closed. The rows-per-page select is as high as the buttons next to it.
- **Categories at 375 px:** every row is one line: `[code] name` together, the count under the name, the buttons at the
  right. The level badge is not shown, the add button is a square `+`, and the pencil and trash icons are grey.
- **Details page:** the tab bar shows no scrollbar (a test checks this at 1440 / 768 / 375 px).

The way the font is loaded was changed once more on 19 Nov (commit `636e258`: the same Pretendard font, loaded as a dynamic
subset). The shots were not retaken for it, because it is the same font.

Still true from the QA round set (12:21 to 12:22):
- the product list shows one price per row under `판매금액` (Selling price) = the API field `price`; the crossed-out second price is gone;
- step 1 of the form shows `단가` (Unit price) first, with the hint `판매가보다 낮은 금액이어야 합니다.` (Must be lower than the
  selling price.), then `판매가` (Selling price), with the hint `고객이 결제하는 금액입니다.` (The amount the customer pays.);
- the details page shows `단가` = `unitPrice` and `판매가` = `price` (sample: ₩4,000 / ₩5,000);
- every date is Korea time (KST), whatever the time zone of the computer that takes the shots (for example `2025/09/13 03:50`
  for a product created at 18:50 UTC on 12 Sep).

Still true from the earlier sets: the step label is not cut at 768 px, the breadcrumb line does not start with "/" at 375 px,
the registration time does not wrap, the 375 px login shots wait until the page is hydrated, and the 375 px product list shows
the 5-link pager that fits on one line. The API is **mocked** (fixture data in
`scripts/screenshots/fixtures.mjs`: 128 products, the category tree of the e2e specs, book-cover SVGs from a fake CDN) and a
SUPER_ADMIN session is injected — no real account and no QA server are used. Category and product names are sample data and
stay English; the user name "홍길동" is made up.

The three small visual items that the QA round left open are fixed on this set (design review, commit `792ef82`): the
rows-per-page select is as high as the buttons next to it, the disabled delete button (`삭제`, Delete) is grey and has no red
border, and the `필터 초기화` (Reset filters) button lines up with the fields (at 768 / 375 px it is inside the closed `필터`
panel, so the shots do not show it).

Not covered by the shots: Safari and Firefox (Chromium only) and a HiDPI screen (device scale 1).

Re-create (the app must already be running):

```
npm run dev                                  # terminal 1 (or: npm run build, then npx next start -p 3100)
node scripts/screenshots/compare.mjs         # terminal 2 (BASE=http://localhost:3100 for another port)
```

## Design | build at 1440 px (left: Korean Figma PNG from `docs/design/`, middle: build light, right: build dark)

| File | Screen | Design frame |
|---|---|---|
| `compare-1440-login.png` | Login | 1.1.0 Login (`1.1.0-login.png`) |
| `compare-1440-product-list.png` | Product list | 8.1.0 Product list (`8.1.0-product-list.png`) |
| `compare-1440-product-form.png` | Product registration, step 1 of 4 | 8.1.1 Product registration (`8.1.1-product-registration.png`) — one long page in Figma, 4 steps in the build (design question 5) |
| `compare-1440-product-details.png` | Product details, Overview tab | none in Figma (design question 4) — 8.1.2 Product edit shown as the closest frame |
| `compare-1440-categories.png` | Product category management | 8.2.0 Product category management (`8.2.0-category-management.png`) |

Dark mode and the 768 / 375 layouts have no Figma frames (design questions 1 and 2); they are built from the same tokens.

## Build at 768 px (tablet) and 375 px (phone), light and dark

| Screen | 768 light | 768 dark | 375 light | 375 dark |
|---|---|---|---|---|
| Login | `build-768-light-login.png` | `build-768-dark-login.png` | `build-375-light-login.png` | `build-375-dark-login.png` |
| Product list | `build-768-light-product-list.png` | `build-768-dark-product-list.png` | `build-375-light-product-list.png` | `build-375-dark-product-list.png` |
| Product form (step 1) | `build-768-light-product-form.png` | `build-768-dark-product-form.png` | `build-375-light-product-form.png` | `build-375-dark-product-form.png` |
| Product details | `build-768-light-product-details.png` | `build-768-dark-product-details.png` | `build-375-light-product-details.png` | `build-375-dark-product-details.png` |
| Categories | `build-768-light-categories.png` | `build-768-dark-categories.png` | `build-375-light-categories.png` | `build-375-dark-categories.png` |

What to look for: at 768 and 375 the sidebar is a drawer (☰), product rows are cards (the table becomes cards at
≤ 768 px; between 769 and 1024 px — not captured here — it scrolls inside its own box), forms are one column, and no
page scrolls sideways.

25 PNG files, about 2.6 MB in total.
