import { describe, expect, it } from "vitest";
import { createProjectInputFingerprint } from "@/src/creative-dna-review/fingerprint";
import type { RoadmapRequest } from "@/src/types";

const request: RoadmapRequest = {
  interfaceLanguage: "en",
  projectBrief: "Create a glossy Y2K animation in Blender for class.",
  deadline: "2026-08-24",
  currentExperience: "Blender beginner",
  hoursPerDay: 2,
  daysPerWeek: 5,
  tutorialLanguage: "either",
  requiredApplications: ["blender", "after-effects"],
  outputType: "video",
  targetQuality: "portfolio",
};

describe("Creative DNA input fingerprint", () => {
  it("is stable when application selection order changes", () => {
    expect(createProjectInputFingerprint(request)).toBe(
      createProjectInputFingerprint({
        ...request,
        requiredApplications: ["after-effects", "blender"],
      }),
    );
  });

  it("marks meaningful project-input changes as stale", () => {
    expect(createProjectInputFingerprint(request)).not.toBe(
      createProjectInputFingerprint({
        ...request,
        projectBrief: `${request.projectBrief} Add chrome materials.`,
      }),
    );
  });
});
