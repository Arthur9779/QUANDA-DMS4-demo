import { z } from "zod";
import { createHash } from "node:crypto";
import type { CreativeDNA, ProjectConstraint, SkillGap, TutorialNeed } from "@/src/contracts/knowledge";
import { CreativeDnaReviewRecordSchema } from "@/src/creative-dna-review/contracts";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import { LearningPlanSchema, type LearningPlan, type RankedTutorial } from "@/src/tutorial-matching/contracts";

export const ROADMAP_GENERATOR_VERSION = 1 as const;

export const RoadmapGenerationRequestSchema = z.object({
  project: RoadmapRequestSchema,
  review: CreativeDnaReviewRecordSchema.refine((review) => review.confirmed, {
    message: "Creative DNA must be confirmed before roadmap generation",
  }),
  learningPlan: LearningPlanSchema,
});

export type RoadmapGenerationRequest = z.infer<typeof RoadmapGenerationRequestSchema>;

export interface SelectedTutorial extends RankedTutorial {
  needId: string;
}

export interface RoadmapGenerationInput {
  projectInput: RoadmapGenerationRequest["project"];
  creativeDna: CreativeDNA;
  userCapabilities: SkillGap[];
  skillGaps: SkillGap[];
  tutorialNeeds: TutorialNeed[];
  selectedTutorials: SelectedTutorial[];
  constraints: ProjectConstraint[];
  ontologyVersion: number;
  inputFingerprint: string;
}

export function selectedTutorialsForPlan(plan: LearningPlan): SelectedTutorial[] {
  return plan.tutorialMatches.flatMap((match) => {
    if (!match.selectedTutorialId || match.rejectedTutorialIds.includes(match.selectedTutorialId)) {
      return [];
    }
    const selected = match.candidates.find(
      (candidate) => candidate.tutorial.id === match.selectedTutorialId,
    );
    return selected ? [{ ...selected, needId: match.needId }] : [];
  });
}

export function createRoadmapInput(value: RoadmapGenerationRequest): RoadmapGenerationInput {
  const inputFingerprint = createHash("sha256")
    .update(JSON.stringify({
      project: value.project,
      creativeDna: value.review.analysis.creativeDna,
      learningPlan: value.learningPlan,
      generator: ROADMAP_GENERATOR_VERSION,
    }))
    .digest("hex")
    .slice(0, 8);
  return {
    projectInput: value.project,
    creativeDna: value.review.analysis.creativeDna,
    userCapabilities: value.learningPlan.skillGaps.filter((gap) => gap.status === "known"),
    skillGaps: value.learningPlan.skillGaps,
    tutorialNeeds: value.learningPlan.tutorialNeeds,
    selectedTutorials: selectedTutorialsForPlan(value.learningPlan),
    constraints: value.review.analysis.creativeDna.constraints.filter(
      (constraint) => constraint.status !== "user_rejected",
    ),
    ontologyVersion: value.review.analysis.creativeDna.creativeDnaVersion,
    inputFingerprint,
  };
}
