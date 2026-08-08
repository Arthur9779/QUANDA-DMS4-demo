import type { Tutorial } from "@/src/lib/tutorialMatcher";
import type { RoadmapRequest } from "@/src/types";

interface BuildPromptOptions {
  request: RoadmapRequest;
  daysRemaining: number;
  availableMinutes: number;
  candidateTutorials: Tutorial[];
  supportedApplicationIds: string[];
}

export function buildRoadmapPrompt({
  request,
  daysRemaining,
  availableMinutes,
  candidateTutorials,
  supportedApplicationIds,
}: BuildPromptOptions): string {
  const languageName =
    request.interfaceLanguage === "vi" ? "Vietnamese" : "English";
  const compactTutorials = candidateTutorials.map((tutorial) => ({
    id: tutorial.id,
    applicationId: tutorial.applicationId,
    language: tutorial.language,
    level: tutorial.level,
    topics: tutorial.topics,
    durationMinutes: tutorial.durationMinutes,
  }));

  return `
Build a deadline-aware creative project roadmap from the normalized input below.

TARGET_LANGUAGE: ${languageName}
DAYS_REMAINING: ${daysRemaining}
AVAILABLE_MINUTES_BEFORE_DEADLINE: ${availableMinutes}
SUPPORTED_APPLICATION_IDS: ${JSON.stringify(supportedApplicationIds)}
CANDIDATE_TUTORIALS: ${JSON.stringify(compactTutorials)}
NORMALIZED_INPUT: ${JSON.stringify(request)}

Return one valid JSON object only. Do not use Markdown. All user-visible strings must be in ${languageName}. Never output a URL.
${request.interfaceLanguage === "vi" ? "Write every generic heading, sentence, task, assumption, and warning in natural Vietnamese. Keep only brand and product names, file extensions, and established technical terms in English; never switch a whole phrase or sentence to English." : ""}

Use this exact JSON shape:
{
  "id": "short-roadmap-id",
  "language": "${request.interfaceLanguage}",
  "title": "string",
  "summary": "one paragraph",
  "feasibility": {
    "status": "comfortable | tight | unrealistic",
    "message": "string",
    "daysRemaining": ${daysRemaining},
    "availableMinutes": ${availableMinutes},
    "estimatedRequiredMinutes": 1
  },
  "totalEstimatedMinutes": 1,
  "assumptions": ["string"],
  "warnings": ["string"],
  "stages": [{
    "id": "unique-stage-id",
    "order": 1,
    "title": "string",
    "goal": "concrete output",
    "why": "reason this stage matters",
    "applicationId": "supported-id-or-null",
    "skillToLearn": "specific skill",
    "tasks": ["concrete task"],
    "learningMinutes": 1,
    "productionMinutes": 1,
    "dependsOnStageIds": [],
    "tutorialIds": ["candidate-id-only"]
  }],
  "schedule": [{
    "label": "string",
    "stageIds": ["stage-id"],
    "plannedMinutes": 1,
    "priority": "high | medium | low"
  }]
}

Validity rules:
- Build 4 to 8 concrete stages, ordered by real production dependency.
- Every stage must produce something observable; do not use a stage that only says "learn software".
- Use positive, plausible minute estimates and keep learning separate from production.
- The stage-time sum must approximately equal totalEstimatedMinutes.
- When NORMALIZED_INPUT.requiredApplications is non-empty, use only those application IDs or null. Never substitute an unselected application.
- When no application is required, use only IDs from SUPPORTED_APPLICATION_IDS when they are genuinely useful.
- Explain an application's purpose in the stage goal or why text.
- Dependencies may refer only to earlier stage IDs.
- Choose tutorial IDs only from CANDIDATE_TUTORIALS and return at most three per stage.
- If the project cannot fit, reduce advanced scope, protect required criteria, and explain the warning kindly.
- Do not present the roadmap as guaranteed professional or academic advice.
`.trim();
}

export function buildRepairPrompt(
  originalOutput: string,
  validationErrors: string,
  language: "en" | "vi",
): string {
  return `
Repair the following invalid QUANDA roadmap into one valid JSON object only.
Do not use Markdown. Do not add URLs or tutorial IDs that are absent from the original output.
Keep all user-visible text in ${language === "vi" ? "Vietnamese" : "English"}.
${language === "vi" ? "Use natural Vietnamese throughout. Keep only brand and product names, file extensions, and established technical terms in English; never switch a whole phrase or sentence to English." : ""}
The result must contain 4 to 8 stages and satisfy these validation errors:
${validationErrors}

INVALID_OUTPUT:
${originalOutput.slice(0, 24_000)}
`.trim();
}
