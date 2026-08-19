import { NextRequest, NextResponse } from "next/server";
import { buildRoadmapPrompt } from "@/src/lib/ai/buildRoadmapPrompt";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import {
  callGoogleAiForRoadmap,
  repairGoogleAiRoadmap,
} from "@/src/lib/ai/googleAi";
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

function fallbackNotice(language: "en" | "vi"): string {
  return language === "en"
    ? "QUANDA could not reach the AI service, so it built a project-aware plan from your confirmed direction, skill gaps, and selected tutorials."
    : "QUANDA không thể kết nối với dịch vụ AI, nên hệ thống đã tạo kế hoạch theo dự án từ định hướng đã xác nhận, khoảng thiếu kỹ năng và tutorial đã chọn.";
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
): RoadmapResponse {
  const roadmap = createIntegratedFallback(input);
  return {
    ...roadmap,
    source,
    notice: fallbackNotice(input.projectInput.interfaceLanguage),
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
    const roadmap = fallbackRoadmap(roadmapInput, "fallback");
    return response(roadmap, 200, roadmap.source);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
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

    const originalOutput = await callGoogleAiForRoadmap(
      prompt,
      controller.signal,
    );
    let parsedRoadmap = parseRoadmap(originalOutput);
    let repairDiagnostic: string | undefined;

    if (!parsedRoadmap.success) {
      try {
        const repairedOutput = await repairGoogleAiRoadmap(
          originalOutput,
          validationSummary(parsedRoadmap.error),
          roadmapInput.projectInput.interfaceLanguage,
          controller.signal,
        );
        parsedRoadmap = parseRoadmap(repairedOutput);
      } catch (error) {
        logAiFailure("repair request", error);
        repairDiagnostic = aiDiagnosticCode(error);
        parsedRoadmap = RoadmapResponseSchema.safeParse(null);
      }
    }

    if (!parsedRoadmap.success) {
      const roadmap = fallbackRoadmap(roadmapInput, "fallback");
      return response(
        roadmap,
        200,
        roadmap.source,
        repairDiagnostic || "invalid_after_repair",
      );
    }

    const validationErrors = validateRoadmapForInput(parsedRoadmap.data, roadmapInput);
    if (validationErrors.length > 0) {
      const roadmap = fallbackRoadmap(roadmapInput, "fallback");
      return response(roadmap, 200, roadmap.source, "input_constraint_validation");
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
  } finally {
    clearTimeout(timeout);
  }
}
