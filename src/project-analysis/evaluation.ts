import type { EvaluationBenchmark } from "@/src/evaluation/contracts";
import { getApplicationName } from "@/src/data/applications";
import { createOntologyLookup } from "@/src/ontology/lookup";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { ontologyArtifact } from "@/src/ontology/runtime";
import { analyzeProject } from "@/src/project-analysis/analyzeProject";
import type { ProjectAnalysisResponse } from "@/src/project-analysis/contracts";
import { resolveExplicitApplicationConcepts } from "@/src/project-analysis/normalizeCreativeDna";

export interface CreativeDnaEvaluationMetrics {
  cases: number;
  explicitRequirementAccuracy: number;
  requiredConceptPrecision: number;
  requiredConceptRecall: number;
  preferenceSourceAccuracy: number;
  inferencePrecision: number | null;
  unknownTermPreservation: number;
  irrelevantConceptRate: number;
  retrievalMisses: number;
  classificationMisses: number;
  fallbackCases: number;
  expectedExplicitApplications: number;
  correctExplicitApplications: number;
  mappedRequiredConcepts: number;
  retrievedRequiredConcepts: number;
  inferredPredictions: number;
  correctInferences: number;
}

type Analyze = (
  input: Parameters<typeof analyzeProject>[0],
) => Promise<ProjectAnalysisResponse>;

const lookup = createOntologyLookup(ontologyArtifact.nodes);

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function idsFor(label: string, ontologyId?: string): string[] {
  if (ontologyId && lookup.ontologyHasId(ontologyId)) return [ontologyId];
  return lookup.findExactOntologyConcepts(label).map((node) => node.id);
}

export async function evaluateCreativeDna(
  benchmark: EvaluationBenchmark,
  analyze: Analyze = (input) =>
    analyzeProject(input, {
      semantic: false,
      classifier: null,
      logDiagnostics: false,
    }),
): Promise<CreativeDnaEvaluationMetrics> {
  let expectedExplicitApplications = 0;
  let correctExplicitApplications = 0;
  let mappedRequiredConcepts = 0;
  let retrievedRequiredConcepts = 0;
  let explicitPredictions = 0;
  let correctExplicitPredictions = 0;
  let mappedPreferences = 0;
  let correctPreferences = 0;
  let inferredPredictions = 0;
  let correctInferences = 0;
  let expectedUnknowns = 0;
  let preservedUnknowns = 0;
  let forbiddenPredictions = 0;
  let totalPredictions = 0;
  let retrievalMisses = 0;
  let classificationMisses = 0;
  let fallbackCases = 0;

  for (const benchmarkCase of benchmark.cases) {
    const result = await analyze({
      interfaceLanguage: benchmarkCase.locale,
      projectBrief: benchmarkCase.input.projectBrief,
      currentExperience: benchmarkCase.input.currentExperience,
      requiredApplications: benchmarkCase.input.requiredApplications,
      outputType: benchmarkCase.input.outputType,
      targetQuality: "portfolio",
      tutorialLanguage: benchmarkCase.input.tutorialLanguage,
    });
    if (result.source === "fallback") fallbackCases += 1;
    const predictedById = new Map(
      result.creativeDna.concepts.flatMap((concept) =>
        concept.ontologyId ? [[concept.ontologyId, concept] as const] : [],
      ),
    );
    const predictedIds = new Set(predictedById.keys());
    const retrievedIds = new Set(result.diagnostics.retrievedCandidateIds);

    const applicationResolutions = resolveExplicitApplicationConcepts(
      benchmarkCase.input.requiredApplications,
    );
    for (const resolution of applicationResolutions) {
      expectedExplicitApplications += 1;
      if (
        resolution.node &&
        predictedById.get(resolution.node.id)?.source === "explicit_requirement"
      ) {
        correctExplicitApplications += 1;
      } else if (
        !resolution.node &&
        result.creativeDna.unknownConcepts.some(
          (unknown) =>
            unknown.source === "explicit_requirement" &&
            [resolution.application, getApplicationName(resolution.application)]
              .map(normalizeOntologyLabel)
              .includes(normalizeOntologyLabel(unknown.raw)),
        )
      ) {
        correctExplicitApplications += 1;
      }
    }

    const requiredIds = new Set<string>();
    for (const expectation of benchmarkCase.expected.requiredConcepts) {
      const ids = idsFor(expectation.label, expectation.ontologyId);
      if (ids.length === 0) continue;
      ids.forEach((id) => requiredIds.add(id));
      mappedRequiredConcepts += 1;
      if (ids.some((id) => predictedIds.has(id))) {
        retrievedRequiredConcepts += 1;
      }
    }
    for (const resolution of applicationResolutions) {
      if (resolution.node) requiredIds.add(resolution.node.id);
    }

    for (const concept of result.creativeDna.concepts) {
      if (!concept.ontologyId) continue;
      totalPredictions += 1;
      if (concept.source === "explicit_requirement") {
        explicitPredictions += 1;
        if (requiredIds.has(concept.ontologyId)) correctExplicitPredictions += 1;
      }
    }

    for (const expectation of benchmarkCase.expected.preferredConcepts) {
      const ids = idsFor(expectation.label, expectation.ontologyId);
      if (ids.length === 0) continue;
      mappedPreferences += 1;
      if (
        ids.some(
          (id) => predictedById.get(id)?.source === "user_preference",
        )
      ) {
        correctPreferences += 1;
      }
    }

    const acceptableInferenceIds = new Set(
      [
        ...benchmarkCase.expected.requiredConcepts,
        ...benchmarkCase.expected.preferredConcepts,
        ...benchmarkCase.expected.acceptableInferredConcepts,
        ...benchmarkCase.expected.acceptableAnyOf.flatMap(
          (group) => group.concepts,
        ),
      ].flatMap((expectation) =>
        idsFor(expectation.label, expectation.ontologyId),
      ),
    );
    for (const concept of result.creativeDna.concepts) {
      if (concept.source !== "ai_inferred" || !concept.ontologyId) continue;
      inferredPredictions += 1;
      if (acceptableInferenceIds.has(concept.ontologyId)) correctInferences += 1;
    }

    for (const expectedUnknown of benchmarkCase.expected.preserveAsUnknown) {
      expectedUnknowns += 1;
      if (
        result.creativeDna.unknownConcepts.some((unknown) =>
          normalizeOntologyLabel(unknown.raw).includes(
            normalizeOntologyLabel(expectedUnknown),
          ),
        )
      ) {
        preservedUnknowns += 1;
      }
    }

    const forbiddenIds = new Set(
      benchmarkCase.expected.forbiddenOrIrrelevantConcepts.flatMap(
        (expectation) => idsFor(expectation.label, expectation.ontologyId),
      ),
    );
    forbiddenPredictions += [...predictedIds].filter((id) =>
      forbiddenIds.has(id),
    ).length;

    const relevantExpectations = [
      ...benchmarkCase.expected.requiredConcepts,
      ...benchmarkCase.expected.preferredConcepts,
      ...benchmarkCase.expected.acceptableInferredConcepts,
    ];
    for (const expectation of relevantExpectations) {
      const ids = idsFor(expectation.label, expectation.ontologyId);
      if (ids.length === 0 || ids.some((id) => predictedIds.has(id))) continue;
      if (ids.some((id) => retrievedIds.has(id))) classificationMisses += 1;
      else retrievalMisses += 1;
    }
  }

  return {
    cases: benchmark.cases.length,
    explicitRequirementAccuracy: ratio(
      correctExplicitApplications,
      expectedExplicitApplications,
    ),
    requiredConceptPrecision: ratio(
      correctExplicitPredictions,
      explicitPredictions,
    ),
    requiredConceptRecall: ratio(
      retrievedRequiredConcepts,
      mappedRequiredConcepts,
    ),
    preferenceSourceAccuracy: ratio(correctPreferences, mappedPreferences),
    inferencePrecision:
      inferredPredictions === 0
        ? null
        : ratio(correctInferences, inferredPredictions),
    unknownTermPreservation: ratio(preservedUnknowns, expectedUnknowns),
    irrelevantConceptRate: ratio(forbiddenPredictions, totalPredictions),
    retrievalMisses,
    classificationMisses,
    fallbackCases,
    expectedExplicitApplications,
    correctExplicitApplications,
    mappedRequiredConcepts,
    retrievedRequiredConcepts,
    inferredPredictions,
    correctInferences,
  };
}

export function formatCreativeDnaEvaluation(
  metrics: CreativeDnaEvaluationMetrics,
): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  return [
    "QUANDA Creative DNA evaluation",
    "",
    `Cases: ${metrics.cases}`,
    `Explicit requirement accuracy: ${percent(metrics.explicitRequirementAccuracy)} (${metrics.correctExplicitApplications}/${metrics.expectedExplicitApplications})`,
    `Required concept precision: ${percent(metrics.requiredConceptPrecision)}`,
    `Required concept recall: ${percent(metrics.requiredConceptRecall)} (${metrics.retrievedRequiredConcepts}/${metrics.mappedRequiredConcepts})`,
    `Preference source accuracy: ${percent(metrics.preferenceSourceAccuracy)}`,
    `Inference precision: ${metrics.inferencePrecision === null ? "N/A (no AI in offline fallback)" : `${percent(metrics.inferencePrecision)} (${metrics.correctInferences}/${metrics.inferredPredictions})`}`,
    `Unknown-term preservation: ${percent(metrics.unknownTermPreservation)}`,
    `Irrelevant concept rate: ${percent(metrics.irrelevantConceptRate)}`,
    `Retrieval misses: ${metrics.retrievalMisses}`,
    `Classification misses: ${metrics.classificationMisses}`,
    `Fallback cases: ${metrics.fallbackCases}/${metrics.cases}`,
  ].join("\n");
}
