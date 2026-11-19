# Screenshots — design | build (HW3)

Made by `scripts/screenshots/compare.mjs` on 2026-11-17, retaken at 17:40 for the Korean UI (the first set was taken on
2026-11-13): Chromium (Playwright 1.64.1), full-page, device scale 1, against the production build (`npx next start -p 3100`,
`BASE=http://localhost:3100`). The UI text in the screenshots is Korean (code review, 17 Nov) and the design side shows the
**Korean** Figma frames: new exports in `docs/design/` for 8.1.0, 8.1.1, 8.1.2, 8.1.3 and 8.2.0 (the login frame was already
Korean). On the retaken 768 and 375 px shots the step label is no longer cut at 768 px, the breadcrumb line no longer starts
with "/" at 375 px, and the registration time no longer wraps. The 375 px login shots wait until the page is hydrated, and the
375 px product list shows the 5-link pager that fits on one line. The API is **mocked** (fixture data in
`scripts/screenshots/fixtures.mjs`: 128 products, the category tree of the e2e specs, book-cover SVGs from a fake CDN) and a
SUPER_ADMIN session is injected — no real account and no QA server are used. Category and product names are sample data and
stay English; the user name "홍길동" is made up.

Three small visual items are unchanged: the rows-per-page select is not the same height as the buttons next to it, the disabled
delete button (`삭제`, Delete) keeps its red border, and the `필터 초기화` (Reset filters) button is indented a little at 768 / 375 px.

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

25 PNG files, about 3.2 MB in total.
