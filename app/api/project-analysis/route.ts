import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/src/project-analysis";
import { ProjectAnalysisRequestSchema } from "@/src/project-analysis/contracts";

const MAX_BODY_BYTES = 30_000;
const RATE_LIMIT = process.env.NODE_ENV === "production" ? 8 : 100;
const RATE_WINDOW_MS = 60_000;
const requestBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function json(body: object, status = 200, source?: "ai" | "fallback") {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(source ? { "X-QUANDA-Source": source } : {}),
    },
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

export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request))) {
    return json(
      {
        error: "rate_limit",
        message: "Too many project-analysis requests. Please try again shortly.",
      },
      429,
    );
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json(
      { error: "payload_too_large", message: "The request is too large." },
      413,
    );
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return json(
      { error: "invalid_request", message: "The request could not be read." },
      400,
    );
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json(
      { error: "payload_too_large", message: "The request is too large." },
      413,
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return json(
      { error: "invalid_json", message: "The request was not valid JSON." },
      400,
    );
  }
  const parsed = ProjectAnalysisRequestSchema.safeParse(input);
  if (!parsed.success) {
    return json(
      {
        error: "validation",
        message: "Please review the project details and try again.",
        fields: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(
    1_000,
    Math.min(Number(process.env.GEMINI_CLASSIFICATION_TIMEOUT_MS || 15_000), 25_000),
  );
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await analyzeProject(parsed.data, {
      signal: controller.signal,
    });
    return json(result, 200, result.source);
  } catch (error) {
    console.error(
      `[QUANDA] Project analysis failed: ${error instanceof Error ? error.name : "UnknownError"}`,
    );
    return json(
      {
        error: "analysis_failed",
        message: "The project could not be analyzed safely.",
      },
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
}
