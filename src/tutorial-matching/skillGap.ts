import type {
  CreativeDNA,
  SkillGap,
  TutorialNeed,
} from "@/src/contracts/knowledge";
import { SkillGapSchema, TutorialNeedSchema } from "@/src/contracts/knowledge";
import { getApplicationName } from "@/src/data/applications";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { ontologyHasId } from "@/src/ontology/runtime";
import type { RoadmapRequest } from "@/src/types";

interface SkillDefinition {
  id: string;
  label: string;
  triggers: string[];
  knownAliases?: string[];
  softwareIds: string[];
  prerequisites?: string[];
  minutes: number;
  priority?: SkillGap["priority"];
  foundation?: boolean;
}

const SKILLS: SkillDefinition[] = [
  {
    id: "learning-classification.prerequisite-software-knowledge.viewport-navigation",
    label: "Basic viewport navigation",
    triggers: ["blender"],
    knownAliases: [
      "navigation",
      "điều hướng",
      "viewport",
      "blender modelling",
      "blender modeling",
    ],
    softwareIds: ["blender"],
    minutes: 10,
    foundation: true,
  },
  {
    id: "learning-classification.prerequisite-software-knowledge.materials",
    label: "Shader Editor and material basics",
    triggers: ["toon shading", "toon material", "chrome", "metallic pbr", "glossy"],
    knownAliases: ["materials", "material", "shader editor", "vật liệu", "shading"],
    softwareIds: ["blender"],
    prerequisites: [
      "learning-classification.prerequisite-software-knowledge.viewport-navigation",
    ],
    minutes: 10,
    foundation: true,
  },
  {
    id: "tutorial-content-classification.tutorial-technique.toon-shading",
    label: "Toon shading",
    triggers: ["toon shading", "toon shaded", "cel shading", "toon material"],
    knownAliases: ["toon shading", "cel shading", "toon shader"],
    softwareIds: ["blender"],
    prerequisites: ["learning-classification.prerequisite-software-knowledge.materials"],
    minutes: 15,
  },
  {
    id: "3d-production.material-technique.metallic-pbr",
    label: "Chrome materials",
    triggers: ["chrome", "metallic pbr", "metallic material"],
    knownAliases: ["chrome material", "metallic material", "vật liệu chrome"],
    softwareIds: ["blender"],
    prerequisites: ["learning-classification.prerequisite-software-knowledge.materials"],
    minutes: 15,
  },
  {
    id: "photography-and-cinematography.lens-type.fisheye",
    label: "Fisheye camera treatment",
    triggers: ["fisheye", "fish eye"],
    knownAliases: ["fisheye", "fish eye"],
    softwareIds: ["blender"],
    prerequisites: ["tutorial-content-classification.tutorial-prerequisite.camera-basics"],
    minutes: 10,
  },
  {
    id: "tutorial-content-classification.tutorial-prerequisite.camera-basics",
    label: "Camera basics",
    triggers: ["camera animation", "product animation", "fisheye"],
    knownAliases: ["camera", "máy quay"],
    softwareIds: ["blender"],
    prerequisites: [
      "learning-classification.prerequisite-software-knowledge.viewport-navigation",
    ],
    minutes: 8,
    foundation: true,
  },
  {
    id: "motion-and-animation.camera-animation.spline-camera",
    label: "Camera animation",
    triggers: ["camera animation", "product animation", "animate camera", "animation sản phẩm"],
    knownAliases: ["camera animation", "animate camera", "chuyển động camera"],
    softwareIds: ["blender"],
    prerequisites: ["tutorial-content-classification.tutorial-prerequisite.camera-basics"],
    minutes: 15,
  },
  {
    id: "motion-and-animation.procedural-motion.geometry-nodes",
    label: "Geometry Nodes fundamentals",
    triggers: ["geometry nodes", "procedural vegetation", "vegetation scatter"],
    knownAliases: ["geometry nodes"],
    softwareIds: ["blender"],
    prerequisites: [
      "learning-classification.prerequisite-software-knowledge.viewport-navigation",
    ],
    minutes: 20,
  },
  {
    id: "3d-production.geometry-nodes-technique.vegetation-scatter",
    label: "Procedural vegetation scattering",
    triggers: ["procedural vegetation", "vegetation scatter", "scatter trees", "solarpunk environment"],
    knownAliases: ["vegetation scatter", "procedural scattering"],
    softwareIds: ["blender"],
    prerequisites: ["motion-and-animation.procedural-motion.geometry-nodes"],
    minutes: 20,
  },
  {
    id: "3d-production.geometry-nodes-technique.point-distribution",
    label: "Distribution and density masks",
    triggers: ["vegetation distribution", "vegetation masking", "density mask", "procedural vegetation"],
    knownAliases: ["point distribution", "density mask", "mask control"],
    softwareIds: ["blender"],
    prerequisites: ["motion-and-animation.procedural-motion.geometry-nodes"],
    minutes: 15,
    priority: "useful",
  },
  {
    id: "learning-classification.prerequisite-technique-knowledge.javascript-syntax",
    label: "Minimal JavaScript basics",
    triggers: ["p5.js", "creative coding", "audio reactive", "react to music"],
    knownAliases: ["javascript", "js basics", "lập trình javascript"],
    softwareIds: ["custom:p5.js"],
    minutes: 20,
    foundation: true,
  },
  {
    id: "learning-classification.prerequisite-coding-knowledge.canvas",
    label: "p5.js canvas and drawing basics",
    triggers: ["p5.js", "creative coding", "bauhaus poster", "react to music"],
    knownAliases: ["p5.js", "canvas", "creative coding"],
    softwareIds: ["custom:p5.js"],
    prerequisites: ["learning-classification.prerequisite-technique-knowledge.javascript-syntax"],
    minutes: 20,
  },
  {
    id: "audio-and-music.audio-reactive-technique.fft",
    label: "Audio input and FFT",
    triggers: ["audio reactive", "react to music", "fft", "music reactive"],
    knownAliases: ["fft", "audio analysis", "p5 sound"],
    softwareIds: ["custom:p5.js"],
    prerequisites: ["learning-classification.prerequisite-coding-knowledge.canvas"],
    minutes: 20,
  },
  {
    id: "web-and-creative-coding.animation-library.p5-js-frame-loop",
    label: "Animation loop",
    triggers: ["audio reactive", "react to music", "animated poster", "p5.js"],
    knownAliases: ["animation loop", "draw loop", "p5 draw"],
    softwareIds: ["custom:p5.js"],
    prerequisites: ["learning-classification.prerequisite-coding-knowledge.canvas"],
    minutes: 10,
    priority: "useful",
  },
  {
    id: "experience-installation-physical-interaction.computer-vision.hand-tracking",
    label: "Hand-tracking input",
    triggers: ["hand tracking", "hand-tracking", "track hands"],
    knownAliases: ["hand tracking", "mediapipe"],
    softwareIds: ["custom:touchdesigner"],
    minutes: 20,
  },
  {
    id: "programming-concepts.interaction-programming-concept.input-mapping",
    label: "Channel processing and parameter mapping",
    triggers: ["hand tracking", "movement to parameters", "chop", "channel processing"],
    knownAliases: ["chop", "channel processing", "parameter mapping"],
    softwareIds: ["custom:touchdesigner"],
    prerequisites: [
      "experience-installation-physical-interaction.computer-vision.hand-tracking",
    ],
    minutes: 15,
  },
  {
    id: "3d-production.geometry-nodes-technique.instancing",
    label: "Instancing and growth control",
    triggers: ["grow projected flowers", "projected flowers", "flower growth"],
    knownAliases: ["instancing", "growth control"],
    softwareIds: ["custom:touchdesigner"],
    prerequisites: ["programming-concepts.interaction-programming-concept.input-mapping"],
    minutes: 20,
    priority: "useful",
  },
];

const byId = new Map(SKILLS.map((skill) => [skill.id, skill]));

function containsAny(text: string, values: string[]): boolean {
  const haystack = text.replace(/[-_/]+/g, " ");
  return values.some((value) =>
    haystack.includes(normalizeOntologyLabel(value).replace(/[-_/]+/g, " ")),
  );
}

function hasNegated(text: string, phrase: string): boolean {
  const escaped = normalizeOntologyLabel(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:never|not|no|without|chua|khong)(?:\\s+\\w+){0,4}\\s+${escaped}|${escaped}(?:\\s+\\w+){0,3}\\s+(?:beginner|new|chua|khong)`,
  ).test(text);
}

function skillKnowledge(
  definition: SkillDefinition,
  experience: string,
): SkillGap["status"] {
  const aliases = [definition.label, ...(definition.knownAliases ?? [])];
  if (aliases.some((alias) => hasNegated(experience, alias))) {
    return "needs_learning";
  }
  if (containsAny(experience, aliases)) return "known";
  if (
    definition.id ===
      "learning-classification.prerequisite-software-knowledge.viewport-navigation" &&
    /(?:basic|basics|co ban).{0,25}blender|blender.{0,25}(?:basic|basics|modelling|modeling)/.test(
      experience,
    ) &&
    !/complete beginner|never used|chua tung/.test(experience)
  ) {
    return "known";
  }
  const appNames = definition.softwareIds.flatMap((id) => [id, getApplicationName(id)]);
  const appMentioned = containsAny(experience, appNames);
  const beginner = /\b(?:beginner|new to|never used|complete beginner|moi bat dau|chua tung|co ban)\b/.test(experience);
  if (definition.foundation && appMentioned && beginner) return "partial";
  return "needs_learning";
}

function inputText(project: RoadmapRequest, creativeDna: CreativeDNA): string {
  return normalizeOntologyLabel(
    [
      project.projectBrief,
      creativeDna.projectIntent,
      ...creativeDna.concepts
        .filter((concept) => concept.status !== "user_rejected")
        .map((concept) => concept.label),
      ...creativeDna.unknownConcepts
        .filter((concept) => concept.status !== "user_rejected")
        .map((concept) => concept.raw),
    ].join(" "),
  );
}

function expandPrerequisites(ids: string[], maximumDepth = 2): string[] {
  const result: string[] = [];
  const visited = new Set(ids);
  const visit = (id: string, depth: number) => {
    if (depth > maximumDepth) return;
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      if (visited.has(prerequisite)) continue;
      visited.add(prerequisite);
      visit(prerequisite, depth + 1);
      result.push(prerequisite);
    }
  };
  ids.forEach((id) => visit(id, 1));
  return result;
}

export function deriveSkillGaps(
  project: RoadmapRequest,
  creativeDna: CreativeDNA,
): SkillGap[] {
  const requiredText = inputText(project, creativeDna);
  const experience = normalizeOntologyLabel(project.currentExperience);
  const directlyRequired = SKILLS.filter((definition) =>
    containsAny(requiredText, definition.triggers),
  ).map((definition) => definition.id);
  const allSet = new Set([
    ...expandPrerequisites(directlyRequired),
    ...directlyRequired,
  ]);
  const allIds: string[] = [];
  const ordered = new Set<string>();
  const addInDependencyOrder = (id: string) => {
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      if (allSet.has(prerequisite) && !ordered.has(prerequisite)) {
        addInDependencyOrder(prerequisite);
      }
    }
    if (!ordered.has(id)) {
      ordered.add(id);
      allIds.push(id);
    }
  };
  directlyRequired.forEach(addInDependencyOrder);

  return allIds.flatMap((id) => {
    const definition = byId.get(id);
    if (!definition || !ontologyHasId(id)) return [];
    const status = skillKnowledge(definition, experience);
    const isDirect = directlyRequired.includes(id);
    return [
      SkillGapSchema.parse({
        skillGapVersion: 1,
        id: `gap:${id}`,
        skillId: id,
        label: definition.label,
        relatedTechniqueIds: isDirect ? [id] : [],
        softwareIds: definition.softwareIds,
        status,
        reason: isDirect
          ? `Required by the confirmed project direction: ${definition.label}.`
          : `Minimum prerequisite for a required project skill.`,
        prerequisiteSkillIds: (definition.prerequisites ?? []).filter((prerequisite) =>
          allIds.includes(prerequisite),
        ),
        priority: definition.priority ?? (isDirect ? "required" : "useful"),
        estimatedLearningMinutes: definition.minutes,
        confidence: isDirect ? 0.92 : 0.86,
      }),
    ];
  });
}

function levelFor(project: RoadmapRequest, softwareIds: string[]): TutorialNeed["userLevel"] {
  const experience = normalizeOntologyLabel(project.currentExperience);
  const relevant = softwareIds.some((id) =>
    containsAny(experience, [id, getApplicationName(id)]),
  );
  if (relevant && /\b(?:advanced|expert|nang cao|chuyen sau)\b/.test(experience)) return "advanced";
  if (relevant && /\b(?:intermediate|trung cap)\b/.test(experience)) return "intermediate";
  return "beginner";
}

function durationFor(project: RoadmapRequest): number {
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(`${project.deadline}T00:00:00`).getTime() - Date.now()) /
        86_400_000,
    ),
  );
  return days <= 2 ? 15 : days <= 7 ? 25 : 40;
}

export function buildTutorialNeeds(
  project: RoadmapRequest,
  creativeDna: CreativeDNA,
  gaps: SkillGap[],
): TutorialNeed[] {
  const aestheticIds = creativeDna.concepts.flatMap((concept) =>
    concept.status !== "user_rejected" && concept.ontologyId &&
    /aesthetic|style|movement|visual/i.test(`${concept.family} ${concept.category}`)
      ? [concept.ontologyId]
      : [],
  );
  return gaps.flatMap((gap) => {
    if (!["needs_learning", "partial"].includes(gap.status)) return [];
    const softwareName = gap.softwareIds.map(getApplicationName).join(" ");
    const level = levelFor(project, gap.softwareIds);
    const queries = [
      `${softwareName} ${gap.label} ${level} tutorial`,
      `${softwareName} ${gap.label} focused guide`,
    ].map((query) => query.trim().replace(/\s+/g, " "));
    return [
      TutorialNeedSchema.parse({
        tutorialNeedVersion: 1,
        id: `need:${gap.skillId}`,
        label: gap.label,
        skillIds: [gap.skillId],
        techniqueIds: gap.relatedTechniqueIds,
        softwareIds: gap.softwareIds,
        prerequisiteIds: gap.prerequisiteSkillIds,
        aestheticIds,
        outputIds: [],
        productionStageIds: [],
        userLevel: level,
        preferredLanguage: project.tutorialLanguage,
        preferredDurationMinutes: durationFor(project),
        searchQueries: [...new Set(queries)].slice(0, 3),
        priority: gap.priority,
        status: "active",
      }),
    ];
  });
}
