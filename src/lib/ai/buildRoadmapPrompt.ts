import type { RoadmapGenerationInput } from "@/src/roadmap";

interface BuildPromptOptions {
  input: RoadmapGenerationInput;
  daysRemaining: number;
  availableMinutes: number;
}

export function buildRoadmapPrompt({
  input,
  daysRemaining,
  availableMinutes,
}: BuildPromptOptions): string {
  const request = input.projectInput;
  const languageName =
    request.interfaceLanguage === "vi" ? "Vietnamese" : "English";
  const compactTutorials = input.selectedTutorials.map((selected) => ({
    id: selected.tutorial.id,
    needId: selected.needId,
    title: selected.tutorial.title,
    softwareIds: selected.tutorial.softwareIds,
    skillIds: selected.tutorial.skillIds,
    techniqueIds: selected.tutorial.techniqueIds,
    durationMinutes: selected.tutorial.durationMinutes,
  }));

  return `
Build a deadline-aware project roadmap from the normalized input below. The project may use creative software, a coding environment, a game engine, a technical tool, or a custom application/platform.

TARGET_LANGUAGE: ${languageName}
DAYS_REMAINING: ${daysRemaining}
AVAILABLE_MINUTES_BEFORE_DEADLINE: ${availableMinutes}
CONFIRMED_CREATIVE_DNA: ${JSON.stringify({
  projectIntent: input.creativeDna.projectIntent,
  concepts: input.creativeDna.concepts.filter((concept) => concept.status === "user_confirmed"),
  unknownConcepts: input.creativeDna.unknownConcepts.filter((concept) => concept.status === "user_confirmed"),
})}
EXPLICIT_CONSTRAINTS: ${JSON.stringify(input.constraints)}
KNOWN_SKILLS: ${JSON.stringify(input.userCapabilities.map((gap) => ({ id: gap.skillId, label: gap.label })))}
SKILL_GAPS: ${JSON.stringify(input.skillGaps.filter((gap) => ["needs_learning", "partial"].includes(gap.status)))}
TUTORIAL_NEEDS: ${JSON.stringify(input.tutorialNeeds.filter((need) => need.status === "active"))}
SELECTED_TUTORIALS_ONLY: ${JSON.stringify(compactTutorials)}
PROJECT_INPUT: ${JSON.stringify(request)}

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
    "tutorialIds": ["selected-tutorial-id-only"],
    "productionTasks": ["concrete project work"],
    "learningTasks": ["only missing skill needed now"],
    "definitionOfDone": ["observable completion criterion"],
    "classification": "required | useful | optional",
    "creativeDnaIds": ["confirmed-id-only"],
    "skillIds": ["required-skill-gap-id-only"]
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
- Treat this as a production plan with just-in-time learning, never a software course.
- When PROJECT_INPUT.requiredApplications is non-empty, use only those application IDs or null. Never substitute an unselected application.
- Treat every custom: application ID as the user's real, explicitly chosen tool. Preserve its ID and displayed name exactly; never replace it with a better-known application.
- When no application is required, use only an application named in PROJECT_INPUT when it is genuinely useful.
- Explain an application's purpose in the stage goal or why text.
- Dependencies may refer only to earlier stage IDs.
- Include every unique tutorial ID in SELECTED_TUTORIALS_ONLY exactly once across the roadmap. Group related skills and tutorials into the same production stage when necessary. Return at most twelve tutorial IDs per stage. Never invent a URL, tutorial ID, ontology ID, or software requirement.
- Do not teach any item in KNOWN_SKILLS. Cover every required SKILL_GAPS item with a matching learning task, then immediately attach it to project work.
- Every stage must include productionTasks and definitionOfDone. Keep learningTasks empty when no learning is needed.
- Preserve the literal wording of confirmed unknown Creative DNA concepts. Never re-add rejected concepts.
- If the project cannot fit, reduce advanced scope, protect required criteria, and explain the warning kindly.
- Do not present the roadmap as guaranteed professional or academic advice.
`.trim();
}

export function buildRepairPrompt(
  originalOutput: string,
  validationErrors: string,
  language: "en" | "vi",
  sourceRequirements = "",
): string {
  return `
Repair the following invalid QUANDA roadmap into one valid JSON object only.
Do not use Markdown. Never add URLs. Tutorial IDs may only come from SELECTED_TUTORIALS_ONLY in SOURCE_REQUIREMENTS.
Keep all user-visible text in ${language === "vi" ? "Vietnamese" : "English"}.
${language === "vi" ? "Use natural Vietnamese throughout. Keep only brand and product names, file extensions, and established technical terms in English; never switch a whole phrase or sentence to English." : ""}
The result must contain 4 to 8 stages and satisfy these validation errors:
${validationErrors}

SOURCE_REQUIREMENTS:
${sourceRequirements.slice(0, 30_000)}

INVALID_OUTPUT:
${originalOutput.slice(0, 24_000)}
`.trim();
}
