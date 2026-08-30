import { z } from "zod";
import {
  ConceptEvidenceSchema,
  ConceptSourceSchema,
  CreativeDNASchema,
  ProjectConstraintSchema,
} from "@/src/contracts/knowledge";
import { DesignApplicationPathDecisionSchema } from "@/src/application-paths/contracts";

const StableOntologyIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/);

export const ProjectAnalysisRequestSchema = z.object({
  interfaceLanguage: z.enum(["en", "vi"]),
  projectBrief: z.string().trim().min(20).max(3_000),
  currentExperience: z.string().trim().min(2).max(1_200),
  requiredApplications: z
    .array(z.string().trim().min(1).max(120))
    .max(12)
    .default([]),
  outputType: z.string().trim().min(1).max(120),
  targetQuality: z.enum(["basic", "portfolio", "unsure"]),
  tutorialLanguage: z.enum(["en", "vi", "either"]),
  deadline: z.string().date().optional(),
  hoursPerDay: z.number().finite().min(0.5).max(12).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
});

export const CreativeDnaModelConceptSchema = z
  .object({
    ontologyId: StableOntologyIdSchema,
    rawLabel: z.string().trim().min(1).max(240),
    source: ConceptSourceSchema.exclude(["user_added"]),
    confidence: z.number().finite().min(0).max(1),
    evidence: ConceptEvidenceSchema.optional(),
  })
  .strict();

export const CreativeDnaModelUnknownSchema = z
  .object({
    raw: z.string().trim().min(1).max(240),
    suggestedCategory: z.string().trim().min(1).max(120).optional(),
    nearestOntologyIds: z.array(StableOntologyIdSchema).max(8).default([]),
    confidence: z.number().finite().min(0).max(1).optional(),
    source: ConceptSourceSchema.exclude(["user_added"]),
    evidence: ConceptEvidenceSchema.optional(),
  })
  .strict();

export const CreativeDnaModelConstraintSchema = ProjectConstraintSchema.omit({
  id: true,
  status: true,
})
  .extend({ source: ConceptSourceSchema.exclude(["user_added"]) })
  .strict();

export const CreativeDnaModelOutputSchema = z
  .object({
    projectIntent: z.string().trim().min(1).max(1_200),
    concepts: z.array(CreativeDnaModelConceptSchema).max(120),
    unknownConcepts: z.array(CreativeDnaModelUnknownSchema).max(40),
    constraints: z.array(CreativeDnaModelConstraintSchema).max(40),
  })
  .strict();

export const ProjectAnalysisResponseSchema = z.object({
  creativeDna: CreativeDNASchema,
  // Optional only for backwards-compatible restoration of reviews saved before
  // application-path scoring existed. New analysis responses always include it.
  applicationPaths: DesignApplicationPathDecisionSchema.optional(),
  retrieval: z.object({
    candidateCount: z.number().int().nonnegative().max(150),
    backend: z.enum(["local", "gemini_file_search", "hybrid"]),
    fallbackUsed: z.boolean(),
  }),
  capabilityContext: z.object({
    currentExperience: z.string().trim().min(2).max(1_200),
    requiredApplications: z.array(z.string().trim().min(1).max(120)).max(12),
  }),
  source: z.enum(["ai", "fallback"]),
  diagnostics: z.object({
    classificationDurationMs: z.number().int().nonnegative(),
    retrievedCandidateIds: z.array(StableOntologyIdSchema).max(150),
    acceptedOntologyIds: z.array(StableOntologyIdSchema).max(200),
    rejectedOntologyIds: z.array(StableOntologyIdSchema).max(200),
    unknownConceptCount: z.number().int().nonnegative().max(80),
    fallbackUsed: z.boolean(),
    failureCode: z.string().regex(/^[A-Z0-9_]+$/).optional(),
  }),
});

export type ProjectAnalysisRequest = z.infer<
  typeof ProjectAnalysisRequestSchema
>;
export type CreativeDnaModelOutput = z.infer<
  typeof CreativeDnaModelOutputSchema
>;
export type ProjectAnalysisResponse = z.infer<
  typeof ProjectAnalysisResponseSchema
>;
