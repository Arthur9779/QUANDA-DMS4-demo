import { describe, expect, it } from "vitest";
import {
  createProjectSnapshot,
  parseProjectSnapshot,
  projectStatus,
  projectTitle,
} from "@/src/lib/projectSnapshot";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import type { RoadmapRequest } from "@/src/types";

const form: RoadmapRequest = {
  interfaceLanguage: "en",
  projectBrief: "Build an interactive sound sculpture. It should react to visitors.",
  deadline: "2099-09-30",
  currentExperience: "Beginner",
  hoursPerDay: 2,
  daysPerWeek: 4,
  tutorialLanguage: "either",
  requiredApplications: ["custom:TouchDesigner"],
  outputType: "other",
  targetQuality: "portfolio",
};

describe("remote project snapshots", () => {
  it("round-trips the complete project state and rejects malformed data", () => {
    const snapshot = createProjectSnapshot({
      form,
      creativeDnaReview: null,
      learningPlan: null,
      roadmap: null,
      completion: {},
      calendarTasks: [],
    });
    expect(parseProjectSnapshot(snapshot)).toEqual(snapshot);
    expect(parseProjectSnapshot({ ...snapshot, dataVersion: 99 })).toBeNull();
    expect(parseProjectSnapshot({ ...snapshot, form: { projectBrief: "missing" } })).toBeNull();
  });

  it("derives draft, active, and completed persistence states", () => {
    const draft = createProjectSnapshot({
      form,
      creativeDnaReview: null,
      learningPlan: null,
      roadmap: null,
      completion: {},
      calendarTasks: [],
    });
    expect(projectStatus(draft)).toBe("draft");
    expect(projectTitle(draft)).toBe("Build an interactive sound sculpture");

    const roadmap = createSampleRoadmap(form);
    const active = { ...draft, roadmap };
    expect(projectStatus(active)).toBe("active");
    expect(projectStatus({
      ...active,
      completion: { [roadmap.id]: roadmap.stages.map((stage) => stage.id) },
    })).toBe("completed");
  });
});
