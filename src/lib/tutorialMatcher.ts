import tutorialsData from "@/src/data/tutorials.json";
import { applicationById } from "@/src/data/applications";
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

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
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
  const stageTokens = new Set(
    tokenize(`${stage.title} ${stage.goal} ${stage.skillToLearn} ${stage.tasks.join(" ")}`),
  );

  const scored = tutorials
    .filter(
      (tutorial) =>
        tutorial.applicationId === stage.applicationId &&
        languageMatches(tutorial, preference) &&
        !excludedIds.has(tutorial.id),
    )
    .map((tutorial) => {
      let score = 0;
      for (const topic of tutorial.topics) {
        for (const token of tokenize(topic)) {
          if (stageTokens.has(token)) score += 2;
        }
      }
      return { tutorial, score };
    })
    .sort((a, b) => b.score - a.score || a.tutorial.id.localeCompare(b.tutorial.id));
  const relevant = scored.filter(({ score }) => score > 0);

  return (relevant.length > 0 ? relevant : scored)
    .slice(0, limit)
    .map(({ tutorial }) => tutorial);
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
        !excludedIds.has(id),
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
    applicationName:
      applicationById[tutorial.applicationId]?.name ?? tutorial.applicationId,
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
