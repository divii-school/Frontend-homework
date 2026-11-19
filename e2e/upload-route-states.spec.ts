import { test, expect, type APIRequestContext } from "@playwright/test";
import { fakeJwt, SESSION_COOKIE_NAME } from "./helpers";
import { MAX_IMAGE_MB } from "./product-form.helpers";

// The app's own POST /api/upload route (src/app/api/upload/route.ts), called straight with Playwright's
// `request` — no browser, no QA API. Only the REFUSALS are tested here: every request below is stopped
// before the route would contact S3, so nothing ever leaves this machine.
//   1. no session / expired session → JSON 401 (never a redirect to the login page)
//   2. an address that is not https on the talking-club-dev bucket host (another site, another bucket) → 400
//   3. a file that is not an image → 415
//   4. a file above the size limit → 413 (found in the form, and by Content-Length before reading)
//   5. a file of exactly the limit is read completely (not cut at 10 MB by the middleware)
//   6. a broken form → 400
//   7. any other /api path without a session → JSON 401 from the middleware
//
// Run alone:  npx playwright test e2e/upload-route-states.spec.ts --project=mocked

// `request` runs in Node, so with E2E_MAP_3000_TO it would reach the OTHER app on port 3000 (see playwright.config.ts)
test.skip(!!process.env.E2E_MAP_3000_TO, "request-fixture tests are not mapped by E2E_MAP_3000_TO");

const UPLOAD_ROUTE = "/api/upload";
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
/**
 * Shaped like a signed URL for the allowed bucket (talking-club-dev). It is never contacted: each test using it
 * fails another check (session, form, type or size) before the route would call S3.
 */
const S3_SHAPED_URL = "https://talking-club-dev.s3.ap-northeast-2.amazonaws.com/products/e2e/photo.png?X-Amz-Signature=e2e";
const SMALL_PNG = { name: "photo.png", mimeType: "image/png", buffer: Buffer.from("not a real png, small") };

const sessionCookie = (expiresInSeconds?: number) => ({ Cookie: `${SESSION_COOKIE_NAME}=${fakeJwt("SUPER_ADMIN", expiresInSeconds)}` });

interface UploadForm {
  url: string;
  file: { name: string; mimeType: string; buffer: Buffer };
}

/** POST the form with a valid session cookie; redirects are never followed. */
function postUpload(request: APIRequestContext, form: UploadForm) {
  return request.post(UPLOAD_ROUTE, { headers: sessionCookie(), multipart: { ...form }, maxRedirects: 0 });
}

test.describe("POST /api/upload — refusals (no S3 call)", () => {
  test("no session cookie, or an expired one → JSON 401, not a redirect to /login", async ({ request }) => {
    const form = { url: S3_SHAPED_URL, file: SMALL_PNG };
    const anonymous = await request.post(UPLOAD_ROUTE, { multipart: form, maxRedirects: 0 });
    expect(anonymous.status()).toBe(401);
    expect(anonymous.headers()["content-type"]).toContain("application/json");
    expect(await anonymous.json()).toEqual({ ok: false, message: "sessionExpired" });

    const expired = await request.post(UPLOAD_ROUTE, { headers: sessionCookie(-60), multipart: form, maxRedirects: 0 });
    expect(expired.status()).toBe(401);
    expect(await expired.json()).toEqual({ ok: false, message: "sessionExpired" });
  });

  test("an address that is not https on the talking-club-dev bucket host → 400 (no open proxy, no other bucket)", async ({ request }) => {
    const notAllowed = [
      "https://example.com/upload/photo.png",
      "http://talking-club-dev.s3.ap-northeast-2.amazonaws.com/photo.png", // http, not https
      "https://talking-club-dev.s3.amazonaws.com.example.com/photo.png", // only looks like S3
      "https://talking-club-dev.s3.amazonaws.com@example.com/photo.png", // the real host is example.com
      "https://ec2.ap-northeast-2.amazonaws.com/photo.png", // Amazon, but not S3
      "https://other-bucket.s3.ap-northeast-2.amazonaws.com/photo.png", // S3, but another bucket
      "https://talking-club-dev-copy.s3.ap-northeast-2.amazonaws.com/photo.png", // name only starts the same
      "https://eviltalking-club-dev.s3.ap-northeast-2.amazonaws.com/photo.png", // name only ends the same
      "https://s3.ap-northeast-2.amazonaws.com/talking-club-dev/photo.png", // path-style: the QA API never signs these
      "not a url",
    ];
    for (const url of notAllowed) {
      const response = await postUpload(request, { url, file: SMALL_PNG });
      expect(response.status(), url).toBe(400);
      expect(await response.json(), url).toEqual({ ok: false, message: "uploadUrlNotAllowed" });
    }
  });

  test("a file that is not JPG / PNG / GIF / WEBP → 415", async ({ request }) => {
    const response = await postUpload(request, {
      url: S3_SHAPED_URL,
      file: { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
    });
    expect(response.status()).toBe(415);
    expect(await response.json()).toEqual({ ok: false, message: "fileFormatNotAllowed" });
  });

  test("a file above the size limit → 413", async ({ request }, testInfo) => {
    // One byte too many: passes the Content-Length pre-check, found when the form is read
    const oneByteOver = await postUpload(request, {
      url: S3_SHAPED_URL,
      file: { name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1, 1) },
    });
    expect(oneByteOver.status()).toBe(413);
    expect(await oneByteOver.json()).toEqual({ ok: false, message: "uploadTooLarge" });

    // Far too big (limit + 1 MB = 5 MB): only on a local server. On a deployed Vercel link the platform refuses
    // any body above 4.5 MB itself (413 FUNCTION_PAYLOAD_TOO_LARGE, not JSON) before the route runs.
    const baseURL = String(testInfo.project.use.baseURL ?? "");
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(baseURL)) {
      testInfo.annotations.push({ type: "skipped part", description: "5 MB body not sent to a deployed host (platform limit 4.5 MB)" });
      return;
    }
    // Refused by its Content-Length, before the body is read
    const farTooBig = await postUpload(request, {
      url: S3_SHAPED_URL,
      file: { name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1024 * 1024, 1) },
    });
    expect(farTooBig.status()).toBe(413);
    expect(await farTooBig.json()).toEqual({ ok: false, message: "uploadTooLarge" });
  });

  test("a file of exactly the size limit is read completely (refused here only for its address)", async ({ request }) => {
    const response = await postUpload(request, {
      url: "https://example.com/upload/photo.png",
      file: { name: "max.png", mimeType: "image/png", buffer: Buffer.alloc(MAX_IMAGE_BYTES, 1) },
    });
    // 400 uploadUrlNotAllowed = the whole form was parsed and the size check passed.
    // A body cut on the way in could not be parsed at all (that would be 400 uploadFailed).
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ ok: false, message: "uploadUrlNotAllowed" });
  });

  test("a form without the file (or not a form at all) → 400", async ({ request }) => {
    const noFile = await request.post(UPLOAD_ROUTE, { headers: sessionCookie(), multipart: { url: S3_SHAPED_URL }, maxRedirects: 0 });
    expect(noFile.status()).toBe(400);
    expect(await noFile.json()).toEqual({ ok: false, message: "uploadFailed" });

    const notAForm = await request.post(UPLOAD_ROUTE, { headers: sessionCookie(), data: { url: S3_SHAPED_URL }, maxRedirects: 0 });
    expect(notAForm.status()).toBe(400);
    expect(await notAForm.json()).toEqual({ ok: false, message: "uploadFailed" });
  });

  test("any other /api path without a session → JSON 401 from the middleware, not the login page", async ({ request }) => {
    const response = await request.get("/api/hw3-no-such-route", { maxRedirects: 0 });
    expect(response.status()).toBe(401);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(await response.json()).toEqual({ ok: false, message: "sessionExpired" });
  });
});
