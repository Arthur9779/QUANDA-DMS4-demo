import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import {
  OntologySearchRequestSchema,
  type OntologyCandidate,
  type OntologyRetrievalResult,
  type OntologyRetriever,
  type ParsedOntologySearchRequest,
} from "@/src/ontology/retrieval/contracts";
import { LocalOntologyRetriever } from "@/src/ontology/retrieval/localRetriever";
import { sha256 } from "@/src/ontology/retrieval/searchDocuments";

interface CacheEntry {
  expiresAt: number;
  result: OntologyRetrievalResult;
}

export interface HybridOntologyRetrieverOptions {
  nodes: RuntimeOntologyNode[];
  ontologySchemaVersion: number;
  ontologySourceHash: string;
  semanticRetriever?: OntologyRetriever;
  semanticUnavailableReason?: string;
  cacheTtlMs?: number;
  cacheSize?: number;
  now?: () => number;
  includeDevelopmentQuery?: boolean;
}

const SOURCE_PRIORITY: Record<OntologyCandidate["matchSource"], number> = {
  exact: 4,
  semantic: 3,
  lexical: 2,
  fallback: 1,
};

function compareCandidates(
  left: OntologyCandidate,
  right: OntologyCandidate,
): number {
  return (
    SOURCE_PRIORITY[right.matchSource] - SOURCE_PRIORITY[left.matchSource] ||
    (right.score ?? 0) - (left.score ?? 0) ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

function cacheKey(
  request: ParsedOntologySearchRequest,
  ontologySourceHash: string,
): string {
  return sha256(
    JSON.stringify({
      ontologySourceHash,
      query: normalizeOntologyLabel(request.query),
      maxResults: request.maxResults,
      families: request.families.map(normalizeOntologyLabel).sort(),
      categories: request.categories.map(normalizeOntologyLabel).sort(),
      requiredApplications: request.requiredApplications
        .map(normalizeOntologyLabel)
        .sort(),
    }),
  );
}

function diversifyCandidates(
  candidates: OntologyCandidate[],
  limit: number,
): OntologyCandidate[] {
  const sorted = [...candidates].sort(compareCandidates);
  const selected: OntologyCandidate[] = [];
  const selectedIds = new Set<string>();
  const familyCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const exactLabelCounts = new Map<string, number>();
  const familyLimit = Math.max(5, Math.ceil(limit * 0.35));
  const categoryLimit = Math.max(3, Math.ceil(limit * 0.15));

  const add = (candidate: OntologyCandidate) => {
    selected.push(candidate);
    selectedIds.add(candidate.id);
    const family = normalizeOntologyLabel(candidate.family);
    const category = `${family}\u0000${normalizeOntologyLabel(candidate.category)}`;
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    if (candidate.matchSource === "exact") {
      const label = normalizeOntologyLabel(candidate.label);
      exactLabelCounts.set(label, (exactLabelCounts.get(label) ?? 0) + 1);
    }
  };

  for (const candidate of sorted.filter(
    (value) => value.matchSource === "exact",
  )) {
    if (selected.length >= limit) break;
    const family = normalizeOntologyLabel(candidate.family);
    const category = `${family}\u0000${normalizeOntologyLabel(candidate.category)}`;
    const label = normalizeOntologyLabel(candidate.label);
    const labelLimit = (candidate.score ?? 0) >= 1 ? 3 : 1;
    if ((exactLabelCounts.get(label) ?? 0) >= labelLimit) continue;
    if ((familyCounts.get(family) ?? 0) >= familyLimit) continue;
    if ((categoryCounts.get(category) ?? 0) >= categoryLimit) continue;
    add(candidate);
  }

  for (const candidate of sorted) {
    if (selected.length >= limit) break;
    if (selectedIds.has(candidate.id)) continue;
    const family = normalizeOntologyLabel(candidate.family);
    const category = `${family}\u0000${normalizeOntologyLabel(candidate.category)}`;
    const labelLimit = (candidate.score ?? 0) >= 1 ? 3 : 1;
    if (
      candidate.matchSource === "exact" &&
      (exactLabelCounts.get(normalizeOntologyLabel(candidate.label)) ?? 0) >=
        labelLimit
    ) {
      continue;
    }
    if ((familyCounts.get(family) ?? 0) >= familyLimit) continue;
    if ((categoryCounts.get(category) ?? 0) >= categoryLimit) continue;
    add(candidate);
  }

  for (const candidate of sorted) {
    if (selected.length >= limit) break;
    if (selectedIds.has(candidate.id)) continue;
    if (candidate.matchSource === "exact") {
      const label = normalizeOntologyLabel(candidate.label);
      const labelLimit = (candidate.score ?? 0) >= 1 ? 3 : 1;
      if ((exactLabelCounts.get(label) ?? 0) >= labelLimit) continue;
    }
    add(candidate);
  }
  return selected;
}

function providerErrorCode(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
  }
  return "SEMANTIC_PROVIDER_FAILED";
}

export class HybridOntologyRetriever implements OntologyRetriever {
  private readonly localRetriever: LocalOntologyRetriever;
  private readonly nodeById: Map<string, RuntimeOntologyNode>;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly now: () => number;
  private readonly cacheTtlMs: number;
  private readonly cacheSize: number;

  constructor(private readonly options: HybridOntologyRetrieverOptions) {
    this.localRetriever = new LocalOntologyRetriever(options.nodes);
    this.nodeById = new Map(options.nodes.map((node) => [node.id, node]));
    this.now = options.now ?? Date.now;
    this.cacheTtlMs = Math.max(0, options.cacheTtlMs ?? 5 * 60_000);
    this.cacheSize = Math.max(1, options.cacheSize ?? 100);
  }

  async search(request: Parameters<OntologyRetriever["search"]>[0]) {
    return (await this.searchWithDiagnostics(request)).candidates;
  }

  async searchWithDiagnostics(
    request: Parameters<OntologyRetriever["search"]>[0],
  ): Promise<OntologyRetrievalResult> {
    const startedAt = this.now();
    const parsed = OntologySearchRequestSchema.parse(request);
    const key = cacheKey(parsed, this.options.ontologySourceHash);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt >= startedAt) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return {
        candidates: cached.result.candidates.map((candidate) => ({ ...candidate })),
        diagnostics: {
          ...cached.result.diagnostics,
          cacheHit: true,
          durationMs: Math.max(0, this.now() - startedAt),
        },
      };
    }
    if (cached) this.cache.delete(key);

    const localPromise = this.localRetriever.search({
      ...parsed,
      // Retrieve a wider deterministic pool before applying cross-source
      // deduplication and diversity limits. This avoids repeated exact labels
      // consuming every local slot before lexical candidates are considered.
      maxResults: 150,
    });
    let semanticCandidates: OntologyCandidate[] = [];
    let semanticFailed = !this.options.semanticRetriever;
    let semanticError = this.options.semanticUnavailableReason;
    if (this.options.semanticRetriever) {
      try {
        semanticCandidates = await this.options.semanticRetriever.search(parsed);
      } catch (error) {
        semanticFailed = true;
        semanticError = providerErrorCode(error);
      }
    }
    const localCandidates = await localPromise;
    const exactCandidates = localCandidates.filter(
      (candidate) => candidate.matchSource === "exact",
    );
    const lexicalCandidates = localCandidates.filter(
      (candidate) => candidate.matchSource === "lexical",
    );

    const merged = new Map<string, OntologyCandidate>();
    const add = (candidate: OntologyCandidate) => {
      const node = this.nodeById.get(candidate.id);
      if (!node) return;
      const hydrated: OntologyCandidate = {
        id: node.id,
        label: node.label,
        family: node.family,
        category: node.category,
        score: candidate.score,
        matchSource: candidate.matchSource,
      };
      const existing = merged.get(candidate.id);
      if (
        existing?.matchSource === "exact" &&
        hydrated.matchSource === "semantic"
      ) {
        merged.set(candidate.id, {
          ...existing,
          // Semantic corroboration keeps an exact node ahead of unrelated
          // nodes that happen to share the same display label.
          score: Math.max(
            existing.score ?? 0,
            Math.min(1, (hydrated.score ?? 0) + 0.04),
          ),
        });
        return;
      }
      if (!existing || compareCandidates(hydrated, existing) < 0) {
        merged.set(candidate.id, hydrated);
      }
    };

    exactCandidates.forEach(add);
    semanticCandidates.forEach(add);
    lexicalCandidates.forEach((candidate) =>
      add({
        ...candidate,
        matchSource: semanticFailed ? "fallback" : "lexical",
      }),
    );

    const candidates = diversifyCandidates(
      [...merged.values()],
      parsed.maxResults,
    );
    const diagnostics = {
      backend: this.options.semanticRetriever ? ("hybrid" as const) : ("local" as const),
      ontologySchemaVersion: this.options.ontologySchemaVersion,
      ontologySourceHash: this.options.ontologySourceHash,
      queryHash: sha256(normalizeOntologyLabel(parsed.query)),
      queryLength: parsed.query.length,
      ...(this.options.includeDevelopmentQuery ? { query: parsed.query } : {}),
      semanticResults: semanticCandidates.length,
      exactResults: exactCandidates.length,
      lexicalResults: lexicalCandidates.length,
      finalCandidateCount: candidates.length,
      topCandidateIds: candidates.slice(0, 10).map((candidate) => candidate.id),
      durationMs: Math.max(0, this.now() - startedAt),
      fallbackUsed: semanticFailed,
      cacheHit: false,
      ...(semanticError ? { providerErrorCode: semanticError } : {}),
    };
    const result: OntologyRetrievalResult = { candidates, diagnostics };

    if (this.cacheTtlMs > 0) {
      this.cache.set(key, {
        expiresAt: this.now() + this.cacheTtlMs,
        result,
      });
      while (this.cache.size > this.cacheSize) {
        const oldestKey = this.cache.keys().next().value as string | undefined;
        if (!oldestKey) break;
        this.cache.delete(oldestKey);
      }
    }
    return result;
  }
}
