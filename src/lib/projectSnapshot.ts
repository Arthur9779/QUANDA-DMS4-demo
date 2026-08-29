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

export const QUANDA_PROJECT_DATA_VERSION = 1;

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

export const QuandaProjectSnapshotSchema = z.object({
  dataVersion: z.literal(QUANDA_PROJECT_DATA_VERSION),
  form: RoadmapRequestSchema,
  creativeDnaReview: CreativeDnaReviewRecordSchema.nullable(),
  learningPlan: LearningPlanSchema.nullable(),
  roadmap: RoadmapResponseSchema.nullable(),
  completion: z.record(z.string(), z.array(z.string())),
  calendarTasks: z.array(CalendarTaskSchema),
});

export interface QuandaProjectSnapshot {
  dataVersion: typeof QUANDA_PROJECT_DATA_VERSION;
  form: RoadmapRequest;
  creativeDnaReview: CreativeDnaReviewRecord | null;
  learningPlan: LearningPlan | null;
  roadmap: RoadmapResponse | null;
  completion: Record<string, string[]>;
  calendarTasks: CalendarTask[];
}

export function createProjectSnapshot(input: {
  form: RoadmapRequest;
  creativeDnaReview: CreativeDnaReviewRecord | null;
  learningPlan: LearningPlan | null;
  roadmap: RoadmapResponse | null;
  completion: Record<string, string[]>;
  calendarTasks: CalendarTask[];
}): QuandaProjectSnapshot {
  return {
    dataVersion: QUANDA_PROJECT_DATA_VERSION,
    ...input,
  };
}

export function parseProjectSnapshot(value: unknown): QuandaProjectSnapshot | null {
  const parsed = QuandaProjectSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function projectStatus(snapshot: QuandaProjectSnapshot) {
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
  if (snapshot.roadmap?.title.trim()) return snapshot.roadmap.title.trim().slice(0, 140);
  const firstLine = snapshot.form.projectBrief.trim().split(/[\n.!?]/u)[0]?.trim();
  return (firstLine || "Untitled QUANDA project").slice(0, 140);
}
