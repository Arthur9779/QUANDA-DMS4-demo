import type {
  EvaluationBenchmark,
  EvaluationPredictionFixture,
} from "@/src/evaluation/contracts";

export interface EvaluationMetrics {
  cases: number;
  recommendations: number;
  applicationCorrectness: number;
  requiredConceptCoverage: number;
  precisionAt3: number;
  irrelevantTutorialRate: number;
  languageMatch: number;
  versionMatch: number;
  prerequisiteFit: number;
  overTeachingRate: number;
  tutorialVerificationRate: number;
  skillSpecificity: number;
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function evaluateBenchmark(
  benchmark: EvaluationBenchmark,
  fixture: EvaluationPredictionFixture,
): EvaluationMetrics {
  const benchmarkById = new Map(
    benchmark.cases.map((benchmarkCase) => [benchmarkCase.id, benchmarkCase]),
  );
  const predictionById = new Map(
    fixture.predictions.map((prediction) => [prediction.caseId, prediction]),
  );
  const missingPredictionIds = benchmark.cases
    .map((benchmarkCase) => benchmarkCase.id)
    .filter((id) => !predictionById.has(id));
  const unknownPredictionIds = fixture.predictions
    .map((prediction) => prediction.caseId)
    .filter((id) => !benchmarkById.has(id));

  if (missingPredictionIds.length > 0) {
    throw new Error(`Missing predictions for: ${missingPredictionIds.join(", ")}`);
  }
  if (unknownPredictionIds.length > 0) {
    throw new Error(`Unknown prediction case IDs: ${unknownPredictionIds.join(", ")}`);
  }

  let expectedApplications = 0;
  let coveredApplications = 0;
  let requiredConcepts = 0;
  let coveredRequiredConcepts = 0;
  let acceptableTopThree = 0;
  let precisionSlots = 0;
  let irrelevantTutorials = 0;
  let tutorialCount = 0;
  let languageMatches = 0;
  let languageChecks = 0;
  let compatibleVersions = 0;
  let versionChecks = 0;
  let prerequisiteFits = 0;
  let prerequisiteChecks = 0;
  let overTeaching = 0;
  let verifiedOrIndexed = 0;
  let skillSpecific = 0;

  for (const benchmarkCase of benchmark.cases) {
    const prediction = predictionById.get(benchmarkCase.id)!;
    const tutorials = [...prediction.tutorials].sort((a, b) => a.rank - b.rank);
    const predictedApplications = new Set(
      tutorials
        .map((tutorial) => tutorial.applicationId)
        .filter((applicationId): applicationId is string => Boolean(applicationId))
        .map(normalize),
    );
    const expectedApplicationIds = new Set(
      benchmarkCase.expected.expectedApplicationIds.map(normalize),
    );
    expectedApplications += expectedApplicationIds.size;
    coveredApplications += [...expectedApplicationIds].filter((id) =>
      predictedApplications.has(id),
    ).length;

    const expectedConcepts = new Set(
      benchmarkCase.expected.requiredConcepts.map((concept) => normalize(concept.label)),
    );
    const coveredConcepts = new Set(
      tutorials.flatMap((tutorial) => tutorial.coveredRequiredConcepts.map(normalize)),
    );
    requiredConcepts += expectedConcepts.size;
    coveredRequiredConcepts += [...expectedConcepts].filter((concept) =>
      coveredConcepts.has(concept),
    ).length;

    acceptableTopThree += tutorials
      .slice(0, 3)
      .filter((tutorial) => tutorial.relevance === "acceptable").length;
    precisionSlots += 3;

    for (const tutorial of tutorials) {
      tutorialCount += 1;
      if (tutorial.relevance === "irrelevant") irrelevantTutorials += 1;
      if (tutorial.overTeaching) overTeaching += 1;
      if (tutorial.skillSpecific) skillSpecific += 1;
      if (["verified", "indexed"].includes(tutorial.verificationStatus)) {
        verifiedOrIndexed += 1;
      }

      if (tutorial.language) {
        languageChecks += 1;
        if (
          benchmarkCase.input.tutorialLanguage === "either" ||
          tutorial.language === benchmarkCase.input.tutorialLanguage
        ) {
          languageMatches += 1;
        }
      }
      if (tutorial.versionCompatible !== null) {
        versionChecks += 1;
        if (tutorial.versionCompatible) compatibleVersions += 1;
      }
      if (tutorial.prerequisiteFit !== null) {
        prerequisiteChecks += 1;
        if (tutorial.prerequisiteFit) prerequisiteFits += 1;
      }
    }
  }

  return {
    cases: benchmark.cases.length,
    recommendations: tutorialCount,
    applicationCorrectness: ratio(coveredApplications, expectedApplications),
    requiredConceptCoverage: ratio(coveredRequiredConcepts, requiredConcepts),
    precisionAt3: ratio(acceptableTopThree, precisionSlots),
    irrelevantTutorialRate: ratio(irrelevantTutorials, tutorialCount),
    languageMatch: ratio(languageMatches, languageChecks),
    versionMatch: ratio(compatibleVersions, versionChecks),
    prerequisiteFit: ratio(prerequisiteFits, prerequisiteChecks),
    overTeachingRate: ratio(overTeaching, tutorialCount),
    tutorialVerificationRate: ratio(verifiedOrIndexed, tutorialCount),
    skillSpecificity: ratio(skillSpecific, tutorialCount),
  };
}

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatEvaluationSummary(
  benchmark: EvaluationBenchmark,
  fixture: EvaluationPredictionFixture,
  metrics: EvaluationMetrics,
): string {
  return [
    `QUANDA Evaluation — benchmark v${benchmark.benchmarkVersion}`,
    `Fixture: ${fixture.name}`,
    "",
    `Cases: ${metrics.cases}`,
    `Recommendations: ${metrics.recommendations}`,
    "",
    `Application correctness: ${percentage(metrics.applicationCorrectness)}`,
    `Required concept coverage: ${percentage(metrics.requiredConceptCoverage)}`,
    `Precision@3: ${percentage(metrics.precisionAt3)}`,
    `Irrelevant tutorial rate: ${percentage(metrics.irrelevantTutorialRate)}`,
    `Language match: ${percentage(metrics.languageMatch)}`,
    `Version match: ${percentage(metrics.versionMatch)}`,
    `Prerequisite fit: ${percentage(metrics.prerequisiteFit)}`,
    `Over-teaching rate: ${percentage(metrics.overTeachingRate)}`,
    `Verified/indexed tutorial rate: ${percentage(metrics.tutorialVerificationRate)}`,
    `Skill specificity: ${percentage(metrics.skillSpecificity)}`,
  ].join("\n");
}
