import { z } from "zod";
import type { Locale } from "@/src/types";

export const ProjectPathSchema = z.enum(["design", "agentic_engineering"]);
export type ProjectPath = z.infer<typeof ProjectPathSchema>;

export const PreparationMethodSchema = z.enum(["guided_tutorials", "agentic_project_plan"]);
export type PreparationMethod = z.infer<typeof PreparationMethodSchema>;

export const PathClassificationSchema = z.object({
  path: z.union([ProjectPathSchema, z.literal("clarification")]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  signals: z.array(z.string().min(1)).max(8),
});
export type PathClassification = z.infer<typeof PathClassificationSchema>;

export const EngineeringStartingPointSchema = z.enum([
  "new_project",
  "existing_repository",
  "existing_bug",
  "existing_feature",
]);
export type EngineeringStartingPoint = z.infer<typeof EngineeringStartingPointSchema>;

export const EngineeringPlatformSchema = z.enum([
  "web_application",
  "mobile_application",
  "desktop_application",
  "api_backend",
  "automation",
  "game",
  "data_project",
  "plugin_extension",
  "other",
]);
export type EngineeringPlatform = z.infer<typeof EngineeringPlatformSchema>;

export const EngineeringProjectSchema = z
  .object({
    path: z.literal("agentic_engineering"),
    interfaceLanguage: z.enum(["en", "vi"]),
    technicalBrief: z.string().trim().min(30).max(3_000),
    startingPoint: EngineeringStartingPointSchema,
    repositoryUrl: z.string().trim().max(500).optional(),
    projectLocation: z.string().trim().max(500).optional(),
    definitionOfDone: z.string().trim().min(5).max(2_000),
    targetPlatform: EngineeringPlatformSchema,
    technologies: z.string().trim().max(500).optional(),
    currentExperience: z.string().trim().min(2).max(1_200),
    deploymentTarget: z.string().trim().max(500).optional(),
    deadline: z.string().date(),
    hoursPerDay: z.number().finite().min(0.5).max(12),
    daysPerWeek: z.number().int().min(1).max(7),
    constraints: z.string().trim().max(2_000).optional(),
    existingErrors: z.string().trim().max(2_000).optional(),
  })
  .superRefine((value, context) => {
    if (value.startingPoint !== "new_project" && !value.repositoryUrl && !value.projectLocation) {
      context.addIssue({
        code: "custom",
        path: ["repositoryUrl"],
        message: "Provide a repository URL or project location for an existing project.",
      });
    }
    if (value.startingPoint === "existing_bug" && !value.existingErrors) {
      context.addIssue({
        code: "custom",
        path: ["existingErrors"],
        message: "Describe the existing error or blocker.",
      });
    }
  });
export type EngineeringProject = z.infer<typeof EngineeringProjectSchema>;

export const EngineeringInterpretationSchema = z.object({
  path: z.literal("agentic_engineering"),
  productType: z.string().min(1).max(240),
  startingPoint: EngineeringStartingPointSchema,
  coreFeatures: z.array(z.string().min(1).max(500)).min(1).max(12),
  suggestedTechnologyStack: z.array(z.string().min(1).max(120)).max(12),
  repositoryContext: z.string().min(1).max(700),
  dataAndApiRequirements: z.string().min(1).max(900),
  deploymentTarget: z.string().min(1).max(500),
  definitionOfDone: z.string().min(1).max(2_000),
  mainRisks: z.array(z.string().min(1).max(500)).max(8),
  importantConstraints: z.array(z.string().min(1).max(500)).max(8),
  source: z.enum(["inferred", "fallback"]),
});
export type EngineeringInterpretation = z.infer<typeof EngineeringInterpretationSchema>;

export const EngineeringExecutorSchema = z.enum(["agent", "human", "hybrid"]);
export type EngineeringExecutor = z.infer<typeof EngineeringExecutorSchema>;

export const EngineeringTaskSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1).max(240),
  outcome: z.string().min(1).max(1_000),
  whyItMatters: z.string().min(1).max(800),
  executor: EngineeringExecutorSchema,
  dependencies: z.array(z.string()).max(12),
  relevantTechnologies: z.array(z.string()).max(12),
  repositoryContext: z.string().min(1).max(700),
  agentPrompt: z.string().min(1).max(2_000),
  acceptanceCriteria: z.array(z.string().min(1).max(600)).min(1).max(10),
  verificationChecks: z.array(z.string().min(1).max(600)).min(1).max(10),
  expectedArtifact: z.string().min(1).max(700),
  humanReviewCheckpoint: z.string().min(1).max(700),
  estimatedAgentMinutes: z.number().int().nonnegative().max(2_880),
  estimatedHumanReviewMinutes: z.number().int().nonnegative().max(1_440),
  failureFallback: z.string().min(1).max(700),
  supervisionResources: z.array(z.object({
    label: z.string().min(1).max(180),
    url: z.string().url(),
    reason: z.string().min(1).max(400),
  })).max(4),
});
export type EngineeringTask = z.infer<typeof EngineeringTaskSchema>;

export const EngineeringRoadmapSchema = z.object({
  path: z.literal("agentic_engineering"),
  id: z.string().min(1),
  language: z.enum(["en", "vi"]),
  title: z.string().min(1).max(240),
  summary: z.string().min(1).max(1_200),
  source: z.enum(["deterministic", "ai", "fallback"]),
  notice: z.string().optional(),
  interpretation: EngineeringInterpretationSchema,
  tasks: z.array(EngineeringTaskSchema).min(5).max(12),
  totalEstimatedAgentMinutes: z.number().int().nonnegative(),
  totalEstimatedHumanReviewMinutes: z.number().int().nonnegative(),
  warnings: z.array(z.string()).max(12),
});
export type EngineeringRoadmap = z.infer<typeof EngineeringRoadmapSchema>;

export const EngineeringGuidedStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(240),
  outcome: z.string().min(1).max(900),
  whyItMatters: z.string().min(1).max(700),
  checks: z.array(z.string().min(1).max(500)).min(1).max(8),
  resources: z.array(z.object({
    label: z.string().min(1).max(180),
    url: z.string().url(),
    reason: z.string().min(1).max(400),
  })).max(4),
});
export type EngineeringGuidedStep = z.infer<typeof EngineeringGuidedStepSchema>;

export const EngineeringGuidedPlanSchema = z.object({
  path: z.literal("agentic_engineering"),
  method: z.literal("guided_tutorials"),
  id: z.string().min(1),
  language: z.enum(["en", "vi"]),
  title: z.string().min(1).max(240),
  summary: z.string().min(1).max(1_200),
  steps: z.array(EngineeringGuidedStepSchema).min(3).max(8),
});
export type EngineeringGuidedPlan = z.infer<typeof EngineeringGuidedPlanSchema>;

export interface EngineeringDraftDefaults {
  interfaceLanguage: Locale;
  technicalBrief: string;
  deadline: string;
}
