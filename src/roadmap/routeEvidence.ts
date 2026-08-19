import { z } from "zod";
import { getApplicationName } from "@/src/data/applications";
import { getDaysRemaining, calculateAvailableMinutes } from "@/src/lib/feasibility";
import type { SkillGap } from "@/src/contracts/knowledge";
import type { RoadmapResponse, RoadmapRequest, OutputType } from "@/src/types";
import type { RoadmapGenerationInput } from "./contracts";

const OUTPUT_PROFILES: Record<OutputType, {
  defaultApplicationId: string;
  alternatives: string[];
  technique: string;
}> = {
  video: { defaultApplicationId: "after-effects", alternatives: ["blender", "davinci-resolve"], technique: "Motion blocking and keyframe animation" },
  "3d": { defaultApplicationId: "blender", alternatives: ["after-effects", "procreate"], technique: "3D modelling and material setup" },
  graphic: { defaultApplicationId: "illustrator", alternatives: ["photoshop", "procreate"], technique: "Composition, typography, and visual hierarchy" },
  uiux: { defaultApplicationId: "figma", alternatives: ["photoshop", "illustrator"], technique: "Wireframing and interactive prototyping" },
  audio: { defaultApplicationId: "audacity", alternatives: ["fl-studio"], technique: "Audio editing and mix cleanup" },
  photo: { defaultApplicationId: "photoshop", alternatives: ["procreate", "illustrator"], technique: "Non-destructive photo editing" },
  other: { defaultApplicationId: "blender", alternatives: ["photoshop", "figma"], technique: "The primary technique required by the brief" },
};

const APPLICATION_ALIASES: Record<string, string[]> = {
  blender: ["blender"],
  photoshop: ["photoshop", "adobe photoshop"],
  illustrator: ["illustrator", "adobe illustrator"],
  "after-effects": ["after effects", "adobe after effects"],
  "premiere-pro": ["premiere", "premiere pro", "adobe premiere"],
  "davinci-resolve": ["davinci", "davinci resolve"],
  figma: ["figma"],
  procreate: ["procreate"],
  audacity: ["audacity"],
  "fl-studio": ["fl studio"],
};

const RouteReasonCodeSchema = z.enum([
  "required-tool", "existing-tool", "output-fit", "required-tool-wins",
  "existing-tool-wins", "switch-cost", "output-mismatch", "no-need-to-switch",
]);

export const RouteEvidenceSchema = z.object({
  primaryApplicationId: z.string().min(1).max(160),
  primaryReasonCode: RouteReasonCodeSchema,
  primarySkillLevel: z.enum(["beginner", "intermediate", "advanced", "not-stated"]),
  selectedTechnique: z.string().min(2).max(240),
  routes: z.array(z.object({
    applicationId: z.string().min(1).max(160),
    status: z.enum(["selected", "rejected"]),
    reasonCode: RouteReasonCodeSchema,
  })).min(1).max(5),
  skippedLearning: z.array(z.string().min(2).max(300)).min(1).max(6),
  estimatedLearningAvoidedMinutes: z.number().int().nonnegative().nullable(),
  basis: z.object({
    outputType: z.string().min(1).max(80),
    requiredApplicationIds: z.array(z.string().min(1).max(160)).max(11),
    knownApplications: z.array(z.object({
      applicationId: z.string().min(1).max(160),
      level: z.enum(["beginner", "intermediate", "advanced", "not-stated"]),
    })).max(20),
    daysRemaining: z.number().int().nonnegative(),
    availableMinutes: z.number().int().nonnegative(),
  }),
});

export type RouteEvidence = z.infer<typeof RouteEvidenceSchema>;

function levelFromContext(context: string): RouteEvidence["primarySkillLevel"] {
  if (/advanced|expert|professional|nâng cao|chuyên nghiệp/i.test(context)) return "advanced";
  if (/intermediate|trung cấp|mid-level|khá|thành thạo/i.test(context)) return "intermediate";
  if (/beginner|new|complete beginner|mới|chưa từng|hoàn toàn mới/i.test(context)) return "beginner";
  return "not-stated";
}

function knownApplications(experience: string) {
  const text = experience.toLocaleLowerCase();
  return Object.entries(APPLICATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => text.includes(alias)))
    .map(([applicationId, aliases]) => {
      const alias = aliases.find((item) => text.includes(item)) ?? applicationId;
      const index = text.indexOf(alias);
      return {
        applicationId,
        level: levelFromContext(experience.slice(Math.max(0, index - 12), index + alias.length + 90)),
      };
    });
}

function supportsOutput(applicationId: string, outputType: OutputType) {
  const profile = OUTPUT_PROFILES[outputType];
  return applicationId === profile.defaultApplicationId || profile.alternatives.includes(applicationId);
}

function skillRank(level: RouteEvidence["primarySkillLevel"]) {
  return { advanced: 3, intermediate: 2, beginner: 1, "not-stated": 0 }[level];
}

export function buildRouteEvidence(request: RoadmapRequest, skillGaps: SkillGap[] = []): RouteEvidence {
  const profile = OUTPUT_PROFILES[request.outputType];
  const required = [...new Set(request.requiredApplications)];
  const known = knownApplications(request.currentExperience);
  const knownMap = new Map(known.map((item) => [item.applicationId, item]));
  const viableKnown = known
    .filter((item) => skillRank(item.level) >= 2 && supportsOutput(item.applicationId, request.outputType))
    .sort((a, b) => skillRank(b.level) - skillRank(a.level));
  const primaryApplicationId = required[0] ?? viableKnown[0]?.applicationId ?? profile.defaultApplicationId;
  const primarySkillLevel = knownMap.get(primaryApplicationId)?.level ?? "not-stated";
  const primaryReasonCode: RouteEvidence["primaryReasonCode"] = required.length
    ? "required-tool"
    : viableKnown.length
      ? "existing-tool"
      : "output-fit";
  const candidateIds = [...new Set([
    primaryApplicationId, ...known.map((item) => item.applicationId), ...required, ...profile.alternatives,
  ])].slice(0, 5);
  const routes = candidateIds.map((applicationId): RouteEvidence["routes"][number] => {
    if (applicationId === primaryApplicationId) return { applicationId, status: "selected", reasonCode: primaryReasonCode };
    const knownCandidate = knownMap.get(applicationId);
    const reasonCode = knownCandidate && skillRank(knownCandidate.level) >= 2
      ? primaryReasonCode === "required-tool" ? "required-tool-wins" : "existing-tool-wins"
      : supportsOutput(applicationId, request.outputType) ? "switch-cost" : "output-mismatch";
    return { applicationId, status: "rejected", reasonCode };
  });
  const knownMinutes = skillGaps
    .filter((gap) => gap.status === "known" && gap.softwareIds.includes(primaryApplicationId))
    .reduce((sum, gap) => sum + (gap.estimatedLearningMinutes ?? 0), 0);

  return {
    primaryApplicationId, primaryReasonCode, primarySkillLevel,
    selectedTechnique: profile.technique, routes,
    skippedLearning: [
      ...(primarySkillLevel === "intermediate" || primarySkillLevel === "advanced"
        ? ["A full beginner course in " + getApplicationName(primaryApplicationId)] : []),
      "Parallel comparison of multiple applications",
    ],
    estimatedLearningAvoidedMinutes: knownMinutes > 0 ? knownMinutes : null,
    basis: {
      outputType: request.outputType,
      requiredApplicationIds: required,
      knownApplications: known,
      daysRemaining: getDaysRemaining(request.deadline),
      availableMinutes: calculateAvailableMinutes(request.deadline, request.hoursPerDay, request.daysPerWeek),
    },
  };
}

export function attachRouteEvidence(
  roadmap: RoadmapResponse,
  input: Pick<RoadmapGenerationInput, "projectInput" | "skillGaps">,
): RoadmapResponse {
  const routeEvidence = buildRouteEvidence(input.projectInput, input.skillGaps);
  return {
    ...roadmap,
    routeEvidence,
    stages: roadmap.stages.map((stage) => ({
      ...stage,
      applicationId: stage.applicationId ?? routeEvidence.primaryApplicationId,
    })),
  };
}
