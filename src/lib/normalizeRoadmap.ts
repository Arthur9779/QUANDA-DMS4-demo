import {
  applications,
  getApplicationName,
  isCustomApplicationId,
  isSupportedApplicationId,
} from "@/src/data/applications";
import {
  calculateAvailableMinutes,
  getDaysRemaining,
  getFeasibilityMessage,
  getFeasibilityStatus,
} from "@/src/lib/feasibility";
import {
  fillTutorialIds,
  validateTutorialIds,
} from "@/src/lib/tutorialMatcher";
import type { RoadmapRequest, RoadmapResponse } from "@/src/types";

const applicationIds = new Set(applications.map((application) => application.id));

function resolveAllowedApplicationId(
  applicationId: string | null,
  allowedApplicationIds: Set<string>,
): string | null {
  if (!applicationId) return null;
  if (allowedApplicationIds.has(applicationId)) return applicationId;

  const normalizedName = applicationId.trim().toLocaleLowerCase();
  return (
    [...allowedApplicationIds].find(
      (allowedId) =>
        isCustomApplicationId(allowedId) &&
        getApplicationName(allowedId).toLocaleLowerCase() === normalizedName,
    ) ?? null
  );
}

export function normalizeRoadmap(
  roadmap: RoadmapResponse,
  request: RoadmapRequest,
  options: { allowedTutorialIds?: ReadonlySet<string> } = {},
): RoadmapResponse {
  const requestedApplicationIds = new Set(
    request.requiredApplications.filter(isSupportedApplicationId),
  );
  const allowedApplicationIds =
    requestedApplicationIds.size > 0 ? requestedApplicationIds : applicationIds;
  const seenIds = new Set<string>();
  const stages = roadmap.stages.slice(0, 8).map((stage, index) => {
    const fallbackId = `stage-${index + 1}`;
    const baseId = stage.id.trim() || fallbackId;
    const id = seenIds.has(baseId) ? fallbackId : baseId;
    const validDependencies = stage.dependsOnStageIds.filter((dependency) =>
      seenIds.has(dependency),
    );
    seenIds.add(id);

    const normalizedStage = {
      ...stage,
      id,
      order: index + 1,
      applicationId: resolveAllowedApplicationId(
        stage.applicationId,
        allowedApplicationIds,
      ),
      learningMinutes: Math.max(1, Math.round(stage.learningMinutes)),
      productionMinutes: Math.max(1, Math.round(stage.productionMinutes)),
      dependsOnStageIds: [...new Set(validDependencies)],
      tutorialIds: options.allowedTutorialIds
        ? stage.tutorialIds.filter((id) => options.allowedTutorialIds!.has(id)).slice(0, 3)
        : validateTutorialIds(stage.tutorialIds).slice(0, 3),
      productionTasks: stage.productionTasks?.length ? stage.productionTasks : stage.tasks,
      learningTasks: stage.learningTasks ?? [],
      definitionOfDone: stage.definitionOfDone?.length
        ? stage.definitionOfDone
        : [stage.goal],
    };

    return options.allowedTutorialIds
      ? normalizedStage
      : {
          ...normalizedStage,
          tutorialIds: fillTutorialIds(normalizedStage, request.tutorialLanguage),
        };
  });

  const totalEstimatedMinutes = stages.reduce(
    (total, stage) =>
      total + stage.learningMinutes + stage.productionMinutes,
    0,
  );
  const availableMinutes = calculateAvailableMinutes(
    request.deadline,
    request.hoursPerDay,
    request.daysPerWeek,
  );
  const status = getFeasibilityStatus(totalEstimatedMinutes, availableMinutes);
  const stageIds = new Set(stages.map((stage) => stage.id));
  const schedule = roadmap.schedule
    .map((item) => ({
      ...item,
      stageIds: [...new Set(item.stageIds.filter((id) => stageIds.has(id)))],
      plannedMinutes: Math.max(1, Math.round(item.plannedMinutes)),
    }))
    .filter((item) => item.stageIds.length > 0);

  return {
    ...roadmap,
    id: roadmap.id.trim() || crypto.randomUUID(),
    language: request.interfaceLanguage,
    totalEstimatedMinutes,
    feasibility: {
      status,
      message: getFeasibilityMessage(status, request.interfaceLanguage),
      daysRemaining: getDaysRemaining(request.deadline),
      availableMinutes,
      estimatedRequiredMinutes: totalEstimatedMinutes,
    },
    stages,
    schedule:
      schedule.length > 0
        ? schedule
        : stages.map((stage, index) => ({
            label:
              request.interfaceLanguage === "en"
                ? `Work block ${index + 1}`
                : `Buổi làm việc ${index + 1}`,
            stageIds: [stage.id],
            plannedMinutes:
              stage.learningMinutes + stage.productionMinutes,
            priority:
              index < 2
                ? ("high" as const)
                : index === stages.length - 1
                  ? ("low" as const)
                  : ("medium" as const),
          })),
    source: "ai",
  };
}
