import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { EvaluationBenchmarkSchema } from "@/src/evaluation/contracts";
import { evaluateCreativeDna } from "@/src/project-analysis/evaluation";

describe("Creative DNA benchmark", () => {
  it("evaluates all PR 0 cases without live providers", async () => {
    const benchmark = EvaluationBenchmarkSchema.parse(
      JSON.parse(await readFile("evals/briefs.v1.json", "utf8")),
    );
    const metrics = await evaluateCreativeDna(benchmark);
    expect(metrics.cases).toBe(25);
    expect(metrics.fallbackCases).toBe(25);
    expect(metrics.explicitRequirementAccuracy).toBeGreaterThanOrEqual(0.9);
    expect(metrics.unknownTermPreservation).toBe(1);
    expect(metrics.irrelevantConceptRate).toBeLessThanOrEqual(0.1);
    expect(metrics.requiredConceptRecall).toBeGreaterThan(0);
  });
});
