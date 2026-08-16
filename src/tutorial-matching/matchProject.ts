import { createProjectInputFingerprint } from "@/src/creative-dna-review/fingerprint";
import type { SkillGap, TutorialNeed } from "@/src/contracts/knowledge";
import {
  LearningPlanSchema,
  TutorialMatchingRequestSchema,
  type LearningPlan,
  type TutorialDiscoveryResult,
  type TutorialMatchingRequest,
} from "@/src/tutorial-matching/contracts";
import {
  createTutorialDiscoveryProvider,
  type TutorialDiscoveryProvider,
} from "@/src/tutorial-matching/providers";
import { rankTutorials } from "@/src/tutorial-matching/ranking";
import {
  buildTutorialNeeds,
  deriveSkillGaps,
} from "@/src/tutorial-matching/skillGap";

export interface MatchProjectOptions {
  provider?: TutorialDiscoveryProvider;
  environment?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

async function discoverForNeed(
  need: TutorialNeed,
  provider: TutorialDiscoveryProvider,
): Promise<TutorialDiscoveryResult[]> {
  const byId = new Map<string, TutorialDiscoveryResult>();
  for (const query of need.searchQueries.slice(0, 2)) {
    const results = await provider.search({
      query,
      language: need.preferredLanguage,
      softwareIds: need.softwareIds,
      maxResults: 12,
    });
    for (const result of results) byId.set(result.tutorial.id, result);
    if (byId.size >= 12) break;
  }
  return [...byId.values()].slice(0, 12);
}

function knownIds(gaps: SkillGap[]): Set<string> {
  return new Set(
    gaps
      .filter((gap) => gap.status === "known")
      .map((gap) => gap.skillId),
  );
}

function broadCourseCanHelp(need: TutorialNeed, gaps: SkillGap[]): boolean {
  const sameSoftware = gaps.filter(
    (gap) =>
      gap.status !== "known" &&
      gap.softwareIds.some((id) => need.softwareIds.includes(id)),
  );
  return need.userLevel === "beginner" && sameSoftware.length >= 4;
}

export async function matchProjectTutorials(
  input: TutorialMatchingRequest,
  options: MatchProjectOptions = {},
): Promise<LearningPlan> {
  const parsed = TutorialMatchingRequestSchema.parse(input);
  const provider =
    options.provider ??
    createTutorialDiscoveryProvider(options.environment, options.fetchImpl);
  const skillGaps = deriveSkillGaps(
    parsed.project,
    parsed.review.analysis.creativeDna,
  );
  const tutorialNeeds = buildTutorialNeeds(
    parsed.project,
    parsed.review.analysis.creativeDna,
    skillGaps,
  ).slice(0, 12);
  const knownSkillIds = knownIds(skillGaps);
  const usedTutorialIds = new Set<string>();
  let usedLive = false;
  const tutorialMatches = [];

  for (const need of tutorialNeeds) {
    const discovered = await discoverForNeed(need, provider);
    if (discovered.some((candidate) => candidate.sourceTier === "live")) {
      usedLive = true;
    }
    const candidates = rankTutorials(need, discovered, {
      knownSkillIds,
      rejectedTutorialIds: usedTutorialIds,
      allowBroadCourse: broadCourseCanHelp(need, skillGaps),
      today: (options.now ?? (() => new Date()))().toISOString().slice(0, 10),
    }).slice(0, 8);
    const selectedTutorialId = candidates[0]?.tutorial.id ?? null;
    if (selectedTutorialId) usedTutorialIds.add(selectedTutorialId);
    tutorialMatches.push({
      needId: need.id,
      selectedTutorialId,
      candidates,
      rejectedTutorialIds: [],
      feedback: "none" as const,
    });
  }

  return LearningPlanSchema.parse({
    learningPlanVersion: 1,
    tutorialRankingVersion: 1,
    inputFingerprint: createProjectInputFingerprint(parsed.project),
    skillGaps,
    tutorialNeeds,
    tutorialMatches,
    source: usedLive ? "catalogue_and_live" : "catalogue",
    createdAt: (options.now ?? (() => new Date()))().toISOString(),
  });
}

export function markSkillGap(
  plan: LearningPlan,
  skillId: string,
  status: SkillGap["status"],
): LearningPlan {
  const skillGaps = plan.skillGaps.map((gap) =>
    gap.skillId === skillId ? { ...gap, status } : gap,
  );
  const affectedNeedIds = new Set(
    plan.tutorialNeeds
      .filter((need) => need.skillIds.includes(skillId))
      .map((need) => need.id),
  );
  const inactive = status === "known" || status === "not_required";
  return LearningPlanSchema.parse({
    ...plan,
    skillGaps,
    tutorialNeeds: plan.tutorialNeeds.map((need) =>
      affectedNeedIds.has(need.id)
        ? { ...need, status: status === "known" ? "known" : inactive ? "not_required" : "active" }
        : need,
    ),
    tutorialMatches: plan.tutorialMatches.map((match) =>
      affectedNeedIds.has(match.needId) && inactive
        ? { ...match, selectedTutorialId: null }
        : match,
    ),
  });
}

export function replaceTutorial(
  plan: LearningPlan,
  needId: string,
  feedback: "none" | "too_advanced" | "too_long" = "none",
): LearningPlan {
  return LearningPlanSchema.parse({
    ...plan,
    tutorialMatches: plan.tutorialMatches.map((match) => {
      if (match.needId !== needId) return match;
      const rejectedTutorialIds = [
        ...new Set([
          ...match.rejectedTutorialIds,
          ...(match.selectedTutorialId ? [match.selectedTutorialId] : []),
        ]),
      ];
      const candidates = [...match.candidates].sort((left, right) => {
        if (feedback === "too_advanced") {
          const level = { beginner: 0, mixed: 1, intermediate: 2, advanced: 3 };
          const difference =
            level[left.tutorial.difficulty ?? "mixed"] -
            level[right.tutorial.difficulty ?? "mixed"];
          if (difference !== 0) return difference;
        }
        if (feedback === "too_long") {
          const difference =
            (left.tutorial.durationMinutes ?? Number.MAX_SAFE_INTEGER) -
            (right.tutorial.durationMinutes ?? Number.MAX_SAFE_INTEGER);
          if (difference !== 0) return difference;
        }
        return right.score - left.score ||
          left.tutorial.id.localeCompare(right.tutorial.id);
      });
      const next = candidates.find(
        (candidate) => !rejectedTutorialIds.includes(candidate.tutorial.id),
      );
      return {
        ...match,
        candidates,
        rejectedTutorialIds,
        selectedTutorialId: next?.tutorial.id ?? null,
        feedback,
      };
    }),
  });
}

export function mergeLearningDecisions(
  previous: LearningPlan | null,
  next: LearningPlan,
): LearningPlan {
  if (!previous || previous.inputFingerprint !== next.inputFingerprint) return next;
  const previousGap = new Map(previous.skillGaps.map((gap) => [gap.skillId, gap]));
  const previousMatch = new Map(
    previous.tutorialMatches.map((match) => [match.needId, match]),
  );
  const skillGaps = next.skillGaps.map((gap) => ({
    ...gap,
    status: previousGap.get(gap.skillId)?.status ?? gap.status,
  }));
  const tutorialNeeds = next.tutorialNeeds.map((need) => {
    const gap = skillGaps.find((item) => need.skillIds.includes(item.skillId));
    return gap?.status === "known"
      ? { ...need, status: "known" as const }
      : gap?.status === "not_required"
        ? { ...need, status: "not_required" as const }
        : need;
  });
  const tutorialMatches = next.tutorialMatches.map((match) => {
    const earlier = previousMatch.get(match.needId);
    if (!earlier) return match;
    const rejectedTutorialIds = [...new Set(earlier.rejectedTutorialIds)];
    const selectedStillAvailable = match.candidates.some(
      (candidate) =>
        candidate.tutorial.id === earlier.selectedTutorialId &&
        !rejectedTutorialIds.includes(candidate.tutorial.id),
    );
    return {
      ...match,
      rejectedTutorialIds,
      feedback: earlier.feedback,
      selectedTutorialId: selectedStillAvailable
        ? earlier.selectedTutorialId
        : match.candidates.find(
            (candidate) => !rejectedTutorialIds.includes(candidate.tutorial.id),
          )?.tutorial.id ?? null,
    };
  });
  return LearningPlanSchema.parse({
    ...next,
    skillGaps,
    tutorialNeeds,
    tutorialMatches,
  });
}
