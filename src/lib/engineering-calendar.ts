import {
  addLocalDays,
  atLocalNoon,
  fromLocalDateKey,
  localCalendarDayDistance,
  toLocalDateKey,
} from "@/src/lib/date";
import { categoryForIndex } from "@/src/lib/calendar";
import type { EngineeringGuidedPlan, EngineeringRoadmap } from "@/src/project-path/contracts";
import type { CalendarTask } from "@/src/types";

const engineeringRoadmapPrefix = "engineering-roadmap:";
const engineeringGuidedPlanPrefix = "engineering-guided-plan:";

function isEngineeringRoadmapTask(task: CalendarTask): boolean {
  return task.source === "roadmap" && task.roadmapId?.startsWith(engineeringRoadmapPrefix) === true;
}

function isEngineeringGuidedPlanTask(task: CalendarTask): boolean {
  return task.source === "roadmap" && task.roadmapId?.startsWith(engineeringGuidedPlanPrefix) === true;
}

function isEngineeringGeneratedTask(task: CalendarTask): boolean {
  return isEngineeringRoadmapTask(task) || isEngineeringGuidedPlanTask(task);
}

export function createEngineeringRoadmapCalendarTasks(
  roadmap: EngineeringRoadmap,
  deadline: string,
  completedTaskIds: readonly string[] = [],
  now = new Date(),
): CalendarTask[] {
  const start = atLocalNoon(now);
  const parsedDeadline = fromLocalDateKey(deadline) ?? start;
  const end = parsedDeadline < start ? start : parsedDeadline;
  const daySpan = Math.max(0, localCalendarDayDistance(start, end));
  const totalMinutes = Math.max(
    1,
    roadmap.tasks.reduce(
      (sum, task) => sum + task.estimatedAgentMinutes + task.estimatedHumanReviewMinutes,
      0,
    ),
  );
  let cumulativeMinutes = 0;

  return roadmap.tasks.map((task, index) => {
    cumulativeMinutes += task.estimatedAgentMinutes + task.estimatedHumanReviewMinutes;
    const proportionalOffset = Math.round(daySpan * (cumulativeMinutes / totalMinutes));
    const minimumOffset = daySpan > 0 ? 1 : 0;
    const dueDate = addLocalDays(
      start,
      Math.min(daySpan, Math.max(minimumOffset, proportionalOffset)),
    );
    return {
      id: `${engineeringRoadmapPrefix}${roadmap.id}:${task.id}`,
      title: task.title,
      deadline: toLocalDateKey(dueDate),
      category: categoryForIndex(index),
      source: "roadmap",
      done: completedTaskIds.includes(task.id),
      createdAt: now.toISOString(),
      roadmapId: `${engineeringRoadmapPrefix}${roadmap.id}`,
      stageId: task.id,
    };
  });
}

export function createEngineeringGuidedPlanCalendarTasks(
  plan: EngineeringGuidedPlan,
  deadline: string,
  now = new Date(),
): CalendarTask[] {
  const start = atLocalNoon(now);
  const parsedDeadline = fromLocalDateKey(deadline) ?? start;
  const end = parsedDeadline < start ? start : parsedDeadline;
  const daySpan = Math.max(0, localCalendarDayDistance(start, end));
  const stepCount = Math.max(1, plan.steps.length);

  return plan.steps.map((step, index) => {
    const proportionalOffset = Math.round(daySpan * ((index + 1) / stepCount));
    const minimumOffset = daySpan > 0 ? 1 : 0;
    const dueDate = addLocalDays(
      start,
      Math.min(daySpan, Math.max(minimumOffset, proportionalOffset)),
    );
    return {
      id: `${engineeringGuidedPlanPrefix}${plan.id}:${step.id}`,
      title: step.title,
      deadline: toLocalDateKey(dueDate),
      category: categoryForIndex(index),
      source: "roadmap",
      done: false,
      createdAt: now.toISOString(),
      roadmapId: `${engineeringGuidedPlanPrefix}${plan.id}`,
      stageId: step.id,
    };
  });
}

export function syncEngineeringRoadmapCalendarTasks(
  tasks: CalendarTask[],
  roadmap: EngineeringRoadmap,
  deadline: string,
  completedTaskIds: readonly string[] = [],
  now = new Date(),
): CalendarTask[] {
  const existingById = new Map(tasks.map((task) => [task.id, task]));
  const roadmapTasks = createEngineeringRoadmapCalendarTasks(
    roadmap,
    deadline,
    completedTaskIds,
    now,
  ).map((task) => ({
    ...task,
    createdAt: existingById.get(task.id)?.createdAt ?? task.createdAt,
  }));
  return [
    ...tasks.filter((task) => !isEngineeringGeneratedTask(task)),
    ...roadmapTasks,
  ];
}

export function syncEngineeringGuidedPlanCalendarTasks(
  tasks: CalendarTask[],
  plan: EngineeringGuidedPlan,
  deadline: string,
  now = new Date(),
): CalendarTask[] {
  const existingById = new Map(tasks.map((task) => [task.id, task]));
  const guidedTasks = createEngineeringGuidedPlanCalendarTasks(plan, deadline, now).map((task) => ({
    ...task,
    createdAt: existingById.get(task.id)?.createdAt ?? task.createdAt,
    done: existingById.get(task.id)?.done ?? task.done,
  }));
  return [
    ...tasks.filter((task) => !isEngineeringGeneratedTask(task)),
    ...guidedTasks,
  ];
}

export function removeEngineeringCalendarTasks(tasks: CalendarTask[]): CalendarTask[] {
  return tasks.filter((task) => !isEngineeringGeneratedTask(task));
}

export function removeEngineeringRoadmapCalendarTasks(tasks: CalendarTask[]): CalendarTask[] {
  return tasks.filter((task) => !isEngineeringRoadmapTask(task));
}
