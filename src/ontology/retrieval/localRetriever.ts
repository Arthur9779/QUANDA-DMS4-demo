import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import {
  normalizeOntologyLabel,
  tokenizeOntologyLabel,
} from "@/src/ontology/normalization";
import {
  OntologySearchRequestSchema,
  type OntologyCandidate,
  type OntologyRetriever,
} from "@/src/ontology/retrieval/contracts";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "by",
  "create",
  "for",
  "from",
  "i",
  "in",
  "into",
  "is",
  "it",
  "make",
  "my",
  "of",
  "on",
  "or",
  "project",
  "the",
  "to",
  "use",
  "using",
  "want",
  "with",
  "và",
  "có",
  "cho",
  "của",
  "dùng",
  "làm",
  "một",
  "tạo",
  "trong",
  "tôi",
  "với",
]);

const QUERY_EXPANSIONS: Record<string, string[]> = {
  music: ["audio", "sound"],
  musical: ["audio", "sound"],
  reacting: ["reactive", "interaction"],
  reacts: ["reactive", "interaction"],
  website: ["web", "interactive"],
  webpage: ["web", "interactive"],
  inspired: ["influence"],
  underwater: ["aquatic"],
  dreamy: ["dreamlike"],
  painted: ["painting", "painterly"],
  children: ["illustration", "editorial"],
  tracking: ["sensor", "interaction"],
  hand: ["gesture"],
  audio: ["sound", "music"],
  âm: ["audio", "sound"],
  nhạc: ["music", "audio"],
  tương: ["interactive", "interaction"],
  tác: ["interactive", "interaction"],
  chuyển: ["motion", "animation"],
  động: ["motion", "animation"],
  nước: ["watercolor", "aquatic"],
  áp: ["poster"],
  phích: ["poster"],
};

interface SearchableNode {
  node: RuntimeOntologyNode;
  normalizedLabels: string[];
  labelTokens: Set<string>;
  familyTokens: Set<string>;
  categoryTokens: Set<string>;
}

function meaningfulTokens(value: string): Set<string> {
  return new Set(
    tokenizeOntologyLabel(value).filter(
      (token) => token.length > 1 && !STOP_WORDS.has(token),
    ),
  );
}

function expandedQueryTokens(query: string): Set<string> {
  const tokens = meaningfulTokens(query);
  for (const token of [...tokens]) {
    for (const expansion of QUERY_EXPANSIONS[token] ?? []) tokens.add(expansion);
  }
  return tokens;
}

function overlap(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

function containsBounded(haystack: string, needle: string): boolean {
  if (needle.length < 2) return false;
  let offset = haystack.indexOf(needle);
  while (offset >= 0) {
    const before = offset === 0 ? "" : haystack[offset - 1];
    const after = haystack[offset + needle.length] ?? "";
    const beforeIsWord = /[\p{L}\p{N}]/u.test(before);
    const afterIsWord = /[\p{L}\p{N}]/u.test(after);
    const startsWithWord = /[\p{L}\p{N}]/u.test(needle[0]);
    const endsWithWord = /[\p{L}\p{N}]/u.test(needle[needle.length - 1]);
    if ((!startsWithWord || !beforeIsWord) && (!endsWithWord || !afterIsWord)) {
      return true;
    }
    offset = haystack.indexOf(needle, offset + 1);
  }
  return false;
}

function candidateFromNode(
  node: RuntimeOntologyNode,
  matchSource: "exact" | "lexical",
  score: number,
): OntologyCandidate {
  return {
    id: node.id,
    label: node.label,
    family: node.family,
    category: node.category,
    score: Math.max(0, Math.min(1, score)),
    matchSource,
  };
}

export class LocalOntologyRetriever implements OntologyRetriever {
  private readonly searchable: SearchableNode[];

  constructor(nodes: RuntimeOntologyNode[]) {
    this.searchable = nodes.map((node) => ({
      node,
      normalizedLabels: [node.label, ...node.aliases].map(
        normalizeOntologyLabel,
      ),
      labelTokens: meaningfulTokens([node.label, ...node.aliases].join(" ")),
      familyTokens: meaningfulTokens(node.family),
      categoryTokens: meaningfulTokens(node.category),
    }));
  }

  async search(request: Parameters<OntologyRetriever["search"]>[0]) {
    const parsed = OntologySearchRequestSchema.parse(request);
    const familyFilters = new Set(parsed.families.map(normalizeOntologyLabel));
    const categoryFilters = new Set(
      parsed.categories.map(normalizeOntologyLabel),
    );
    const available = this.searchable.filter(
      ({ node }) =>
        (familyFilters.size === 0 ||
          familyFilters.has(normalizeOntologyLabel(node.family))) &&
        (categoryFilters.size === 0 ||
          categoryFilters.has(normalizeOntologyLabel(node.category))),
    );
    const intentQuery = parsed.query.split(
      /SECONDARY EXPERIENCE CONTEXT[^\n]*\n/i,
    )[0];
    const normalizedQuery = normalizeOntologyLabel(intentQuery);
    const required = parsed.requiredApplications.map(normalizeOntologyLabel);
    const queryTokens = expandedQueryTokens(intentQuery);
    const candidates = new Map<string, OntologyCandidate>();

    for (const searchable of available) {
      const requiredMatch = required.some((application) =>
        searchable.normalizedLabels.includes(application),
      );
      const explicitMatches = searchable.normalizedLabels.filter((label) =>
        containsBounded(normalizedQuery, label),
      );
      if (requiredMatch || explicitMatches.length > 0) {
        const bestMatch = explicitMatches.sort(
          (left, right) =>
            meaningfulTokens(right).size - meaningfulTokens(left).size ||
            right.length - left.length,
        )[0];
        const hierarchyOverlap =
          overlap(queryTokens, searchable.familyTokens) +
          overlap(queryTokens, searchable.categoryTokens);
        const matchedTokenCount = bestMatch
          ? meaningfulTokens(bestMatch).size
          : 0;
        const aliasPenalty =
          bestMatch && bestMatch !== searchable.normalizedLabels[0] ? 0.01 : 0;
        const explicitScore = Math.min(
          0.99,
          0.9 +
            Math.min(0.04, matchedTokenCount * 0.015) +
            Math.min(0.04, hierarchyOverlap * 0.015) -
            aliasPenalty,
        );
        candidates.set(
          searchable.node.id,
          candidateFromNode(
            searchable.node,
            "exact",
            requiredMatch ? 1 : explicitScore,
          ),
        );
      }
    }

    for (const searchable of available) {
      if (candidates.has(searchable.node.id)) continue;
      const labelOverlap = overlap(queryTokens, searchable.labelTokens);
      const familyOverlap = overlap(queryTokens, searchable.familyTokens);
      const categoryOverlap = overlap(queryTokens, searchable.categoryTokens);
      if (labelOverlap + familyOverlap + categoryOverlap === 0) continue;

      const labelCoverage =
        searchable.labelTokens.size === 0
          ? 0
          : labelOverlap / searchable.labelTokens.size;
      const queryCoverage =
        queryTokens.size === 0 ? 0 : labelOverlap / queryTokens.size;
      const categoryCoverage =
        searchable.categoryTokens.size === 0
          ? 0
          : categoryOverlap / searchable.categoryTokens.size;
      const familyCoverage =
        searchable.familyTokens.size === 0
          ? 0
          : familyOverlap / searchable.familyTokens.size;
      const score =
        labelCoverage * 0.55 +
        queryCoverage * 0.25 +
        categoryCoverage * 0.12 +
        familyCoverage * 0.08;
      if (score < 0.1) continue;
      candidates.set(
        searchable.node.id,
        candidateFromNode(searchable.node, "lexical", score),
      );
    }

    return [...candidates.values()]
      .sort(
        (left, right) =>
          (right.score ?? 0) - (left.score ?? 0) ||
          (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
      )
      .slice(0, parsed.maxResults);
  }
}
