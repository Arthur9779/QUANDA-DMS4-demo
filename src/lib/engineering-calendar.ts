import {
  atLocalNoon,
  fromLocalDateKey,
  toLocalDateKey,
} from "@/src/lib/date";
import {
  categoryForIndex,
  dueDateForCumulativeMinutes,
  type CalendarAvailability,
} from "@/src/lib/calendar";
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
  availability: CalendarAvailability = { hoursPerDay: 2, daysPerWeek: 6 },
): CalendarTask[] {
  const start = atLocalNoon(now);
  const parsedDeadline = fromLocalDateKey(deadline) ?? start;
  const end = parsedDeadline < start ? start : parsedDeadline;
  let cumulativeMinutes = 0;

  return roadmap.tasks.map((task, index) => {
    cumulativeMinutes += task.estimatedAgentMinutes + task.estimatedHumanReviewMinutes;
    const dueDate = dueDateForCumulativeMinutes(start, end, cumulativeMinutes, availability);
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
  availability: CalendarAvailability = { hoursPerDay: 2, daysPerWeek: 6 },
): CalendarTask[] {
  const start = atLocalNoon(now);
  const parsedDeadline = fromLocalDateKey(deadline) ?? start;
  const end = parsedDeadline < start ? start : parsedDeadline;
  const minutesPerStep = Math.max(30, availability.hoursPerDay * 60);

  return plan.steps.map((step, index) => {
    const dueDate = dueDateForCumulativeMinutes(start, end, (index + 1) * minutesPerStep, availability);
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
  availability: CalendarAvailability = { hoursPerDay: 2, daysPerWeek: 6 },
): CalendarTask[] {
  const existingById = new Map(tasks.map((task) => [task.id, task]));
  const roadmapTasks = createEngineeringRoadmapCalendarTasks(
    roadmap,
    deadline,
    completedTaskIds,
    now,
    availability,
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
  availability: CalendarAvailability = { hoursPerDay: 2, daysPerWeek: 6 },
): CalendarTask[] {
  const existingById = new Map(tasks.map((task) => [task.id, task]));
  const guidedTasks = createEngineeringGuidedPlanCalendarTasks(plan, deadline, now, availability).map((task) => ({
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
