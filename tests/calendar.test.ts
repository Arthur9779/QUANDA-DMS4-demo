import { describe, expect, it } from "vitest";
import {
  createRoadmapCalendarTasks,
  isCalendarTask,
  removeRoadmapCalendarTasks,
  syncRoadmapCalendarTasks,
} from "@/src/lib/calendar";
import { toLocalDateKey } from "@/src/lib/date";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import type { CalendarTask, RoadmapRequest } from "@/src/types";
import { generateEngineeringRoadmap } from "@/src/agentic-engineering";
import {
  createEngineeringRoadmapCalendarTasks,
  removeEngineeringRoadmapCalendarTasks,
  syncEngineeringRoadmapCalendarTasks,
} from "@/src/lib/engineering-calendar";

const request: RoadmapRequest = {
  interfaceLanguage: "en",
  projectBrief:
    "Create a clean vector logo and icon set in Adobe Illustrator for a student brand project.",
  deadline: "2026-08-12",
  currentExperience: "Complete beginner in Adobe Illustrator",
  hoursPerDay: 2,
  daysPerWeek: 5,
  tutorialLanguage: "either",
  requiredApplications: ["illustrator"],
  outputType: "graphic",
  targetQuality: "basic",
};

describe("project calendar", () => {
  it("formats date input values from local calendar fields", () => {
    const localOneAm = new Date(2026, 7, 5, 1, 0, 0);
    expect(toLocalDateKey(localOneAm)).toBe("2026-08-05");
  });

  it("distributes roadmap stages across the available local dates", () => {
    const roadmap = createSampleRoadmap(request);
    const tasks = createRoadmapCalendarTasks(
      roadmap,
      request.deadline,
      [roadmap.stages[0].id],
      new Date(2026, 7, 5, 12),
    );

    expect(tasks).toHaveLength(roadmap.stages.length);
    expect(tasks[0].done).toBe(true);
    expect(tasks.every((task) => task.source === "roadmap")).toBe(true);
    expect(tasks.every((task) => task.deadline <= request.deadline)).toBe(true);
    expect(tasks.map((task) => task.deadline)).toEqual(
      [...tasks.map((task) => task.deadline)].sort(),
    );
  });

  it("replaces generated milestones while preserving manual tasks", () => {
    const roadmap = createSampleRoadmap(request);
    const manualTask: CalendarTask = {
      id: "manual-1",
      title: "Ask for feedback",
      deadline: "2026-08-07",
      category: "peach",
      source: "manual",
      done: false,
      createdAt: "2026-08-05T00:00:00.000Z",
    };
    const staleRoadmapTask: CalendarTask = {
      id: "old-roadmap-task",
      title: "Old milestone",
      deadline: "2026-08-06",
      category: "sage",
      source: "roadmap",
      done: false,
      createdAt: "2026-08-05T00:00:00.000Z",
      roadmapId: "old-roadmap",
      stageId: "old-stage",
    };

    const synced = syncRoadmapCalendarTasks(
      [manualTask, staleRoadmapTask],
      roadmap,
      request.deadline,
      [],
      new Date(2026, 7, 5, 12),
    );

    expect(synced).toContainEqual(manualTask);
    expect(synced.some((task) => task.id === staleRoadmapTask.id)).toBe(false);
    expect(removeRoadmapCalendarTasks(synced)).toEqual([manualTask]);
  });

  it("rejects malformed stored calendar entries", () => {
    expect(
      isCalendarTask({
        id: "bad",
        title: "Invalid date",
        deadline: "2026-02-31",
        category: "sage",
        source: "manual",
        done: false,
        createdAt: "now",
      }),
    ).toBe(false);
  });

  it("distributes engineering outcomes without mixing design milestones", () => {
    const project = {
      path: "agentic_engineering" as const,
      interfaceLanguage: "en" as const,
      technicalBrief: "Build a small REST API for a student project with tests and deployment.",
      startingPoint: "new_project" as const,
      repositoryUrl: "",
      projectLocation: "",
      definitionOfDone: "The documented endpoint works and the automated tests pass.",
      targetPlatform: "api_backend" as const,
      technologies: "Python, FastAPI",
      currentExperience: "Basic Python knowledge.",
      deploymentTarget: "A reviewable preview deployment",
      deadline: "2026-08-20",
      hoursPerDay: 2,
      daysPerWeek: 5,
      constraints: "Solo project",
      existingErrors: "",
    };
    const roadmap = generateEngineeringRoadmap(project);
    const tasks = createEngineeringRoadmapCalendarTasks(
      roadmap,
      project.deadline,
      [roadmap.tasks[0].id],
      new Date(2026, 7, 5, 12),
    );
    expect(tasks).toHaveLength(roadmap.tasks.length);
    expect(tasks[0].done).toBe(true);
    expect(tasks.every((task) => task.roadmapId?.startsWith("engineering-roadmap:") === true)).toBe(true);
    expect(tasks.every((task) => task.title === roadmap.tasks.find((item) => item.id === task.stageId)?.title)).toBe(true);
    expect(tasks.every((task) => task.deadline <= project.deadline)).toBe(true);
  });

  it("syncs engineering milestones while preserving manual engineering tasks", () => {
    const project = {
      path: "agentic_engineering" as const,
      interfaceLanguage: "en" as const,
      technicalBrief: "Build a small browser extension for a student project with tests.",
      startingPoint: "new_project" as const,
      repositoryUrl: "",
      projectLocation: "",
      definitionOfDone: "The extension works in the browser and tests pass.",
      targetPlatform: "plugin_extension" as const,
      technologies: "TypeScript",
      currentExperience: "Basic programming knowledge.",
      deploymentTarget: "A packaged extension build",
      deadline: "2026-08-20",
      hoursPerDay: 2,
      daysPerWeek: 5,
      constraints: "Solo project",
      existingErrors: "",
    };
    const roadmap = generateEngineeringRoadmap(project);
    const manualTask: CalendarTask = {
      id: "engineering-manual-1",
      title: "Review the preview build",
      deadline: "2026-08-10",
      category: "peach",
      source: "manual",
      done: false,
      createdAt: "2026-08-05T00:00:00.000Z",
    };
    const staleTask: CalendarTask = {
      id: "engineering-roadmap:old:stale",
      title: "Stale engineering task",
      deadline: "2026-08-06",
      category: "sage",
      source: "roadmap",
      done: false,
      createdAt: "2026-08-05T00:00:00.000Z",
      roadmapId: "engineering-roadmap:old",
      stageId: "stale",
    };
    const synced = syncEngineeringRoadmapCalendarTasks(
      [manualTask, staleTask],
      roadmap,
      project.deadline,
      [],
      new Date(2026, 7, 5, 12),
    );
    expect(synced).toContainEqual(manualTask);
    expect(synced.some((task) => task.id === staleTask.id)).toBe(false);
    expect(removeEngineeringRoadmapCalendarTasks(synced)).toEqual([manualTask]);
  });
});
