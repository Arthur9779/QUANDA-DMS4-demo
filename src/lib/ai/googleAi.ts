import { buildRepairPrompt } from "./buildRoadmapPrompt";
import { QUANDA_SYSTEM_PROMPT } from "./systemPrompt";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

interface GoogleAiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    status?: string;
    details?: Array<{
      reason?: string;
      metadata?: { reason?: string };
    }>;
  };
}

function safeErrorCode(data: GoogleAiResponse): string {
  const status = data.error?.status?.replace(/[^A-Z_]/g, "") || "UNKNOWN";
  const reason = data.error?.details
    ?.map((detail) => detail.reason || detail.metadata?.reason)
    .find(Boolean)
    ?.replace(/[^A-Z_]/g, "");
  return reason ? `${status}_${reason}` : status;
}

function endpoint(): string {
  const baseUrl = (process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  return `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`;
}

async function completeJson(
  userPrompt: string,
  signal: AbortSignal,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const response = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: QUANDA_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 5_000,
        responseMimeType: "application/json",
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = (await response
      .json()
      .catch(() => ({}))) as GoogleAiResponse;
    throw new Error(
      `Google AI request failed (${response.status}_${safeErrorCode(errorData)})`,
    );
  }

  const data = (await response.json()) as GoogleAiResponse;
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!content) throw new Error("Empty model response");
  return content;
}

export function callGoogleAiForRoadmap(
  prompt: string,
  signal: AbortSignal,
): Promise<string> {
  return completeJson(prompt, signal);
}

export function repairGoogleAiRoadmap(
  originalOutput: string,
  validationErrors: string,
  language: "en" | "vi",
  signal: AbortSignal,
): Promise<string> {
  return completeJson(
    buildRepairPrompt(originalOutput, validationErrors, language),
    signal,
  );
}
