# HW3 Talking Club Admin — 쇼핑몰 관리 (frontend)

Admin screens for Talking Club's shopping mall: login + roles, 상품 카테고리 관리 (3-level tree),
상품 관리 (list, 4-step create/edit, details with tabs). Users: Talking Club head-office administrators.

Stack: Next.js 15 · React 19 · TypeScript · PrimeReact 10 · SCSS modules · TanStack Query 5 ·
react-hook-form + zod · Vitest · Playwright.
Backend API: Talking Club **QA** server only — `NEXT_PUBLIC_API_BASE_URL` (never production).
Design: Figma `4wQgaju5jbb5BNRCeNmGZ0`, Korean frames 8.1.0 · 8.1.1 · 8.1.2 · 8.2.0, login 4019:78447.

## Commands
npm run dev                  # localhost:3000
npm run typecheck            # tsc --noEmit — run after every change
npm run lint
npm run test                 # Vitest (src/**/*.test.ts)
npm run build
npm run test:e2e             # Playwright read-only
npm run test:e2e:mutation    # Playwright writes (HW3-Pranesh-* only)

## Folders
src/app/(main)/shopping/…    pages (categories · products · new · [id] · [id]/edit)
src/app/api/{auth,upload}    same-origin server routes (refresh cookie, S3 upload)
src/config/app-routes.ts     one config for menu + route guard + permissions
src/services/                axios calls, one file per domain
src/hooks/api/               TanStack Query hooks (keys in query-keys.ts)
src/components/              screens and shared UI
src/styles/                  _theme.scss colours (light+dark), _tokens.scss spacing/type
e2e/                         *.spec.ts read-only · *.mutation.spec.ts writes

## Rules
- Follow the style of the file you are editing; reuse StateBlock, PageHeader, AppDropdown, UrlTabs.
- No hardcoded colours: add a token to _theme.scss with a light AND a dark value (WM Light/Dark).
- Class names lowercase-with-hyphens; Korean UI text; dates/numbers via src/lib/format.ts.
- A new page = add it to app-routes.ts (menu, guard and permission in one place).
- API calls only through services + hooks; no `any`; errors through ApiError/errorMessage.
- Shared QA data: only create/edit/delete HW3-Pranesh-* records. Never commit .env.local or logins.
- Company rules are in WM (Notion); fetch them, don't guess.
