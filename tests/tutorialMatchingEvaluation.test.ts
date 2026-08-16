import { describe, expect, it } from "vitest";
import { evaluateTutorialMatching } from "@/src/tutorial-matching/evaluation";

describe("PR 5 tutorial matching benchmark", () => {
  it("improves the critical precision and over-teaching metrics offline", async () => {
    const { metrics } = await evaluateTutorialMatching();
    expect(metrics.cases).toBe(6);
    expect(metrics.precisionAt3).toBeGreaterThanOrEqual(0.9);
    expect(metrics.irrelevantTutorialRate).toBe(0);
    expect(metrics.overTeachingRate).toBeLessThan(0.4);
    expect(metrics.softwareCorrectness).toBe(1);
    expect(metrics.requiredSkillRecall).toBe(1);
    expect(metrics.knownSkillRepetitionRate).toBe(0);
  }, 10_000);
});
