import { createHash } from "node:crypto";
import {
  KNOWLEDGE_CONTRACT_VERSIONS,
  OntologyRelationshipSchema,
  type OntologyRelationship,
} from "@/src/contracts/knowledge";
import {
  RuntimeOntologyArtifactSchema,
  type OntologyCollision,
  type RuntimeOntologyArtifact,
  type RuntimeOntologyNode,
} from "@/src/ontology/contracts";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

export interface SourcePosition {
  line: number;
  column: number;
}

export interface ParsedOntologyConcept {
  label: string;
  sourcePosition: SourcePosition;
}

export interface ParsedOntologyCategory {
  label: string;
  sourcePosition: SourcePosition;
  concepts: ParsedOntologyConcept[];
}

export interface ParsedOntologyFamily {
  label: string;
  sourcePosition: SourcePosition;
  categories: ParsedOntologyCategory[];
}

export interface ParsedOntologySource {
  title: string;
  version: string;
  metadata: Record<string, string>;
  families: ParsedOntologyFamily[];
}

export class OntologyCompilerError extends Error {
  readonly line?: number;

  constructor(message: string, line?: number) {
    super(line ? `Line ${line}: ${message}` : message);
    this.name = "OntologyCompilerError";
    this.line = line;
  }
}

const MAX_STABLE_ID_LENGTH = 160;

function sourceColumn(line: string, markerLength: number): number {
  return line.search(/\S/) + markerLength + 1;
}

function cleanFamilyHeading(heading: string): string {
  return heading.replace(/^\d+\.\s*/, "").trim();
}

export function parseOntologySource(source: string): ParsedOntologySource {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const metadata: Record<string, string> = {};
  const families: ParsedOntologyFamily[] = [];
  let title = "";
  let currentFamily: ParsedOntologyFamily | undefined;
  let currentCategory: ParsedOntologyCategory | undefined;
  let hasEnteredOntology = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trimEnd();
    if (!line.trim()) return;

    const familyMatch = line.match(/^\s{0,3}##(?!#)\s+(.+?)\s*$/);
    if (familyMatch) {
      const label = cleanFamilyHeading(familyMatch[1]);
      if (!label) {
        throw new OntologyCompilerError("Empty family heading", lineNumber);
      }
      currentFamily = {
        label,
        sourcePosition: {
          line: lineNumber,
          column: sourceColumn(line, 3),
        },
        categories: [],
      };
      families.push(currentFamily);
      currentCategory = undefined;
      hasEnteredOntology = true;
      return;
    }

    const categoryMatch = line.match(/^\s{0,3}###(?!#)\s+(.+?)\s*$/);
    if (categoryMatch) {
      if (!currentFamily) {
        throw new OntologyCompilerError(
          "Category appears before a family heading",
          lineNumber,
        );
      }
      const label = categoryMatch[1].trim();
      if (!label) {
        throw new OntologyCompilerError("Empty category heading", lineNumber);
      }
      currentCategory = {
        label,
        sourcePosition: {
          line: lineNumber,
          column: sourceColumn(line, 4),
        },
        concepts: [],
      };
      currentFamily.categories.push(currentCategory);
      return;
    }

    if (/^\s{0,3}#{4,}/.test(line)) {
      throw new OntologyCompilerError(
        "Unsupported heading depth would be silently discarded",
        lineNumber,
      );
    }

    const conceptMatch = line.match(/^\s*-\s*(.*?)\s*$/);
    if (conceptMatch) {
      if (!currentCategory) {
        throw new OntologyCompilerError(
          "Concept appears outside a category",
          lineNumber,
        );
      }
      const label = conceptMatch[1].trim();
      if (!label) {
        throw new OntologyCompilerError("Empty concept label", lineNumber);
      }
      currentCategory.concepts.push({
        label,
        sourcePosition: {
          line: lineNumber,
          column: sourceColumn(line, 2),
        },
      });
      return;
    }

    if (!hasEnteredOntology) {
      const titleMatch = line.match(/^\s{0,3}#(?!#)\s+(.+?)\s*$/);
      if (titleMatch) {
        if (title) {
          throw new OntologyCompilerError(
            "Multiple document titles are not supported",
            lineNumber,
          );
        }
        title = titleMatch[1].trim();
        return;
      }

      const metadataMatch = line.match(/^([^:]{1,80}):\s*(.+)$/);
      if (metadataMatch) {
        const key = metadataMatch[1].trim();
        if (metadata[key] !== undefined) {
          throw new OntologyCompilerError(
            `Duplicate source metadata field: ${key}`,
            lineNumber,
          );
        }
        metadata[key] = metadataMatch[2].trim();
        return;
      }
    }

    throw new OntologyCompilerError(
      `Unrecognized content would be silently discarded: ${line.trim().slice(0, 80)}`,
      lineNumber,
    );
  });

  if (!title) {
    throw new OntologyCompilerError("Missing document title");
  }
  if (!metadata.Version) {
    throw new OntologyCompilerError("Missing source Version metadata");
  }
  if (families.length === 0) {
    throw new OntologyCompilerError("Missing family heading");
  }

  for (const family of families) {
    if (family.categories.length === 0) {
      throw new OntologyCompilerError(
        `Family "${family.label}" contains no categories`,
        family.sourcePosition.line,
      );
    }
    for (const category of family.categories) {
      if (category.concepts.length === 0) {
        throw new OntologyCompilerError(
          `Category "${category.label}" contains no concepts`,
          category.sourcePosition.line,
        );
      }
    }
  }

  return {
    title,
    version: metadata.Version,
    metadata,
    families,
  };
}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function slugifyOntologyLabel(value: string): string {
  const expanded = normalizeOntologyLabel(value)
    .replace(/[đĐ]/g, "d")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/%/g, " percent ")
    .replace(/@/g, " at ")
    .replace(/[’']/g, "")
    .replace(/[/.]/g, "-")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  if (expanded) return expanded;

  const codePoints = [...normalizeOntologyLabel(value)]
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");
  if (!codePoints) {
    throw new OntologyCompilerError(`Cannot create an ID for label: ${value}`);
  }
  return `u-${codePoints}`;
}

function appendHash(base: string, digest: string, maximumLength: number): string {
  const prefixLength = maximumLength - digest.length - 1;
  const prefix = base
    .slice(0, prefixLength)
    .replace(/[._:-]+$/g, "")
    .replace(/^[._:-]+/g, "");
  if (!prefix) {
    throw new OntologyCompilerError(
      `Impossible collision resolution for canonical ID: ${base}`,
    );
  }
  return `${prefix}-${digest}`;
}

function fitStableId(base: string, seed: string, maximumLength: number): string {
  if (base.length <= maximumLength) return base;
  return appendHash(base, hash(seed).slice(0, 12), maximumLength);
}

interface IdCandidate {
  key: string;
  label: string;
  sourceLines: number[];
  baseId: string;
}

function resolveCanonicalIds(
  candidates: IdCandidate[],
  entityType: OntologyCollision["entityType"],
  maximumLength: number,
): { ids: Map<string, string>; collisions: OntologyCollision[] } {
  const ids = new Map<string, string>();
  const collisions: OntologyCollision[] = [];
  const byBaseId = new Map<string, IdCandidate[]>();

  for (const candidate of candidates) {
    const group = byBaseId.get(candidate.baseId) ?? [];
    group.push(candidate);
    byBaseId.set(candidate.baseId, group);
  }

  for (const [baseId, group] of byBaseId) {
    if (group.length === 1) {
      ids.set(group[0].key, baseId);
      continue;
    }

    let resolved: string[] | undefined;
    for (const digestLength of [8, 12, 16, 24, 32, 48, 64]) {
      const attempts = group.map((candidate) =>
        appendHash(
          baseId,
          hash(`${entityType}:${candidate.key}`).slice(0, digestLength),
          maximumLength,
        ),
      );
      if (new Set(attempts).size === attempts.length) {
        resolved = attempts;
        break;
      }
    }

    if (!resolved) {
      throw new OntologyCompilerError(
        `Impossible collision resolution for ${entityType} ID: ${baseId}`,
      );
    }

    group.forEach((candidate, index) => {
      ids.set(candidate.key, resolved?.[index] as string);
    });
    collisions.push({
      kind: "slug_collision",
      entityType,
      baseId,
      labels: group.map((candidate) => candidate.label).sort(compareText),
      resolvedIds: [...resolved].sort(compareText),
      sourceLines: group.flatMap((candidate) => candidate.sourceLines).sort((a, b) => a - b),
    });
  }

  return { ids, collisions };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function conceptConventions(label: string) {
  const conventions: Array<
    "slash_separated" | "parenthetical_disambiguation"
  > = [];
  if (label.includes("/") && !label.includes("://")) {
    conventions.push("slash_separated");
  }
  if (/\([^()]+\)/.test(label)) {
    conventions.push("parenthetical_disambiguation");
  }
  return conventions;
}

function aliasesForLabels(labels: string[], canonicalLabel: string): string[] {
  const aliases = new Map<string, string>();
  const canonicalNormalized = normalizeOntologyLabel(canonicalLabel);

  for (const label of labels) {
    if (normalizeOntologyLabel(label) !== canonicalNormalized) {
      aliases.set(normalizeOntologyLabel(label), label);
    }
    if (label.includes("/") && !label.includes("://")) {
      for (const part of label.split(/\s*\/\s*/)) {
        const alias = part.trim();
        if (alias && normalizeOntologyLabel(alias) !== canonicalNormalized) {
          aliases.set(normalizeOntologyLabel(alias), alias);
        }
      }
    }
  }

  return [...aliases.values()].sort(compareText);
}

function parseRelationships(
  relationships: unknown[],
  nodeIds: Set<string>,
): OntologyRelationship[] {
  const parsed = relationships.map((relationship, index) => {
    const result = OntologyRelationshipSchema.safeParse(relationship);
    if (!result.success) {
      throw new OntologyCompilerError(
        `Invalid ontology relationship at index ${index}: ${result.error.issues
          .map((issue) => issue.message)
          .join("; ")}`,
      );
    }
    if (!nodeIds.has(result.data.sourceId)) {
      throw new OntologyCompilerError(
        `Invalid relationship source ID: ${result.data.sourceId}`,
      );
    }
    if (!nodeIds.has(result.data.targetId)) {
      throw new OntologyCompilerError(
        `Invalid relationship target ID: ${result.data.targetId}`,
      );
    }
    return result.data;
  });

  return parsed.sort((left, right) =>
    compareText(
      `${left.sourceId}:${left.type}:${left.targetId}`,
      `${right.sourceId}:${right.type}:${right.targetId}`,
    ),
  );
}

export interface CompileOntologyOptions {
  sourcePath?: string;
  relationships?: unknown[];
}

export function compileOntologySource(
  source: string,
  options: CompileOntologyOptions = {},
): RuntimeOntologyArtifact {
  const parsed = parseOntologySource(source);
  const sourceMajorVersion = Number.parseInt(parsed.version.split(".")[0], 10);
  if (sourceMajorVersion !== KNOWLEDGE_CONTRACT_VERSIONS.ontology) {
    throw new OntologyCompilerError(
      `Source version ${parsed.version} is incompatible with ontology schema version ${KNOWLEDGE_CONTRACT_VERSIONS.ontology}`,
    );
  }

  const collisions: OntologyCollision[] = [];
  const familyKeys = new Set<string>();
  const familyCandidates = parsed.families.map((family) => {
    const key = normalizeOntologyLabel(family.label);
    if (familyKeys.has(key)) {
      throw new OntologyCompilerError(
        `Duplicate family heading: ${family.label}`,
        family.sourcePosition.line,
      );
    }
    familyKeys.add(key);
    return {
      key,
      label: family.label,
      sourceLines: [family.sourcePosition.line],
      baseId: fitStableId(
        slugifyOntologyLabel(family.label),
        `family:${key}`,
        80,
      ),
    };
  });
  const resolvedFamilies = resolveCanonicalIds(familyCandidates, "family", 80);
  collisions.push(...resolvedFamilies.collisions);

  const nodes: RuntimeOntologyNode[] = [];
  const families = parsed.families.map((family) => {
    const familyKey = normalizeOntologyLabel(family.label);
    const familyId = resolvedFamilies.ids.get(familyKey);
    if (!familyId) {
      throw new OntologyCompilerError(`Missing resolved family ID: ${family.label}`);
    }

    const categoryKeys = new Set<string>();
    const categoryCandidates = family.categories.map((category) => {
      const normalizedCategory = normalizeOntologyLabel(category.label);
      if (categoryKeys.has(normalizedCategory)) {
        throw new OntologyCompilerError(
          `Duplicate category heading in ${family.label}: ${category.label}`,
          category.sourcePosition.line,
        );
      }
      categoryKeys.add(normalizedCategory);
      const key = `${familyKey}\u0000${normalizedCategory}`;
      const baseId = fitStableId(
        `${familyId}.${slugifyOntologyLabel(category.label)}`,
        `category:${key}`,
        120,
      );
      return {
        key,
        label: category.label,
        sourceLines: [category.sourcePosition.line],
        baseId,
      };
    });
    const resolvedCategories = resolveCanonicalIds(
      categoryCandidates,
      "category",
      120,
    );
    collisions.push(...resolvedCategories.collisions);

    const categories = family.categories.map((category) => {
      const normalizedCategory = normalizeOntologyLabel(category.label);
      const categoryKey = `${familyKey}\u0000${normalizedCategory}`;
      const categoryId = resolvedCategories.ids.get(categoryKey);
      if (!categoryId) {
        throw new OntologyCompilerError(
          `Missing resolved category ID: ${category.label}`,
        );
      }

      const occurrences = new Map<string, ParsedOntologyConcept[]>();
      for (const concept of category.concepts) {
        const normalized = normalizeOntologyLabel(concept.label);
        const group = occurrences.get(normalized) ?? [];
        group.push(concept);
        occurrences.set(normalized, group);
      }

      const conceptCandidates = [...occurrences.entries()].map(
        ([normalized, group]) => {
          const labels = [...new Set(group.map((concept) => concept.label))].sort(
            compareText,
          );
          const label = labels[0];
          const key = `${categoryKey}\u0000${normalized}`;
          const conceptSlug = slugifyOntologyLabel(label);
          const baseId = fitStableId(
            `${categoryId}.${conceptSlug}`,
            `concept:${key}`,
            MAX_STABLE_ID_LENGTH,
          );
          return {
            key,
            label,
            labels,
            normalized,
            group,
            sourceLines: group.map((concept) => concept.sourcePosition.line),
            baseId,
          };
        },
      );

      const resolvedConcepts = resolveCanonicalIds(
        conceptCandidates,
        "concept",
        MAX_STABLE_ID_LENGTH,
      );
      collisions.push(...resolvedConcepts.collisions);

      for (const candidate of conceptCandidates) {
        const id = resolvedConcepts.ids.get(candidate.key);
        if (!id) {
          throw new OntologyCompilerError(
            `Missing resolved concept ID: ${candidate.label}`,
          );
        }
        const sourcePositions = candidate.group
          .map((concept) => concept.sourcePosition)
          .sort((left, right) => left.line - right.line);
        const conventions = conceptConventions(candidate.label);
        const aliases = aliasesForLabels(candidate.labels, candidate.label);
        if (aliases.length > 80) {
          throw new OntologyCompilerError(
            `Too many aliases for concept: ${candidate.label}`,
          );
        }

        nodes.push({
          ontologySchemaVersion: KNOWLEDGE_CONTRACT_VERSIONS.ontology,
          id,
          label: candidate.label,
          family: family.label,
          category: category.label,
          normalizedLabel: candidate.normalized,
          aliases,
          metadata: {
            sourcePosition: sourcePositions[0],
            ...(conventions.length > 0 ? { conventions } : {}),
            ...(sourcePositions.length > 1
              ? { duplicateSourcePositions: sourcePositions.slice(1) }
              : {}),
          },
        });

        if (candidate.group.length > 1) {
          collisions.push({
            kind: "exact_duplicate",
            entityType: "concept",
            baseId: id,
            labels: candidate.labels,
            resolvedIds: [id],
            sourceLines: candidate.sourceLines.sort((a, b) => a - b),
          });
        }
      }

      return {
        id: categoryId,
        label: category.label,
        sourcePosition: category.sourcePosition,
        conceptCount: conceptCandidates.length,
      };
    });

    return {
      id: familyId,
      label: family.label,
      sourcePosition: family.sourcePosition,
      categories,
    };
  });

  nodes.sort((left, right) => compareText(left.id, right.id));
  collisions.sort((left, right) =>
    compareText(
      `${left.entityType}:${left.baseId}:${left.kind}`,
      `${right.entityType}:${right.baseId}:${right.kind}`,
    ),
  );

  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length) {
    throw new OntologyCompilerError(
      "Duplicate canonical IDs remain after collision resolution",
    );
  }
  const relationships = parseRelationships(options.relationships ?? [], nodeIds);

  const artifact: RuntimeOntologyArtifact = {
    ontologySchemaVersion: KNOWLEDGE_CONTRACT_VERSIONS.ontology,
    source: {
      path: options.sourcePath ?? "knowledge/quanda.skills",
      sha256: hash(source),
      version: parsed.version,
      title: parsed.title,
      metadata: parsed.metadata,
    },
    stats: {
      familyCount: families.length,
      categoryCount: families.reduce(
        (total, family) => total + family.categories.length,
        0,
      ),
      nodeCount: nodes.length,
      relationshipCount: relationships.length,
      collisionCount: collisions.length,
    },
    families,
    nodes,
    relationships,
    collisions,
  };

  const validated = RuntimeOntologyArtifactSchema.safeParse(artifact);
  if (!validated.success) {
    throw new OntologyCompilerError(
      `Generated ontology failed runtime validation: ${validated.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }
  return validated.data;
}

export function serializeOntologyArtifact(
  artifact: RuntimeOntologyArtifact,
): string {
  return `${JSON.stringify(artifact)}\n`;
}

export function formatOntologySummary(
  artifact: RuntimeOntologyArtifact,
): string {
  return [
    "QUANDA ontology compiled",
    "",
    `Schema version: ${artifact.ontologySchemaVersion}`,
    `Families: ${artifact.stats.familyCount}`,
    `Categories: ${artifact.stats.categoryCount}`,
    `Concepts: ${artifact.stats.nodeCount}`,
    `Relationships: ${artifact.stats.relationshipCount}`,
    `Collisions resolved: ${artifact.stats.collisionCount}`,
    `Source hash: ${artifact.source.sha256}`,
  ].join("\n");
}
