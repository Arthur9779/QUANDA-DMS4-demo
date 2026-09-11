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

  it("migrates version-one design snapshots without losing local project data", () => {
    const legacy = {
      dataVersion: 1 as const,
      form,
      creativeDnaReview: null,
      learningPlan: null,
      roadmap: null,
      completion: {},
      calendarTasks: [],
    };
    expect(parseProjectSnapshot(legacy)).toMatchObject({
      dataVersion: 2,
      projectPath: "design",
      form,
      engineeringForm: null,
      engineeringCompletion: [],
    });
  });

  it("round-trips an agentic project so it can be opened on another device", () => {
    const agentic = createProjectSnapshot({
      form,
      creativeDnaReview: null,
      learningPlan: null,
      roadmap: null,
      completion: {},
      calendarTasks: [],
      projectPath: "agentic_engineering",
      engineeringForm: {
        path: "agentic_engineering",
        interfaceLanguage: "vi",
        technicalBrief: "Xây dựng một ứng dụng web theo dõi tiến độ học tập cho sinh viên.",
        startingPoint: "new_project",
        projectLocation: "",
        definitionOfDone: "Ứng dụng chạy ổn định và lưu được nhiệm vụ.",
        targetPlatform: "web_application",
        technologies: "Next.js",
        currentExperience: "Mới bắt đầu với Next.js",
        deploymentTarget: "Vercel",
        deadline: "2099-09-30",
        hoursPerDay: 2,
        daysPerWeek: 4,
        constraints: "",
        existingErrors: "",
      },
      engineeringCompletion: ["task-1"],
    });
    expect(parseProjectSnapshot(agentic)).toEqual(agentic);
    expect(projectStatus(agentic)).toBe("draft");
    expect(projectTitle(agentic)).toBe("Xây dựng một ứng dụng web theo dõi tiến độ học tập cho sinh viên");
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
