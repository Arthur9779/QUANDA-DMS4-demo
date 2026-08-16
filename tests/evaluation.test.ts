import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EvaluationBenchmarkSchema,
  EvaluationPredictionFixtureSchema,
} from "@/src/evaluation/contracts";
import { evaluateBenchmark } from "@/src/evaluation/metrics";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

const benchmarkCase = {
  id: "metric-case",
  locale: "en" as const,
  disciplines: ["3D"],
  input: {
    projectBrief: "Create a focused toon-shaded animation in Blender for assessment.",
    currentExperience: "Intermediate Blender user.",
    requiredApplications: ["blender"],
    outputType: "video",
    tutorialLanguage: "en" as const,
    softwareVersions: [],
  },
  expected: {
    requiredConcepts: [{ label: "toon shading" }, { label: "camera animation" }],
    preferredConcepts: [],
    acceptableInferredConcepts: [],
    acceptableAnyOf: [],
    forbiddenOrIrrelevantConcepts: [{ label: "character rigging" }],
    preserveAsUnknown: [],
    expectedApplicationIds: ["blender"],
    acceptableTutorialTopics: ["toon shading"],
    irrelevantTutorialTopics: ["character rigging"],
    acceptablePrerequisiteConcepts: [],
    irrelevantPrerequisiteConcepts: ["navigation"],
  },
};

describe("evaluation baseline", () => {
  it("validates the 25-case bilingual benchmark", () => {
    const benchmark = EvaluationBenchmarkSchema.parse(
      readJson("evals/briefs.v1.json"),
    );

    expect(benchmark.cases).toHaveLength(25);
    expect(benchmark.cases.filter((item) => item.locale === "vi")).toHaveLength(7);
    expect(
      benchmark.cases.find((item) => item.id === "vi-p5-audio-visualizer")
        ?.input.projectBrief,
    ).toContain("p5.js");
  });

  it("validates the complete naive prediction fixture", () => {
    const fixture = EvaluationPredictionFixtureSchema.parse(
      readJson("evals/fixtures/naive-software-first.json"),
    );

    expect(fixture.predictions).toHaveLength(25);
  });

  it("calculates precision, irrelevance, coverage, and language match", () => {
    const benchmark = EvaluationBenchmarkSchema.parse({
      benchmarkVersion: 1,
      name: "Metric calculation fixture",
      cases: [benchmarkCase],
    });
    const fixture = EvaluationPredictionFixtureSchema.parse({
      predictionFixtureVersion: 1,
      name: "Metric predictions",
      benchmarkVersion: 1,
      predictions: [{
        caseId: "metric-case",
        tutorials: [
          {
            id: "focused-toon", title: "Focused toon shading", rank: 1,
            applicationId: "blender", language: "en", versionCompatible: true,
            prerequisiteFit: true, relevance: "acceptable", verificationStatus: "verified",
            tutorialType: "focused", coveredRequiredConcepts: ["toon shading"],
            overTeaching: false, skillSpecific: true,
          },
          {
            id: "camera-basics", title: "Camera animation basics", rank: 2,
            applicationId: "blender", language: "en", versionCompatible: true,
            prerequisiteFit: true, relevance: "acceptable", verificationStatus: "indexed",
            tutorialType: "focused", coveredRequiredConcepts: [],
            overTeaching: false, skillSpecific: true,
          },
          {
            id: "wrong-rigging", title: "Character rigging", rank: 3,
            applicationId: "blender", language: "vi", versionCompatible: false,
            prerequisiteFit: false, relevance: "irrelevant", verificationStatus: "unverified",
            tutorialType: "broad_course", coveredRequiredConcepts: [],
            overTeaching: true, skillSpecific: false,
          },
        ],
      }],
    });

    const metrics = evaluateBenchmark(benchmark, fixture);

    expect(metrics.applicationCorrectness).toBe(1);
    expect(metrics.requiredConceptCoverage).toBe(0.5);
    expect(metrics.precisionAt3).toBeCloseTo(2 / 3);
    expect(metrics.irrelevantTutorialRate).toBeCloseTo(1 / 3);
    expect(metrics.languageMatch).toBeCloseTo(2 / 3);
    expect(metrics.versionMatch).toBeCloseTo(2 / 3);
    expect(metrics.prerequisiteFit).toBeCloseTo(2 / 3);
    expect(metrics.overTeachingRate).toBeCloseTo(1 / 3);
  });

  it("detects over-teaching in the naive software-first fixture", () => {
    const benchmark = EvaluationBenchmarkSchema.parse(
      readJson("evals/briefs.v1.json"),
    );
    const fixture = EvaluationPredictionFixtureSchema.parse(
      readJson("evals/fixtures/naive-software-first.json"),
    );
    const metrics = evaluateBenchmark(benchmark, fixture);

    expect(metrics.overTeachingRate).toBeGreaterThan(0.5);
    expect(metrics.skillSpecificity).toBeLessThan(0.5);
  });
});
