## HW3 — Talking Club Admin · Shopping Management (Sandip)

Review PR for HW3 (never merged). Live: https://hw3-sandip.vercel.app · Build report: `docs/BUILD-REPORT.md`

### What
- Login (1.1.0) with the real QA API; session, return to the same page after login (`?next=`)
- One config for menu + route guard + roles (`src/config/navigation.ts`), 403 page, non-admin popup
- Product Category Management (8.2.0): tree, server search in the URL, add / rename / delete
- Product list (8.1.0): server paging + search in the URL, selection (max 100), bulk delete, inline exposure, CSV export
- Register / edit product (8.1.1 / 8.1.2) as a 4-step form; image upload with type / size check, preview, remove
- Product details with tabs (URL state, per-tab data and loading / empty / error)
- Light / dark tokens, WM class names and date format, keyboard / screen-reader support
- Korean UI on every screen (`lang="ko"`), Korean error messages by API code / HTTP status (never raw keys)

### How it's built
Service + hook pattern: component → TanStack Query hook (`src/hooks`) → service (`src/services`, zod-validated) →
`request()` in `src/services/http.ts` → QA API. No `any`. Forms validate per step with the same rules the API requires.

### Checks (real output in `docs/results/`)
- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm run build` ✔
- Playwright against the demo: 60 passed (59 chromium + 1 mutation on QA, `HW3-Sandip-E2E-*`, cleaned up)
- HTML report: https://hw3-sandip.vercel.app/playwright-report/index.html

### Open questions / known items
`docs/DESIGN-QUESTIONS.md` (design D1–D14, API A1–A8) and Build report part 8 — main ones: no server-side sort in the
products API, category API returns a tree (no paging), refresh token not usable from the browser, Figma has desktop
frames only.

### Secrets
No passwords or tokens in code, commits, screenshots or the report (`.env.local` git-ignored; report scanned).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
