import type { CreativeDNA } from "@/src/contracts/knowledge";
import {
  applications,
  getApplicationDefinition,
  getApplicationName,
  isCustomApplicationId,
} from "@/src/data/applications";
import { preciseTutorials } from "@/src/data/preciseTutorials";
import tutorials from "@/src/data/tutorials.json";
import { searchApplications } from "@/src/application-search/search";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { stableHash } from "@/src/tutorial-matching/hash";
import {
  DESIGN_APPLICATION_PATH_SCORING_VERSION,
  DESIGN_APPLICATION_PATH_VERSION,
  DesignApplicationPathDecisionSchema,
  type ApplicationPathComparison,
  type ApplicationPathFactor,
  type ApplicationPathScoreBreakdown,
  type DesignApplicationPathCandidate,
  type DesignApplicationPathDecision,
} from "./contracts";

interface DesignApplicationPathInput {
  interfaceLanguage: "en" | "vi";
  projectBrief: string;
  currentExperience: string;
  requiredApplications: string[];
  outputType: string;
  targetQuality: "basic" | "portfolio" | "unsure";
  tutorialLanguage: "en" | "vi" | "either";
  deadline?: string;
  hoursPerDay?: number;
  daysPerWeek?: number;
}

interface RouteSeed {
  applicationIds: string[];
}

const WEIGHTS: Record<ApplicationPathFactor, number> = {
  requirements: 0.3,
  deliverableFit: 0.22,
  familiarity: 0.16,
  techniqueCoverage: 0.12,
  tutorialCoverage: 0.08,
  switchingCost: 0.06,
  deadlineFit: 0.06,
};

const OUTPUT_PRIMARY_APPS: Record<string, string[]> = {
  video: ["after-effects", "davinci-resolve", "premiere-pro", "blender", "procreate"],
  "3d": ["blender"],
  graphic: ["illustrator", "photoshop", "procreate"],
  uiux: ["figma"],
  audio: ["fl-studio", "audacity"],
  photo: ["photoshop", "procreate"],
  other: [],
};

const OUTPUT_CATEGORY_FIT: Record<string, Partial<Record<NonNullable<ReturnType<typeof getApplicationDefinition>>["category"], number>>> = {
  video: { video: 96, "3d": 82, drawing: 62, graphics: 56, audio: 45, uiux: 24, custom: 68 },
  "3d": { "3d": 100, video: 48, graphics: 42, drawing: 34, audio: 18, uiux: 18, custom: 68 },
  graphic: { graphics: 100, drawing: 92, "3d": 54, video: 48, uiux: 48, audio: 16, custom: 68 },
  uiux: { uiux: 100, graphics: 58, video: 48, drawing: 36, "3d": 32, audio: 12, custom: 68 },
  audio: { audio: 100, video: 42, graphics: 18, drawing: 12, "3d": 12, uiux: 12, custom: 68 },
  photo: { graphics: 98, drawing: 58, video: 42, "3d": 30, uiux: 24, audio: 12, custom: 68 },
  other: { graphics: 62, drawing: 62, video: 62, "3d": 62, uiux: 62, audio: 62, custom: 68 },
};

const FACTOR_LABELS: Record<"en" | "vi", Record<ApplicationPathFactor, string>> = {
  en: {
    requirements: "hard-requirement fit",
    deliverableFit: "deliverable fit",
    familiarity: "software familiarity",
    techniqueCoverage: "technique coverage",
    tutorialCoverage: "verified learning support",
    switchingCost: "lower switching cost",
    deadlineFit: "deadline fit",
  },
  vi: {
    requirements: "mức đáp ứng yêu cầu bắt buộc",
    deliverableFit: "mức phù hợp với đầu ra",
    familiarity: "độ quen thuộc với phần mềm",
    techniqueCoverage: "mức bao phủ kỹ thuật",
    tutorialCoverage: "hỗ trợ học tập đã xác minh",
    switchingCost: "chi phí chuyển đổi thấp hơn",
    deadlineFit: "mức phù hợp với thời hạn",
  },
};

const normalized = (value: string) => normalizeOntologyLabel(value).replace(/[-_/]+/g, " ");
const unique = <T,>(values: T[]) => [...new Set(values)];
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function activeCreativeText(creativeDna: CreativeDNA): string {
  return normalized([
    creativeDna.projectIntent,
    ...creativeDna.concepts
      .filter((concept) => concept.status !== "user_rejected")
      .flatMap((concept) => [concept.label, concept.category ?? "", concept.family ?? ""]),
    ...creativeDna.unknownConcepts
      .filter((concept) => concept.status !== "user_rejected")
      .map((concept) => concept.raw),
  ].join(" "));
}

function inferredApplicationIds(input: DesignApplicationPathInput, creativeDna: CreativeDNA): string[] {
  const searchableText = normalized(`${input.projectBrief} ${input.currentExperience} ${activeCreativeText(creativeDna)}`);
  const builtIn = applications
    .filter((application) => searchableText.includes(normalized(application.name)) || searchableText.includes(normalized(application.id)))
    .map((application) => application.id);
  const ontologyApplications = creativeDna.concepts.flatMap((concept) => {
    if (concept.status === "user_rejected") return [];
    if (!/tool|software|application|creative coding|code editor|game engine/i.test(`${concept.family ?? ""} ${concept.category ?? ""}`)) return [];
    return searchApplications(concept.label, 1).map((application) => application.id);
  });
  return unique([...input.requiredApplications, ...builtIn, ...ontologyApplications]);
}

function primaryApplicationIds(input: DesignApplicationPathInput, creativeDna: CreativeDNA): string[] {
  const text = normalized(`${input.projectBrief} ${activeCreativeText(creativeDna)}`);
  const inferred = inferredApplicationIds(input, creativeDna);
  const defaults = [...(OUTPUT_PRIMARY_APPS[input.outputType] ?? OUTPUT_PRIMARY_APPS.other)];
  const boosted = defaults.sort((left, right) => {
    const leftDefinition = getApplicationDefinition(left);
    const rightDefinition = getApplicationDefinition(right);
    const overlap = (id: string) => getApplicationDefinition(id)?.commonUses.filter((use) => text.includes(normalized(use))).length ?? 0;
    return overlap(right) - overlap(left) ||
      Number(Boolean(rightDefinition && text.includes(normalized(rightDefinition.name)))) -
        Number(Boolean(leftDefinition && text.includes(normalized(leftDefinition.name))));
  });
  return unique([...input.requiredApplications, ...inferred, ...boosted]).slice(0, 6);
}

function complementaryApplication(primaryId: string, input: DesignApplicationPathInput): string | null {
  const primary = getApplicationDefinition(primaryId);
  const text = normalized(input.projectBrief);
  if (["video", "3d"].includes(input.outputType) && primary?.category !== "video") return "davinci-resolve";
  if (input.outputType === "video" && primaryId === "after-effects") return "premiere-pro";
  if (input.outputType === "graphic" && ["illustrator", "procreate"].includes(primaryId)) return "photoshop";
  if (input.outputType === "audio" && primaryId === "fl-studio") return "audacity";
  if (input.outputType === "uiux" && primaryId === "figma" && /motion|animat|transition|microinteraction/.test(text)) return "after-effects";
  return null;
}

function routeSeeds(input: DesignApplicationPathInput, creativeDna: CreativeDNA): RouteSeed[] {
  const primaryIds = primaryApplicationIds(input, creativeDna);
  const hard = unique(input.requiredApplications);
  const seeds: RouteSeed[] = [];
  const add = (applicationIds: string[]) => {
    const ids = unique(applicationIds).filter(Boolean).slice(0, 5);
    if (!ids.length || seeds.some((seed) => seed.applicationIds.join("|") === ids.join("|"))) return;
    seeds.push({ applicationIds: ids });
  };

  if (hard.length) {
    add(hard);
    const primary = hard[0];
    const complement = complementaryApplication(primary, input);
    if (complement && !hard.includes(complement)) add([...hard, complement]);
    if (["video", "3d"].includes(input.outputType) && !hard.includes("premiere-pro")) add([...hard, "premiere-pro"]);
    if (input.outputType === "video" && !hard.includes("davinci-resolve")) add([...hard, "davinci-resolve"]);
    for (const primary of primaryIds) {
      if (!hard.includes(primary)) add([...hard, primary]);
    }
  }

  for (const primary of primaryIds) {
    add([primary]);
    const complement = complementaryApplication(primary, input);
    if (complement && complement !== primary) add([primary, complement]);
  }

  return seeds.slice(0, 12);
}

function applicationMentioned(value: string, applicationId: string): boolean {
  const definition = getApplicationDefinition(applicationId);
  const names = [applicationId, getApplicationName(applicationId), ...(definition?.commonUses ?? [])]
    .map(normalized)
    .filter((item) => item.length >= 3);
  return names.some((name) => value.includes(name));
}

function requirementScore(applicationIds: string[], hardRequired: string[]): number {
  return hardRequired.every((requiredId) => applicationIds.includes(requiredId)) ? 100 : 0;
}

function coversCoreDeliverable(
  applicationIds: string[],
  input: DesignApplicationPathInput,
): boolean {
  const definitions = applicationIds.map((id) => getApplicationDefinition(id));
  const brief = normalized(input.projectBrief);
  const hasCategory = (category: string) =>
    definitions.some((definition) => definition?.category === category);
  const hasNamedCustomTool = applicationIds.some((id) =>
    isCustomApplicationId(id) && applicationMentioned(brief, id),
  );

  if (input.outputType === "video") {
    const needsMotionCreation = /animat|motion graphics|moving image|kinetic|frame by frame/.test(brief);
    if (!needsMotionCreation) return hasCategory("video") || hasNamedCustomTool;
    return applicationIds.some((id) =>
      ["after-effects", "blender", "procreate"].includes(id),
    ) || hasNamedCustomTool;
  }
  if (input.outputType === "3d") return hasCategory("3d") || hasNamedCustomTool;
  if (input.outputType === "uiux") return hasCategory("uiux") || hasNamedCustomTool;
  if (input.outputType === "audio") return hasCategory("audio") || hasNamedCustomTool;
  if (input.outputType === "graphic" || input.outputType === "photo") {
    return hasCategory("graphics") || hasCategory("drawing") || hasNamedCustomTool;
  }
  return true;
}

function deliverableFit(applicationIds: string[], input: DesignApplicationPathInput): number {
  const text = normalized(input.projectBrief);
  const fitByCategory = OUTPUT_CATEGORY_FIT[input.outputType] ?? OUTPUT_CATEGORY_FIT.other;
  let score = Math.max(...applicationIds.map((id) => {
    const definition = getApplicationDefinition(id);
    if (!definition) return applicationMentioned(text, id) ? 90 : 68;
    const base = fitByCategory[definition.category] ?? 35;
    const useMatches = definition.commonUses.filter((use) => text.includes(normalized(use))).length;
    return base + Math.min(12, useMatches * 4);
  }));
  const first = getApplicationDefinition(applicationIds[0]);
  const last = getApplicationDefinition(applicationIds.at(-1) ?? "");
  if (["video", "3d"].includes(input.outputType) && first?.category !== "video" && last?.category === "video") score += 10;
  if (input.outputType === "graphic" && applicationIds.includes("photoshop") && applicationIds.some((id) => ["illustrator", "procreate"].includes(id))) score += 7;
  if (input.outputType === "audio" && applicationIds.includes("fl-studio") && applicationIds.includes("audacity")) score += 7;
  return clamp(score);
}

function familiarityScore(applicationIds: string[], input: DesignApplicationPathInput): number {
  const experience = normalized(input.currentExperience);
  const mentionsSomeApplication = applications.some((application) => applicationMentioned(experience, application.id));
  const values = applicationIds.map((id) => {
    if (!applicationMentioned(experience, id)) return mentionsSomeApplication ? 34 : 50;
    const definition = getApplicationDefinition(id);
    const aliases = [id, getApplicationName(id), definition?.name ?? ""]
      .map(normalized)
      .filter(Boolean);
    const clauses = experience.split(/[,.!?;]|\bbut\b|\bhowever\b|\bnhung\b/);
    const localEvidence = clauses.find((clause) =>
      aliases.some((alias) => clause.includes(alias)),
    ) ?? experience;
    if (/advanced|expert|nang cao|chuyen sau/.test(localEvidence)) return 96;
    if (/intermediate|trung cap/.test(localEvidence)) return 86;
    if (/new to|complete beginner|beginner|never (used|tried)|do not know|don't know|moi bat dau|chua tung/.test(localEvidence)) return 38;
    if (/basic|basics|co ban/.test(localEvidence)) return 62;
    if (/know|use|used|familiar|comfortable|biet|quen|da dung/.test(localEvidence)) return 78;
    return 66;
  });
  return clamp(values.reduce((total, value) => total + value, 0) / values.length);
}

function techniqueCoverage(applicationIds: string[], input: DesignApplicationPathInput, creativeDna: CreativeDNA): number {
  const text = normalized(`${input.projectBrief} ${activeCreativeText(creativeDna)}`);
  const importantTokens = unique(text.split(/\s+/).filter((token) => token.length >= 5));
  const values = applicationIds.map((id) => {
    const definition = getApplicationDefinition(id);
    if (!definition) return applicationMentioned(text, id) ? 88 : 58;
    const capabilityTokens = unique(definition.commonUses.flatMap((use) => normalized(use).split(/\s+/)).filter((token) => token.length >= 4));
    const overlap = capabilityTokens.filter((token) => importantTokens.includes(token)).length;
    return 56 + Math.min(38, overlap * 9) + (applicationMentioned(text, id) ? 8 : 0);
  });
  return clamp(Math.max(...values));
}

function tutorialCoverage(applicationIds: string[], input: DesignApplicationPathInput): number {
  const preferred = input.tutorialLanguage === "either" ? input.interfaceLanguage : input.tutorialLanguage;
  const counts = applicationIds.map((id) => {
    const legacyCount = tutorials.filter((tutorial) => tutorial.applicationId === id && (tutorial.language === preferred || input.tutorialLanguage === "either")).length;
    const preciseCount = preciseTutorials.filter((tutorial) => tutorial.softwareIds.includes(id) && (tutorial.language === preferred || input.tutorialLanguage === "either")).length;
    return legacyCount + preciseCount;
  });
  const supported = counts.filter((count) => count > 0).length;
  const average = counts.reduce((total, count) => total + count, 0) / Math.max(1, counts.length);
  return clamp(28 + (supported / applicationIds.length) * 44 + Math.min(28, average * 5));
}

function productionEstimate(input: DesignApplicationPathInput, applicationCount: number): number {
  const baseByOutput: Record<string, number> = { video: 320, "3d": 260, graphic: 190, uiux: 230, audio: 190, photo: 160, other: 240 };
  const qualityMultiplier = input.targetQuality === "portfolio" ? 1.25 : input.targetQuality === "basic" ? 0.78 : 1;
  return Math.round((baseByOutput[input.outputType] ?? baseByOutput.other) * qualityMultiplier + Math.max(0, applicationCount - 1) * 35);
}

function learningEstimate(applicationIds: string[], input: DesignApplicationPathInput): number {
  const experience = normalized(input.currentExperience);
  return applicationIds.reduce((total, id) => total + (applicationMentioned(experience, id) ? 12 : 45), 0);
}

function availableMinutes(input: DesignApplicationPathInput): number {
  const deadline = input.deadline ? new Date(`${input.deadline}T23:59:59`) : new Date(Date.now() + 7 * 86_400_000);
  const days = Math.max(1, Math.ceil((deadline.getTime() - Date.now()) / 86_400_000));
  const workDays = Math.max(1, Math.ceil(days * Math.min(7, input.daysPerWeek ?? 5) / 7));
  return workDays * Math.max(0.5, input.hoursPerDay ?? 2) * 60;
}

function deadlineFit(input: DesignApplicationPathInput, learningMinutes: number, productionMinutes: number): number {
  const required = learningMinutes + productionMinutes;
  return clamp((availableMinutes(input) / Math.max(1, required)) * 100);
}

function fitBand(score: number): DesignApplicationPathCandidate["fitBand"] {
  if (score >= 82) return "strong";
  if (score >= 68) return "good";
  return "conditional";
}

function candidateFor(seed: RouteSeed, input: DesignApplicationPathInput, creativeDna: CreativeDNA): DesignApplicationPathCandidate {
  const hardRequired = unique(input.requiredApplications);
  const requirements = requirementScore(seed.applicationIds, hardRequired);
  const estimatedLearningMinutes = learningEstimate(seed.applicationIds, input);
  const estimatedProductionMinutes = productionEstimate(input, seed.applicationIds.length);
  const scoreBreakdown: ApplicationPathScoreBreakdown = {
    requirements,
    deliverableFit: deliverableFit(seed.applicationIds, input),
    familiarity: familiarityScore(seed.applicationIds, input),
    techniqueCoverage: techniqueCoverage(seed.applicationIds, input, creativeDna),
    tutorialCoverage: tutorialCoverage(seed.applicationIds, input),
    switchingCost: clamp(100 - Math.max(0, seed.applicationIds.length - 1) * 24),
    deadlineFit: deadlineFit(input, estimatedLearningMinutes, estimatedProductionMinutes),
  };
  const deliverableIsCovered = coversCoreDeliverable(seed.applicationIds, input);
  const viable = requirements === 100 && deliverableIsCovered;
  const score = viable
    ? clamp(Object.entries(WEIGHTS).reduce((total, [factor, weight]) => total + scoreBreakdown[factor as ApplicationPathFactor] * weight, 0))
    : 0;
  const names = seed.applicationIds.map(getApplicationName);
  const vi = input.interfaceLanguage === "vi";
  const strengths = [
    ...(hardRequired.length ? [vi ? "Giữ mọi ứng dụng bắt buộc trong đề bài." : "Preserves every application required by the brief."] : []),
    ...(scoreBreakdown.deliverableFit >= 86 ? [vi ? "Chuỗi ứng dụng phù hợp trực tiếp với loại đầu ra cần bàn giao." : "The application chain directly fits the required deliverable."] : []),
    ...(scoreBreakdown.familiarity >= 72 ? [vi ? "Tái sử dụng phần mềm mà bạn đã có kinh nghiệm." : "Reuses software already present in your experience."] : []),
    ...(scoreBreakdown.techniqueCoverage >= 80 ? [vi ? "Bao phủ tốt các kỹ thuật được xác nhận trong DNA sáng tạo." : "Strongly covers the techniques confirmed in the Creative DNA."] : []),
    ...(scoreBreakdown.tutorialCoverage >= 72 ? [vi ? "Có hỗ trợ học tập đã xác minh trong kho QUANDA." : "Has verified learning support in QUANDA's catalogue."] : []),
    ...(scoreBreakdown.deadlineFit >= 90 ? [vi ? "Phù hợp với quỹ thời gian hiện có." : "Fits the currently available time."] : []),
  ].slice(0, 5);
  const tradeoffs = [
    ...(seed.applicationIds.length > 1 ? [vi ? `Cần ${seed.applicationIds.length - 1} lần bàn giao giữa ứng dụng.` : `Requires ${seed.applicationIds.length - 1} application handoff${seed.applicationIds.length > 2 ? "s" : ""}.`] : []),
    ...(scoreBreakdown.familiarity < 60 ? [vi ? "Có phần mềm chưa xuất hiện trong kinh nghiệm bạn đã mô tả." : "Includes software not present in your stated experience."] : []),
    ...(scoreBreakdown.tutorialCoverage < 65 ? [vi ? "Kho QUANDA hiện có ít tài nguyên đã xác minh hơn cho tuyến này." : "QUANDA currently has less verified learning coverage for this route."] : []),
    ...(scoreBreakdown.deadlineFit < 80 ? [vi ? "Ước tính công việc và học tập có thể vượt quỹ thời gian." : "Estimated production and learning may exceed the available time."] : []),
  ].slice(0, 5);
  return {
    id: `design-path:${stableHash(seed.applicationIds.join("|"))}`,
    title: vi ? `Quy trình ${names.join(" → ")}` : `${names.join(" → ")} workflow`,
    applicationIds: seed.applicationIds,
    applicationNames: names,
    viable,
    score,
    fitBand: fitBand(score),
    scoreBreakdown,
    estimatedLearningMinutes,
    estimatedProductionMinutes,
    strengths,
    tradeoffs,
    rejectionReasons: viable
      ? []
      : [
          ...hardRequired
            .filter((id) => !seed.applicationIds.includes(id))
            .map((id) => vi ? `Thiếu ứng dụng bắt buộc: ${getApplicationName(id)}.` : `Missing required application: ${getApplicationName(id)}.`),
          ...(!deliverableIsCovered
            ? [vi ? "Tuyến này không bao phủ khả năng cốt lõi cần để tạo đầu ra." : "This route does not cover the core capability needed to create the deliverable."]
            : []),
        ],
  };
}

function comparisonFor(winner: DesignApplicationPathCandidate, alternative: DesignApplicationPathCandidate, language: "en" | "vi"): ApplicationPathComparison {
  const factors = Object.keys(WEIGHTS) as ApplicationPathFactor[];
  const winnerAdvantages = factors
    .map((factor) => ({ factor, points: winner.scoreBreakdown[factor] - alternative.scoreBreakdown[factor] }))
    .filter((item) => item.points >= 4)
    .sort((left, right) => right.points - left.points)
    .slice(0, 3);
  const alternativeAdvantages = factors
    .map((factor) => ({ factor, points: alternative.scoreBreakdown[factor] - winner.scoreBreakdown[factor] }))
    .filter((item) => item.points >= 4)
    .sort((left, right) => right.points - left.points)
    .slice(0, 2);
  const labels = FACTOR_LABELS[language];
  const winnerText = winnerAdvantages.length
    ? winnerAdvantages.slice(0, 2).map((item) => `${labels[item.factor]} (+${item.points})`).join(language === "vi" ? " và " : " and ")
    : language === "vi" ? "tổng điểm cân bằng hơn" : "a better-balanced total score";
  const summary = language === "vi"
    ? `${winner.title} xếp trên ${alternative.title} chủ yếu nhờ ${winnerText}.`
    : `${winner.title} ranks above ${alternative.title} mainly through ${winnerText}.`;
  return {
    alternativePathId: alternative.id,
    summary,
    winnerAdvantages,
    alternativeAdvantages,
  };
}

export function scoreDesignApplicationPaths(
  input: DesignApplicationPathInput,
  creativeDna: CreativeDNA,
): DesignApplicationPathDecision {
  const candidates = routeSeeds(input, creativeDna).map((seed) => candidateFor(seed, input, creativeDna));
  const viable = candidates.filter((candidate) => candidate.viable).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  const rejected = candidates.filter((candidate) => !candidate.viable).sort((left, right) => left.id.localeCompare(right.id));
  const recommended = viable[0] ?? candidateFor({ applicationIds: input.requiredApplications.length ? input.requiredApplications : ["photoshop"] }, input, creativeDna);
  const alternatives = viable.slice(1, 5);
  return DesignApplicationPathDecisionSchema.parse({
    applicationPathVersion: DESIGN_APPLICATION_PATH_VERSION,
    scoringVersion: DESIGN_APPLICATION_PATH_SCORING_VERSION,
    branch: "design",
    hardRequiredApplicationIds: unique(input.requiredApplications),
    recommended,
    alternatives,
    rejected: rejected.slice(0, 8),
    comparisons: alternatives.map((alternative) => comparisonFor(recommended, alternative, input.interfaceLanguage)),
    evaluatedPathCount: candidates.length,
  });
}

export function recommendedApplicationIds(decision: DesignApplicationPathDecision): string[] {
  return decision.recommended.applicationIds.filter((id) => !isCustomApplicationId(id) || id.length <= 80);
}
