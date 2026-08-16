import { describe, expect, it } from "vitest";
import { deriveSkillGaps, buildTutorialNeeds } from "@/src/tutorial-matching/skillGap";
import type { CreativeDNA } from "@/src/contracts/knowledge";
import type { RoadmapRequest } from "@/src/types";

function project(overrides: Partial<RoadmapRequest> = {}): RoadmapRequest {
  return {
    interfaceLanguage: "en",
    projectBrief: "I am new to Blender and need a toon-shaded product animation with a simple camera move.",
    deadline: "2026-09-30",
    currentExperience: "Blender: complete beginner",
    hoursPerDay: 2,
    daysPerWeek: 5,
    tutorialLanguage: "en",
    requiredApplications: ["blender"],
    outputType: "video",
    targetQuality: "portfolio",
    ...overrides,
  };
}

function creativeDna(intent: string): CreativeDNA {
  return {
    creativeDnaVersion: 1,
    projectIntent: intent,
    concepts: [],
    unknownConcepts: [],
    constraints: [],
  };
}

describe("contextual skill-gap analysis", () => {
  it("creates a minimum, deduplicated prerequisite chain for a Blender beginner", () => {
    const gaps = deriveSkillGaps(project(), creativeDna("Toon-shaded product animation"));
    expect(gaps.map((gap) => gap.label)).toEqual([
      "Basic viewport navigation",
      "Shader Editor and material basics",
      "Toon shading",
      "Camera basics",
      "Camera animation",
    ]);
    expect(new Set(gaps.map((gap) => gap.skillId)).size).toBe(gaps.length);
    expect(buildTutorialNeeds(project(), creativeDna("Toon shading"), gaps))
      .toHaveLength(gaps.length);
  });

  it("does not repeat explicitly known navigation or materials", () => {
    const gaps = deriveSkillGaps(
      project({
        currentExperience: "I know Blender modelling, navigation and materials at an intermediate level.",
      }),
      creativeDna("Toon-shaded product animation"),
    );
    expect(gaps.find((gap) => gap.label === "Basic viewport navigation")?.status)
      .toBe("known");
    expect(gaps.find((gap) => gap.label === "Shader Editor and material basics")?.status)
      .toBe("known");
    expect(gaps.find((gap) => gap.label === "Toon shading")?.status)
      .toBe("needs_learning");
  });

  it("does not expand a creative-coding brief into unrelated web development", () => {
    const codingProject = project({
      projectBrief: "Make a Bauhaus poster where shapes react to music using p5.js.",
      currentExperience: "I know Illustrator but have never coded.",
      requiredApplications: ["custom:p5.js"],
      outputType: "other",
    });
    const gaps = deriveSkillGaps(codingProject, creativeDna(codingProject.projectBrief));
    expect(gaps.map((gap) => gap.label)).toEqual([
      "Minimal JavaScript basics",
      "p5.js canvas and drawing basics",
      "Audio input and FFT",
      "Animation loop",
    ]);
    expect(gaps.some((gap) => /React|database|authentication/i.test(gap.label)))
      .toBe(false);
  });
});
