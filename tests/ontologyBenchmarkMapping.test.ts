import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EvaluationBenchmarkSchema } from "@/src/evaluation/contracts";
import { mapBenchmarkLabelsToOntology } from "@/src/ontology/benchmarkMapping";
import { ontologyArtifact } from "@/src/ontology/runtime";

describe("benchmark ontology mapping", () => {
  it("reports exact, ambiguous, and unknown labels without guessing", async () => {
    const benchmark = EvaluationBenchmarkSchema.parse(
      JSON.parse(
        await readFile(
          resolve(import.meta.dirname, "../evals/briefs.v1.json"),
          "utf8",
        ),
      ),
    );
    const report = mapBenchmarkLabelsToOntology(
      benchmark,
      ontologyArtifact.nodes,
    );

    expect(report.exact).toBeGreaterThan(0);
    expect(report.unknown).toBeGreaterThan(0);
    expect(report.exact + report.ambiguous + report.unknown).toBe(
      report.entries.length,
    );
    expect(
      report.entries
        .filter((entry) => entry.status === "unknown")
        .every((entry) => entry.candidateIds.length === 0),
    ).toBe(true);
    expect(
      report.entries
        .filter((entry) => entry.status === "ambiguous")
        .every((entry) => entry.candidateIds.length > 1),
    ).toBe(true);
  });
});
