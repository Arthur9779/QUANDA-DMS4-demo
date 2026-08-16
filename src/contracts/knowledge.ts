import { z } from "zod";

export const KNOWLEDGE_CONTRACT_VERSIONS = {
  creativeDna: 1,
  ontology: 1,
  tutorialMetadata: 1,
  tutorialMatchScore: 1,
} as const;

const ConfidenceSchema = z.number().finite().min(0).max(1);
const StableIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/);
const SemanticLabelSchema = z.string().trim().min(1).max(200);
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ConceptSourceSchema = z.enum([
  "explicit_requirement",
  "user_preference",
  "ai_inferred",
  "user_added",
]);

export const ConceptStatusSchema = z.enum([
  "unconfirmed",
  "user_confirmed",
  "user_rejected",
]);

export const ConceptEvidenceSchema = z.object({
  sourceField: z.enum([
    "projectBrief",
    "currentExperience",
    "requiredApplications",
    "outputType",
    "reference",
    "userEdit",
    "other",
  ]),
  excerpt: z.string().trim().min(1).max(400).optional(),
});

export const CreativeDNAConceptSchema = z.object({
  ontologyId: StableIdSchema.optional(),
  label: SemanticLabelSchema,
  category: z.string().trim().min(1).max(120).optional(),
  family: z.string().trim().min(1).max(120).optional(),
  source: ConceptSourceSchema,
  status: ConceptStatusSchema,
  confidence: ConfidenceSchema.optional(),
  evidence: ConceptEvidenceSchema.optional(),
});

export const UnknownConceptSchema = z.object({
  raw: z.string().trim().min(1).max(240),
  suggestedCategory: z.string().trim().min(1).max(120).optional(),
  nearestOntologyIds: z.array(StableIdSchema).max(8).default([]),
  confidence: ConfidenceSchema.optional(),
  source: ConceptSourceSchema,
  status: ConceptStatusSchema.default("unconfirmed"),
  evidence: ConceptEvidenceSchema.optional(),
});

export const ProjectConstraintSchema = z.object({
  id: StableIdSchema.optional(),
  label: SemanticLabelSchema,
  kind: z.enum([
    "hard_requirement",
    "preference",
    "deadline",
    "available_time",
    "deliverable",
    "resource",
    "accessibility",
    "other",
  ]),
  source: ConceptSourceSchema,
  status: ConceptStatusSchema,
  evidence: ConceptEvidenceSchema.optional(),
});

export const CreativeDNASchema = z.object({
  creativeDnaVersion: z.literal(KNOWLEDGE_CONTRACT_VERSIONS.creativeDna),
  projectIntent: z.string().trim().min(1).max(1200),
  concepts: z.array(CreativeDNAConceptSchema).max(200),
  unknownConcepts: z.array(UnknownConceptSchema).max(80),
  constraints: z.array(ProjectConstraintSchema).max(80),
});

export const OntologyNodeSchema = z.object({
  ontologySchemaVersion: z.literal(KNOWLEDGE_CONTRACT_VERSIONS.ontology),
  id: StableIdSchema,
  label: SemanticLabelSchema,
  family: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120),
  normalizedLabel: z.string().trim().min(1).max(200),
  aliases: z.array(SemanticLabelSchema).max(80).default([]),
  description: z.string().trim().min(1).max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const OntologyRelationshipTypeSchema = z.enum([
  "is_a",
  "part_of",
  "related_to",
  "requires",
  "prerequisite_of",
  "used_for",
  "implemented_with",
  "supported_by",
  "similar_to",
  "opposite_of",
  "influenced_by",
  "commonly_combined_with",
  "alternative_to",
]);

export const OntologyRelationshipSchema = z.object({
  ontologySchemaVersion: z.literal(KNOWLEDGE_CONTRACT_VERSIONS.ontology),
  sourceId: StableIdSchema,
  targetId: StableIdSchema,
  type: OntologyRelationshipTypeSchema,
  confidence: ConfidenceSchema.optional(),
  origin: z.enum(["curated", "generated", "user_feedback"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const TutorialVerificationStatusSchema = z.enum([
  "verified",
  "indexed",
  "unverified",
  "stale",
  "broken",
]);

export const TutorialTypeSchema = z.enum([
  "focused",
  "project_based",
  "broad_course",
  "reference",
  "other",
]);

export const TutorialMetadataSchema = z.object({
  tutorialMetadataVersion: z.literal(
    KNOWLEDGE_CONTRACT_VERSIONS.tutorialMetadata,
  ),
  id: StableIdSchema,
  provider: z.enum(["quanda_catalog", "youtube", "other"]),
  externalId: z.string().trim().min(1).max(240).optional(),
  title: SemanticLabelSchema,
  creator: z.string().trim().min(1).max(200).optional(),
  url: z.url(),
  language: z.string().trim().min(2).max(35).optional(),
  durationMinutes: z.number().finite().positive().max(10_000).optional(),
  publishedAt: IsoDateSchema.optional(),
  verifiedAt: IsoDateSchema.optional(),
  softwareIds: z.array(StableIdSchema).max(40).default([]),
  softwareVersions: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  skillIds: z.array(StableIdSchema).max(120).default([]),
  techniqueIds: z.array(StableIdSchema).max(120).default([]),
  prerequisiteIds: z.array(StableIdSchema).max(120).default([]),
  aestheticIds: z.array(StableIdSchema).max(120).default([]),
  productionStageIds: z.array(StableIdSchema).max(80).default([]),
  outputIds: z.array(StableIdSchema).max(80).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "mixed"]).optional(),
  tutorialType: TutorialTypeSchema.optional(),
  sourceQuality: ConfidenceSchema.optional(),
  classificationConfidence: ConfidenceSchema.optional(),
  status: TutorialVerificationStatusSchema.default("unverified"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const TUTORIAL_SOURCE_PRIORITY = [
  "verified_quanda_catalog",
  "indexed_classified",
  "live_external_discovery",
  "no_suitable_tutorial",
] as const;

export const TutorialMatchPositiveSignalsSchema = z.object({
  requiredSkill: ConfidenceSchema,
  applicationOrTool: ConfidenceSchema,
  technique: ConfidenceSchema,
  productionStage: ConfidenceSchema,
  deliverableOrOutput: ConfidenceSchema,
  experienceLevel: ConfidenceSchema,
  language: ConfidenceSchema,
  softwareVersion: ConfidenceSchema,
  availableTime: ConfidenceSchema,
  prerequisiteFit: ConfidenceSchema,
  sourceReliability: ConfidenceSchema,
  tutorialSpecificity: ConfidenceSchema,
  aestheticSimilarity: ConfidenceSchema,
});

export const TutorialMatchPenaltySignalsSchema = z.object({
  topicConflict: ConfidenceSchema,
  staleContent: ConfidenceSchema,
  unverifiedContent: ConfidenceSchema,
  brokenLink: ConfidenceSchema,
  prerequisiteMismatch: ConfidenceSchema,
  excessiveBreadth: ConfidenceSchema,
});

export const TutorialMatchScoreConfigSchema = z.object({
  tutorialMatchScoreVersion: z.literal(
    KNOWLEDGE_CONTRACT_VERSIONS.tutorialMatchScore,
  ),
  positiveWeights: TutorialMatchPositiveSignalsSchema,
  penaltyWeights: TutorialMatchPenaltySignalsSchema,
  minimumScore: z.number().finite(),
  hardRejectBrokenLinks: z.boolean(),
  hardRejectTopicConflicts: z.boolean(),
});

export const TutorialMatchCandidateSignalsSchema = z.object({
  tutorialId: StableIdSchema,
  positive: TutorialMatchPositiveSignalsSchema,
  penalties: TutorialMatchPenaltySignalsSchema,
});

export type ConceptSource = z.infer<typeof ConceptSourceSchema>;
export type ConceptStatus = z.infer<typeof ConceptStatusSchema>;
export type CreativeDNAConcept = z.infer<typeof CreativeDNAConceptSchema>;
export type UnknownConcept = z.infer<typeof UnknownConceptSchema>;
export type ProjectConstraint = z.infer<typeof ProjectConstraintSchema>;
export type CreativeDNA = z.infer<typeof CreativeDNASchema>;
export type OntologyNode = z.infer<typeof OntologyNodeSchema>;
export type OntologyRelationship = z.infer<typeof OntologyRelationshipSchema>;
export type TutorialMetadata = z.infer<typeof TutorialMetadataSchema>;
export type TutorialMatchScoreConfig = z.infer<
  typeof TutorialMatchScoreConfigSchema
>;
