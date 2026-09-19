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

export interface CalendarAvailability {
  hoursPerDay: number;
  daysPerWeek: number;
}

const defaultAvailability: CalendarAvailability = { hoursPerDay: 2, daysPerWeek: 6 };

function isAvailableWorkday(date: Date, daysPerWeek: number): boolean {
  if (daysPerWeek >= 7) return true;
  const mondayIndex = (date.getDay() + 6) % 7;
  return mondayIndex < Math.max(1, Math.min(7, daysPerWeek));
}

export function dueDateForCumulativeMinutes(
  start: Date,
  end: Date,
  cumulativeMinutes: number,
  availability: CalendarAvailability,
): Date {
  const daySpan = Math.max(0, localCalendarDayDistance(start, end));
  const minutesPerDay = Math.max(30, availability.hoursPerDay * 60);
  let remaining = Math.max(1, cumulativeMinutes);
  for (let offset = 0; offset <= daySpan; offset += 1) {
    const date = addLocalDays(start, offset);
    if (!isAvailableWorkday(date, availability.daysPerWeek)) continue;
    remaining -= minutesPerDay;
    if (remaining <= 0) return date;
  }
  return end;
}

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
  availability: CalendarAvailability = defaultAvailability,
): CalendarTask[] {
  const start = atLocalNoon(now);
  const parsedDeadline = fromLocalDateKey(deadline) ?? start;
  const end = parsedDeadline < start ? start : parsedDeadline;
  let cumulativeMinutes = 0;

  return roadmap.stages.map((stage, index) => {
    cumulativeMinutes += stage.learningMinutes + stage.productionMinutes;
    const dueDate = dueDateForCumulativeMinutes(start, end, cumulativeMinutes, availability);

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
  availability: CalendarAvailability = defaultAvailability,
): CalendarTask[] {
  const existingById = new Map(tasks.map((task) => [task.id, task]));
  const manualTasks = tasks.filter((task) => task.source === "manual");
  const roadmapTasks = createRoadmapCalendarTasks(
    roadmap,
    deadline,
    completedStageIds,
    now,
    availability,
  ).map((task) => ({
    ...task,
    createdAt: existingById.get(task.id)?.createdAt ?? task.createdAt,
  }));

  return [...manualTasks, ...roadmapTasks];
}

export function removeRoadmapCalendarTasks(tasks: CalendarTask[]): CalendarTask[] {
  return tasks.filter((task) => task.source === "manual");
}
