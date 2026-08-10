import { describe, expect, it } from "vitest";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import { normalizeRoadmap } from "@/src/lib/normalizeRoadmap";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import type { RoadmapRequest } from "@/src/types";
import {
  createCustomApplicationId,
  getApplicationName,
} from "@/src/data/applications";

function illustratorRequest(): RoadmapRequest {
  return {
    interfaceLanguage: "en",
    projectBrief:
      "Create a clean vector logo and icon set in Adobe Illustrator for a student brand project.",
    deadline: "2026-08-20",
    currentExperience: "Complete beginner in Adobe Illustrator",
    hoursPerDay: 2,
    daysPerWeek: 5,
    tutorialLanguage: "either",
    requiredApplications: ["illustrator"],
    outputType: "graphic",
    targetQuality: "basic",
  };
}

describe("application-aware roadmaps", () => {
  it("builds an Illustrator fallback without unrelated applications", () => {
    const request = illustratorRequest();
    const roadmap = createSampleRoadmap(request);
    const applicationIds = roadmap.stages
      .map((stage) => stage.applicationId)
      .filter(Boolean);
    const tutorialIds = roadmap.stages.flatMap((stage) => stage.tutorialIds);

    expect(roadmap.title).toContain("Illustrator");
    expect(new Set(applicationIds)).toEqual(new Set(["illustrator"]));
    expect(tutorialIds.length).toBeGreaterThan(0);
    expect(tutorialIds.every((id) => id.startsWith("illustrator-"))).toBe(true);
  });

  it("removes an AI-selected application that the user did not choose", () => {
    const request = illustratorRequest();
    const fallback = createSampleRoadmap(request);
    const malformed = {
      ...fallback,
      stages: fallback.stages.map((stage, index) =>
        index === 0
          ? {
              ...stage,
              applicationId: "blender",
              tutorialIds: ["blender-2026-course-en"],
            }
          : stage,
      ),
    };

    const normalized = normalizeRoadmap(malformed, request);
    expect(normalized.stages[0].applicationId).toBeNull();
    expect(normalized.stages[0].tutorialIds).toEqual([]);
  });

  it("rejects unknown application IDs at the API boundary", () => {
    expect(
      RoadmapRequestSchema.safeParse({
        ...illustratorRequest(),
        requiredApplications: ["unknown-editor"],
      }).success,
    ).toBe(false);
  });

  it("accepts a named Other application without substituting another tool", () => {
    const customApplicationId = createCustomApplicationId("Cinema 4D");
    const request = {
      ...illustratorRequest(),
      projectBrief:
        "Create a short product animation in Cinema 4D for a university assignment.",
      requiredApplications: [customApplicationId],
      outputType: "3d" as const,
    };

    expect(RoadmapRequestSchema.safeParse(request).success).toBe(true);
    expect(getApplicationName(customApplicationId)).toBe("Cinema 4D");

    const roadmap = createSampleRoadmap(request);
    expect(roadmap.title).toContain("Cinema 4D");
    expect(
      roadmap.stages
        .map((roadmapStage) => roadmapStage.applicationId)
        .filter(Boolean),
    ).toEqual(expect.arrayContaining([customApplicationId]));
    expect(roadmap.stages.flatMap((roadmapStage) => roadmapStage.tutorialIds))
      .toEqual([]);
  });

  it("restores an explicit custom application name if the AI omits its internal prefix", () => {
    const customApplicationId = createCustomApplicationId("Visual Studio Code");
    const request = {
      ...illustratorRequest(),
      projectBrief:
        "Build and test a small TypeScript web application in Visual Studio Code.",
      currentExperience: "Beginner with TypeScript and Visual Studio Code",
      requiredApplications: [customApplicationId],
      outputType: "other" as const,
    };
    const fallback = createSampleRoadmap(request);
    const malformed = {
      ...fallback,
      stages: fallback.stages.map((roadmapStage, index) =>
        index === 0
          ? { ...roadmapStage, applicationId: "Visual Studio Code" }
          : roadmapStage,
      ),
    };

    const normalized = normalizeRoadmap(malformed, request);
    expect(normalized.stages[0].applicationId).toBe(customApplicationId);
    expect(getApplicationName(normalized.stages[0].applicationId!)).toBe(
      "Visual Studio Code",
    );
    expect(normalized.stages.flatMap((roadmapStage) => roadmapStage.tutorialIds))
      .toEqual([]);
  });
});
