import { NextRequest, NextResponse } from "next/server";
import { applications } from "@/src/data/applications";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import { buildRoadmapPrompt } from "@/src/lib/ai/buildRoadmapPrompt";
import {
  callGoogleAiForRoadmap,
  repairGoogleAiRoadmap,
} from "@/src/lib/ai/googleAi";
import {
  calculateAvailableMinutes,
  getDaysRemaining,
} from "@/src/lib/feasibility";
import { normalizeRoadmap } from "@/src/lib/normalizeRoadmap";
import { selectCandidateTutorials } from "@/src/lib/tutorialMatcher";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";
import type { RoadmapRequest, RoadmapResponse } from "@/src/types";

const MAX_BODY_BYTES = 30_000;
const RATE_LIMIT = 8;
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
    ? "QUANDA could not reach the AI service, so a reliable demo roadmap has been generated instead."
    : "QUANDA không thể kết nối với dịch vụ AI, nên hệ thống đã tạo một lộ trình mẫu đáng tin cậy để thay thế.";
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

function demoRoadmap(
  request: RoadmapRequest,
  source: "demo" | "fallback",
): RoadmapResponse {
  const roadmap = createSampleRoadmap(request);
  return {
    ...roadmap,
    source,
    ...(source === "fallback"
      ? { notice: fallbackNotice(request.interfaceLanguage) }
      : {}),
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

  const parsedRequest = RoadmapRequestSchema.safeParse(input);
  if (!parsedRequest.success) {
    return response(
      {
        error: "validation",
        message: "Please review the project details and try again.",
        fields: parsedRequest.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const roadmapRequest = parsedRequest.data;
  if (!process.env.GEMINI_API_KEY) {
    const roadmap = demoRoadmap(roadmapRequest, "demo");
    return response(roadmap, 200, roadmap.source);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const supportedApplicationIds =
      roadmapRequest.requiredApplications.length > 0
        ? roadmapRequest.requiredApplications
        : applications.map((application) => application.id);
    const prompt = buildRoadmapPrompt({
      request: roadmapRequest,
      daysRemaining: getDaysRemaining(roadmapRequest.deadline),
      availableMinutes: calculateAvailableMinutes(
        roadmapRequest.deadline,
        roadmapRequest.hoursPerDay,
        roadmapRequest.daysPerWeek,
      ),
      candidateTutorials: selectCandidateTutorials(roadmapRequest),
      supportedApplicationIds,
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
          roadmapRequest.interfaceLanguage,
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
      const roadmap = demoRoadmap(roadmapRequest, "fallback");
      return response(
        roadmap,
        200,
        roadmap.source,
        repairDiagnostic || "invalid_after_repair",
      );
    }

    const roadmap = normalizeRoadmap(parsedRoadmap.data, roadmapRequest);
    return response(roadmap, 200, roadmap.source);
  } catch (error) {
    logAiFailure("generation request", error);
    const roadmap = demoRoadmap(roadmapRequest, "fallback");
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
