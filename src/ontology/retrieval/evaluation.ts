import type { EvaluationBenchmark } from "@/src/evaluation/contracts";
import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import { createOntologyLookup } from "@/src/ontology/lookup";
import { buildOntologyRetrievalQuery } from "@/src/ontology/retrieval/queryBuilder";
import type { HybridOntologyRetriever } from "@/src/ontology/retrieval/hybridRetriever";

export interface OntologyRetrievalEvaluationMetrics {
  cases: number;
  mappedCandidateExpectations: number;
  retrievedCandidateExpectations: number;
  mappedRequiredExpectations: number;
  retrievedRequiredExpectations: number;
  candidateRecall: number;
  requiredConceptRecall: number;
  irrelevantCandidateRate: number;
  averageCandidateCount: number;
  averageFamilyDiversity: number;
  fallbackCases: number;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export async function evaluateOntologyRetrieval(
  benchmark: EvaluationBenchmark,
  retriever: HybridOntologyRetriever,
  nodes: RuntimeOntologyNode[],
): Promise<OntologyRetrievalEvaluationMetrics> {
  const lookup = createOntologyLookup(nodes);
  let mappedCandidateExpectations = 0;
  let retrievedCandidateExpectations = 0;
  let mappedRequiredExpectations = 0;
  let retrievedRequiredExpectations = 0;
  let irrelevantCandidates = 0;
  let totalCandidates = 0;
  let totalFamilyDiversity = 0;
  let fallbackCases = 0;

  for (const benchmarkCase of benchmark.cases) {
    const query = buildOntologyRetrievalQuery({
      projectBrief: benchmarkCase.input.projectBrief,
      currentExperience: benchmarkCase.input.currentExperience,
      requiredApplications: benchmarkCase.input.requiredApplications,
      outputType: benchmarkCase.input.outputType,
      tutorialLanguage: benchmarkCase.input.tutorialLanguage,
    });
    const result = await retriever.searchWithDiagnostics({
      query,
      requiredApplications: benchmarkCase.input.requiredApplications,
      maxResults: 60,
    });
    if (result.diagnostics.fallbackUsed) fallbackCases += 1;
    const retrievedIds = new Set(
      result.candidates.map((candidate) => candidate.id),
    );
    const candidateExpectations = [
      ...benchmarkCase.expected.requiredConcepts,
      ...benchmarkCase.expected.preferredConcepts,
      ...benchmarkCase.expected.acceptableInferredConcepts,
      ...benchmarkCase.expected.acceptableAnyOf.flatMap(
        (group) => group.concepts,
      ),
    ];

    for (const expectation of candidateExpectations) {
      const mapped = lookup.findExactOntologyConcepts(expectation.label);
      if (mapped.length === 0) continue;
      mappedCandidateExpectations += 1;
      if (mapped.some((node) => retrievedIds.has(node.id))) {
        retrievedCandidateExpectations += 1;
      }
    }
    for (const expectation of benchmarkCase.expected.requiredConcepts) {
      const mapped = lookup.findExactOntologyConcepts(expectation.label);
      if (mapped.length === 0) continue;
      mappedRequiredExpectations += 1;
      if (mapped.some((node) => retrievedIds.has(node.id))) {
        retrievedRequiredExpectations += 1;
      }
    }

    const forbiddenIds = new Set(
      benchmarkCase.expected.forbiddenOrIrrelevantConcepts.flatMap(
        (expectation) =>
          lookup
            .findExactOntologyConcepts(expectation.label)
            .map((node) => node.id),
      ),
    );
    irrelevantCandidates += result.candidates.filter((candidate) =>
      forbiddenIds.has(candidate.id),
    ).length;
    totalCandidates += result.candidates.length;
    totalFamilyDiversity += new Set(
      result.candidates.map((candidate) => candidate.family),
    ).size;
  }

  return {
    cases: benchmark.cases.length,
    mappedCandidateExpectations,
    retrievedCandidateExpectations,
    mappedRequiredExpectations,
    retrievedRequiredExpectations,
    candidateRecall: ratio(
      retrievedCandidateExpectations,
      mappedCandidateExpectations,
    ),
    requiredConceptRecall: ratio(
      retrievedRequiredExpectations,
      mappedRequiredExpectations,
    ),
    irrelevantCandidateRate: ratio(irrelevantCandidates, totalCandidates),
    averageCandidateCount: ratio(totalCandidates, benchmark.cases.length),
    averageFamilyDiversity: ratio(
      totalFamilyDiversity,
      benchmark.cases.length,
    ),
    fallbackCases,
  };
}

export function formatOntologyRetrievalEvaluation(
  metrics: OntologyRetrievalEvaluationMetrics,
): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  return [
    "QUANDA ontology retrieval evaluation",
    "",
    `Cases: ${metrics.cases}`,
    `Candidate recall: ${percent(metrics.candidateRecall)} (${metrics.retrievedCandidateExpectations}/${metrics.mappedCandidateExpectations})`,
    `Required-concept recall: ${percent(metrics.requiredConceptRecall)} (${metrics.retrievedRequiredExpectations}/${metrics.mappedRequiredExpectations})`,
    `Irrelevant candidate rate: ${percent(metrics.irrelevantCandidateRate)}`,
    `Average candidate count: ${metrics.averageCandidateCount.toFixed(1)}`,
    `Average family diversity: ${metrics.averageFamilyDiversity.toFixed(1)}`,
    `Fallback cases: ${metrics.fallbackCases}/${metrics.cases}`,
  ].join("\n");
}
