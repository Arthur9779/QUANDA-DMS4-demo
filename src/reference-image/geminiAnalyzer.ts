import {
  ReferenceImageModelOutputSchema,
  type ReferenceImageModelOutput,
} from "@/src/reference-image/contracts";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

interface GoogleAiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { status?: string };
}

export class ReferenceImageAnalysisError extends Error {
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
    this.name = "ReferenceImageAnalysisError";
  }
}

export interface ReferenceImageAnalyzer {
  analyze(input: {
    bytes: Uint8Array;
    mimeType: string;
    projectBrief?: string;
    signal?: AbortSignal;
  }): Promise<ReferenceImageModelOutput>;
}

export interface GeminiReferenceImageAnalyzerOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export const REFERENCE_IMAGE_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          category: {
            type: "string",
            enum: [
              "creative_direction",
              "visual_quality",
              "composition",
              "color",
              "lighting",
              "material_texture",
              "image_making",
              "motion_interaction",
            ],
          },
          evidence: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["label", "category", "evidence", "confidence"],
      },
    },
  },
  required: ["findings"],
} as const;

const SYSTEM_INSTRUCTION = `You extract production-relevant visual attributes from a design reference image for QUANDA.
Return 3-8 concise findings that could improve a Creative DNA and tutorial search.
Prefer canonical, searchable production vocabulary such as "high contrast", "fisheye", "soft lighting", "toon shading", or "asymmetrical composition".
Describe only visible creative direction, visual qualities, composition, color, lighting, material/texture, image-making style, or motion/interaction cues.
Do not identify people. Do not infer age, ethnicity, gender, health, emotion, religion, politics, location, authorship, brand ownership, or other sensitive/personal traits.
Do not invent tools, techniques, cultural movements, or project requirements that are not visually supported.
The evidence field must briefly state what visible feature supports the finding. Output JSON only.`;

function responseText(data: GoogleAiResponse): string {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function parseJson(text: string): unknown {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(unfenced);
}

export class GeminiReferenceImageAnalyzer implements ReferenceImageAnalyzer {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: GeminiReferenceImageAnalyzerOptions) {
    if (!options.apiKey) {
      throw new ReferenceImageAnalysisError(
        "NOT_CONFIGURED",
        "Reference image analysis is not configured",
      );
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = Math.max(1_000, Math.min(options.timeoutMs ?? 15_000, 25_000));
  }

  async analyze(input: {
    bytes: Uint8Array;
    mimeType: string;
    projectBrief?: string;
    signal?: AbortSignal;
  }) {
    const baseUrl = (this.options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = this.options.model ?? DEFAULT_MODEL;
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = input.signal
      ? AbortSignal.any([input.signal, timeoutSignal])
      : timeoutSignal;
    const context = input.projectBrief?.trim()
      ? `Project context (use only to disambiguate visible production attributes): ${input.projectBrief.trim().slice(0, 1_000)}`
      : "Extract the visible production attributes from this reference.";

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
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [
              {
                role: "user",
                parts: [
                  { text: context },
                  {
                    inlineData: {
                      mimeType: input.mimeType,
                      data: Buffer.from(input.bytes).toString("base64"),
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1_500,
              responseMimeType: "application/json",
              responseSchema: REFERENCE_IMAGE_RESPONSE_JSON_SCHEMA,
            },
          }),
          signal,
        },
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new ReferenceImageAnalysisError(
          "TIMEOUT",
          "Reference image analysis timed out",
        );
      }
      throw new ReferenceImageAnalysisError(
        "HTTP_ERROR",
        "Reference image analysis request failed",
      );
    }

    const data = (await response.json().catch(() => ({}))) as GoogleAiResponse;
    if (!response.ok) {
      const status = data.error?.status?.replace(/[^A-Z_]/g, "") || "UNKNOWN";
      throw new ReferenceImageAnalysisError(
        "HTTP_ERROR",
        `Reference image analysis failed (${response.status}_${status})`,
      );
    }
    const text = responseText(data);
    if (!text) {
      throw new ReferenceImageAnalysisError(
        "EMPTY_RESPONSE",
        "Reference image analysis returned no content",
      );
    }
    let parsedJson: unknown;
    try {
      parsedJson = parseJson(text);
    } catch {
      throw new ReferenceImageAnalysisError(
        "INVALID_RESPONSE",
        "Reference image analysis returned invalid JSON",
      );
    }
    const parsed = ReferenceImageModelOutputSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new ReferenceImageAnalysisError(
        "INVALID_RESPONSE",
        "Reference image analysis failed schema validation",
      );
    }
    return parsed.data;
  }
}

export function createGeminiReferenceImageAnalyzerFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
  fetchImpl?: typeof fetch,
): GeminiReferenceImageAnalyzer | undefined {
  if (!environment.GEMINI_API_KEY) return undefined;
  return new GeminiReferenceImageAnalyzer({
    apiKey: environment.GEMINI_API_KEY,
    model:
      environment.GEMINI_REFERENCE_IMAGE_MODEL ??
      environment.GEMINI_CLASSIFICATION_MODEL ??
      environment.GEMINI_MODEL,
    baseUrl: environment.GEMINI_BASE_URL,
    timeoutMs: Number(environment.GEMINI_REFERENCE_IMAGE_TIMEOUT_MS || 15_000),
    fetchImpl,
  });
}

