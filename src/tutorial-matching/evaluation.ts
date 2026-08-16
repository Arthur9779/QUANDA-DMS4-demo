import { readFile } from "node:fs/promises";
import { z } from "zod";
import { createProjectInputFingerprint } from "@/src/creative-dna-review/fingerprint";
import type { CreativeDnaReviewRecord } from "@/src/creative-dna-review";
import { findExactOntologyConcepts } from "@/src/ontology/runtime";
import { matchProjectTutorials } from "@/src/tutorial-matching/matchProject";
import { CatalogueTutorialProvider } from "@/src/tutorial-matching/providers";
import type { LearningPlan } from "@/src/tutorial-matching/contracts";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";

const BenchmarkCaseSchema = z.object({
  id: z.string(),
  project: RoadmapRequestSchema,
  creativeLabels: z.array(z.string()),
  expectedSkillIds: z.array(z.string()),
  knownSkillIds: z.array(z.string()),
  forbiddenSkillIds: z.array(z.string()),
});

const TutorialMatchingBenchmarkSchema = z.object({
  version: z.literal(1),
  cases: z.array(BenchmarkCaseSchema),
});

export type TutorialMatchingBenchmarkCase = z.infer<typeof BenchmarkCaseSchema>;

export interface TutorialMatchingMetrics {
  cases: number;
  precisionAt3: number;
  irrelevantTutorialRate: number;
  overTeachingRate: number;
  skillSpecificity: number;
  prerequisiteFit: number;
  softwareCorrectness: number;
  languageMatch: number;
  verifiedTutorialRate: number;
  requiredSkillRecall: number;
  unnecessaryPrerequisiteRate: number;
  knownSkillRepetitionRate: number;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function reviewFor(testCase: TutorialMatchingBenchmarkCase): CreativeDnaReviewRecord {
  const concepts = testCase.creativeLabels.flatMap((label) => {
    const node = findExactOntologyConcepts(label)[0];
    return node
      ? [{
          ontologyId: node.id,
          label: node.label,
          family: node.family,
          category: node.category,
          source: "user_preference" as const,
          status: "user_confirmed" as const,
          confidence: 1,
        }]
      : [];
  });
  return {
    reviewVersion: 1,
    inputFingerprint: createProjectInputFingerprint(testCase.project),
    confirmed: true,
    analysis: {
      creativeDna: {
        creativeDnaVersion: 1,
        projectIntent: testCase.project.projectBrief,
        concepts,
        unknownConcepts: testCase.creativeLabels
          .filter((label) => !findExactOntologyConcepts(label)[0])
          .map((raw) => ({
            raw,
            nearestOntologyIds: [],
            source: "user_added" as const,
            status: "user_confirmed" as const,
          })),
        constraints: [],
      },
      retrieval: { candidateCount: 0, backend: "local", fallbackUsed: true },
      capabilityContext: {
        currentExperience: testCase.project.currentExperience,
        requiredApplications: testCase.project.requiredApplications,
      },
      source: "fallback",
      diagnostics: {
        classificationDurationMs: 0,
        retrievedCandidateIds: [],
        acceptedOntologyIds: concepts.flatMap((concept) =>
          concept.ontologyId ? [concept.ontologyId] : [],
        ),
        rejectedOntologyIds: [],
        unknownConceptCount: 0,
        fallbackUsed: true,
      },
    },
  };
}

export async function loadTutorialMatchingBenchmark() {
  return TutorialMatchingBenchmarkSchema.parse(
    JSON.parse(await readFile("evals/tutorial-matching.v1.json", "utf8")),
  );
}

export async function evaluateTutorialMatching() {
  const benchmark = await loadTutorialMatchingBenchmark();
  const results: Array<{ testCase: TutorialMatchingBenchmarkCase; plan: LearningPlan }> = [];
  for (const testCase of benchmark.cases) {
    results.push({
      testCase,
      plan: await matchProjectTutorials(
        { project: testCase.project, review: reviewFor(testCase) },
        {
          provider: new CatalogueTutorialProvider(),
          now: () => new Date("2026-08-16T00:00:00.000Z"),
        },
      ),
    });
  }

  let precisionHits = 0;
  let precisionSlots = 0;
  let recommendations = 0;
  let irrelevant = 0;
  let broad = 0;
  let focused = 0;
  let prerequisiteFits = 0;
  let softwareMatches = 0;
  let languageMatches = 0;
  let verified = 0;
  let expectedSkills = 0;
  let recalledSkills = 0;
  let forbiddenPrerequisites = 0;
  let prerequisiteCount = 0;
  let knownRepetitions = 0;
  let knownChecks = 0;

  for (const { testCase, plan } of results) {
    const gapById = new Map(plan.skillGaps.map((gap, index) => [gap.skillId, { gap, index }]));
    expectedSkills += testCase.expectedSkillIds.length;
    recalledSkills += testCase.expectedSkillIds.filter((id) => gapById.has(id)).length;
    prerequisiteCount += plan.skillGaps.length;
    forbiddenPrerequisites += plan.skillGaps.filter((gap) =>
      testCase.forbiddenSkillIds.includes(gap.skillId),
    ).length;
    knownChecks += testCase.knownSkillIds.length;
    knownRepetitions += testCase.knownSkillIds.filter((id) => {
      const gap = gapById.get(id)?.gap;
      return gap && gap.status !== "known";
    }).length;

    const needById = new Map(plan.tutorialNeeds.map((need) => [need.id, need]));
    const selected = plan.tutorialMatches.flatMap((match) => {
      const candidate = match.candidates.find(
        (item) => item.tutorial.id === match.selectedTutorialId,
      );
      const need = needById.get(match.needId);
      return candidate && need ? [{ candidate, need }] : [];
    });
    precisionSlots += Math.min(3, selected.length);
    for (const { candidate, need } of selected) {
      recommendations += 1;
      const tutorial = candidate.tutorial;
      const relevant =
        tutorial.skillIds.some((id) => need.skillIds.includes(id)) ||
        tutorial.techniqueIds.some((id) => need.techniqueIds.includes(id));
      const software =
        need.softwareIds.length === 0 ||
        tutorial.softwareIds.some((id) => need.softwareIds.includes(id));
      if (!relevant || !software) irrelevant += 1;
      if (selected.indexOf(selected.find((item) => item.candidate === candidate)!) < 3 && relevant && software) {
        precisionHits += 1;
      }
      if (tutorial.tutorialType === "broad_course") broad += 1;
      if (tutorial.tutorialType === "focused") focused += 1;
      if (software) softwareMatches += 1;
      if (
        need.preferredLanguage === "either" ||
        tutorial.language === need.preferredLanguage
      ) {
        languageMatches += 1;
      }
      if (["verified", "indexed"].includes(tutorial.status)) verified += 1;
      const needGapIndex = gapById.get(need.skillIds[0])?.index ?? 999;
      const fits = tutorial.prerequisiteIds.every((id) => {
        const gap = gapById.get(id);
        return !gap || gap.gap.status === "known" || gap.index < needGapIndex;
      });
      if (fits) prerequisiteFits += 1;
    }
  }

  const metrics: TutorialMatchingMetrics = {
    cases: results.length,
    precisionAt3: ratio(precisionHits, precisionSlots),
    irrelevantTutorialRate: ratio(irrelevant, recommendations),
    overTeachingRate: ratio(broad, recommendations),
    skillSpecificity: ratio(focused, recommendations),
    prerequisiteFit: ratio(prerequisiteFits, recommendations),
    softwareCorrectness: ratio(softwareMatches, recommendations),
    languageMatch: ratio(languageMatches, recommendations),
    verifiedTutorialRate: ratio(verified, recommendations),
    requiredSkillRecall: ratio(recalledSkills, expectedSkills),
    unnecessaryPrerequisiteRate: ratio(forbiddenPrerequisites, prerequisiteCount),
    knownSkillRepetitionRate: ratio(knownRepetitions, knownChecks),
  };
  return { benchmark, results, metrics };
}

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatTutorialMatchingMetrics(metrics: TutorialMatchingMetrics): string {
  return [
    "QUANDA skill-gap + tutorial matching evaluation",
    "",
    `Cases: ${metrics.cases}`,
    `Precision@3: ${percentage(metrics.precisionAt3)}`,
    `Irrelevant tutorial rate: ${percentage(metrics.irrelevantTutorialRate)}`,
    `Over-teaching rate: ${percentage(metrics.overTeachingRate)}`,
    `Skill specificity: ${percentage(metrics.skillSpecificity)}`,
    `Prerequisite fit: ${percentage(metrics.prerequisiteFit)}`,
    `Software correctness: ${percentage(metrics.softwareCorrectness)}`,
    `Language match: ${percentage(metrics.languageMatch)}`,
    `Verified tutorial rate: ${percentage(metrics.verifiedTutorialRate)}`,
    `Required skill recall: ${percentage(metrics.requiredSkillRecall)}`,
    `Unnecessary prerequisite rate: ${percentage(metrics.unnecessaryPrerequisiteRate)}`,
    `Known-skill repetition rate: ${percentage(metrics.knownSkillRepetitionRate)}`,
  ].join("\n");
}
