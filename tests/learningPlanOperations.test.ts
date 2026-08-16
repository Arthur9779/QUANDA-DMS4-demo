import { describe, expect, it } from "vitest";
import { LearningPlanSchema } from "@/src/tutorial-matching/contracts";
import { markSkillGap, replaceTutorial } from "@/src/tutorial-matching/matchProject";

const skillId = "tutorial-content-classification.tutorial-technique.toon-shading";
const plan = LearningPlanSchema.parse({
  learningPlanVersion: 1,
  tutorialRankingVersion: 1,
  inputFingerprint: "12ab34cd",
  source: "catalogue",
  createdAt: "2026-08-16T00:00:00.000Z",
  skillGaps: [{
    skillGapVersion: 1,
    id: `gap:${skillId}`,
    skillId,
    label: "Toon shading",
    relatedTechniqueIds: [skillId],
    softwareIds: ["blender"],
    status: "needs_learning",
    reason: "Required by the project.",
    prerequisiteSkillIds: [],
    priority: "required",
    estimatedLearningMinutes: 15,
  }],
  tutorialNeeds: [{
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
    preferredLanguage: "en",
    searchQueries: ["Blender toon shading"],
    priority: "required",
    status: "active",
  }],
  tutorialMatches: [{
    needId: `need:${skillId}`,
    selectedTutorialId: "catalog:first",
    rejectedTutorialIds: [],
    feedback: "none",
    candidates: ["first", "second"].map((id, index) => ({
      tutorial: {
        tutorialMetadataVersion: 1,
        classifierVersion: 1,
        metadataHash: index ? "1234abce" : "1234abcd",
        id: `catalog:${id}`,
        provider: "quanda_catalog",
        title: id,
        url: `https://example.com/${id}`,
        softwareIds: ["blender"],
        softwareVersions: [],
        skillIds: [skillId],
        techniqueIds: [skillId],
        prerequisiteIds: [],
        aestheticIds: [],
        productionStageIds: [],
        outputIds: [],
        tutorialType: "focused",
        status: "verified",
        learningObjectives: ["Toon shading"],
      },
      sourceTier: "curated",
      score: 90 - index,
      why: "Focused match.",
      breakdown: {
        skill: 24, technique: 18, software: 10, prerequisiteFit: 9,
        output: 0, sourceQuality: 7, userLevel: 6, language: 5,
        version: 2, specificity: 4, recency: 2, aesthetic: 0,
        classification: 0,
        penalties: { softwareMismatch: 0, prerequisiteMismatch: 0, broadCourse: 0, duration: 0, stale: 0, unverified: 0 },
      },
    })),
  }],
});

describe("learning-plan corrections", () => {
  it("removes a tutorial need when the user already knows the skill", () => {
    const updated = markSkillGap(plan, skillId, "known");
    expect(updated.skillGaps[0].status).toBe("known");
    expect(updated.tutorialNeeds[0].status).toBe("known");
    expect(updated.tutorialMatches[0].selectedTutorialId).toBeNull();
  });

  it("replaces a tutorial without returning the rejected resource", () => {
    const updated = replaceTutorial(plan, `need:${skillId}`);
    expect(updated.tutorialMatches[0].selectedTutorialId).toBe("catalog:second");
    expect(updated.tutorialMatches[0].rejectedTutorialIds).toContain("catalog:first");
  });
});
