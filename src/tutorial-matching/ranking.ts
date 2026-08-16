import type { TutorialDNA, TutorialNeed } from "@/src/contracts/knowledge";
import type {
  RankedTutorial,
  TutorialDiscoveryResult,
  TutorialScoreBreakdown,
} from "@/src/tutorial-matching/contracts";

export const tutorialRankingWeights = {
  skill: 24,
  technique: 18,
  software: 10,
  prerequisiteFit: 9,
  output: 7,
  sourceQuality: 7,
  userLevel: 6,
  language: 5,
  version: 4,
  specificity: 4,
  recency: 3,
  aesthetic: 3,
} as const;

export const tutorialRankingPenalties = {
  softwareMismatch: 45,
  prerequisiteMismatch: 18,
  broadCourse: 30,
  duration: 12,
  stale: 10,
  unverified: 5,
} as const;

export interface TutorialRankingContext {
  knownSkillIds: ReadonlySet<string>;
  rejectedTutorialIds?: ReadonlySet<string>;
  feedback?: "none" | "too_advanced" | "too_long";
  allowBroadCourse?: boolean;
  today?: string;
}

function coverage(required: string[], actual: string[]): number {
  if (required.length === 0) return 0;
  const values = new Set(actual);
  return required.filter((id) => values.has(id)).length / required.length;
}

function matchesLevel(need: TutorialNeed, tutorial: TutorialDNA): number {
  if (!need.userLevel || !tutorial.difficulty || tutorial.difficulty === "mixed") {
    return 0.65;
  }
  if (need.userLevel === tutorial.difficulty) return 1;
  const levels = ["beginner", "intermediate", "advanced"];
  const distance = Math.abs(
    levels.indexOf(need.userLevel) - levels.indexOf(tutorial.difficulty),
  );
  return distance === 1 ? 0.35 : 0;
}

function prerequisiteFit(
  tutorial: TutorialDNA,
  knownSkillIds: ReadonlySet<string>,
): number {
  if (tutorial.prerequisiteIds.length === 0) return 1;
  return tutorial.prerequisiteIds.filter((id) => knownSkillIds.has(id)).length /
    tutorial.prerequisiteIds.length;
}

function recency(tutorial: TutorialDNA, today: string): number {
  if (!tutorial.publishedAt) return 0.45;
  const years =
    (new Date(today).getTime() - new Date(tutorial.publishedAt).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 1) return 1;
  if (years <= 3) return 0.7;
  if (years <= 6) return 0.35;
  return 0.1;
}

function specificity(need: TutorialNeed, tutorial: TutorialDNA): number {
  if (tutorial.tutorialType === "focused") return 1;
  if (tutorial.tutorialType === "project_based") return 0.75;
  if (tutorial.tutorialType === "reference") return 0.55;
  if (tutorial.tutorialType === "broad_course") return 0.15;
  return 0.4;
}

function languageFit(need: TutorialNeed, tutorial: TutorialDNA): number {
  if (need.preferredLanguage === "either") return 1;
  return tutorial.language === need.preferredLanguage ? 1 : 0.25;
}

function sourceFit(candidate: TutorialDiscoveryResult): number {
  const tier = { curated: 1, indexed: 0.82, live: 0.45 } as const;
  return Math.min(tier[candidate.sourceTier], candidate.tutorial.sourceQuality ?? 0.5);
}

function scoreOne(
  need: TutorialNeed,
  candidate: TutorialDiscoveryResult,
  context: TutorialRankingContext,
): RankedTutorial | null {
  const tutorial = candidate.tutorial;
  if (
    tutorial.status === "broken" ||
    context.rejectedTutorialIds?.has(tutorial.id)
  ) {
    return null;
  }

  const prerequisiteScore = prerequisiteFit(tutorial, context.knownSkillIds);
  const softwareScore = coverage(need.softwareIds, tutorial.softwareIds);
  if (need.softwareIds.length > 0 && softwareScore === 0) return null;
  const skillScore = coverage(need.skillIds, tutorial.skillIds);
  const techniqueScore = coverage(need.techniqueIds, tutorial.techniqueIds);
  const hasTechnicalMatch = skillScore > 0 || techniqueScore > 0;
  if (!hasTechnicalMatch) {
    return null;
  }
  const classification = Math.max(0.35, tutorial.classificationConfidence ?? 0.5);
  const breakdown: TutorialScoreBreakdown = {
    skill: skillScore * tutorialRankingWeights.skill,
    technique:
      techniqueScore *
      tutorialRankingWeights.technique,
    software: softwareScore * tutorialRankingWeights.software,
    prerequisiteFit: prerequisiteScore * tutorialRankingWeights.prerequisiteFit,
    output: coverage(need.outputIds, tutorial.outputIds) * tutorialRankingWeights.output,
    sourceQuality: sourceFit(candidate) * tutorialRankingWeights.sourceQuality,
    userLevel: matchesLevel(need, tutorial) * tutorialRankingWeights.userLevel,
    language: languageFit(need, tutorial) * tutorialRankingWeights.language,
    version: (tutorial.softwareVersions.length > 0 ? 1 : 0.5) * tutorialRankingWeights.version,
    specificity: specificity(need, tutorial) * tutorialRankingWeights.specificity,
    recency: recency(tutorial, context.today ?? new Date().toISOString().slice(0, 10)) * tutorialRankingWeights.recency,
    aesthetic: coverage(need.aestheticIds, tutorial.aestheticIds) * tutorialRankingWeights.aesthetic,
    classification: -(1 - classification) * 3,
    penalties: {
      softwareMismatch:
        need.softwareIds.length > 0 && softwareScore === 0
          ? -tutorialRankingPenalties.softwareMismatch
          : 0,
      prerequisiteMismatch:
        prerequisiteScore < 0.5
          ? -tutorialRankingPenalties.prerequisiteMismatch * (1 - prerequisiteScore)
          : 0,
      broadCourse:
        tutorial.tutorialType === "broad_course" && !context.allowBroadCourse
          ? -tutorialRankingPenalties.broadCourse
          : 0,
      duration:
        tutorial.durationMinutes && need.preferredDurationMinutes &&
        tutorial.durationMinutes > need.preferredDurationMinutes * 2
          ? -tutorialRankingPenalties.duration *
            Math.min(1, tutorial.durationMinutes / need.preferredDurationMinutes / 5)
          : context.feedback === "too_long" && tutorial.durationMinutes && tutorial.durationMinutes > 20
            ? -tutorialRankingPenalties.duration
            : 0,
      stale:
        tutorial.status === "stale" ? -tutorialRankingPenalties.stale : 0,
      unverified:
        tutorial.status === "unverified"
          ? -tutorialRankingPenalties.unverified
          : 0,
    },
  };
  if (
    context.feedback === "too_advanced" &&
    tutorial.difficulty &&
    ["intermediate", "advanced"].includes(tutorial.difficulty)
  ) {
    breakdown.penalties.prerequisiteMismatch -= 12;
  }
  const positives = Object.entries(breakdown)
    .filter(([key, value]) => key !== "penalties" && typeof value === "number")
    .reduce((sum, [, value]) => sum + (value as number), 0);
  const penalties = Object.values(breakdown.penalties).reduce(
    (sum, value) => sum + value,
    0,
  );
  const score = Math.round((positives + penalties) * 10) / 10;
  const reasons = [
    breakdown.skill > 0 || breakdown.technique > 0 ? "specific skill match" : "related topic",
    breakdown.software > 0 ? "required software" : null,
    breakdown.prerequisiteFit >= 6 ? "appropriate prerequisites" : null,
    breakdown.specificity >= 3 ? "focused scope" : null,
    breakdown.language >= 5 ? "preferred language" : null,
  ].filter(Boolean);
  return {
    tutorial,
    sourceTier: candidate.sourceTier,
    score,
    breakdown,
    why: `Selected for ${reasons.slice(0, 3).join(", ")}.`,
  };
}

export function rankTutorials(
  need: TutorialNeed,
  candidates: TutorialDiscoveryResult[],
  context: TutorialRankingContext,
): RankedTutorial[] {
  return candidates
    .map((candidate) => scoreOne(need, candidate, context))
    .filter((candidate): candidate is RankedTutorial => Boolean(candidate))
    .filter((candidate) => candidate.score >= 15)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.tutorial.sourceQuality ?? 0) - (left.tutorial.sourceQuality ?? 0) ||
        specificity(need, right.tutorial) - specificity(need, left.tutorial) ||
        (left.tutorial.durationMinutes ?? Number.MAX_SAFE_INTEGER) -
          (right.tutorial.durationMinutes ?? Number.MAX_SAFE_INTEGER) ||
        left.tutorial.id.localeCompare(right.tutorial.id),
    );
}
