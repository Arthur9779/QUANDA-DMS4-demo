import {
  addLocalDays,
  atLocalNoon,
  fromLocalDateKey,
  localCalendarDayDistance,
  toLocalDateKey,
} from "@/src/lib/date";
import type {
  CalendarTask,
  CalendarTaskCategory,
  RoadmapResponse,
} from "@/src/types";

export const calendarTaskCategories: CalendarTaskCategory[] = [
  "sage",
  "peach",
  "lavender",
  "sky",
  "butter",
];

export function isCalendarTask(value: unknown): value is CalendarTask {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const task = value as Partial<CalendarTask>;
  return Boolean(
    typeof task.id === "string" &&
      task.id.length > 0 &&
      typeof task.title === "string" &&
      task.title.length > 0 &&
      task.title.length <= 160 &&
      typeof task.deadline === "string" &&
      fromLocalDateKey(task.deadline) &&
      typeof task.category === "string" &&
      calendarTaskCategories.includes(task.category as CalendarTaskCategory) &&
      (task.source === "manual" || task.source === "roadmap") &&
      typeof task.done === "boolean" &&
      typeof task.createdAt === "string" &&
      (task.roadmapId === undefined || typeof task.roadmapId === "string") &&
      (task.stageId === undefined || typeof task.stageId === "string")
  );
}

export function categoryForIndex(index: number): CalendarTaskCategory {
  return calendarTaskCategories[index % calendarTaskCategories.length];
}

export function createRoadmapCalendarTasks(
  roadmap: RoadmapResponse,
  deadline: string,
  completedStageIds: readonly string[] = [],
  now = new Date(),
): CalendarTask[] {
  const start = atLocalNoon(now);
  const parsedDeadline = fromLocalDateKey(deadline) ?? start;
  const end = parsedDeadline < start ? start : parsedDeadline;
  const daySpan = Math.max(0, localCalendarDayDistance(start, end));
  const totalMinutes = Math.max(
    1,
    roadmap.stages.reduce(
      (sum, stage) => sum + stage.learningMinutes + stage.productionMinutes,
      0,
    ),
  );
  let cumulativeMinutes = 0;

  return roadmap.stages.map((stage, index) => {
    cumulativeMinutes += stage.learningMinutes + stage.productionMinutes;
    const proportionalOffset = Math.round(
      daySpan * (cumulativeMinutes / totalMinutes),
    );
    const minimumOffset = daySpan > 0 ? 1 : 0;
    const dueDate = addLocalDays(
      start,
      Math.min(daySpan, Math.max(minimumOffset, proportionalOffset)),
    );

    return {
      id: `roadmap:${roadmap.id}:${stage.id}`,
      title: stage.title,
      deadline: toLocalDateKey(dueDate),
      category: categoryForIndex(index),
      source: "roadmap",
      done: completedStageIds.includes(stage.id),
      createdAt: now.toISOString(),
      roadmapId: roadmap.id,
      stageId: stage.id,
    };
  });
}

export function syncRoadmapCalendarTasks(
  tasks: CalendarTask[],
  roadmap: RoadmapResponse,
  deadline: string,
  completedStageIds: readonly string[] = [],
  now = new Date(),
): CalendarTask[] {
  const existingById = new Map(tasks.map((task) => [task.id, task]));
  const manualTasks = tasks.filter((task) => task.source === "manual");
  const roadmapTasks = createRoadmapCalendarTasks(
    roadmap,
    deadline,
    completedStageIds,
    now,
  ).map((task) => ({
    ...task,
    createdAt: existingById.get(task.id)?.createdAt ?? task.createdAt,
  }));

  return [...manualTasks, ...roadmapTasks];
}

export function removeRoadmapCalendarTasks(tasks: CalendarTask[]): CalendarTask[] {
  return tasks.filter((task) => task.source === "manual");
}
