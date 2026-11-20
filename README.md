# HW3 — Talking Club Admin (Shopping Management) · Sandip

Frontend for Talking Club Admin → Shopping Management (Product Category Management + Product Management),
connected to the **Talking Club QA API** (never production).

**Live (Vercel):** https://hw3-sandip.vercel.app — logins from DM.

Stack: Next.js 16 (App Router) · TypeScript · PrimeReact 10 · SCSS · TanStack Query · Playwright.

## Screens

| Path | Screen |
| --- | --- |
| `/login` | Login (Figma 1.1.0) |
| `/shopping/categories` | Product Category Management tree (8.2.0) — Super Admin only |
| `/shopping/products` | Product list (8.1.0) — page / search in the URL, selection, bulk delete, exposure, CSV export |
| `/shopping/products/new` | Product registration, 4 steps (8.1.1) |
| `/shopping/products/{id}` | Product details with tabs (`?tab=sessions&page=2`) |
| `/shopping/products/{id}/edit` | Product edit, 4 steps (8.1.2) |

## Run locally

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL = the QA API URL (already in .env.example)
npm run dev                  # http://localhost:3003
```

Logins: from DM. Never put them in code, commits, screenshots or Notion.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3003 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next route types + `tsc --noEmit` |
| `npm run test:e2e` | Playwright read-only specs (HTML report in `playwright-report/`) |
| `npm run test:e2e:mutation` | Playwright `*.mutation.spec.ts` (creates/edits/deletes `HW3-Sandip-*` records only, cleans up) |

Most specs mock the API. The `*.real.spec.ts` and `*.mutation.spec.ts` files use the real QA API and need
`E2E_LOGIN_ID` / `E2E_PASSWORD` in `.env.local` (they are skipped otherwise). They log in through an API request,
so the HTML report never contains the login. Against the deployment:
`PLAYWRIGHT_BASE_URL=https://hw3-sandip.vercel.app npm run test:e2e`.

## Deploy (Vercel)

Deployed from branch `hw3/sandip` with the Vercel CLI (own Vercel account):

```bash
npx vercel link --project hw3-sandip
npx vercel deploy --prod
```

- Only `NEXT_PUBLIC_API_BASE_URL` is set in Vercel (Production + Preview), never logins.
- No deployment protection on the production URL: QA and design can open it without a Vercel login.
- Redeploy after each push to `hw3/sandip`.
- `/api/upload` is a small server route: the image bucket's CORS only allows the original admin's origin, so
  product images are sent to the signed S3 URL from the server. It holds no secrets.

## Shared QA data

Only create, edit or delete records named `HW3-Sandip-…`. Delete test records after tests.
