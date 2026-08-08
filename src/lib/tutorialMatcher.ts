import tutorialsData from "@/src/data/tutorials.json";
import { getApplicationName } from "@/src/data/applications";
import type {
  Locale,
  RoadmapRequest,
  RoadmapStage,
  TutorialLanguage,
} from "@/src/types";

export interface Tutorial {
  id: string;
  title: Record<Locale, string>;
  creator: string;
  url: string;
  youtubeVideoId: string;
  language: Locale;
  applicationId: string;
  topics: string[];
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number | null;
  publishedAt: string;
  versionLabel: string;
  verifiedAt: string;
  sourceType: "video";
}

export interface TutorialRecommendation {
  id: string;
  title: string;
  creator: string;
  url: string;
  thumbnailUrl: string;
  language: Locale;
  applicationName: string;
  level: Tutorial["level"];
  durationMinutes: number | null;
  versionLabel: string;
  sourceType: Tutorial["sourceType"];
  badge: "youtube";
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtube.com" && parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    } else if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1).split("/")[0] || null;
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export function isDirectYouTubeVideo(tutorial: Tutorial): boolean {
  return extractYouTubeVideoId(tutorial.url) === tutorial.youtubeVideoId;
}

export const tutorials = (tutorialsData as Tutorial[]).filter(isDirectYouTubeVideo);

const tutorialById = new Map(tutorials.map((tutorial) => [tutorial.id, tutorial]));

const TOKEN_ALIASES: Record<string, string> = {
  basics: "setup",
  beginner: "setup",
  bins: "setup",
  import: "setup",
  interface: "setup",
  media: "setup",
  organisation: "setup",
  organization: "setup",
  setup: "setup",
  workspace: "setup",
  colour: "color",
  correction: "color",
  exposure: "color",
  grade: "color",
  grading: "color",
  matching: "color",
  audio: "audio",
  dialogue: "audio",
  fairlight: "audio",
  noise: "audio",
  sound: "audio",
  edit: "editing",
  editing: "editing",
  footage: "editing",
  timeline: "editing",
  trim: "editing",
  trimming: "editing",
  cut: "editing",
  codec: "export",
  deliver: "export",
  delivery: "export",
  export: "export",
  h264: "export",
  render: "export",
  rendering: "export",
  criteria: "quality",
  criterion: "quality",
  errors: "quality",
  inspection: "quality",
  issues: "quality",
  quality: "quality",
  refine: "quality",
  review: "quality",
  troubleshoot: "quality",
  troubleshooting: "quality",
  verify: "quality",
  verification: "quality",
  model: "modeling",
  modeling: "modeling",
  modelling: "modeling",
  geometry: "modeling",
  material: "materials",
  shading: "materials",
  texture: "materials",
  textures: "materials",
  light: "lighting",
  animation: "animation",
  animate: "animation",
  keyframes: "animation",
  prototype: "prototype",
  prototyping: "prototype",
  wireframe: "layout",
  wireframes: "layout",
  layout: "layout",
  components: "components",
  component: "components",
  vector: "vector",
  logo: "vector",
  logos: "vector",
  icon: "vector",
  icons: "vector",
  illustration: "illustration",
  painting: "painting",
  sketching: "painting",
  recording: "recording",
  mixing: "mixing",
  music: "music",
  beat: "music",
};

const CONCEPT_TOKENS = new Set([
  "setup", "color", "audio", "editing", "export", "quality", "modeling",
  "materials", "lighting", "animation", "prototype", "layout", "components",
  "vector", "illustration", "painting", "recording", "mixing", "music",
]);

function tokenize(value: string): string[] {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(?:sound|audio) editing\b/g, " audio ")
    .replace(/\bvideo editing\b/g, " editing ")
    .replace(/\bcolou?r (?:correction|grading)\b/g, " color ")
    .replace(/\bwhite balance\b/g, " color ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  return normalized
    .map((token) => TOKEN_ALIASES[token] ?? token);
}

function tutorialTokens(tutorial: Tutorial): Set<string> {
  return new Set(tokenize([
    tutorial.title.en,
    tutorial.title.vi,
    ...tutorial.topics,
  ].join(" ")));
}

function isBroadQualityReview(stageText: string): boolean {
  const normalized = stageText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ");
  const qualityReview =
    /\bquality (?:check|control|review)\b/.test(normalized) ||
    /\b(?:review|check)\b.{0,50}\b(?:criteria|criterion|issues?)\b/.test(normalized) ||
    /\b(?:kiem tra|kiem soat|ra soat) chat luong\b/.test(normalized);
  const delivery = /\b(?:export|delivery|deliver|xuat|ban giao)\b/.test(normalized);
  return qualityReview && !delivery;
}

function tutorialRelevanceScore(stage: RoadmapStage, tutorial: Tutorial): number {
  const stageText = `${stage.title} ${stage.goal} ${stage.skillToLearn} ${stage.tasks.join(" ")}`;
  const stageTokens = new Set(tokenize(stageText));
  const candidateTokens = tutorialTokens(tutorial);

  if (isBroadQualityReview(stageText) && !candidateTokens.has("quality")) return 0;

  const stageConcepts = new Set(
    [...stageTokens].filter((token) => CONCEPT_TOKENS.has(token)),
  );
  const tutorialConcepts = new Set(
    [...candidateTokens].filter((token) => CONCEPT_TOKENS.has(token)),
  );
  if (
    stageConcepts.size > 0 &&
    tutorialConcepts.size > 0 &&
    ![...stageConcepts].some((concept) => tutorialConcepts.has(concept))
  ) {
    return 0;
  }

  return tutorial.topics.reduce(
    (score, topic) =>
      score + tokenize(topic).filter((token) => stageTokens.has(token)).length * 2,
    0,
  );
}

function languageMatches(
  tutorial: Tutorial,
  preference: TutorialLanguage,
): boolean {
  return preference === "either" || tutorial.language === preference;
}

export function validateTutorialIds(ids: string[]): string[] {
  return [...new Set(ids)].filter((id) => tutorialById.has(id));
}

export function selectCandidateTutorials(
  request: RoadmapRequest,
  limit = 16,
): Tutorial[] {
  const requestTokens = new Set(
    tokenize(
      `${request.projectBrief} ${request.currentExperience} ${request.outputType}`,
    ),
  );
  const requiredApplications = new Set(request.requiredApplications);

  const ranked = tutorials
    .filter(
      (tutorial) =>
        languageMatches(tutorial, request.tutorialLanguage) &&
        (requiredApplications.size === 0 ||
          requiredApplications.has(tutorial.applicationId)),
    )
    .map((tutorial) => {
      let score = 0;
      if (requiredApplications.has(tutorial.applicationId)) score += 8;
      for (const topic of tutorial.topics) {
        for (const token of tokenize(topic)) {
          if (requestTokens.has(token)) score += 2;
        }
      }
      if (tutorial.level === "beginner") score += 1;
      return { tutorial, score };
    })
    .sort((a, b) => b.score - a.score || a.tutorial.id.localeCompare(b.tutorial.id));

  if (requiredApplications.size === 0) {
    return ranked.slice(0, limit).map(({ tutorial }) => tutorial);
  }

  const selected: Tutorial[] = [];
  const selectedIds = new Set<string>();
  for (const applicationId of requiredApplications) {
    const firstMatch = ranked.find(
      ({ tutorial }) => tutorial.applicationId === applicationId,
    )?.tutorial;
    if (firstMatch) {
      selected.push(firstMatch);
      selectedIds.add(firstMatch.id);
    }
  }

  for (const { tutorial } of ranked) {
    if (selected.length >= Math.max(limit, requiredApplications.size)) break;
    if (!selectedIds.has(tutorial.id)) {
      selected.push(tutorial);
      selectedIds.add(tutorial.id);
    }
  }

  return selected;
}

export function matchTutorialsForStage(
  stage: RoadmapStage,
  preference: TutorialLanguage,
  limit = 3,
  excludedIds: ReadonlySet<string> = new Set(),
): Tutorial[] {
  const scored = tutorials
    .filter(
      (tutorial) =>
        tutorial.applicationId === stage.applicationId &&
        languageMatches(tutorial, preference) &&
        !excludedIds.has(tutorial.id),
    )
    .map((tutorial) => ({ tutorial, score: tutorialRelevanceScore(stage, tutorial) }))
    .sort((a, b) => b.score - a.score || a.tutorial.id.localeCompare(b.tutorial.id));
  const relevant = scored.filter(({ score }) => score > 0);

  return relevant.slice(0, limit).map(({ tutorial }) => tutorial);
}

export function fillTutorialIds(
  stage: RoadmapStage,
  preference: TutorialLanguage,
  excludedIds: ReadonlySet<string> = new Set(),
  limit = 3,
): string[] {
  const valid = validateTutorialIds(stage.tutorialIds).filter((id) => {
    const tutorial = tutorialById.get(id);
    return Boolean(
        tutorial &&
        tutorial.applicationId === stage.applicationId &&
        languageMatches(tutorial, preference) &&
        !excludedIds.has(id) &&
        tutorialRelevanceScore(stage, tutorial) > 0,
    );
  });
  const matched = matchTutorialsForStage(
    stage,
    preference,
    limit,
    new Set([...excludedIds, ...valid]),
  ).map((tutorial) => tutorial.id);

  return [...valid, ...matched].slice(0, limit);
}

function toRecommendation(
  tutorial: Tutorial,
  locale: Locale,
): TutorialRecommendation {
  return {
    id: tutorial.id,
    title: tutorial.title[locale],
    creator: tutorial.creator,
    url: tutorial.url,
    thumbnailUrl: `https://i.ytimg.com/vi/${tutorial.youtubeVideoId}/hqdefault.jpg`,
    language: tutorial.language,
    applicationName: getApplicationName(tutorial.applicationId),
    level: tutorial.level,
    durationMinutes: tutorial.durationMinutes,
    versionLabel: tutorial.versionLabel,
    sourceType: tutorial.sourceType,
    badge: "youtube",
  };
}

export function resolveTutorialRecommendations(
  stage: RoadmapStage,
  preference: TutorialLanguage,
  locale: Locale,
): TutorialRecommendation[] {
  const validIds = fillTutorialIds(stage, preference);
  return validIds
    .map((id) => tutorialById.get(id))
    .filter((tutorial): tutorial is Tutorial => Boolean(tutorial))
    .map((tutorial) => toRecommendation(tutorial, locale));
}

export function resolveRoadmapTutorialRecommendations(
  stages: RoadmapStage[],
  preference: TutorialLanguage,
  locale: Locale,
): Record<string, TutorialRecommendation[]> {
  const recommendations: Record<string, TutorialRecommendation[]> = {};
  const usedIds = new Set<string>();

  stages.forEach((stage, index) => {
    if (!stage.applicationId) {
      recommendations[stage.id] = [];
      return;
    }

    const remainingStagesForApplication = stages
      .slice(index + 1)
      .filter((candidate) => candidate.applicationId === stage.applicationId)
      .length;
    const availableCount = tutorials.filter(
      (tutorial) =>
        tutorial.applicationId === stage.applicationId &&
        languageMatches(tutorial, preference) &&
        !usedIds.has(tutorial.id),
    ).length;
    const limit = availableCount > remainingStagesForApplication ? 2 : 1;
    const ids = fillTutorialIds(stage, preference, usedIds, limit);

    ids.forEach((id) => usedIds.add(id));
    recommendations[stage.id] = ids
      .map((id) => tutorialById.get(id))
      .filter((tutorial): tutorial is Tutorial => Boolean(tutorial))
      .map((tutorial) => toRecommendation(tutorial, locale));
  });

  return recommendations;
}
