export interface GeminiFileSearchAdminOptions {
  apiKey: string;
  baseUrl?: string;
  uploadBaseUrl?: string;
  embeddingModel?: string;
  fetchImpl?: typeof fetch;
  pollIntervalMs?: number;
  operationTimeoutMs?: number;
  now?: () => Date;
  wait?: (milliseconds: number) => Promise<void>;
}

export interface GeminiFileSearchIndexInput {
  content: Uint8Array;
  ontologySourceHash: string;
  ontologySchemaVersion: number;
  documentCount: number;
  storeName?: string;
}

export interface GeminiFileSearchIndexResult {
  storeName: string;
  documentName?: string;
  indexedAt: string;
}

interface Operation {
  name?: string;
  done?: boolean;
  response?: { documentName?: string; document_name?: string };
  error?: { code?: number; message?: string };
}

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function uploadBaseFor(baseUrl: string): string {
  const url = new URL(baseUrl);
  return `${url.origin}/upload${url.pathname}`.replace(/\/$/, "");
}

async function requireJson(
  response: Response,
  action: string,
): Promise<Record<string, unknown>> {
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new Error(`${action} failed (${response.status})`);
  }
  return body;
}

export async function indexOntologyWithGeminiFileSearch(
  input: GeminiFileSearchIndexInput,
  options: GeminiFileSearchAdminOptions,
): Promise<GeminiFileSearchIndexResult> {
  if (!options.apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const uploadBaseUrl = (
    options.uploadBaseUrl ?? uploadBaseFor(baseUrl)
  ).replace(/\/$/, "");
  const wait =
    options.wait ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const now = options.now ?? (() => new Date());
  let storeName = input.storeName;

  if (!storeName) {
    const response = await fetchImpl(`${baseUrl}/fileSearchStores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        displayName: `quanda-ontology-${input.ontologySourceHash.slice(0, 12)}`,
        embeddingModel:
          options.embeddingModel ?? "models/gemini-embedding-2",
      }),
    });
    const body = await requireJson(response, "File Search store creation");
    storeName = typeof body.name === "string" ? body.name : undefined;
    if (!storeName) throw new Error("File Search store response omitted its name");
  }

  if (!/^fileSearchStores\/[a-z0-9-]+$/.test(storeName)) {
    throw new Error("Invalid Gemini File Search store name");
  }

  const startResponse = await fetchImpl(
    `${uploadBaseUrl}/${storeName}:uploadToFileSearchStore`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(input.content.byteLength),
        "X-Goog-Upload-Header-Content-Type": "text/plain",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        displayName: `quanda-ontology-${input.ontologySourceHash.slice(0, 12)}.jsonl`,
        customMetadata: [
          { key: "ontology_source_hash", stringValue: input.ontologySourceHash },
          {
            key: "ontology_schema_version",
            numericValue: input.ontologySchemaVersion,
          },
          { key: "document_count", numericValue: input.documentCount },
        ],
        chunkingConfig: {
          whiteSpaceConfig: {
            maxTokensPerChunk: 120,
            maxOverlapTokens: 0,
          },
        },
      }),
    },
  );
  if (!startResponse.ok) {
    throw new Error(`File Search upload initialization failed (${startResponse.status})`);
  }
  const uploadUrl = startResponse.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("File Search upload URL was not returned");

  const uploadResponse = await fetchImpl(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(input.content.byteLength),
      "Content-Type": "text/plain",
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: input.content as BodyInit,
  });
  let operation = (await requireJson(
    uploadResponse,
    "File Search upload",
  )) as Operation;

  const startedAt = Date.now();
  const timeout = options.operationTimeoutMs ?? 10 * 60_000;
  while (!operation.done) {
    if (!operation.name) throw new Error("File Search operation omitted its name");
    if (Date.now() - startedAt >= timeout) {
      throw new Error("File Search indexing operation timed out");
    }
    await wait(options.pollIntervalMs ?? 2_000);
    const operationResponse = await fetchImpl(
      `${baseUrl}/${operation.name.replace(/^\//, "")}`,
      {
        headers: { "x-goog-api-key": options.apiKey },
      },
    );
    operation = (await requireJson(
      operationResponse,
      "File Search operation polling",
    )) as Operation;
  }
  if (operation.error) {
    throw new Error(
      `File Search indexing failed (${operation.error.code ?? "UNKNOWN"})`,
    );
  }

  return {
    storeName,
    documentName:
      operation.response?.documentName ?? operation.response?.document_name,
    indexedAt: now().toISOString(),
  };
}
