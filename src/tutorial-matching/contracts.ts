import { z } from "zod";
import {
  SkillGapSchema,
  TutorialDNASchema,
  TutorialNeedSchema,
} from "@/src/contracts/knowledge";
import { CreativeDnaReviewRecordSchema } from "@/src/creative-dna-review/contracts";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";

export const TUTORIAL_RANKING_VERSION = 1 as const;
export const LEARNING_PLAN_VERSION = 1 as const;

export const TutorialDiscoveryRequestSchema = z.object({
  query: z.string().trim().min(3).max(180),
  language: z.enum(["en", "vi", "either"]).optional(),
  softwareIds: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  skillIds: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
  techniqueIds: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
  maxResults: z.number().int().min(1).max(15).default(10),
});

export const TutorialDiscoveryResultSchema = z.object({
  tutorial: TutorialDNASchema,
  sourceTier: z.enum(["curated", "indexed", "live"]),
});

export const TutorialScoreBreakdownSchema = z.object({
  skill: z.number(),
  technique: z.number(),
  software: z.number(),
  prerequisiteFit: z.number(),
  output: z.number(),
  sourceQuality: z.number(),
  userLevel: z.number(),
  language: z.number(),
  version: z.number(),
  specificity: z.number(),
  recency: z.number(),
  aesthetic: z.number(),
  classification: z.number(),
  penalties: z.object({
    softwareMismatch: z.number(),
    prerequisiteMismatch: z.number(),
    broadCourse: z.number(),
    duration: z.number(),
    stale: z.number(),
    unverified: z.number(),
  }),
});

export const RankedTutorialSchema = z.object({
  tutorial: TutorialDNASchema,
  sourceTier: z.enum(["curated", "indexed", "live"]),
  score: z.number().finite(),
  breakdown: TutorialScoreBreakdownSchema,
  why: z.string().trim().min(1).max(500),
});

export const TutorialMatchSchema = z.object({
  needId: z.string().min(1).max(160),
  selectedTutorialId: z.string().min(1).max(160).nullable(),
  candidates: z.array(RankedTutorialSchema).max(15),
  rejectedTutorialIds: z.array(z.string().min(1).max(160)).max(100).default([]),
  feedback: z.enum(["none", "too_advanced", "too_long"]).default("none"),
});

export const LearningPlanSchema = z.object({
  learningPlanVersion: z.literal(LEARNING_PLAN_VERSION),
  tutorialRankingVersion: z.literal(TUTORIAL_RANKING_VERSION),
  inputFingerprint: z.string().regex(/^[a-f0-9]{8}$/),
  skillGaps: z.array(SkillGapSchema).max(40),
  tutorialNeeds: z.array(TutorialNeedSchema).max(40),
  tutorialMatches: z.array(TutorialMatchSchema).max(40),
  source: z.enum(["catalogue", "catalogue_and_live"]),
  createdAt: z.string().datetime(),
});

export const TutorialMatchingRequestSchema = z.object({
  project: RoadmapRequestSchema,
  review: CreativeDnaReviewRecordSchema.refine((review) => review.confirmed, {
    message: "Creative DNA must be confirmed before tutorial matching",
  }),
});

export const TutorialMatchingResponseSchema = LearningPlanSchema;

export type TutorialDiscoveryRequest = z.infer<
  typeof TutorialDiscoveryRequestSchema
>;
export type TutorialDiscoveryResult = z.infer<
  typeof TutorialDiscoveryResultSchema
>;
export type TutorialScoreBreakdown = z.infer<
  typeof TutorialScoreBreakdownSchema
>;
export type RankedTutorial = z.infer<typeof RankedTutorialSchema>;
export type TutorialMatch = z.infer<typeof TutorialMatchSchema>;
export type LearningPlan = z.infer<typeof LearningPlanSchema>;
export type TutorialMatchingRequest = z.infer<
  typeof TutorialMatchingRequestSchema
>;
