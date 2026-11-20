# HW3 submission page — content to paste (Sandip)

Notion page: https://app.notion.com/p/416326b2d5fb817c8d6bde4e60f5b656
Properties: **HW3 status** → Submitted · **Submitted on** → 2026-11-17 · **Vercel link** → https://hw3-sandip.vercel.app ·
**Branch / PR link** → https://github.com/divii-school/Frontend-homework/pull/3
Then comment on the TL page: "HW3 submitted" + link to this page, tagging Kakali.

---

## 1. Branch and PR link
- Repo: https://github.com/divii-school/Frontend-homework · branch `hw3/sandip`
- PR to `main` (review only, never merged): https://github.com/divii-school/Frontend-homework/pull/3

## 2. Vercel link (latest build)
https://hw3-sandip.vercel.app — build `29e011f` (app code). Logins from DM.

## 3. How to run it (no secrets; "logins from DM")
```bash
git clone https://github.com/divii-school/Frontend-homework.git && cd Frontend-homework
git checkout hw3/sandip
npm install
cp .env.example .env.local      # QA API URL is already in it
npm run dev                     # http://localhost:3003 — log in with the account from the DM
```
Tests: `npm run test:e2e` (read-only), `npm run test:e2e:mutation` (creates and deletes one `HW3-Sandip-E2E-*` product).
Real-API tests need `E2E_LOGIN_ID` / `E2E_PASSWORD` in `.env.local` (from the DM); without them they are skipped.

## 4. Prompts and skills used, and one problem you solved
**Write this in your own words.** Facts you can use:
- Tools: Claude Code (desktop) for code, Figma via Chrome (frame export + layer data through the Figma page's plugin API, because the Figma MCP had no access to this file), Playwright, Vercel CLI.
- Example prompts you gave: "check the task and list out what needs to be done", "start the product category list screen", "build CRUD", "start the product list", "product form next", "details page", "Vercel next", "submission docs".
- Problems that were really solved (pick one and explain it):
  - **Image upload blocked by CORS:** the signed S3 URL only accepted the original admin's origin, so uploads went through our own `/api/upload` route (server-side PUT, with type / size / host checks).
  - **Doubled image URL after edit:** the details API returns URLs, add / edit expect keys; sending URLs back stored `…amazonaws.com/https://…`. Found by the mutation test on QA, fixed with `imageKey()`.
  - **Refresh token not usable from the browser** (httpOnly cookie on `.dvconsulting.org`, CORS `*` without credentials) → re-login with return to the same page.
  - **Secrets in the HTML report:** Playwright records typed values; real-API tests log in through an API request instead, and the report was scanned before publishing.

## 5. lint / type-check / build / Playwright output + HTML report
- Output: `docs/results/lint-typecheck-build.txt` and `docs/results/playwright-vercel.txt` (summary in Build report part 9)
- lint ✔ exit 0 · type-check ✔ exit 0 · build ✔ exit 0 · Playwright **59 passed** against the demo (58 chromium + 1 mutation)
- HTML report: https://hw3-sandip.vercel.app/playwright-report/index.html

## 6. Unit test case sheet link
https://docs.google.com/spreadsheets/d/1_YH4pzHaD5ChI8YM80rqsB_nAc39hzzeBvr5r60Yaps/edit?usp=sharing (imported from `docs/TEST-CASES.csv`)
67 cases (35 P · 32 N), each with the Playwright test that covers it. Markdown: `docs/TEST-CASES.md`.

## 7. Build report for QA
`docs/BUILD-REPORT.md` (10 parts) — https://github.com/divii-school/Frontend-homework/blob/hw3/sandip/docs/BUILD-REPORT.md
Design / API questions: `docs/DESIGN-QUESTIONS.md`.

## 8. Side-by-side screenshots (design | your screen) at 1440 / 768 / 375, light and dark
`docs/design-compare/` — 36 images (6 screens × 3 widths × light / dark), Figma frame left, build right.
Figma has desktop frames only, so 768 / 375 and dark are compared with the desktop frame (design questions D1, D2).
Raw build shots: `screenshots/`. Attach at least: `products-1440-light`, `products-375-dark`, `categories-1440-light`,
`product-new-768-light`, `login-375-dark`, `product-detail-1440-dark`.

## 9. Your explanation: auth flow, route guard, table state in URL, multi-step form, image upload
**Write this in your own words** (it is checked in the call). Study notes with file pointers: `docs/EXPLANATION-NOTES.md`.
