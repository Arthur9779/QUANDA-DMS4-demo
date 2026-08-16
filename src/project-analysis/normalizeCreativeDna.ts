import type {
  ConceptEvidence,
  ConceptSource,
  CreativeDNA,
  CreativeDNAConcept,
  ProjectConstraint,
  UnknownConcept,
} from "@/src/contracts/knowledge";
import { CreativeDNASchema } from "@/src/contracts/knowledge";
import { getApplicationName } from "@/src/data/applications";
import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import { createOntologyLookup } from "@/src/ontology/lookup";
import {
  normalizeOntologyLabel,
  tokenizeOntologyLabel,
} from "@/src/ontology/normalization";
import { ontologyArtifact } from "@/src/ontology/runtime";
import type { OntologyCandidate } from "@/src/ontology/retrieval";
import type {
  CreativeDnaModelOutput,
  ProjectAnalysisRequest,
} from "@/src/project-analysis/contracts";

const SOURCE_PRIORITY: Record<ConceptSource, number> = {
  explicit_requirement: 4,
  user_added: 3,
  user_preference: 2,
  ai_inferred: 1,
};

const EXPLICIT_LANGUAGE =
  /\b(require(?:s|d)?|must|mandatory|has to|have to|need(?:s|ed)? to|assignment|lecturer)\b|bắt buộc|phải|yêu cầu|cần phải/iu;
const EXCLUDED_FAMILIES = new Set([
  "learning classification",
  "recommendation context",
  "safety accuracy culture and style notes",
  "search retrieval metadata",
  "tutorial content classification",
  "user capability",
]);

const SAFE_SINGLE_LABEL_CATEGORIES = new Set([
  "aesthetic",
  "animation style",
  "art movement",
  "color palette",
  "character material treatment",
  "deliverable type",
  "design movement",
  "environment genre",
  "interior design style",
  "material appearance",
  "material treatment",
  "modeling style",
  "post-processing style",
  "poster style",
  "required medium",
  "required technique",
  "rendering style",
  "simulation technique",
  "surface quality",
  "texturing technique",
]);

const UNSAFE_SINGLE_LABELS = new Set(["music", "product"]);

const lookup = createOntologyLookup(ontologyArtifact.nodes);
const nodeById = new Map(
  ontologyArtifact.nodes.map((node) => [node.id, node]),
);

export interface CreativeDnaNormalizationResult {
  creativeDna: CreativeDNA;
  acceptedOntologyIds: string[];
  rejectedOntologyIds: string[];
}

function clean(value: string, maximum = 400): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maximum);
}

function fieldValue(
  request: ProjectAnalysisRequest,
  field: ConceptEvidence["sourceField"],
): string {
  switch (field) {
    case "projectBrief":
      return request.projectBrief;
    case "currentExperience":
      return request.currentExperience;
    case "requiredApplications":
      return request.requiredApplications.join(", ");
    case "outputType":
      return request.outputType;
    default:
      return "";
  }
}

function normalizeEvidence(
  evidence: ConceptEvidence | undefined,
  request: ProjectAnalysisRequest,
): ConceptEvidence | undefined {
  if (!evidence) return undefined;
  const excerpt = evidence.excerpt ? clean(evidence.excerpt) : undefined;
  const source = fieldValue(request, evidence.sourceField);
  if (
    excerpt &&
    source &&
    normalizeOntologyLabel(source).includes(normalizeOntologyLabel(excerpt))
  ) {
    return { sourceField: evidence.sourceField, excerpt };
  }
  return { sourceField: evidence.sourceField };
}

function sentenceEvidence(
  request: ProjectAnalysisRequest,
  label: string,
): ConceptEvidence {
  const normalizedLabel = normalizeOntologyLabel(label);
  const sentence = request.projectBrief
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((value) => clean(value))
    .find((value) =>
      normalizeOntologyLabel(value).includes(normalizedLabel),
    );
  return {
    sourceField: "projectBrief",
    ...(sentence ? { excerpt: sentence.slice(0, 400) } : {}),
  };
}

function applicationVariants(application: string): string[] {
  const display = getApplicationName(application);
  const values = [application, display, display.replace(/^Adobe\s+/i, "")];
  return [...new Set(values.map((value) => clean(value)).filter(Boolean))];
}

function applicationNodeRank(node: RuntimeOntologyNode): number {
  const family = normalizeOntologyLabel(node.family);
  const category = normalizeOntologyLabel(node.category);
  if (family === "project requirements" && category === "required software") {
    return 0;
  }
  if (family === "tools and software" && category === "software") return 1;
  if (family === "tools and software") return 2;
  if (family === "web and creative coding") return 3;
  if (family.includes("experience installation")) return 4;
  if (family === "tutorial content classification") return 8;
  if (family === "user capability") return 9;
  return 5;
}

export function resolveExplicitApplicationConcepts(
  requiredApplications: string[],
): Array<{ application: string; node?: RuntimeOntologyNode }> {
  return requiredApplications.map((application) => {
    const candidates = applicationVariants(application).flatMap((variant) =>
      lookup.findExactOntologyConcepts(variant),
    );
    const nodes = [
      ...new Map(candidates.map((candidate) => [candidate.id, candidate])).values(),
    ].sort(
      (left, right) =>
        applicationNodeRank(left) - applicationNodeRank(right) ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
    return { application, node: nodes[0] };
  });
}

function isRelevantNode(node: RuntimeOntologyNode): boolean {
  const family = normalizeOntologyLabel(node.family);
  return !EXCLUDED_FAMILIES.has(family);
}

function isSafeDirectCandidate(
  node: RuntimeOntologyNode,
  explicitApplicationLabels: Set<string>,
): boolean {
  if (!isRelevantNode(node)) return false;
  const normalizedLabel = normalizeOntologyLabel(node.label);
  if (explicitApplicationLabels.has(normalizedLabel)) return false;
  const tokens = tokenizeOntologyLabel(node.label);
  if (tokens.length > 1) return true;
  if (UNSAFE_SINGLE_LABELS.has(normalizedLabel)) return false;
  const category = normalizeOntologyLabel(node.category);
  return SAFE_SINGLE_LABEL_CATEGORIES.has(category);
}

function hasBoundedLabel(value: string, label: string): boolean {
  const haystack = normalizeOntologyLabel(value);
  const needle = normalizeOntologyLabel(label);
  if (!needle) return false;
  const index = haystack.indexOf(needle);
  if (index < 0) return false;
  const before = haystack[index - 1] ?? "";
  const after = haystack[index + needle.length] ?? "";
  return !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after);
}

function canonicalSource(input: {
  source: ConceptSource;
  node: RuntimeOntologyNode;
  evidence?: ConceptEvidence;
  request: ProjectAnalysisRequest;
  explicitIds: Set<string>;
}): ConceptSource {
  if (input.explicitIds.has(input.node.id)) return "explicit_requirement";
  if (input.source !== "explicit_requirement") return input.source;
  const evidenceText = input.evidence?.excerpt ?? "";
  if (EXPLICIT_LANGUAGE.test(evidenceText)) return "explicit_requirement";
  if (hasBoundedLabel(input.request.projectBrief, input.node.label)) {
    return "user_preference";
  }
  return "ai_inferred";
}

function directSource(): ConceptSource {
  // The required-applications field and model-validated clauses establish hard
  // requirements. A lexical mention in the brief alone remains a preference
  // so nearby words such as "assignment" cannot promote an entire sentence.
  return "user_preference";
}

function insertConcept(
  concepts: Map<string, CreativeDNAConcept>,
  concept: CreativeDNAConcept,
) {
  if (!concept.ontologyId) return;
  const existing = concepts.get(concept.ontologyId);
  if (!existing) {
    concepts.set(concept.ontologyId, concept);
    return;
  }
  const preferred =
    SOURCE_PRIORITY[concept.source] > SOURCE_PRIORITY[existing.source]
      ? concept
      : existing;
  concepts.set(concept.ontologyId, {
    ...preferred,
    confidence: Math.max(existing.confidence ?? 0, concept.confidence ?? 0),
  });
}

function canonicalConcept(input: {
  node: RuntimeOntologyNode;
  source: ConceptSource;
  confidence?: number;
  evidence?: ConceptEvidence;
}): CreativeDNAConcept {
  return {
    ontologyId: input.node.id,
    label: input.node.label,
    family: input.node.family,
    category: input.node.category,
    source: input.source,
    status: "unconfirmed",
    ...(input.confidence === undefined
      ? {}
      : { confidence: Math.max(0, Math.min(1, input.confidence)) }),
    ...(input.evidence ? { evidence: input.evidence } : {}),
  };
}

function nearestIds(
  raw: string,
  candidates: OntologyCandidate[],
): string[] {
  const rawTokens = new Set(tokenizeOntologyLabel(raw));
  return candidates
    .map((candidate) => {
      const tokens = new Set(tokenizeOntologyLabel(candidate.label));
      let overlap = 0;
      for (const token of rawTokens) if (tokens.has(token)) overlap += 1;
      return { id: candidate.id, overlap, score: candidate.score ?? 0 };
    })
    .filter((candidate) => candidate.overlap > 0)
    .sort(
      (left, right) =>
        right.overlap - left.overlap ||
        right.score - left.score ||
        (left.id < right.id ? -1 : 1),
    )
    .slice(0, 4)
    .map((candidate) => candidate.id);
}

export function extractUnknownConcepts(
  request: ProjectAnalysisRequest,
  candidates: OntologyCandidate[],
): UnknownConcept[] {
  const phrases: string[] = [];
  for (const match of request.projectBrief.matchAll(/["“]([^"”]{2,120})["”]/gu)) {
    phrases.push(clean(match[1], 240));
  }
  for (const match of request.projectBrief.matchAll(
    /(?:with|using|has|have)\s+(?:an?\s+)?([a-z0-9][a-z0-9-]*(?:\s+[a-z0-9][a-z0-9-]*){0,4})\s+(?:look|aesthetic|vibe)/giu,
  )) {
    phrases.push(clean(match[1], 240));
  }
  for (const match of request.projectBrief.matchAll(
    /phong cách\s+([^,.;]{2,100})/giu,
  )) {
    phrases.push(clean(match[1], 240));
  }
  for (const match of request.projectBrief.matchAll(
    /\b([a-z0-9]+-[a-z0-9]+(?:\s+[a-z0-9]+-[a-z0-9]+)+)\b/giu,
  )) {
    phrases.push(clean(match[1], 240));
  }

  return [
    ...new Map(
      phrases
        .filter(
          (raw) =>
            raw.length >= 3 && lookup.findExactOntologyConcepts(raw).length === 0,
        )
        .map((raw) => [normalizeOntologyLabel(raw), raw]),
    ).values(),
  ].map((raw) => ({
    raw,
    suggestedCategory: "Aesthetic",
    nearestOntologyIds: nearestIds(raw, candidates),
    confidence: 0.55,
    source: "user_preference",
    status: "unconfirmed",
    evidence: sentenceEvidence(request, raw),
  }));
}

function deterministicConstraints(
  request: ProjectAnalysisRequest,
): ProjectConstraint[] {
  const constraints: ProjectConstraint[] = request.requiredApplications.map(
    (application) => ({
      label: `Required application: ${getApplicationName(application)}`,
      kind: "hard_requirement",
      source: "explicit_requirement",
      status: "unconfirmed",
      evidence: {
        sourceField: "requiredApplications",
        excerpt: application,
      },
    }),
  );
  constraints.push({
    label: `Deliverable: ${request.outputType}`,
    kind: "deliverable",
    source: "explicit_requirement",
    status: "unconfirmed",
    evidence: { sourceField: "outputType", excerpt: request.outputType },
  });
  if (request.targetQuality !== "unsure") {
    constraints.push({
      label: `Target quality: ${request.targetQuality}`,
      kind: "preference",
      source: "user_preference",
      status: "unconfirmed",
      evidence: { sourceField: "other" },
    });
  }
  if (request.deadline) {
    constraints.push({
      label: `Deadline: ${request.deadline}`,
      kind: "deadline",
      source: "explicit_requirement",
      status: "unconfirmed",
      evidence: { sourceField: "other" },
    });
  }
  if (request.hoursPerDay && request.daysPerWeek) {
    constraints.push({
      label: `${request.hoursPerDay} hours/day, ${request.daysPerWeek} days/week`,
      kind: "available_time",
      source: "explicit_requirement",
      status: "unconfirmed",
      evidence: { sourceField: "other" },
    });
  }
  return constraints;
}

function fallbackIntent(request: ProjectAnalysisRequest): string {
  const brief = clean(request.projectBrief, 360);
  if (brief.length <= 320) return brief;
  return `${brief.slice(0, 317).trimEnd()}…`;
}

export function normalizeCreativeDna(input: {
  request: ProjectAnalysisRequest;
  candidates: OntologyCandidate[];
  modelOutput?: CreativeDnaModelOutput;
}): CreativeDnaNormalizationResult {
  const explicitApplications = resolveExplicitApplicationConcepts(
    input.request.requiredApplications,
  );
  const explicitIds = new Set(
    explicitApplications.flatMap(({ node }) => (node ? [node.id] : [])),
  );
  const explicitApplicationLabels = new Set(
    input.request.requiredApplications.flatMap(applicationVariants).map(
      normalizeOntologyLabel,
    ),
  );
  const allowedIds = new Set([
    ...input.candidates.map((candidate) => candidate.id),
    ...explicitIds,
  ]);
  const concepts = new Map<string, CreativeDNAConcept>();
  const rejectedIds = new Set<string>();
  const unknowns = new Map<string, UnknownConcept>();

  for (const { application, node } of explicitApplications) {
    if (!node) {
      const raw = getApplicationName(application);
      unknowns.set(normalizeOntologyLabel(raw), {
        raw,
        suggestedCategory: "Software",
        nearestOntologyIds: nearestIds(raw, input.candidates),
        source: "explicit_requirement",
        confidence: 1,
        status: "unconfirmed",
        evidence: {
          sourceField: "requiredApplications",
          excerpt: application,
        },
      });
      continue;
    }
    insertConcept(
      concepts,
      canonicalConcept({
        node,
        source: "explicit_requirement",
        confidence: 1,
        evidence: {
          sourceField: "requiredApplications",
          excerpt: application,
        },
      }),
    );
  }

  for (const candidate of input.candidates) {
    if (candidate.matchSource !== "exact") continue;
    const node = nodeById.get(candidate.id);
    if (
      !node ||
      explicitIds.has(node.id) ||
      !isSafeDirectCandidate(
        node,
        explicitApplicationLabels,
      )
    ) {
      continue;
    }
    if (!hasBoundedLabel(input.request.projectBrief, node.label)) continue;
    const evidence = sentenceEvidence(input.request, node.label);
    insertConcept(
      concepts,
      canonicalConcept({
        node,
        source: directSource(),
        confidence: 0.92,
        evidence,
      }),
    );
  }

  const briefTokens = new Set(tokenizeOntologyLabel(input.request.projectBrief));
  for (const candidate of input.candidates) {
    if (
      candidate.matchSource === "exact" ||
      (candidate.score ?? 0) < 0.65
    ) {
      continue;
    }
    const node = nodeById.get(candidate.id);
    const labelTokens = tokenizeOntologyLabel(candidate.label);
    if (
      !node ||
      labelTokens.length < 2 ||
      concepts.has(node.id) ||
      !labelTokens.every((token) => briefTokens.has(token)) ||
      !isSafeDirectCandidate(
        node,
        explicitApplicationLabels,
      )
    ) {
      continue;
    }
    insertConcept(
      concepts,
      canonicalConcept({
        node,
        source: "user_preference",
        confidence: Math.min(0.86, candidate.score ?? 0.7),
        evidence: sentenceEvidence(input.request, candidate.label),
      }),
    );
  }

  if (input.modelOutput) {
    for (const modelConcept of input.modelOutput.concepts) {
      const node = nodeById.get(modelConcept.ontologyId);
      if (!node || !allowedIds.has(modelConcept.ontologyId)) {
        rejectedIds.add(modelConcept.ontologyId);
        const raw = clean(modelConcept.rawLabel, 240);
        unknowns.set(normalizeOntologyLabel(raw), {
          raw,
          nearestOntologyIds: nearestIds(raw, input.candidates),
          confidence: Math.min(modelConcept.confidence, 0.6),
          source: modelConcept.source,
          status: "unconfirmed",
          evidence: normalizeEvidence(modelConcept.evidence, input.request),
        });
        continue;
      }
      const evidence = normalizeEvidence(modelConcept.evidence, input.request);
      insertConcept(
        concepts,
        canonicalConcept({
          node,
          source: canonicalSource({
            source: modelConcept.source,
            node,
            evidence,
            request: input.request,
            explicitIds,
          }),
          confidence: modelConcept.confidence,
          evidence,
        }),
      );
    }
    for (const unknown of input.modelOutput.unknownConcepts) {
      const raw = clean(unknown.raw, 240);
      unknowns.set(normalizeOntologyLabel(raw), {
        raw,
        ...(unknown.suggestedCategory
          ? { suggestedCategory: unknown.suggestedCategory }
          : {}),
        nearestOntologyIds: [
          ...new Set(
            unknown.nearestOntologyIds.filter(
              (id) => allowedIds.has(id) && nodeById.has(id),
            ),
          ),
        ].slice(0, 8),
        ...(unknown.confidence === undefined
          ? {}
          : { confidence: unknown.confidence }),
        source: unknown.source,
        status: "unconfirmed",
        evidence: normalizeEvidence(unknown.evidence, input.request),
      });
    }
  }

  for (const unknown of extractUnknownConcepts(
    input.request,
    input.candidates,
  )) {
    const key = normalizeOntologyLabel(unknown.raw);
    if (!unknowns.has(key)) unknowns.set(key, unknown);
  }

  const constraints = new Map<string, ProjectConstraint>();
  const addConstraint = (constraint: ProjectConstraint) => {
    const key = `${normalizeOntologyLabel(constraint.kind)}\u0000${normalizeOntologyLabel(constraint.label)}`;
    const existing = constraints.get(key);
    if (
      !existing ||
      SOURCE_PRIORITY[constraint.source] > SOURCE_PRIORITY[existing.source]
    ) {
      constraints.set(key, constraint);
    }
  };
  deterministicConstraints(input.request).forEach(addConstraint);
  input.modelOutput?.constraints.forEach((constraint) =>
    addConstraint({
      ...constraint,
      status: "unconfirmed",
      evidence: normalizeEvidence(constraint.evidence, input.request),
    }),
  );

  const creativeDna = CreativeDNASchema.parse({
    creativeDnaVersion: 1,
    projectIntent: input.modelOutput?.projectIntent ?? fallbackIntent(input.request),
    concepts: [...concepts.values()].sort(
      (left, right) =>
        SOURCE_PRIORITY[right.source] - SOURCE_PRIORITY[left.source] ||
        (right.confidence ?? 0) - (left.confidence ?? 0) ||
        (left.ontologyId! < right.ontologyId! ? -1 : 1),
    ),
    unknownConcepts: [...unknowns.values()],
    constraints: [...constraints.values()],
  });

  return {
    creativeDna,
    acceptedOntologyIds: creativeDna.concepts.flatMap((concept) =>
      concept.ontologyId ? [concept.ontologyId] : [],
    ),
    rejectedOntologyIds: [...rejectedIds].sort(),
  };
}
