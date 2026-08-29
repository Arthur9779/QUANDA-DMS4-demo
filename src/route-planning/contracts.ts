import { z } from "zod";

export const RouteCriterionSchema = z.enum([
  "requirements_fit",
  "familiarity",
  "time_fit",
  "switching_cost",
  "resources",
  "risk",
]);
export type RouteCriterion = z.infer<typeof RouteCriterionSchema>;

export const RouteEvidenceSourceSchema = z.enum([
  "user_brief",
  "user_profile",
  "deadline",
  "existing_tools",
  "verified_resource",
  "derived_constraint",
  "system_fallback",
]);
export type RouteEvidenceSource = z.infer<typeof RouteEvidenceSourceSchema>;

export const RouteEvidenceSchema = z.object({
  source: RouteEvidenceSourceSchema,
  statement: z.string().min(1).max(500),
});
export type RouteEvidence = z.infer<typeof RouteEvidenceSchema>;

export const RouteCriterionScoreSchema = z.object({
  criterion: RouteCriterionSchema,
  score: z.number().int().min(0).max(100),
  weight: z.number().positive().max(1),
  rationale: z.string().min(1).max(500),
  evidence: z.array(RouteEvidenceSchema).min(1).max(4),
});
export type RouteCriterionScore = z.infer<typeof RouteCriterionScoreSchema>;

export const RouteCandidateSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  summary: z.string().min(1).max(700),
  toolSequence: z.array(z.string().min(1).max(160)).min(1).max(8),
  steps: z.array(z.string().min(1).max(300)).min(2).max(8),
  score: z.number().int().min(0).max(100),
  status: z.enum(["recommended", "alternative", "rejected"]),
  scoreBreakdown: z.array(RouteCriterionScoreSchema).length(6),
  strengths: z.array(z.string().min(1).max(400)).min(1).max(5),
  tradeoffs: z.array(z.string().min(1).max(400)).min(1).max(5),
  rejectionReason: z.string().max(600).optional(),
});
export type RouteCandidate = z.infer<typeof RouteCandidateSchema>;

export const RouteEvaluationSchema = z.object({
  modelVersion: z.literal(1),
  recommendedRouteId: z.string().min(1),
  explanation: z.string().min(1).max(900),
  routes: z.array(RouteCandidateSchema).min(2).max(4),
});
export type RouteEvaluation = z.infer<typeof RouteEvaluationSchema>;
