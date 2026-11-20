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

## 2026-11-17 — after the code review
Prompt (Claude Code in VS Code): `bhai ye dehko or improve kro` (sent with the link to Kakali's review message; the review result was "Resubmit": the code was praised, 2 must-fix and 4 should-fix items).
What Claude did: fixed all six items — the whole UI is Korean now (562 strings listed in `docs/ko-glossary.md`, following the Korean Figma frames); the image upload goes through the app's own route `POST /api/upload` instead of the browser sending the file to S3; a 5th image is blocked; commas are removed from image file names; an outdated edit draft is dropped with a notice; a default error toast was added. Then ran lint, type-check, build and all 104 Playwright tests once (104 passed), checked the Vercel link, retook the 25 screenshots and updated every document.

## 2026-11-18 — code re-check and QA round
Prompts (Claude Code in VS Code):
1. `bhai kakali ke new comment aaye hai dekho or btao kya ye ho sakta hai` (Kakali's re-check points)
2. `thik hai fix kar do`
3. `bhai archana ka new comment aaya hai dekho or kya improve karna hai kr do` (the QA round; result "Resubmit", the build was praised: 90 checks passed on the Vercel build)

What Claude did:
- Re-check points (code result Pass): the image size limit defaults to 4 MB (Vercel refuses bodies above 4.5 MB), and `/api/upload` sends files only to the `talking-club-dev` bucket. Commit `355d2ae`.
- QA round: first read the backend code (talking-club-backend, `release/qa`) to see which price field the cart and the order charge. It is `price`, and the API requires `unitPrice < price`. So `판매가 (Selling price)` / `판매금액` = `price` and `단가 (Unit price)` = `unitPrice` everywhere (form, list, CSV, details, sort, option defaults, step-4 summary), with the rule `단가는 판매가보다 낮아야 합니다.`. Every date is now Korea time (KST) for every viewer. Tab titles `… | 토킹클럽 관리자`, logo suffix `관리자`, step-4 label `ERP 단가`. Tests updated (a new mocked test with a browser in India time). Commit `586b91a`.
- Ran the checks locally (type-check, lint, build 0 / 0 / 0) and the whole suite against the Vercel link: 105 passed. Retook the 25 screenshots and updated the documents. The test sheet was moved to the WM DEV template and the manual rows were run on 18 Nov (`docs/test-cases.md`, `docs/manual-run-2026-11-18.md`).
- Problem solved: the Figma description and the API disagreed on which price is which. The backend code decided it; the conflict is now design question 25.

## 2026-11-18 — design review (and the font change of 2026-11-19)
Prompts (Claude Code in VS Code):
1. `commit kar do par sb check kar ke hi thik hai or comment bhi`
2. `start again or ek new comment aaya hai vo dekho or kam start kro.` (first sentence of the prompt; the rest was a question to Claude, not a work instruction) (the design review of Bhagyashree; result "Resubmit": a strong build, three must-fix items, four should-fix items and minor items.)

What Claude did:
- The design review items, commit `792ef82`:
  - Must-fix 1, logo: the TalkingClub logo image of the Figma frames (three-ring mark + wordmark) on the header, login, 403, 404, error page and the no-permission popup, with no text next to it; the wordmark follows the text colour in dark mode (`src/components/BrandLogo.tsx`).
  - Must-fix 2, colours and font: every light colour in `src/styles/_tokens.scss` is the hex of a Figma style, with the style name in the comment; the font is Pretendard, the font of the frames.
  - Must-fix 3: disabled buttons are muted (a disabled `삭제 (Delete)` is grey, with no red border).
  - Should-fix 4 to 7: `word-break: keep-all`; underline-only fields on the list search and the product form; at ≤ 768 px the list filters sit behind a `필터 (Filters)` button with the number of active filters; at ≤ 640 px every category row is one line.
  - Minor: focus ring in the brand colour, no scrollbar on the details tab bar, a 40 px rows-per-page select, `필터 초기화 (Reset filters)` lined up, grey row icons.
- Added nine tests (114 tests in 15 files now), ran type-check, lint and build (0 / 0 / 0), the mocked project (75 passed) and the whole suite on the local production build, and retook the 25 screenshots (18 Nov, 18:27 to 18:28). Run notes: `docs/live-run-2026-11-16.md`, last section.
- 19 Nov, commit `636e258`: the font is loaded as a dynamic subset (92 small files with `unicode-range`), because one 2.06 MB font file, preloaded on every page, made the first page load on the Vercel link several seconds slower and the Playwright runs against the Vercel link timed out.
- Wrote down the open point for the designer: some Figma tokens are below WCAG AA (design question 27).
- The lesson written down in this round: read the exact values from the source (the Korean Figma frames, the Figma styles, the backend code, the WM template) before building, instead of building something that only looks similar.
