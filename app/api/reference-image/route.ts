import { NextRequest, NextResponse } from "next/server";
import {
  analyzeReferenceImage,
  createGeminiReferenceImageAnalyzerFromEnvironment,
  ReferenceImageAnalysisError,
} from "@/src/reference-image";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 32_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_LIMIT = process.env.NODE_ENV === "production" ? 6 : 100;
const RATE_WINDOW_MS = 60_000;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function hasValidSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request))) {
    return json(
      { error: "rate_limit", message: "Too many image-analysis requests. Try again shortly." },
      429,
    );
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: "payload_too_large", message: "The image is too large." }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "invalid_request", message: "The upload could not be read." }, 400);
  }
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return json({ error: "validation", message: "Choose an image to analyze." }, 400);
  }
  if (!ALLOWED_TYPES.has(image.type)) {
    return json(
      { error: "unsupported_type", message: "Use a JPEG, PNG, or WebP image." },
      415,
    );
  }
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    return json({ error: "payload_too_large", message: "Use an image smaller than 4 MB." }, 413);
  }
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!hasValidSignature(bytes, image.type)) {
    return json(
      { error: "invalid_image", message: "The file contents do not match the image type." },
      400,
    );
  }

  const analyzer = createGeminiReferenceImageAnalyzerFromEnvironment();
  if (!analyzer) {
    return json(
      { error: "not_configured", message: "Reference image analysis is temporarily unavailable." },
      503,
    );
  }
  const projectBrief = String(formData.get("projectBrief") ?? "").trim().slice(0, 1_000);
  const controller = new AbortController();
  const timeoutMs = Math.max(
    1_000,
    Math.min(Number(process.env.GEMINI_REFERENCE_IMAGE_TIMEOUT_MS || 15_000), 25_000),
  );
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await analyzeReferenceImage(
      { bytes, mimeType: image.type, projectBrief, signal: controller.signal },
      analyzer,
    );
    return json(result, 200);
  } catch (error) {
    const code =
      error instanceof ReferenceImageAnalysisError ? error.code : "UNKNOWN";
    console.error(`[QUANDA] Reference image analysis failed: ${code}`);
    return json(
      { error: "analysis_failed", message: "The reference could not be analyzed safely." },
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

