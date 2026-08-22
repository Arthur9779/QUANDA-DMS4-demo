import { describe, expect, it } from "vitest";
import type { CreativeDNA, SkillGap, TutorialNeed } from "@/src/contracts/knowledge";
import {
  createIntegratedFallback,
  validateRoadmapForInput,
  type RoadmapGenerationInput,
  type SelectedTutorial,
} from "@/src/roadmap";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";

const knownSkill: SkillGap = {
  skillGapVersion: 1,
  id: "gap-known",
  skillId: "web.javascript-basics",
  label: "Minimal JavaScript basics",
  relatedTechniqueIds: [],
  softwareIds: ["custom:p5.js"],
  status: "known",
  reason: "User confirmed this skill.",
  prerequisiteSkillIds: [],
  priority: "required",
  estimatedLearningMinutes: 15,
};

const missingSkill: SkillGap = {
  skillGapVersion: 1,
  id: "gap-audio",
  skillId: "web.audio-fft",
  label: "Audio input and FFT",
  relatedTechniqueIds: ["web.audio-fft"],
  softwareIds: ["custom:p5.js"],
  status: "needs_learning",
  reason: "The interactive poster must react to music.",
  prerequisiteSkillIds: [],
  priority: "required",
  estimatedLearningMinutes: 20,
};

const need: TutorialNeed = {
  tutorialNeedVersion: 1,
  id: "need-audio",
  label: "Audio input and FFT",
  skillIds: [missingSkill.skillId],
  techniqueIds: ["web.audio-fft"],
  softwareIds: ["custom:p5.js"],
  prerequisiteIds: [],
  aestheticIds: [],
  outputIds: [],
  productionStageIds: [],
  preferredLanguage: "en",
  searchQueries: ["p5.js audio FFT"],
  priority: "required",
  status: "active",
};

const selectedTutorial = {
  needId: need.id,
  tutorial: {
    tutorialMetadataVersion: 1,
    classifierVersion: 1,
    metadataHash: "1234abcd",
    id: "tutorial:p5-audio-fft",
    provider: "quanda_catalog",
    title: "p5.js audio FFT",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    language: "en",
    durationMinutes: 12,
    softwareIds: ["custom:p5.js"],
    softwareVersions: [],
    skillIds: [missingSkill.skillId],
    techniqueIds: ["web.audio-fft"],
    prerequisiteIds: [],
    aestheticIds: [],
    productionStageIds: [],
    outputIds: [],
    status: "verified",
    learningObjectives: ["Connect audio FFT to a p5.js sketch"],
  },
  sourceTier: "curated",
  score: 98,
  breakdown: {},
  why: "Specific verified match.",
} as unknown as SelectedTutorial;

function input(overrides: Partial<RoadmapGenerationInput> = {}): RoadmapGenerationInput {
  const creativeDna: CreativeDNA = {
    creativeDnaVersion: 1,
    projectIntent: "A neo-y2k eco-rave poster that reacts to music.",
    concepts: [
      { ontologyId: "creative.y2k", label: "Y2K", source: "user_added", status: "user_confirmed" },
      { ontologyId: "creative.generic", label: "Generic corporate", source: "ai_inferred", status: "user_rejected" },
    ],
    unknownConcepts: [{ raw: "neo-y2k eco-rave", nearestOntologyIds: [], source: "user_added", status: "user_confirmed" }],
    constraints: [],
  };
  return {
    projectInput: {
      interfaceLanguage: "en",
      projectBrief: "Create a Bauhaus poster where geometric shapes react to music using p5.js.",
      deadline: "2026-08-17",
      currentExperience: "I know basic JavaScript but have never used p5.js audio.",
      hoursPerDay: 1,
      daysPerWeek: 1,
      tutorialLanguage: "en",
      requiredApplications: ["custom:p5.js"],
      outputType: "other",
      targetQuality: "portfolio",
    },
    creativeDna,
    userCapabilities: [knownSkill],
    skillGaps: [knownSkill, missingSkill],
    tutorialNeeds: [need],
    selectedTutorials: [selectedTutorial],
    constraints: [],
    ontologyVersion: 1,
    inputFingerprint: "1234abcd",
    ...overrides,
  };
}

describe("project-oriented roadmap integration", () => {
  it("uses only selected tutorials, preserves a custom tool, and keeps learning separate", () => {
    const roadmap = createIntegratedFallback(input());
    const tutorialIds = roadmap.stages.flatMap((stage) => stage.tutorialIds);
    expect(tutorialIds).toEqual(["tutorial:p5-audio-fft"]);
    expect(roadmap.stages.some((stage) => stage.applicationId === "custom:p5.js")).toBe(true);
    expect(roadmap.stages.every((stage) => stage.productionTasks?.length)).toBe(true);
    expect(roadmap.stages.every((stage) => stage.definitionOfDone?.length)).toBe(true);
    expect(roadmap.stages.flatMap((stage) => stage.skillIds ?? [])).not.toContain(knownSkill.skillId);
  });

  it("keeps the deterministic roadmap inside the eight-stage response contract", () => {
    const roadmap = createIntegratedFallback(input({
      projectInput: {
        ...input().projectInput,
        requiredApplications: ["blender", "after-effects", "premiere-pro"],
      },
      skillGaps: [
        knownSkill,
        ...Array.from({ length: 8 }, (_, index) => ({
          ...missingSkill,
          id: `gap-${index}`,
          skillId: `skill-${index}`,
          label: `Required skill ${index}`,
          softwareIds: ["blender"],
        })),
      ],
    }));
    expect(roadmap.stages.length).toBeLessThanOrEqual(8);
    expect(RoadmapResponseSchema.safeParse(roadmap).success).toBe(true);
  });

  it("preserves unknown confirmed wording and flags an infeasible deadline", () => {
    const roadmap = createIntegratedFallback(input());
    expect(roadmap.summary).toContain("neo-y2k eco-rave");
    expect(roadmap.feasibility.status).toBe("unrealistic");
    expect(roadmap.warnings.join(" ")).toContain("exceeds the available time");
  });

  it("rejects invented tutorials, rejected concepts, and known-skill teaching", () => {
    const roadmap = createIntegratedFallback(input());
    const invalid = {
      ...roadmap,
      stages: roadmap.stages.map((stage, index) => index === 0
        ? { ...stage, tutorialIds: ["youtube:invented"], skillIds: [knownSkill.skillId], creativeDnaIds: ["creative.generic"] }
        : stage),
    };
    expect(validateRoadmapForInput(invalid, input())).toEqual(expect.arrayContaining([
      expect.stringContaining("was not selected"),
      expect.stringContaining("Known skill"),
      expect.stringContaining("Rejected creative concept"),
    ]));
  });
});
