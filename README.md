# HW3 — Talking Club Admin (Shopping Management) · Sandip

Frontend for Talking Club Admin → Shopping Management (Product Category Management + Product Management),
connected to the **Talking Club QA API** (never production).

Stack: Next.js 16 (App Router) · TypeScript · PrimeReact 10 · SCSS · TanStack Query · Playwright.

## Run locally

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL to the QA API URL
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
| `npm run test:e2e:mutation` | Playwright `*.mutation.spec.ts` (creates/edits/deletes `HW3-Sandip-*` records only) |

## Deploy (Vercel)

Deploy branch `hw3/sandip`. Set only `NEXT_PUBLIC_API_BASE_URL` in Vercel project settings, never logins.
Turn off deployment protection so QA and design can open the link.

## Shared QA data

Only create, edit or delete records named `HW3-Sandip-…`. Delete test records after tests.
