import { getApplicationName } from "@/src/data/applications";
import { buildOntologyRetrievalQuery } from "@/src/ontology/retrieval/queryBuilder";
import {
  createOntologyRetriever,
  type OntologyCandidate,
  type OntologyRetrievalResult,
} from "@/src/ontology/retrieval";
import { buildCreativeDnaPrompt } from "@/src/project-analysis/buildCreativeDnaPrompt";
import {
  ProjectAnalysisRequestSchema,
  ProjectAnalysisResponseSchema,
  type ProjectAnalysisRequest,
  type ProjectAnalysisResponse,
} from "@/src/project-analysis/contracts";
import {
  CreativeDnaClassifierError,
  createGeminiCreativeDnaClassifierFromEnvironment,
  type CreativeDnaClassifier,
} from "@/src/project-analysis/geminiClassifier";
import { normalizeCreativeDna } from "@/src/project-analysis/normalizeCreativeDna";

interface ProjectOntologyRetriever {
  searchWithDiagnostics(request: {
    query: string;
    maxResults?: number;
    requiredApplications?: string[];
  }): Promise<OntologyRetrievalResult>;
}

export interface AnalyzeProjectOptions {
  retriever?: ProjectOntologyRetriever;
  classifier?: CreativeDnaClassifier | null;
  semantic?: boolean;
  environment?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  now?: () => number;
  logDiagnostics?: boolean;
}

function fallbackCode(error: unknown): string {
  if (error instanceof CreativeDnaClassifierError) return error.code;
  if (error instanceof Error && error.name === "AbortError") return "TIMEOUT";
  return "CLASSIFICATION_FAILED";
}

function safeFailureDetail(error: unknown): string | undefined {
  if (!(error instanceof CreativeDnaClassifierError)) return undefined;
  return error.message.replace(/[^A-Za-z0-9_(),. -]/g, "").slice(0, 180);
}

function localRetrievalResult(
  request: ProjectAnalysisRequest,
): Promise<OntologyRetrievalResult> {
  const requiredApplications = request.requiredApplications.map(
    getApplicationName,
  );
  return createOntologyRetriever({
    semantic: false,
    includeDevelopmentQuery: false,
  }).searchWithDiagnostics({
    query: buildOntologyRetrievalQuery({
      projectBrief: request.projectBrief,
      currentExperience: request.currentExperience,
      requiredApplications,
      outputType: request.outputType,
      qualityTarget: request.targetQuality,
    }),
    requiredApplications,
    maxResults: 60,
  });
}

async function retrieveCandidates(
  request: ProjectAnalysisRequest,
  options: AnalyzeProjectOptions,
): Promise<OntologyRetrievalResult> {
  const requiredApplications = request.requiredApplications.map(
    getApplicationName,
  );
  const query = buildOntologyRetrievalQuery({
    projectBrief: request.projectBrief,
    currentExperience: request.currentExperience,
    requiredApplications,
    outputType: request.outputType,
    qualityTarget: request.targetQuality,
  });
  const retriever =
    options.retriever ??
    createOntologyRetriever({
      semantic: options.semantic,
      environment: options.environment,
      fetchImpl: options.fetchImpl,
      includeDevelopmentQuery: false,
    });
  try {
    return await retriever.searchWithDiagnostics({
      query,
      requiredApplications,
      maxResults: 60,
    });
  } catch {
    return localRetrievalResult(request);
  }
}

function classifierFor(options: AnalyzeProjectOptions) {
  if (options.classifier !== undefined) return options.classifier ?? undefined;
  return createGeminiCreativeDnaClassifierFromEnvironment(
    options.environment,
    options.fetchImpl,
  );
}

function logDiagnostics(input: {
  candidates: OntologyCandidate[];
  response: ProjectAnalysisResponse;
  failureDetail?: string;
}) {
  const message =
    `[QUANDA] Creative DNA candidates=${input.candidates.length} ` +
    `accepted=${input.response.diagnostics.acceptedOntologyIds.length} ` +
    `rejected=${input.response.diagnostics.rejectedOntologyIds.length} ` +
    `unknown=${input.response.diagnostics.unknownConceptCount} ` +
    `fallback=${input.response.diagnostics.fallbackUsed} ` +
    `failure=${input.response.diagnostics.failureCode ?? "none"}` +
    (input.failureDetail ? ` detail=${input.failureDetail}` : "");
  if (input.response.diagnostics.fallbackUsed) {
    console.warn(message);
    return;
  }
  if (process.env.NODE_ENV !== "production") console.info(message);
}

export async function analyzeProject(
  input: unknown,
  options: AnalyzeProjectOptions = {},
): Promise<ProjectAnalysisResponse> {
  const startedAt = (options.now ?? Date.now)();
  const request = ProjectAnalysisRequestSchema.parse(input);
  const retrieval = await retrieveCandidates(request, options);
  const classifier = classifierFor(options);
  let source: "ai" | "fallback" = "fallback";
  let failureCode: string | undefined;
  let failureDetail: string | undefined;
  let normalized;

  if (classifier) {
    try {
      const modelOutput = await classifier.classify(
        buildCreativeDnaPrompt({
          request,
          candidates: retrieval.candidates,
        }),
        options.signal,
      );
      normalized = normalizeCreativeDna({
        request,
        candidates: retrieval.candidates,
        modelOutput,
      });
      source = "ai";
    } catch (error) {
      failureCode = fallbackCode(error);
      failureDetail = safeFailureDetail(error);
    }
  } else {
    failureCode = "NOT_CONFIGURED";
  }

  normalized ??= normalizeCreativeDna({
    request,
    candidates: retrieval.candidates,
  });

  const response = ProjectAnalysisResponseSchema.parse({
    creativeDna: normalized.creativeDna,
    retrieval: {
      candidateCount: retrieval.candidates.length,
      backend: retrieval.diagnostics.backend,
      fallbackUsed: retrieval.diagnostics.fallbackUsed,
    },
    capabilityContext: {
      currentExperience: request.currentExperience,
      requiredApplications: request.requiredApplications,
    },
    source,
    diagnostics: {
      classificationDurationMs: Math.max(
        0,
        (options.now ?? Date.now)() - startedAt,
      ),
      retrievedCandidateIds: retrieval.candidates.map((candidate) => candidate.id),
      acceptedOntologyIds: normalized.acceptedOntologyIds,
      rejectedOntologyIds: normalized.rejectedOntologyIds,
      unknownConceptCount: normalized.creativeDna.unknownConcepts.length,
      fallbackUsed: source === "fallback",
      ...(failureCode ? { failureCode } : {}),
    },
  });
  if (options.logDiagnostics !== false) {
    logDiagnostics({ candidates: retrieval.candidates, response, failureDetail });
  }
  return response;
}
