import type { CreativeDNAConcept } from "@/src/contracts/knowledge";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

export type CreativeDnaGroupKey =
  | "creativeDirection"
  | "medium"
  | "visualQualities"
  | "techniques"
  | "subject"
  | "motionInteraction"
  | "toolsSoftware"
  | "codingTechnology"
  | "output"
  | "moreDetails";

export interface CreativeDnaGroup {
  key: CreativeDnaGroupKey;
  concepts: CreativeDNAConcept[];
}

const GROUP_ORDER: CreativeDnaGroupKey[] = [
  "creativeDirection",
  "medium",
  "visualQualities",
  "techniques",
  "subject",
  "motionInteraction",
  "toolsSoftware",
  "codingTechnology",
  "output",
  "moreDetails",
];

const SOURCE_ORDER = {
  explicit_requirement: 0,
  user_preference: 1,
  user_added: 2,
  ai_inferred: 3,
} as const;

export function groupKeyForConcept(
  concept: CreativeDNAConcept,
): CreativeDnaGroupKey {
  const family = normalizeOntologyLabel(concept.family ?? "");
  const category = normalizeOntologyLabel(concept.category ?? "");
  const value = `${family} ${category}`;
  if (/tool|software|required software|application/.test(value)) {
    return "toolsSoftware";
  }
  if (/programming|coding|web|technology|framework|algorithm|ai /.test(value)) {
    return "codingTechnology";
  }
  if (/deliverable|output|file format|platform|distribution/.test(value)) {
    return "output";
  }
  if (/aesthetic|style|movement|mood|genre|era/.test(category)) {
    return "creativeDirection";
  }
  if (/motion|animation|interaction|installation|tracking|gesture/.test(value)) {
    return "motionInteraction";
  }
  if (/\bsubject\b|\bcharacters?\b|environment genre|object type/.test(value)) {
    return "subject";
  }
  if (/medium|3d production|photography|audio and music|graphic design/.test(value)) {
    return "medium";
  }
  if (/technique|workflow|pipeline|production stage|process/.test(value)) {
    return "techniques";
  }
  if (
    /visual|image-making|color|colour|lighting|material|texture|camera|lens|surface/.test(
      value,
    )
  ) {
    return "visualQualities";
  }
  if (/creative direction|aesthetic|style|movement|mood|genre|era/.test(value)) {
    return "creativeDirection";
  }
  return "moreDetails";
}

export function groupCreativeDnaConcepts(
  concepts: CreativeDNAConcept[],
): CreativeDnaGroup[] {
  const active = concepts.filter(
    (concept) =>
      concept.status !== "user_rejected" &&
      concept.source !== "explicit_requirement",
  );
  const groups = new Map<CreativeDnaGroupKey, CreativeDNAConcept[]>();
  for (const concept of active) {
    const key = groupKeyForConcept(concept);
    groups.set(key, [...(groups.get(key) ?? []), concept]);
  }
  return GROUP_ORDER.flatMap((key) => {
    const values = groups.get(key);
    if (!values?.length) return [];
    return [
      {
        key,
        concepts: values.sort(
          (left, right) =>
            SOURCE_ORDER[left.source] - SOURCE_ORDER[right.source] ||
            (right.confidence ?? 0) - (left.confidence ?? 0),
        ),
      },
    ];
  });
}
