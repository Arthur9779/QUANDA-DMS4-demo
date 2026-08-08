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
});
