import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import {
  OntologySearchRequestSchema,
  OntologySemanticResponseSchema,
  type OntologyCandidate,
  type OntologyRetriever,
} from "@/src/ontology/retrieval/contracts";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

interface GeminiInteractionResponse {
  output_text?: string;
  outputText?: string;
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { status?: string; message?: string };
}

export class GeminiFileSearchError extends Error {
  constructor(
    readonly code:
      | "NOT_CONFIGURED"
      | "STALE_INDEX"
      | "TIMEOUT"
      | "HTTP_ERROR"
      | "INVALID_RESPONSE",
    message: string,
  ) {
    super(message);
    this.name = "GeminiFileSearchError";
  }
}

export interface GeminiFileSearchRetrieverOptions {
  apiKey: string;
  storeName: string;
  indexedOntologyHash: string;
  localOntologyHash: string;
  nodes: RuntimeOntologyNode[];
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

function interactionText(response: GeminiInteractionResponse): string {
  if (response.output_text?.trim()) return response.output_text.trim();
  if (response.outputText?.trim()) return response.outputText.trim();
  return (
    response.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

export class GeminiFileSearchRetriever implements OntologyRetriever {
  private readonly nodeById: Map<string, RuntimeOntologyNode>;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: GeminiFileSearchRetrieverOptions) {
    if (!options.apiKey || !options.storeName) {
      throw new GeminiFileSearchError(
        "NOT_CONFIGURED",
        "Gemini File Search is not configured",
      );
    }
    if (options.indexedOntologyHash !== options.localOntologyHash) {
      throw new GeminiFileSearchError(
        "STALE_INDEX",
        "Gemini File Search index does not match the local ontology",
      );
    }
    this.nodeById = new Map(options.nodes.map((node) => [node.id, node]));
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = Math.max(250, Math.min(options.timeoutMs ?? 5_000, 15_000));
  }

  async search(request: Parameters<OntologyRetriever["search"]>[0]) {
    const parsed = OntologySearchRequestSchema.parse(request);
    const baseUrl = (this.options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = this.options.model ?? DEFAULT_MODEL;
    const filterContext = [
      parsed.families.length > 0
        ? `Allowed families: ${parsed.families.join(", ")}`
        : "",
      parsed.categories.length > 0
        ? `Allowed categories: ${parsed.categories.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    const input = [
      "Retrieve ontology concepts that may be relevant to the project query.",
      "Return only canonical IDs that appear verbatim in the indexed documents.",
      "Do not classify or confirm the project. Do not invent IDs.",
      `Return at most ${parsed.maxResults} candidate IDs with useful diversity.`,
      filterContext,
      "PROJECT RETRIEVAL QUERY:",
      parsed.query,
    ]
      .filter(Boolean)
      .join("\n\n");

    let response: Response;
    try {
      response = await this.fetchImpl(`${baseUrl}/interactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.options.apiKey,
        },
        body: JSON.stringify({
          model,
          input,
          tools: [
            {
              type: "file_search",
              file_search_store_names: [this.options.storeName],
            },
          ],
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: {
              type: "object",
              properties: {
                candidateIds: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: parsed.maxResults,
                },
              },
              required: ["candidateIds"],
              additionalProperties: false,
            },
          },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new GeminiFileSearchError(
          "TIMEOUT",
          "Gemini File Search request timed out",
        );
      }
      throw new GeminiFileSearchError(
        "HTTP_ERROR",
        "Gemini File Search request failed",
      );
    }

    const body = (await response.json().catch(() => ({}))) as GeminiInteractionResponse;
    if (!response.ok) {
      const safeStatus = body.error?.status?.replace(/[^A-Z_]/g, "") || "UNKNOWN";
      throw new GeminiFileSearchError(
        "HTTP_ERROR",
        `Gemini File Search request failed (${response.status}_${safeStatus})`,
      );
    }

    const text = interactionText(body);
    let semanticResponse: { candidateIds: string[] };
    try {
      semanticResponse = OntologySemanticResponseSchema.parse(JSON.parse(text));
    } catch {
      throw new GeminiFileSearchError(
        "INVALID_RESPONSE",
        "Gemini File Search returned an invalid candidate list",
      );
    }

    const familyFilters = new Set(parsed.families.map(normalizeOntologyLabel));
    const categoryFilters = new Set(
      parsed.categories.map(normalizeOntologyLabel),
    );
    const uniqueIds = [...new Set(semanticResponse.candidateIds)];
    const candidates: OntologyCandidate[] = [];
    for (const id of uniqueIds) {
      const node = this.nodeById.get(id);
      if (!node) continue;
      if (
        familyFilters.size > 0 &&
        !familyFilters.has(normalizeOntologyLabel(node.family))
      ) {
        continue;
      }
      if (
        categoryFilters.size > 0 &&
        !categoryFilters.has(normalizeOntologyLabel(node.category))
      ) {
        continue;
      }
      const rank = candidates.length;
      candidates.push({
        id: node.id,
        label: node.label,
        family: node.family,
        category: node.category,
        score: Math.max(0.55, 0.95 - rank * 0.01),
        matchSource: "semantic",
      });
      if (candidates.length >= parsed.maxResults) break;
    }
    return candidates;
  }
}

export function createGeminiFileSearchRetrieverFromEnvironment(input: {
  nodes: RuntimeOntologyNode[];
  localOntologyHash: string;
  environment?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): GeminiFileSearchRetriever | undefined {
  const environment = input.environment ?? process.env;
  const apiKey = environment.GEMINI_API_KEY;
  const storeName = environment.GEMINI_FILE_SEARCH_STORE;
  const indexedOntologyHash = environment.GEMINI_FILE_SEARCH_ONTOLOGY_HASH;
  if (!apiKey || !storeName || !indexedOntologyHash) return undefined;

  return new GeminiFileSearchRetriever({
    apiKey,
    storeName,
    indexedOntologyHash,
    localOntologyHash: input.localOntologyHash,
    nodes: input.nodes,
    model: environment.GEMINI_RETRIEVAL_MODEL ?? environment.GEMINI_MODEL,
    baseUrl: environment.GEMINI_BASE_URL,
    timeoutMs: Number(environment.GEMINI_RETRIEVAL_TIMEOUT_MS || 5_000),
    fetchImpl: input.fetchImpl,
  });
}
