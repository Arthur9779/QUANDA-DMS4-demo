import {
  applicationById,
  applications,
  createCustomApplicationId,
} from "@/src/data/applications";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { ontologyArtifact } from "@/src/ontology/runtime";
import type { ApplicationSearchResult } from "./contracts";

const APPLICATION_CATEGORIES = new Set([
  "3D Software",
  "CAD Software",
  "Code Editor",
  "Creative Coding Tool",
  "DAW",
  "Game Engine",
  "IDE",
  "Image Editor",
  "Software",
  "Video Editor",
]);

interface SearchableApplication extends ApplicationSearchResult {
  searchableNames: string[];
}

function applicationKey(value: string): string {
  return normalizeOntologyLabel(value).replace(/^adobe\s+/, "");
}

const builtInIdByName = new Map(
  applications.flatMap((application) => [
    [applicationKey(application.name), application.id] as const,
    [normalizeOntologyLabel(application.name), application.id] as const,
  ]),
);

function categoryLabel(category: string): string {
  return category === "Software" ? "Creative application" : category;
}

const BUILT_IN_CATEGORY_LABELS = {
  "3d": "3D application",
  graphics: "Design application",
  video: "Video application",
  uiux: "UI/UX application",
  audio: "Audio application",
  drawing: "Drawing application",
  custom: "Creative application",
} as const;

function buildApplicationIndex(): SearchableApplication[] {
  const byId = new Map<string, SearchableApplication>();

  for (const application of applications) {
    byId.set(application.id, {
      id: application.id,
      name: application.name,
      category: BUILT_IN_CATEGORY_LABELS[application.category],
      source: "built_in",
      searchableNames: [application.name],
    });
  }

  for (const node of ontologyArtifact.nodes) {
    if (
      node.family !== "Tools and Software" ||
      !APPLICATION_CATEGORIES.has(node.category)
    ) {
      continue;
    }
    const builtInId =
      builtInIdByName.get(applicationKey(node.label)) ??
      builtInIdByName.get(normalizeOntologyLabel(node.label));
    const id = builtInId ?? createCustomApplicationId(node.label);
    const existing = byId.get(id);
    if (existing) {
      existing.searchableNames.push(node.label, ...node.aliases);
      continue;
    }
    byId.set(id, {
      id,
      name: applicationById[id]?.name ?? node.label,
      category: categoryLabel(node.category),
      source: applicationById[id] ? "built_in" : "ontology",
      searchableNames: [node.label, ...node.aliases],
    });
  }

  return [...byId.values()].map((application) => ({
    ...application,
    searchableNames: [...new Set(application.searchableNames)],
  }));
}

const applicationIndex = buildApplicationIndex();

function scoreApplication(
  application: SearchableApplication,
  query: string,
): number {
  const normalizedQuery = normalizeOntologyLabel(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const value of application.searchableNames) {
    const normalized = normalizeOntologyLabel(value);
    if (normalized === normalizedQuery) score = Math.max(score, 100);
    else if (normalized.startsWith(normalizedQuery)) score = Math.max(score, 82);
    const tokens = normalized.split(/\s+/);
    if (tokens.includes(normalizedQuery)) score = Math.max(score, 86);
    const matched = queryTokens.filter((token) =>
      tokens.some((candidate) => candidate.startsWith(token)),
    ).length;
    if (matched > 0) {
      score = Math.max(score, 34 + (matched / queryTokens.length) * 32);
    }
  }
  if (application.source === "built_in" && score > 0) score += 3;
  return score;
}

export function searchApplications(
  query: string,
  limit = 10,
): ApplicationSearchResult[] {
  return applicationIndex
    .map((application) => ({
      application,
      score: scoreApplication(application, query),
    }))
    .filter(({ score }) => score >= 50)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.application.name.localeCompare(right.application.name),
    )
    .slice(0, limit)
    .map(({ application }) => ({
      id: application.id,
      name: application.name,
      category: application.category,
      source: application.source,
    }));
}
