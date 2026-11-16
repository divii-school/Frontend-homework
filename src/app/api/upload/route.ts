/**
 * POST /api/upload — forwards one product image to a signed S3 URL.
 *
 * Why this exists: the Talking Club bucket's CORS only allows the original admin's origin, so the
 * browser can't PUT to the signed URL from our domain. The signed URL itself comes from the
 * Talking Club API (the user's login is checked there); this route holds no secrets.
 *
 * Guard rails: only https URLs on the product bucket under /products/, only images, max 3 MB.
 */
const ALLOWED_HOST = "talking-club-dev.s3.ap-northeast-2.amazonaws.com";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 3 * 1024 * 1024;

function fail(status: number, message: string) {
  return Response.json({ message }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Send the file as multipart form data.");
  }

  const url = form.get("url");
  const file = form.get("file");
  if (typeof url !== "string" || !(file instanceof File)) return fail(400, "Missing url or file.");

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return fail(400, "Invalid upload URL.");
  }
  if (target.protocol !== "https:" || target.host !== ALLOWED_HOST || !target.pathname.startsWith("/products/")) {
    return fail(400, "Upload URL is not allowed.");
  }
  if (!ALLOWED_TYPES.has(file.type)) return fail(415, "Only JPG, PNG or WebP images can be uploaded.");
  if (file.size > MAX_BYTES) return fail(413, "Images must be 3 MB or smaller.");

  try {
    const put = await fetch(target, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!put.ok) return fail(502, "The image storage rejected the upload. Please try again.");
  } catch {
    return fail(502, "The image storage could not be reached. Please try again.");
  }
  return Response.json({ ok: true });
}
