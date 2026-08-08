import { applications } from "@/src/data/applications";
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

export function normalizeRoadmap(
  roadmap: RoadmapResponse,
  request: RoadmapRequest,
): RoadmapResponse {
  const requestedApplicationIds = new Set(
    request.requiredApplications.filter((id) => applicationIds.has(id)),
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
      applicationId:
        stage.applicationId && allowedApplicationIds.has(stage.applicationId)
          ? stage.applicationId
          : null,
      learningMinutes: Math.max(1, Math.round(stage.learningMinutes)),
      productionMinutes: Math.max(1, Math.round(stage.productionMinutes)),
      dependsOnStageIds: [...new Set(validDependencies)],
      tutorialIds: validateTutorialIds(stage.tutorialIds).slice(0, 3),
    };

    return {
      ...normalizedStage,
      tutorialIds: fillTutorialIds(
        normalizedStage,
        request.tutorialLanguage,
      ),
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
