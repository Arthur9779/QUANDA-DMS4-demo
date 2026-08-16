import {
  CreativeDNASchema,
  type CreativeDNA,
  type CreativeDNAConcept,
  type OntologyNode,
  type ProjectConstraint,
  type UnknownConcept,
} from "@/src/contracts/knowledge";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

export interface RejectOptions {
  allowExplicitRequirement?: boolean;
}

export function conceptIdentity(concept: CreativeDNAConcept): string {
  return (
    concept.ontologyId ??
    [concept.label, concept.family ?? "", concept.category ?? ""]
      .map(normalizeOntologyLabel)
      .join("|")
  );
}

export function constraintIdentity(constraint: ProjectConstraint): string {
  return constraint.id ?? normalizeOntologyLabel(constraint.label);
}

export function unknownIdentity(concept: UnknownConcept): string {
  return normalizeOntologyLabel(concept.raw);
}

function validated(next: CreativeDNA): CreativeDNA {
  return CreativeDNASchema.parse(next);
}

export function confirmCreativeDna(creativeDna: CreativeDNA): CreativeDNA {
  return validated({
    ...creativeDna,
    concepts: creativeDna.concepts.map((concept) =>
      concept.status === "unconfirmed"
        ? { ...concept, status: "user_confirmed" as const }
        : concept,
    ),
    unknownConcepts: creativeDna.unknownConcepts.map((concept) =>
      concept.status === "unconfirmed"
        ? { ...concept, status: "user_confirmed" as const }
        : concept,
    ),
    constraints: creativeDna.constraints.map((constraint) =>
      constraint.status === "unconfirmed"
        ? { ...constraint, status: "user_confirmed" as const }
        : constraint,
    ),
  });
}

export function rejectConcept(
  creativeDna: CreativeDNA,
  identity: string,
  options: RejectOptions = {},
): CreativeDNA {
  return validated({
    ...creativeDna,
    concepts: creativeDna.concepts.map((concept) => {
      if (conceptIdentity(concept) !== identity) return concept;
      if (
        concept.source === "explicit_requirement" &&
        !options.allowExplicitRequirement
      ) {
        return concept;
      }
      return { ...concept, status: "user_rejected" as const };
    }),
  });
}

export function rejectConstraint(
  creativeDna: CreativeDNA,
  identity: string,
  options: RejectOptions = {},
): CreativeDNA {
  return validated({
    ...creativeDna,
    constraints: creativeDna.constraints.map((constraint) => {
      if (constraintIdentity(constraint) !== identity) return constraint;
      if (
        constraint.source === "explicit_requirement" &&
        !options.allowExplicitRequirement
      ) {
        return constraint;
      }
      return { ...constraint, status: "user_rejected" as const };
    }),
  });
}

export function rejectUnknownConcept(
  creativeDna: CreativeDNA,
  identity: string,
): CreativeDNA {
  return validated({
    ...creativeDna,
    unknownConcepts: creativeDna.unknownConcepts.map((concept) =>
      unknownIdentity(concept) === identity
        ? { ...concept, status: "user_rejected" as const }
        : concept,
    ),
  });
}

export function restoreConcept(
  creativeDna: CreativeDNA,
  identity: string,
): CreativeDNA {
  return validated({
    ...creativeDna,
    concepts: creativeDna.concepts.map((concept) =>
      conceptIdentity(concept) === identity
        ? { ...concept, status: "user_confirmed" as const }
        : concept,
    ),
    unknownConcepts: creativeDna.unknownConcepts.map((concept) =>
      unknownIdentity(concept) === identity
        ? { ...concept, status: "user_confirmed" as const }
        : concept,
    ),
    constraints: creativeDna.constraints.map((constraint) =>
      constraintIdentity(constraint) === identity
        ? { ...constraint, status: "user_confirmed" as const }
        : constraint,
    ),
  });
}

export function addOntologyConcept(
  creativeDna: CreativeDNA,
  node: Pick<OntologyNode, "id" | "label" | "family" | "category">,
): CreativeDNA {
  const addition: CreativeDNAConcept = {
    ontologyId: node.id,
    label: node.label,
    family: node.family,
    category: node.category,
    source: "user_added",
    status: "user_confirmed",
    confidence: 1,
    evidence: { sourceField: "userEdit" },
  };
  const existingIndex = creativeDna.concepts.findIndex(
    (concept) => concept.ontologyId === node.id,
  );
  const concepts = [...creativeDna.concepts];
  if (existingIndex >= 0) {
    const existing = concepts[existingIndex];
    concepts[existingIndex] =
      existing.source === "explicit_requirement"
        ? { ...existing, status: "user_confirmed" }
        : addition;
  } else {
    concepts.push(addition);
  }
  return validated({ ...creativeDna, concepts });
}

export function addUnknownConcept(
  creativeDna: CreativeDNA,
  wording: string,
): CreativeDNA {
  const raw = wording.trim().replace(/\s+/g, " ").slice(0, 240);
  if (!raw) return creativeDna;
  const identity = normalizeOntologyLabel(raw);
  const addition: UnknownConcept = {
    raw,
    nearestOntologyIds: [],
    source: "user_added",
    status: "user_confirmed",
    confidence: 1,
    evidence: { sourceField: "userEdit", excerpt: raw },
  };
  const unknownConcepts = creativeDna.unknownConcepts.filter(
    (concept) => unknownIdentity(concept) !== identity,
  );
  unknownConcepts.push(addition);
  return validated({ ...creativeDna, unknownConcepts });
}

export function updateProjectIntent(
  creativeDna: CreativeDNA,
  projectIntent: string,
): CreativeDNA {
  return validated({ ...creativeDna, projectIntent: projectIntent.trim() });
}

export function mergeReviewOverrides(
  previous: CreativeDNA | null,
  next: CreativeDNA,
): CreativeDNA {
  if (!previous) return next;
  let merged = next;
  for (const concept of previous.concepts) {
    if (concept.source === "user_added" && concept.ontologyId) {
      merged = addOntologyConcept(merged, {
        id: concept.ontologyId,
        label: concept.label,
        family: concept.family ?? "Other",
        category: concept.category ?? "Concept",
      });
    } else if (concept.status === "user_rejected") {
      const matching = merged.concepts.find(
        (candidate) => candidate.ontologyId === concept.ontologyId,
      );
      if (matching) merged = rejectConcept(merged, conceptIdentity(matching), {
        allowExplicitRequirement: true,
      });
      else {
        merged = validated({
          ...merged,
          concepts: [...merged.concepts, concept],
        });
      }
    } else if (
      concept.status === "user_confirmed" &&
      concept.source !== "explicit_requirement"
    ) {
      const existingIndex = merged.concepts.findIndex(
        (candidate) => conceptIdentity(candidate) === conceptIdentity(concept),
      );
      const concepts = [...merged.concepts];
      if (existingIndex >= 0) {
        concepts[existingIndex] = {
          ...concepts[existingIndex],
          status: "user_confirmed",
        };
      } else {
        concepts.push(concept);
      }
      merged = validated({ ...merged, concepts });
    }
  }
  for (const unknown of previous.unknownConcepts) {
    if (unknown.source === "user_added") {
      merged = addUnknownConcept(merged, unknown.raw);
    } else if (unknown.status === "user_rejected") {
      const withoutDuplicate = merged.unknownConcepts.filter(
        (candidate) => unknownIdentity(candidate) !== unknownIdentity(unknown),
      );
      merged = validated({
        ...merged,
        unknownConcepts: [...withoutDuplicate, unknown],
      });
    }
  }
  for (const constraint of previous.constraints) {
    if (
      constraint.status !== "user_rejected" &&
      constraint.status !== "user_confirmed"
    ) {
      continue;
    }
    const identity = constraintIdentity(constraint);
    const existingIndex = merged.constraints.findIndex(
      (candidate) => constraintIdentity(candidate) === identity,
    );
    const constraints = [...merged.constraints];
    if (existingIndex >= 0) {
      constraints[existingIndex] = {
        ...constraints[existingIndex],
        status: constraint.status,
      };
    } else if (constraint.status === "user_rejected") {
      constraints.push(constraint);
    }
    merged = validated({ ...merged, constraints });
  }
  return merged;
}
