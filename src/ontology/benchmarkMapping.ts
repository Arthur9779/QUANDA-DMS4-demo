import type { EvaluationBenchmark } from "@/src/evaluation/contracts";
import type { RuntimeOntologyNode } from "@/src/ontology/contracts";
import { createOntologyLookup } from "@/src/ontology/lookup";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

export type BenchmarkOntologyMappingStatus = "exact" | "ambiguous" | "unknown";

export interface BenchmarkOntologyMappingEntry {
  label: string;
  status: BenchmarkOntologyMappingStatus;
  candidateIds: string[];
}

export interface BenchmarkOntologyMappingReport {
  exact: number;
  ambiguous: number;
  unknown: number;
  entries: BenchmarkOntologyMappingEntry[];
}

export function collectBenchmarkOntologyLabels(
  benchmark: EvaluationBenchmark,
): string[] {
  const labels = new Map<string, string>();
  for (const benchmarkCase of benchmark.cases) {
    const expectations = [
      ...benchmarkCase.expected.requiredConcepts,
      ...benchmarkCase.expected.preferredConcepts,
      ...benchmarkCase.expected.acceptableInferredConcepts,
      ...benchmarkCase.expected.forbiddenOrIrrelevantConcepts,
      ...benchmarkCase.expected.acceptableAnyOf.flatMap((group) => group.concepts),
    ];
    for (const expectation of expectations) {
      const normalized = normalizeOntologyLabel(expectation.label);
      if (!labels.has(normalized)) labels.set(normalized, expectation.label);
    }
  }
  return [...labels.values()].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

export function mapBenchmarkLabelsToOntology(
  benchmark: EvaluationBenchmark,
  nodes: RuntimeOntologyNode[],
): BenchmarkOntologyMappingReport {
  const lookup = createOntologyLookup(nodes);
  const entries = collectBenchmarkOntologyLabels(benchmark).map((label) => {
    const candidates = lookup.findExactOntologyConcepts(label);
    const status: BenchmarkOntologyMappingStatus =
      candidates.length === 0
        ? "unknown"
        : candidates.length === 1
          ? "exact"
          : "ambiguous";
    return {
      label,
      status,
      candidateIds: candidates.map((candidate) => candidate.id),
    };
  });

  return {
    exact: entries.filter((entry) => entry.status === "exact").length,
    ambiguous: entries.filter((entry) => entry.status === "ambiguous").length,
    unknown: entries.filter((entry) => entry.status === "unknown").length,
    entries,
  };
}
