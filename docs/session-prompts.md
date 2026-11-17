# HW3 — prompts, skills and one problem solved (submission section 4)

## My prompts (verbatim, Claude Code in VS Code, 2026-11-13)
1. `https://divii.slack.com/archives/D0ADCGKUNSK/p1794491160704229 ye check kro or ab kya kam karna hai`
2. `@Kakali Dinda ( Frontend ) ka last msg dekho vo kya bol rhi hai`
3. *(pasted Kakali's HW3 DM — login removed here)* `ye msg tha ab dekho or btao kya krana hai`
4. `kya kya kar sakte hai jo bhi karna hai kar do`
5. `ab try kro` / `fir se try karna` / `try kro shi chal rha hai` (resuming after network errors)

## What Claude did with them (plan-first)
1. Read the Slack DM, the TL page, my submission page and the training page (Notion connector), the Figma frames (Figma connector: login 4019:78447, shopping 5498:98250 → 8.1.0–8.1.3, 8.2.0) and the real API code (`talking-club-backend`, branch `release/qa`: controllers + DTOs + services).
2. Wrote the plan first: `docs/hw3-plan.md` (API contract, routes, rules, checklist) and `docs/design-questions.md` (WM design checklist + questions). No code before the plan.
3. Built in steps, each with its own brief and checks: foundation (auth, one nav/permission config, tokens light/dark, layout, API services + hooks) → three screens in parallel (categories / product list + details / multi-step form), each in its own files → shared-file fixes → lint, type-check, build, Playwright → QA documents.

## Skills / tools used
- Connectors: Notion (TL + submission pages), Slack (Kakali's DM), Figma (frames + screenshots).
- Claude Code subagents for the foundation, each screen and the QA documents; Playwright for tests and screenshots.

## One problem I solved
**The QA API was down (Cloudflare 521) for the whole build day.** Instead of waiting, every screen got a mocked spec (`*-states.spec.ts`) that intercepts the API with `page.route` and injects its own session, and `playwright.config.ts` got a `mocked` project with no login dependency. So loading / empty / 403 / 500 / network / rollback states were tested for real while the server was down (44 mocked tests green), and when the API came back on 16-17 Nov the live specs (`categories.spec.ts`, `products-list.spec.ts`, `products-details.spec.ts`, `product-form.spec.ts`) passed, plus `categories.mutation.spec.ts`. `products.mutation.spec.ts` also passed (3 of 3, with a real image upload to S3) through the port-3000 mapping (`E2E_MAP_3000_TO`), because the S3 bucket CORS allows only `http://localhost:3000` (see `docs/qa-build-report.md`).

Second one: **refresh token vs CORS.** The API puts the refresh token in an httpOnly cookie, but the QA server's CORS is `origin: *`, so a browser on another domain (Vercel) will never send that cookie. Token expiry is therefore handled by decoding `exp` from the JWT and sending the user to `/login?returnTo=<same page>`, which brings them back after login.
