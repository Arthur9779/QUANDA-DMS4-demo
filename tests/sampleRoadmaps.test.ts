import { describe, expect, it } from "vitest";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import { normalizeRoadmap } from "@/src/lib/normalizeRoadmap";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import type { RoadmapRequest } from "@/src/types";

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
});
