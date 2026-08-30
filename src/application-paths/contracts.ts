import { z } from "zod";

export const DESIGN_APPLICATION_PATH_VERSION = 1 as const;
export const DESIGN_APPLICATION_PATH_SCORING_VERSION = 1 as const;

export const ApplicationPathFactorSchema = z.enum([
  "requirements",
  "deliverableFit",
  "familiarity",
  "techniqueCoverage",
  "tutorialCoverage",
  "switchingCost",
  "deadlineFit",
]);

export const ApplicationPathScoreBreakdownSchema = z.object({
  requirements: z.number().int().min(0).max(100),
  deliverableFit: z.number().int().min(0).max(100),
  familiarity: z.number().int().min(0).max(100),
  techniqueCoverage: z.number().int().min(0).max(100),
  tutorialCoverage: z.number().int().min(0).max(100),
  switchingCost: z.number().int().min(0).max(100),
  deadlineFit: z.number().int().min(0).max(100),
});

export const DesignApplicationPathCandidateSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(260),
  applicationIds: z.array(z.string().min(1).max(120)).min(1).max(5),
  applicationNames: z.array(z.string().min(1).max(160)).min(1).max(5),
  viable: z.boolean(),
  score: z.number().int().min(0).max(100),
  fitBand: z.enum(["strong", "good", "conditional"]),
  scoreBreakdown: ApplicationPathScoreBreakdownSchema,
  estimatedLearningMinutes: z.number().int().nonnegative().max(20_000),
  estimatedProductionMinutes: z.number().int().positive().max(50_000),
  strengths: z.array(z.string().min(1).max(400)).max(6),
  tradeoffs: z.array(z.string().min(1).max(400)).max(6),
  rejectionReasons: z.array(z.string().min(1).max(400)).max(6),
});

export const ApplicationPathComparisonSchema = z.object({
  alternativePathId: z.string().min(1).max(160),
  summary: z.string().min(1).max(700),
  winnerAdvantages: z.array(z.object({
    factor: ApplicationPathFactorSchema,
    points: z.number().int().positive().max(100),
  })).max(3),
  alternativeAdvantages: z.array(z.object({
    factor: ApplicationPathFactorSchema,
    points: z.number().int().positive().max(100),
  })).max(2),
});

export const DesignApplicationPathDecisionSchema = z.object({
  applicationPathVersion: z.literal(DESIGN_APPLICATION_PATH_VERSION),
  scoringVersion: z.literal(DESIGN_APPLICATION_PATH_SCORING_VERSION),
  branch: z.literal("design"),
  hardRequiredApplicationIds: z.array(z.string().min(1).max(120)).max(12),
  recommended: DesignApplicationPathCandidateSchema,
  alternatives: z.array(DesignApplicationPathCandidateSchema).max(4),
  rejected: z.array(DesignApplicationPathCandidateSchema).max(8),
  comparisons: z.array(ApplicationPathComparisonSchema).max(4),
  evaluatedPathCount: z.number().int().positive().max(20),
});

export type ApplicationPathFactor = z.infer<typeof ApplicationPathFactorSchema>;
export type ApplicationPathScoreBreakdown = z.infer<typeof ApplicationPathScoreBreakdownSchema>;
export type DesignApplicationPathCandidate = z.infer<typeof DesignApplicationPathCandidateSchema>;
export type ApplicationPathComparison = z.infer<typeof ApplicationPathComparisonSchema>;
export type DesignApplicationPathDecision = z.infer<typeof DesignApplicationPathDecisionSchema>;
