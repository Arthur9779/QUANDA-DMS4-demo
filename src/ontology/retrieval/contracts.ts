import { z } from "zod";

export const ONTOLOGY_RETRIEVAL_LIMITS = {
  default: 60,
  minimum: 10,
  maximum: 150,
} as const;

const StableOntologyIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/);

const FilterSchema = z.array(z.string().trim().min(1).max(120)).max(20);

export const OntologySearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(5_000),
  maxResults: z
    .number()
    .int()
    .min(ONTOLOGY_RETRIEVAL_LIMITS.minimum)
    .max(ONTOLOGY_RETRIEVAL_LIMITS.maximum)
    .default(ONTOLOGY_RETRIEVAL_LIMITS.default),
  families: FilterSchema.default([]),
  categories: FilterSchema.default([]),
  requiredApplications: z
    .array(z.string().trim().min(1).max(200))
    .max(12)
    .default([]),
});

export const OntologyCandidateSchema = z.object({
  id: StableOntologyIdSchema,
  label: z.string().trim().min(1).max(200),
  family: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120),
  score: z.number().finite().min(0).max(1).optional(),
  matchSource: z.enum(["semantic", "lexical", "exact", "fallback"]),
});

export const OntologySemanticResponseSchema = z.object({
  candidateIds: z.array(StableOntologyIdSchema).max(ONTOLOGY_RETRIEVAL_LIMITS.maximum),
});

export interface OntologySearchRequest {
  query: string;
  maxResults?: number;
  families?: string[];
  categories?: string[];
  requiredApplications?: string[];
}

export type ParsedOntologySearchRequest = z.infer<
  typeof OntologySearchRequestSchema
>;
export type OntologyCandidate = z.infer<typeof OntologyCandidateSchema>;

export interface OntologyRetriever {
  search(request: OntologySearchRequest): Promise<OntologyCandidate[]>;
}

export interface OntologyRetrievalDiagnostics {
  backend: "local" | "gemini_file_search" | "hybrid";
  ontologySchemaVersion: number;
  ontologySourceHash: string;
  queryHash: string;
  queryLength: number;
  query?: string;
  semanticResults: number;
  exactResults: number;
  lexicalResults: number;
  finalCandidateCount: number;
  topCandidateIds: string[];
  durationMs: number;
  fallbackUsed: boolean;
  cacheHit: boolean;
  providerErrorCode?: string;
}

export interface OntologyRetrievalResult {
  candidates: OntologyCandidate[];
  diagnostics: OntologyRetrievalDiagnostics;
}
