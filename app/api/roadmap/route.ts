import { NextRequest, NextResponse } from "next/server";
import { buildRoadmapPrompt } from "@/src/lib/ai/buildRoadmapPrompt";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import {
  callGoogleAiForRoadmap,
  repairGoogleAiRoadmap,
} from "@/src/lib/ai/googleAi";
import {
  configuredTimeoutMs,
  withAbortTimeout,
} from "@/src/lib/ai/withAbortTimeout";
import {
  calculateAvailableMinutes,
  getDaysRemaining,
} from "@/src/lib/feasibility";
import { normalizeRoadmap } from "@/src/lib/normalizeRoadmap";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import { createIntegratedFallback, createRoadmapInput, RoadmapGenerationRequestSchema, validateRoadmapForInput } from "@/src/roadmap";
import type { RoadmapResponse } from "@/src/types";

// The confirmed learning plan includes ranked tutorial metadata; keep a bounded
// but sufficiently large request envelope for the integrated roadmap input.
const MAX_BODY_BYTES = 120_000;
const RATE_LIMIT = process.env.NODE_ENV === "production" ? 8 : 100;
const RATE_WINDOW_MS = 60_000;
const requestBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function response(
  body: object,
  status = 200,
  source?: RoadmapResponse["source"],
  diagnostic?: string,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(source ? { "X-QUANDA-Source": source } : {}),
      ...(diagnostic ? { "X-QUANDA-Diagnostic": diagnostic } : {}),
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

type FallbackReason = "not_configured" | "unavailable" | "invalid_response";

function fallbackNotice(
  language: "en" | "vi",
  reason: FallbackReason,
): string {
  if (reason === "not_configured") {
    return language === "en"
      ? "AI enhancement is not configured for this deployment. QUANDA built this deterministic plan from your confirmed direction, skill gaps, and verified tutorials."
      : "Tính năng tăng cường bằng AI chưa được cấu hình cho bản triển khai này. QUANDA đã tạo kế hoạch xác định từ định hướng đã xác nhận, khoảng thiếu kỹ năng và tutorial đã kiểm chứng.";
  }
  if (reason === "invalid_response") {
    return language === "en"
      ? "AI enhancement returned a plan that did not pass QUANDA's consistency checks. QUANDA built this deterministic plan from your confirmed direction, skill gaps, and every verified tutorial you selected."
      : "Tính năng tăng cường bằng AI trả về kế hoạch chưa vượt qua kiểm tra tính nhất quán của QUANDA. QUANDA đã tạo kế hoạch xác định từ định hướng đã xác nhận, khoảng thiếu kỹ năng và mọi tutorial đã kiểm chứng mà bạn chọn.";
  }
  return language === "en"
    ? "AI enhancement was temporarily unavailable. QUANDA built this deterministic plan from your confirmed direction, skill gaps, and verified tutorials."
    : "Tính năng tăng cường bằng AI tạm thời không khả dụng. QUANDA đã tạo kế hoạch xác định từ định hướng đã xác nhận, khoảng thiếu kỹ năng và tutorial đã kiểm chứng.";
}

function validationSummary(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray(error.issues)
  ) {
    return error.issues
      .slice(0, 20)
      .map((issue) =>
        typeof issue === "object" && issue !== null
          ? JSON.stringify(issue)
          : String(issue),
      )
      .join("\n");
  }
  return "The response was not valid JSON matching the required schema.";
}

function parseRoadmap(content: string) {
  try {
    return RoadmapResponseSchema.safeParse(JSON.parse(content));
  } catch {
    return RoadmapResponseSchema.safeParse(null);
  }
}

function logAiFailure(stage: string, error: unknown) {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.error(`[QUANDA] Google AI ${stage} failed: ${message}`);
}

function aiDiagnosticCode(error: unknown): string {
  if (!(error instanceof Error)) return "request_error";
  const upstreamCode = error.message.match(
    /Google AI request failed \(([A-Z0-9_]+)\)/,
  )?.[1];
  if (upstreamCode) return `upstream_${upstreamCode.toLowerCase()}`;
  if (error.name === "AbortError") return "timeout";
  if (error.message === "Empty model response") return "empty_response";
  return "request_error";
}

function fallbackRoadmap(
  input: ReturnType<typeof createRoadmapInput>,
  source: "fallback",
  reason: FallbackReason = "unavailable",
): RoadmapResponse {
  const roadmap = createIntegratedFallback(input);
  return {
    ...roadmap,
    source,
    notice: fallbackNotice(input.projectInput.interfaceLanguage, reason),
  };
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request))) {
    return response(
      {
        error: "rate_limit",
        message:
          "Too many roadmap requests. Please wait a moment and try again.",
      },
      429,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return response(
      { error: "payload_too_large", message: "The request is too large." },
      413,
    );
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return response(
      { error: "invalid_request", message: "The request could not be read." },
      400,
    );
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return response(
      { error: "payload_too_large", message: "The request is too large." },
      413,
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return response(
      { error: "invalid_json", message: "The request was not valid JSON." },
      400,
    );
  }

  const parsedRequest = RoadmapGenerationRequestSchema.safeParse(input);
  if (!parsedRequest.success) {
    // Keep the pre-PR6 API contract usable for saved links, integrations, and
    // older clients that have not completed the Creative DNA review flow yet.
    const legacyRequest = RoadmapRequestSchema.safeParse(input);
    if (legacyRequest.success) {
      // Legacy callers do not provide the confirmed Creative DNA and learning
      // plan required by the integrated generator. Keep their historical,
      // deterministic contract instead of rejecting the request.
      const roadmap = createSampleRoadmap(legacyRequest.data);
      return response(roadmap, 200, roadmap.source);
    }
    return response(
      {
        error: "validation",
        message: "Please review the project details and try again.",
        fields: parsedRequest.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const roadmapInput = createRoadmapInput(parsedRequest.data);
  if (!process.env.GEMINI_API_KEY) {
    const roadmap = fallbackRoadmap(roadmapInput, "fallback", "not_configured");
    return response(roadmap, 200, roadmap.source);
  }

  try {
    const prompt = buildRoadmapPrompt({
      input: roadmapInput,
      daysRemaining: getDaysRemaining(roadmapInput.projectInput.deadline),
      availableMinutes: calculateAvailableMinutes(
        roadmapInput.projectInput.deadline,
        roadmapInput.projectInput.hoursPerDay,
        roadmapInput.projectInput.daysPerWeek,
      ),
    });

    const originalOutput = await withAbortTimeout(
      configuredTimeoutMs(
        process.env.GEMINI_ROADMAP_GENERATION_TIMEOUT_MS,
        25_000,
      ),
      (signal) => callGoogleAiForRoadmap(prompt, signal),
    );
    let parsedRoadmap = parseRoadmap(originalOutput);
    let repairDiagnostic: string | undefined;

    if (!parsedRoadmap.success) {
      try {
        const repairedOutput = await withAbortTimeout(
          configuredTimeoutMs(
            process.env.GEMINI_ROADMAP_REPAIR_TIMEOUT_MS,
            25_000,
          ),
          (signal) =>
            repairGoogleAiRoadmap(
              originalOutput,
              validationSummary(parsedRoadmap.error),
              roadmapInput.projectInput.interfaceLanguage,
              signal,
              prompt,
            ),
        );
        parsedRoadmap = parseRoadmap(repairedOutput);
      } catch (error) {
        logAiFailure("repair request", error);
        repairDiagnostic = aiDiagnosticCode(error);
        parsedRoadmap = RoadmapResponseSchema.safeParse(null);
      }
    }

    if (!parsedRoadmap.success) {
      console.warn("[QUANDA] Roadmap response remained schema-invalid after repair.");
      const roadmap = fallbackRoadmap(
        roadmapInput,
        "fallback",
        "invalid_response",
      );
      return response(
        roadmap,
        200,
        roadmap.source,
        repairDiagnostic || "invalid_after_repair",
      );
    }

    let validationErrors = validateRoadmapForInput(parsedRoadmap.data, roadmapInput);
    if (validationErrors.length > 0) {
      console.warn(
        `[QUANDA] Roadmap constraint validation requested repair: ${validationErrors.slice(0, 12).join(" | ")}`,
      );
      try {
        const repairedOutput = await withAbortTimeout(
          configuredTimeoutMs(
            process.env.GEMINI_ROADMAP_REPAIR_TIMEOUT_MS,
            25_000,
          ),
          (signal) =>
            repairGoogleAiRoadmap(
              JSON.stringify(parsedRoadmap.data),
              validationErrors.join("\n"),
              roadmapInput.projectInput.interfaceLanguage,
              signal,
              prompt,
            ),
        );
        const repairedRoadmap = parseRoadmap(repairedOutput);
        if (repairedRoadmap.success) {
          const repairedValidationErrors = validateRoadmapForInput(
            repairedRoadmap.data,
            roadmapInput,
          );
          if (repairedValidationErrors.length === 0) {
            parsedRoadmap = repairedRoadmap;
            validationErrors = [];
          } else {
            validationErrors = repairedValidationErrors;
          }
        } else {
          validationErrors = ["The repaired roadmap did not match the response schema."];
        }
      } catch (error) {
        logAiFailure("constraint repair request", error);
        repairDiagnostic = aiDiagnosticCode(error);
      }
    }
    if (validationErrors.length > 0) {
      console.warn(
        `[QUANDA] Roadmap constraint repair failed: ${validationErrors.slice(0, 12).join(" | ")}`,
      );
      const roadmap = fallbackRoadmap(
        roadmapInput,
        "fallback",
        "invalid_response",
      );
      return response(
        roadmap,
        200,
        roadmap.source,
        repairDiagnostic || "input_constraint_validation",
      );
    }
    const roadmap = normalizeRoadmap(parsedRoadmap.data, roadmapInput.projectInput, {
      allowedTutorialIds: new Set(roadmapInput.selectedTutorials.map((item) => item.tutorial.id)),
    });
    return response(roadmap, 200, roadmap.source);
  } catch (error) {
    logAiFailure("generation request", error);
    const roadmap = fallbackRoadmap(roadmapInput, "fallback");
    return response(
      roadmap,
      200,
      roadmap.source,
      aiDiagnosticCode(error),
    );
  }
}
