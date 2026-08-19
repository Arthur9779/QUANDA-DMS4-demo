import { describe, expect, it } from "vitest";
import { buildRouteEvidence } from "@/src/roadmap/routeEvidence";
import type { RoadmapRequest } from "@/src/types";

const baseRequest: RoadmapRequest = {
  interfaceLanguage: "en",
  projectBrief: "Create a short creative project for a university assignment with a final export.",
  deadline: "2099-01-01",
  currentExperience: "",
  hoursPerDay: 2,
  daysPerWeek: 6,
  tutorialLanguage: "either",
  requiredApplications: [],
  outputType: "video",
  targetQuality: "basic",
};

describe("route evidence", () => {
  it("keeps a selected required application and records alternatives", () => {
    const evidence = buildRouteEvidence({
      ...baseRequest,
      requiredApplications: ["blender"],
      currentExperience: "Photoshop: intermediate; Blender: complete beginner",
    });
    expect(evidence.primaryApplicationId).toBe("blender");
    expect(evidence.primaryReasonCode).toBe("required-tool");
    expect(evidence.routes.some((route) => route.status === "rejected")).toBe(true);
    expect(evidence.selectedTechnique).toContain("animation");
  });

  it("prefers a known viable application when none is required", () => {
    const evidence = buildRouteEvidence({
      ...baseRequest,
      outputType: "graphic",
      currentExperience: "Photoshop: intermediate",
    });
    expect(evidence.primaryApplicationId).toBe("photoshop");
    expect(evidence.primaryReasonCode).toBe("existing-tool");
    expect(evidence.skippedLearning.some((item) => item.includes("beginner"))).toBe(true);
  });

  it("does not fabricate a time saving without matching known skill-gap estimates", () => {
    const evidence = buildRouteEvidence(baseRequest);
    expect(evidence.estimatedLearningAvoidedMinutes).toBeNull();
    expect(evidence.skippedLearning).toContain("Parallel comparison of multiple applications");
  });
});
