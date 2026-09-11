import { z } from "zod";
import { CreativeDnaReviewRecordSchema } from "@/src/creative-dna-review/contracts";
import { LearningPlanSchema } from "@/src/tutorial-matching/contracts";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";
import type {
  CalendarTask,
  RoadmapRequest,
  RoadmapResponse,
} from "@/src/types";
import type { CreativeDnaReviewRecord } from "@/src/creative-dna-review/contracts";
import type { LearningPlan } from "@/src/tutorial-matching/contracts";
import {
  EngineeringGuidedPlanSchema,
  EngineeringInterpretationSchema,
  EngineeringProjectSchema,
  EngineeringRoadmapSchema,
  PreparationMethodSchema,
  ProjectPathSchema,
  type EngineeringGuidedPlan,
  type EngineeringInterpretation,
  type EngineeringProject,
  type EngineeringRoadmap,
  type PreparationMethod,
  type ProjectPath,
} from "@/src/project-path/contracts";

export const QUANDA_PROJECT_DATA_VERSION = 2;

const CalendarTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(["sage", "peach", "lavender", "sky", "butter"]),
  source: z.enum(["manual", "roadmap"]),
  done: z.boolean(),
  createdAt: z.string(),
  roadmapId: z.string().optional(),
  stageId: z.string().optional(),
});

const DesignSnapshotFields = {
  form: RoadmapRequestSchema,
  creativeDnaReview: CreativeDnaReviewRecordSchema.nullable(),
  learningPlan: LearningPlanSchema.nullable(),
  roadmap: RoadmapResponseSchema.nullable(),
  completion: z.record(z.string(), z.array(z.string())),
  calendarTasks: z.array(CalendarTaskSchema),
};

const LegacyProjectSnapshotSchema = z.object({
  dataVersion: z.literal(1),
  ...DesignSnapshotFields,
});

export const QuandaProjectSnapshotSchema = z.object({
  dataVersion: z.literal(QUANDA_PROJECT_DATA_VERSION),
  projectPath: ProjectPathSchema,
  ...DesignSnapshotFields,
  engineeringForm: EngineeringProjectSchema.nullable(),
  engineeringInterpretation: EngineeringInterpretationSchema.nullable(),
  engineeringRoadmap: EngineeringRoadmapSchema.nullable(),
  preparationMethod: PreparationMethodSchema.nullable(),
  engineeringGuidedPlan: EngineeringGuidedPlanSchema.nullable(),
  engineeringCompletion: z.array(z.string()),
  engineeringCalendarTasks: z.array(CalendarTaskSchema),
});

export interface QuandaProjectSnapshot {
  dataVersion: typeof QUANDA_PROJECT_DATA_VERSION;
  projectPath: ProjectPath;
  form: RoadmapRequest;
  creativeDnaReview: CreativeDnaReviewRecord | null;
  learningPlan: LearningPlan | null;
  roadmap: RoadmapResponse | null;
  completion: Record<string, string[]>;
  calendarTasks: CalendarTask[];
  engineeringForm: EngineeringProject | null;
  engineeringInterpretation: EngineeringInterpretation | null;
  engineeringRoadmap: EngineeringRoadmap | null;
  preparationMethod: PreparationMethod | null;
  engineeringGuidedPlan: EngineeringGuidedPlan | null;
  engineeringCompletion: string[];
  engineeringCalendarTasks: CalendarTask[];
}

export function createProjectSnapshot(input: {
  form: RoadmapRequest;
  creativeDnaReview: CreativeDnaReviewRecord | null;
  learningPlan: LearningPlan | null;
  roadmap: RoadmapResponse | null;
  completion: Record<string, string[]>;
  calendarTasks: CalendarTask[];
  projectPath?: ProjectPath;
  engineeringForm?: EngineeringProject | null;
  engineeringInterpretation?: EngineeringInterpretation | null;
  engineeringRoadmap?: EngineeringRoadmap | null;
  preparationMethod?: PreparationMethod | null;
  engineeringGuidedPlan?: EngineeringGuidedPlan | null;
  engineeringCompletion?: string[];
  engineeringCalendarTasks?: CalendarTask[];
}): QuandaProjectSnapshot {
  return {
    dataVersion: QUANDA_PROJECT_DATA_VERSION,
    projectPath: input.projectPath ?? "design",
    form: input.form,
    creativeDnaReview: input.creativeDnaReview,
    learningPlan: input.learningPlan,
    roadmap: input.roadmap,
    completion: input.completion,
    calendarTasks: input.calendarTasks,
    engineeringForm: input.engineeringForm ?? null,
    engineeringInterpretation: input.engineeringInterpretation ?? null,
    engineeringRoadmap: input.engineeringRoadmap ?? null,
    preparationMethod: input.preparationMethod ?? null,
    engineeringGuidedPlan: input.engineeringGuidedPlan ?? null,
    engineeringCompletion: input.engineeringCompletion ?? [],
    engineeringCalendarTasks: input.engineeringCalendarTasks ?? [],
  };
}

export function parseProjectSnapshot(value: unknown): QuandaProjectSnapshot | null {
  const parsed = QuandaProjectSnapshotSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  const legacy = LegacyProjectSnapshotSchema.safeParse(value);
  return legacy.success ? createProjectSnapshot({ ...legacy.data, projectPath: "design" }) : null;
}

export function projectStatus(snapshot: QuandaProjectSnapshot) {
  if (snapshot.projectPath === "agentic_engineering") {
    if (!snapshot.engineeringRoadmap && !snapshot.engineeringGuidedPlan) {
      return snapshot.engineeringInterpretation ? "planning" : "draft";
    }
    if (snapshot.engineeringRoadmap) {
      const completed = new Set(snapshot.engineeringCompletion);
      return snapshot.engineeringRoadmap.tasks.length > 0 && snapshot.engineeringRoadmap.tasks.every((task) => completed.has(task.id))
        ? "completed" : "active";
    }
    return "active";
  }
  if (!snapshot.roadmap) {
    return snapshot.creativeDnaReview || snapshot.learningPlan ? "planning" : "draft";
  }
  const completed = new Set(snapshot.completion[snapshot.roadmap.id] ?? []);
  return snapshot.roadmap.stages.length > 0 &&
    snapshot.roadmap.stages.every((stage) => completed.has(stage.id))
    ? "completed"
    : "active";
}

export function projectTitle(snapshot: QuandaProjectSnapshot): string {
  if (snapshot.projectPath === "agentic_engineering") {
    if (snapshot.engineeringRoadmap?.title.trim()) return snapshot.engineeringRoadmap.title.trim().slice(0, 140);
    if (snapshot.engineeringGuidedPlan?.title.trim()) return snapshot.engineeringGuidedPlan.title.trim().slice(0, 140);
    const firstLine = snapshot.engineeringForm?.technicalBrief.trim().split(/[\n.!?]/u)[0]?.trim();
    return (firstLine || "Untitled QUANDA project").slice(0, 140);
  }
  if (snapshot.roadmap?.title.trim()) return snapshot.roadmap.title.trim().slice(0, 140);
  const firstLine = snapshot.form.projectBrief.trim().split(/[\n.!?]/u)[0]?.trim();
  return (firstLine || "Untitled QUANDA project").slice(0, 140);
}
