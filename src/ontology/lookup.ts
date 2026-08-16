import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import {
  normalizeOntologyLabel,
  tokenizeOntologyLabel,
} from "@/src/ontology/normalization";

export interface OntologyLookup {
  getOntologyConcept(id: string): RuntimeOntologyNode | undefined;
  ontologyHasId(id: string): boolean;
  getConceptsByFamily(family: string): RuntimeOntologyNode[];
  getConceptsByCategory(
    category: string,
    family?: string,
  ): RuntimeOntologyNode[];
  findExactOntologyConcepts(label: string): RuntimeOntologyNode[];
  findOntologyConcepts(label: string): RuntimeOntologyNode[];
  searchOntologyByLabel(
    query: string,
    options?: { limit?: number },
  ): RuntimeOntologyNode[];
}

function addToIndex(
  index: Map<string, RuntimeOntologyNode[]>,
  key: string,
  node: RuntimeOntologyNode,
) {
  const values = index.get(key) ?? [];
  values.push(node);
  index.set(key, values);
}

function stableNodes(nodes: RuntimeOntologyNode[]): RuntimeOntologyNode[] {
  return [...nodes].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
}

export function createOntologyLookup(
  ontologyNodes: RuntimeOntologyNode[],
): OntologyLookup {
  const nodes = stableNodes(ontologyNodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const byFamily = new Map<string, RuntimeOntologyNode[]>();
  const byCategory = new Map<string, RuntimeOntologyNode[]>();
  const byFamilyAndCategory = new Map<string, RuntimeOntologyNode[]>();
  const byExactLabel = new Map<string, RuntimeOntologyNode[]>();

  for (const node of nodes) {
    const family = normalizeOntologyLabel(node.family);
    const category = normalizeOntologyLabel(node.category);
    addToIndex(byFamily, family, node);
    addToIndex(byCategory, category, node);
    addToIndex(byFamilyAndCategory, `${family}\u0000${category}`, node);
    addToIndex(byExactLabel, node.normalizedLabel, node);
    for (const alias of node.aliases) {
      addToIndex(byExactLabel, normalizeOntologyLabel(alias), node);
    }
  }

  for (const index of [
    byFamily,
    byCategory,
    byFamilyAndCategory,
    byExactLabel,
  ]) {
    for (const [key, values] of index) {
      index.set(
        key,
        stableNodes([...new Map(values.map((node) => [node.id, node])).values()]),
      );
    }
  }

  function findExactOntologyConcepts(label: string) {
    const normalized = normalizeOntologyLabel(label);
    if (!normalized) return [];
    return byExactLabel.get(normalized) ?? [];
  }

  function searchOntologyByLabel(
    query: string,
    options: { limit?: number } = {},
  ) {
    const normalizedQuery = normalizeOntologyLabel(query);
    if (!normalizedQuery) return [];
    const queryTokens = tokenizeOntologyLabel(normalizedQuery);
    const limit = Math.max(1, Math.min(options.limit ?? 50, 500));

    const scored = nodes.flatMap((node) => {
      const searchableLabels = [node.normalizedLabel, ...node.aliases.map(normalizeOntologyLabel)];
      let score = Number.POSITIVE_INFINITY;
      for (const searchable of searchableLabels) {
        if (searchable === normalizedQuery) score = Math.min(score, 0);
        else if (searchable.startsWith(normalizedQuery)) score = Math.min(score, 1);
        else {
          const tokens = new Set(tokenizeOntologyLabel(searchable));
          if (
            queryTokens.length > 0 &&
            queryTokens.every((token) => tokens.has(token))
          ) {
            score = Math.min(score, 2);
          } else if (searchable.includes(normalizedQuery)) {
            score = Math.min(score, 3);
          }
        }
      }
      return Number.isFinite(score) ? [{ node, score }] : [];
    });

    return scored
      .sort(
        (left, right) =>
          left.score - right.score ||
          (left.node.label < right.node.label
            ? -1
            : left.node.label > right.node.label
              ? 1
              : 0) ||
          (left.node.id < right.node.id ? -1 : left.node.id > right.node.id ? 1 : 0),
      )
      .slice(0, limit)
      .map(({ node }) => node);
  }

  return {
    getOntologyConcept: (id) => byId.get(id),
    ontologyHasId: (id) => byId.has(id),
    getConceptsByFamily: (family) =>
      byFamily.get(normalizeOntologyLabel(family)) ?? [],
    getConceptsByCategory: (category, family) => {
      const normalizedCategory = normalizeOntologyLabel(category);
      if (!family) return byCategory.get(normalizedCategory) ?? [];
      return (
        byFamilyAndCategory.get(
          `${normalizeOntologyLabel(family)}\u0000${normalizedCategory}`,
        ) ?? []
      );
    },
    findExactOntologyConcepts,
    findOntologyConcepts: (label) => {
      const exact = findExactOntologyConcepts(label);
      return exact.length > 0
        ? exact
        : searchOntologyByLabel(label, { limit: 50 });
    },
    searchOntologyByLabel,
  };
}
