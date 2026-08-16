import type { RoadmapRequest } from "@/src/types";

function stableProjectInput(request: RoadmapRequest): string {
  return JSON.stringify({
    projectBrief: request.projectBrief.trim(),
    deadline: request.deadline,
    currentExperience: request.currentExperience.trim(),
    hoursPerDay: request.hoursPerDay,
    daysPerWeek: request.daysPerWeek,
    requiredApplications: [...request.requiredApplications].sort(),
    outputType: request.outputType,
    targetQuality: request.targetQuality,
  });
}

export function createProjectInputFingerprint(request: RoadmapRequest): string {
  let hash = 0x811c9dc5;
  for (const character of stableProjectInput(request)) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
