import { describe, expect, it } from "vitest";
import { TutorialDNASchema, TutorialNeedSchema } from "@/src/contracts/knowledge";
import { rankTutorials } from "@/src/tutorial-matching/ranking";

const skillId = "tutorial-content-classification.tutorial-technique.toon-shading";
const need = TutorialNeedSchema.parse({
  tutorialNeedVersion: 1,
  id: `need:${skillId}`,
  label: "Toon shading",
  skillIds: [skillId],
  techniqueIds: [skillId],
  softwareIds: ["blender"],
  prerequisiteIds: [],
  aestheticIds: [],
  outputIds: [],
  productionStageIds: [],
  userLevel: "beginner",
  preferredLanguage: "en",
  preferredDurationMinutes: 25,
  searchQueries: ["Blender toon shading beginner tutorial"],
  priority: "required",
});

function tutorial(input: {
  id: string;
  software?: string;
  type: "focused" | "broad_course";
  duration: number;
  status?: "verified" | "broken";
}) {
  return TutorialDNASchema.parse({
    tutorialMetadataVersion: 1,
    classifierVersion: 1,
    metadataHash: "1234abcd",
    id: input.id,
    provider: "quanda_catalog",
    title: input.id,
    url: `https://example.com/${input.id}`,
    language: "en",
    durationMinutes: input.duration,
    softwareIds: [input.software ?? "blender"],
    softwareVersions: ["5.x"],
    skillIds: [skillId],
    techniqueIds: [skillId],
    prerequisiteIds: [],
    aestheticIds: [],
    productionStageIds: [],
    outputIds: [],
    difficulty: "beginner",
    tutorialType: input.type,
    sourceQuality: 0.9,
    classificationConfidence: 0.95,
    status: input.status ?? "verified",
    learningObjectives: ["Toon shading"],
  });
}

describe("deterministic tutorial ranking", () => {
  it("ranks a focused tutorial above a five-hour broad course", () => {
    const candidates = [
      { tutorial: tutorial({ id: "catalog:broad", type: "broad_course", duration: 300 }), sourceTier: "curated" as const },
      { tutorial: tutorial({ id: "catalog:focused", type: "focused", duration: 15 }), sourceTier: "curated" as const },
    ];
    const ranked = rankTutorials(need, candidates, {
      knownSkillIds: new Set(),
      allowBroadCourse: false,
      today: "2026-08-16",
    });
    expect(ranked.map((item) => item.tutorial.id)).toEqual([
      "catalog:focused",
      "catalog:broad",
    ]);
    expect(ranked[1].breakdown.penalties.broadCourse).toBeLessThan(0);
    expect(rankTutorials(need, candidates, {
      knownSkillIds: new Set(),
      allowBroadCourse: true,
      today: "2026-08-16",
    }).some((item) => item.tutorial.id === "catalog:broad")).toBe(true);
  });

  it("rejects broken resources and strongly penalizes wrong software", () => {
    const ranked = rankTutorials(need, [
      { tutorial: tutorial({ id: "catalog:maya", software: "maya", type: "focused", duration: 15 }), sourceTier: "curated" },
      { tutorial: tutorial({ id: "catalog:broken", type: "focused", duration: 15, status: "broken" }), sourceTier: "curated" },
      { tutorial: tutorial({ id: "catalog:correct", type: "focused", duration: 15 }), sourceTier: "curated" },
    ], { knownSkillIds: new Set(), today: "2026-08-16" });
    expect(ranked.map((item) => item.tutorial.id)).toEqual(["catalog:correct"]);
  });

  it("is stable for identical inputs", () => {
    const candidates = [
      { tutorial: tutorial({ id: "catalog:b", type: "focused", duration: 15 }), sourceTier: "indexed" as const },
      { tutorial: tutorial({ id: "catalog:a", type: "focused", duration: 15 }), sourceTier: "indexed" as const },
    ];
    const context = { knownSkillIds: new Set<string>(), today: "2026-08-16" };
    expect(rankTutorials(need, candidates, context)).toEqual(
      rankTutorials(need, candidates, context),
    );
  });
});
