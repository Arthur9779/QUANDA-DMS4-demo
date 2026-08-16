import { ontologyArtifact } from "@/src/ontology/runtime";
import {
  createGeminiFileSearchRetrieverFromEnvironment,
  GeminiFileSearchError,
} from "@/src/ontology/retrieval/geminiFileSearchRetriever";
import { HybridOntologyRetriever } from "@/src/ontology/retrieval/hybridRetriever";
import type {
  OntologyRetrievalResult,
  OntologySearchRequest,
} from "@/src/ontology/retrieval/contracts";

export interface CreateOntologyRetrieverOptions {
  semantic?: boolean;
  environment?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  includeDevelopmentQuery?: boolean;
}

export function createOntologyRetriever(
  options: CreateOntologyRetrieverOptions = {},
): HybridOntologyRetriever {
  let semanticRetriever;
  let semanticUnavailableReason: string | undefined;
  if (options.semantic !== false) {
    try {
      semanticRetriever = createGeminiFileSearchRetrieverFromEnvironment({
        nodes: ontologyArtifact.nodes,
        localOntologyHash: ontologyArtifact.source.sha256,
        environment: options.environment,
        fetchImpl: options.fetchImpl,
      });
      if (!semanticRetriever) semanticUnavailableReason = "NOT_CONFIGURED";
    } catch (error) {
      semanticUnavailableReason =
        error instanceof GeminiFileSearchError
          ? error.code
          : "SEMANTIC_PROVIDER_CONFIGURATION_FAILED";
    }
  } else {
    semanticUnavailableReason = "SEMANTIC_DISABLED";
  }

  return new HybridOntologyRetriever({
    nodes: ontologyArtifact.nodes,
    ontologySchemaVersion: ontologyArtifact.ontologySchemaVersion,
    ontologySourceHash: ontologyArtifact.source.sha256,
    semanticRetriever,
    semanticUnavailableReason,
    includeDevelopmentQuery:
      options.includeDevelopmentQuery ?? process.env.NODE_ENV !== "production",
  });
}

let defaultRetriever: HybridOntologyRetriever | undefined;

export async function searchOntologySemantic(
  request: OntologySearchRequest,
): Promise<OntologyRetrievalResult> {
  defaultRetriever ??= createOntologyRetriever();
  return defaultRetriever.searchWithDiagnostics(request);
}

export type {
  OntologyCandidate,
  OntologyRetrievalDiagnostics,
  OntologyRetrievalResult,
  OntologyRetriever,
  OntologySearchRequest,
} from "@/src/ontology/retrieval/contracts";
