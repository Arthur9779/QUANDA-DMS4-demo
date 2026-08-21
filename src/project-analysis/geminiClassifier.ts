import {
  CreativeDnaModelOutputSchema,
  type CreativeDnaModelOutput,
} from "@/src/project-analysis/contracts";
import { CREATIVE_DNA_SYSTEM_INSTRUCTION } from "@/src/project-analysis/buildCreativeDnaPrompt";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

interface GoogleAiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { status?: string };
}

export interface CreativeDnaClassifier {
  classify(prompt: string, signal?: AbortSignal): Promise<CreativeDnaModelOutput>;
}

export class CreativeDnaClassifierError extends Error {
  constructor(
    readonly code:
      | "NOT_CONFIGURED"
      | "TIMEOUT"
      | "HTTP_ERROR"
      | "EMPTY_RESPONSE"
      | "INVALID_RESPONSE",
    message: string,
  ) {
    super(message);
    this.name = "CreativeDnaClassifierError";
  }
}

export interface GeminiCreativeDnaClassifierOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

// Keep the transport schema deliberately compact: Gemini can reject large or
// deeply nested structured-output schemas. Optional evidence is restored by
// normalization, while the complete Zod contract still validates the response.
export const CREATIVE_DNA_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    projectIntent: { type: "string" },
    concepts: {
      type: "array",
      maxItems: 120,
      items: {
        type: "object",
        properties: {
          ontologyId: { type: "string" },
          rawLabel: { type: "string" },
          source: {
            type: "string",
            enum: [
              "explicit_requirement",
              "user_preference",
              "ai_inferred",
            ],
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: [
          "ontologyId",
          "rawLabel",
          "source",
          "confidence",
        ],
      },
    },
    unknownConcepts: {
      type: "array",
      maxItems: 40,
      items: {
        type: "object",
        properties: {
          raw: { type: "string" },
          nearestOntologyIds: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
          source: {
            type: "string",
            enum: [
              "explicit_requirement",
              "user_preference",
              "ai_inferred",
            ],
          },
        },
        required: ["raw", "nearestOntologyIds", "source"],
      },
    },
    constraints: {
      type: "array",
      maxItems: 40,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          kind: {
            type: "string",
            enum: [
              "hard_requirement",
              "preference",
              "deadline",
              "available_time",
              "deliverable",
              "resource",
              "accessibility",
              "other",
            ],
          },
          source: {
            type: "string",
            enum: [
              "explicit_requirement",
              "user_preference",
              "ai_inferred",
            ],
          },
        },
        required: ["label", "kind", "source"],
      },
    },
  },
  required: ["projectIntent", "concepts", "unknownConcepts", "constraints"],
} as const;

function responseText(data: GoogleAiResponse): string {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function parseStructuredOutput(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object found");
    return JSON.parse(unfenced.slice(start, end + 1));
  }
}

export class GeminiCreativeDnaClassifier implements CreativeDnaClassifier {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: GeminiCreativeDnaClassifierOptions) {
    if (!options.apiKey) {
      throw new CreativeDnaClassifierError(
        "NOT_CONFIGURED",
        "Gemini Creative DNA classification is not configured",
      );
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = Math.max(500, Math.min(options.timeoutMs ?? 15_000, 25_000));
  }

  async classify(prompt: string, signal?: AbortSignal) {
    const baseUrl = (this.options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = this.options.model ?? DEFAULT_MODEL;
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const requestSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;
    let response: Response;
    try {
      response = await this.fetchImpl(
        `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.options.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: CREATIVE_DNA_SYSTEM_INSTRUCTION }],
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.15,
              maxOutputTokens: 6_000,
              responseMimeType: "application/json",
              responseJsonSchema: CREATIVE_DNA_RESPONSE_JSON_SCHEMA,
            },
          }),
          signal: requestSignal,
        },
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new CreativeDnaClassifierError(
          "TIMEOUT",
          "Gemini Creative DNA classification timed out",
        );
      }
      throw new CreativeDnaClassifierError(
        "HTTP_ERROR",
        "Gemini Creative DNA classification request failed",
      );
    }

    const data = (await response.json().catch(() => ({}))) as GoogleAiResponse;
    if (!response.ok) {
      const status = data.error?.status?.replace(/[^A-Z_]/g, "") || "UNKNOWN";
      throw new CreativeDnaClassifierError(
        "HTTP_ERROR",
        `Gemini Creative DNA classification failed (${response.status}_${status})`,
      );
    }
    const text = responseText(data);
    if (!text) {
      throw new CreativeDnaClassifierError(
        "EMPTY_RESPONSE",
        "Gemini Creative DNA classification returned no content",
      );
    }
    let structuredOutput: unknown;
    try {
      structuredOutput = parseStructuredOutput(text);
    } catch {
      throw new CreativeDnaClassifierError(
        "INVALID_RESPONSE",
        "Gemini Creative DNA classification returned invalid JSON",
      );
    }
    const parsed = CreativeDnaModelOutputSchema.safeParse(structuredOutput);
    if (!parsed.success) {
      const issuePaths = parsed.error.issues
        .slice(0, 8)
        .map((issue) => issue.path.join(".") || "root")
        .join(",");
      throw new CreativeDnaClassifierError(
        "INVALID_RESPONSE",
        `Gemini Creative DNA classification failed schema validation (${issuePaths})`,
      );
    }
    return parsed.data;
  }
}

export function createGeminiCreativeDnaClassifierFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
  fetchImpl?: typeof fetch,
): GeminiCreativeDnaClassifier | undefined {
  if (!environment.GEMINI_API_KEY) return undefined;
  return new GeminiCreativeDnaClassifier({
    apiKey: environment.GEMINI_API_KEY,
    model:
      environment.GEMINI_CLASSIFICATION_MODEL ?? environment.GEMINI_MODEL,
    baseUrl: environment.GEMINI_BASE_URL,
    timeoutMs: Number(environment.GEMINI_CLASSIFICATION_TIMEOUT_MS || 15_000),
    fetchImpl,
  });
}
