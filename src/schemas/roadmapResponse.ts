import { z } from "zod";

export const RoadmapStageSchema = z.object({
  id: z.string().min(1).max(80),
  order: z.number().int().min(1).max(8),
  title: z.string().min(2).max(160),
  goal: z.string().min(5).max(600),
  why: z.string().min(5).max(600),
  applicationId: z.string().min(1).max(80).nullable(),
  skillToLearn: z.string().min(2).max(240),
  tasks: z.array(z.string().min(2).max(300)).min(1).max(8),
  learningMinutes: z.number().finite().positive().max(10_000),
  productionMinutes: z.number().finite().positive().max(20_000),
  dependsOnStageIds: z.array(z.string().min(1).max(80)).max(7),
  tutorialIds: z.array(z.string().min(1).max(120)).max(3),
});

export const RoadmapResponseSchema = z.object({
  id: z.string().min(1).max(120),
  language: z.enum(["en", "vi"]),
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(1200),
  feasibility: z.object({
    status: z.enum(["comfortable", "tight", "unrealistic"]),
    message: z.string().min(5).max(600),
    daysRemaining: z.number().int().nonnegative(),
    availableMinutes: z.number().int().nonnegative(),
    estimatedRequiredMinutes: z.number().int().positive(),
  }),
  totalEstimatedMinutes: z.number().int().positive(),
  assumptions: z.array(z.string().min(2).max(400)).max(8),
  warnings: z.array(z.string().min(2).max(400)).max(8),
  stages: z.array(RoadmapStageSchema).min(4).max(8),
  schedule: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        stageIds: z.array(z.string().min(1).max(80)).min(1).max(8),
        plannedMinutes: z.number().int().positive().max(20_000),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .min(1)
    .max(14),
  source: z.enum(["ai", "demo", "fallback"]).optional(),
  notice: z.string().max(600).optional(),
});

export type RoadmapResponseData = z.infer<typeof RoadmapResponseSchema>;
