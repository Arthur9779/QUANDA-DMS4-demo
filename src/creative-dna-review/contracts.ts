import { z } from "zod";
import { ProjectAnalysisResponseSchema } from "@/src/project-analysis/contracts";

export const CREATIVE_DNA_REVIEW_VERSION = 1 as const;

export const CreativeDnaReviewRecordSchema = z.object({
  reviewVersion: z.literal(CREATIVE_DNA_REVIEW_VERSION),
  inputFingerprint: z.string().regex(/^[a-f0-9]{8}$/),
  analysis: ProjectAnalysisResponseSchema,
  confirmed: z.boolean(),
});

export const OntologySearchResultSchema = z.object({
  id: z.string().min(1).max(160),
  label: z.string().min(1).max(200),
  family: z.string().min(1).max(120),
  category: z.string().min(1).max(120),
});

export const OntologySearchResponseSchema = z.object({
  results: z.array(OntologySearchResultSchema).max(15),
});

export type CreativeDnaReviewRecord = z.infer<
  typeof CreativeDnaReviewRecordSchema
>;
export type OntologySearchResult = z.infer<typeof OntologySearchResultSchema>;
