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
    return fail(400, "파일을 multipart/form-data 형식으로 보내 주세요.");
  }

  const url = form.get("url");
  const file = form.get("file");
  if (typeof url !== "string" || !(file instanceof File)) return fail(400, "업로드 주소 또는 파일이 없습니다.");

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return fail(400, "업로드 주소가 올바르지 않습니다.");
  }
  if (target.protocol !== "https:" || target.host !== ALLOWED_HOST || !target.pathname.startsWith("/products/")) {
    return fail(400, "허용되지 않은 업로드 주소입니다.");
  }
  if (!ALLOWED_TYPES.has(file.type)) return fail(415, "JPG, PNG, WebP 이미지만 올릴 수 있습니다.");
  if (file.size > MAX_BYTES) return fail(413, "이미지는 3MB 이하만 올릴 수 있습니다.");

  try {
    const put = await fetch(target, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!put.ok) return fail(502, "이미지 저장소가 업로드를 거부했습니다. 다시 시도해 주세요.");
  } catch {
    return fail(502, "이미지 저장소에 연결하지 못했습니다. 다시 시도해 주세요.");
  }
  return Response.json({ ok: true });
}
