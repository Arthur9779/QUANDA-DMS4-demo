import { z } from "zod";
import {
  ConceptSourceSchema,
  ConceptStatusSchema,
  TutorialTypeSchema,
  TutorialVerificationStatusSchema,
} from "@/src/contracts/knowledge";

export const BENCHMARK_VERSION = 1 as const;
export const PREDICTION_FIXTURE_VERSION = 1 as const;

const LabelSchema = z.string().trim().min(1).max(240);

export const EvaluationConceptExpectationSchema = z.object({
  label: LabelSchema,
  ontologyId: z.string().trim().min(1).max(160).optional(),
});

export const AcceptableConceptGroupSchema = z.object({
  description: z.string().trim().min(1).max(400),
  concepts: z.array(EvaluationConceptExpectationSchema).min(2).max(12),
  minimumMatches: z.number().int().min(1).max(12).default(1),
});

export const BenchmarkCaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.enum(["en", "vi"]),
  disciplines: z.array(LabelSchema).min(1).max(8),
  input: z.object({
    projectBrief: z.string().trim().min(20).max(3000),
    currentExperience: z.string().trim().min(2).max(1200),
    requiredApplications: z.array(LabelSchema).max(12).default([]),
    outputType: LabelSchema,
    tutorialLanguage: z.enum(["en", "vi", "either"]),
    softwareVersions: z.array(LabelSchema).max(12).default([]),
  }),
  expected: z.object({
    requiredConcepts: z.array(EvaluationConceptExpectationSchema).max(40),
    preferredConcepts: z.array(EvaluationConceptExpectationSchema).max(40),
    acceptableInferredConcepts: z.array(EvaluationConceptExpectationSchema).max(60),
    acceptableAnyOf: z.array(AcceptableConceptGroupSchema).max(12).default([]),
    forbiddenOrIrrelevantConcepts: z
      .array(EvaluationConceptExpectationSchema)
      .max(60),
    preserveAsUnknown: z.array(LabelSchema).max(20).default([]),
    expectedApplicationIds: z.array(LabelSchema).max(12),
    acceptableTutorialTopics: z.array(LabelSchema).max(40),
    irrelevantTutorialTopics: z.array(LabelSchema).max(40),
    acceptablePrerequisiteConcepts: z.array(LabelSchema).max(30).default([]),
    irrelevantPrerequisiteConcepts: z.array(LabelSchema).max(30).default([]),
    notes: z.string().trim().min(1).max(1000).optional(),
  }),
});

export const EvaluationBenchmarkSchema = z.object({
  benchmarkVersion: z.literal(BENCHMARK_VERSION),
  name: z.string().trim().min(1).max(200),
  cases: z.array(BenchmarkCaseSchema).min(1).max(500),
}).superRefine((benchmark, context) => {
  const ids = new Set<string>();
  benchmark.cases.forEach((benchmarkCase, index) => {
    if (ids.has(benchmarkCase.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate benchmark case ID: ${benchmarkCase.id}`,
        path: ["cases", index, "id"],
      });
    }
    ids.add(benchmarkCase.id);
  });
});

export const TutorialPredictionSchema = z.object({
  id: z.string().trim().min(1).max(200),
  title: LabelSchema,
  rank: z.number().int().positive().max(100),
  applicationId: LabelSchema.optional(),
  language: z.string().trim().min(2).max(35).optional(),
  versionCompatible: z.boolean().nullable().default(null),
  prerequisiteFit: z.boolean().nullable().default(null),
  relevance: z.enum(["acceptable", "irrelevant"]),
  verificationStatus: TutorialVerificationStatusSchema,
  tutorialType: TutorialTypeSchema,
  coveredRequiredConcepts: z.array(LabelSchema).max(40).default([]),
  overTeaching: z.boolean(),
  skillSpecific: z.boolean(),
});

export const BenchmarkPredictionSchema = z.object({
  caseId: z.string().trim().min(1).max(200),
  creativeDnaConcepts: z.array(z.object({
    label: LabelSchema,
    source: ConceptSourceSchema,
    status: ConceptStatusSchema,
  })).max(200).default([]),
  unknownConcepts: z.array(LabelSchema).max(80).default([]),
  tutorials: z.array(TutorialPredictionSchema).max(20),
});

export const EvaluationPredictionFixtureSchema = z.object({
  predictionFixtureVersion: z.literal(PREDICTION_FIXTURE_VERSION),
  name: z.string().trim().min(1).max(200),
  benchmarkVersion: z.literal(BENCHMARK_VERSION),
  predictions: z.array(BenchmarkPredictionSchema).min(1).max(500),
}).superRefine((fixture, context) => {
  const ids = new Set<string>();
  fixture.predictions.forEach((prediction, index) => {
    if (ids.has(prediction.caseId)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate prediction case ID: ${prediction.caseId}`,
        path: ["predictions", index, "caseId"],
      });
    }
    ids.add(prediction.caseId);
  });
});

export type EvaluationBenchmark = z.infer<typeof EvaluationBenchmarkSchema>;
export type EvaluationPredictionFixture = z.infer<
  typeof EvaluationPredictionFixtureSchema
>;
