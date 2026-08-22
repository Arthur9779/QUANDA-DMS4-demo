import type {
  CreativeDNA,
  SkillGap,
  TutorialNeed,
} from "@/src/contracts/knowledge";
import { SkillGapSchema, TutorialNeedSchema } from "@/src/contracts/knowledge";
import { getApplicationName } from "@/src/data/applications";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { getOntologyConcept, ontologyHasId } from "@/src/ontology/runtime";
import { stableHash } from "@/src/tutorial-matching/hash";
import { canonicalSkillIdForTopic } from "@/src/tutorial-matching/skillTaxonomy";
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
  relatedTechniqueIds?: string[];
  reason?: string;
}

const SPECIALIZED_SKILLS: SkillDefinition[] = [
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
    relatedTechniqueIds: [
      "tutorial-content-classification.tutorial-skill.navigation",
    ],
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
    relatedTechniqueIds: [
      "tutorial-content-classification.tutorial-topic.animation",
      "learning-classification.prerequisite-software-knowledge.keyframes",
    ],
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

interface WorkflowStep {
  skillId?: string;
  topic: string;
  label: string;
  minutes: number;
  foundation?: boolean;
  priority?: SkillGap["priority"];
  onlyWhen?: RegExp;
  aliases?: string[];
}

const APPLICATION_WORKFLOWS: Record<string, WorkflowStep[]> = {
  blender: [
    {
      skillId: "learning-classification.prerequisite-software-knowledge.viewport-navigation",
      topic: "navigation",
      label: "Basic viewport navigation",
      minutes: 10,
      foundation: true,
    },
    { topic: "modeling", label: "Product modelling and scene assembly", minutes: 25 },
    { topic: "materials", label: "Shader Editor and material basics", minutes: 15 },
    { topic: "lighting", label: "Lighting the product", minutes: 20 },
    { topic: "camera", label: "Camera basics", minutes: 12, onlyWhen: /animat|video|film|camera|mp4|mov/ },
    { topic: "animation", label: "Object and keyframe animation", minutes: 20, onlyWhen: /animat|video|motion|mp4|mov/ },
    { topic: "rendering", label: "Render settings", minutes: 15 },
    { topic: "export", label: "Final render and export", minutes: 12 },
  ],
  photoshop: [
    { topic: "workspace", label: "Photoshop workspace basics", minutes: 12, foundation: true },
    { topic: "layers", label: "Layers and non-destructive editing", minutes: 15, foundation: true },
    { topic: "selection", label: "Selections", minutes: 15 },
    { topic: "masking", label: "Layer masks and masking", minutes: 18 },
    { topic: "compositing", label: "Image compositing", minutes: 20 },
    { topic: "export", label: "Image export settings", minutes: 10 },
  ],
  illustrator: [
    { topic: "workspace", label: "Illustrator workspace basics", minutes: 12, foundation: true },
    { topic: "vector", label: "Vector shapes and paths", minutes: 20 },
    { topic: "typography", label: "Typography and type layout", minutes: 18, priority: "useful" },
    { topic: "export", label: "Vector and PDF export", minutes: 10 },
  ],
  "after-effects": [
    { topic: "workspace", label: "After Effects workspace basics", minutes: 12, foundation: true },
    { topic: "keyframes", label: "Keyframes and timing", minutes: 18 },
    { topic: "graph editor", label: "Graph Editor and easing", minutes: 18 },
    { topic: "motion graphics", label: "Motion graphics production", minutes: 25 },
    { topic: "compositing", label: "Compositing", minutes: 20 },
    { topic: "export", label: "Render queue and export", minutes: 12 },
  ],
  "premiere-pro": [
    { topic: "workspace", label: "Premiere workspace basics", minutes: 12, foundation: true },
    { topic: "timeline", label: "Timeline navigation", minutes: 12, foundation: true },
    { topic: "editing", label: "Editing and trimming", minutes: 25 },
    { topic: "audio", label: "Basic dialogue and audio editing", minutes: 15, priority: "useful" },
    { topic: "export", label: "Delivery codec and export settings", minutes: 12 },
  ],
  "davinci-resolve": [
    { topic: "workspace", label: "DaVinci Resolve workspace basics", minutes: 12, foundation: true },
    { topic: "timeline", label: "Timeline navigation", minutes: 12, foundation: true },
    { topic: "editing", label: "Video editing and trimming", minutes: 25 },
    { topic: "color grading", label: "Colour correction and grading", minutes: 20 },
    { topic: "mixing", label: "Fairlight audio mixing", minutes: 18, priority: "useful" },
    { topic: "export", label: "Delivery page and export", minutes: 12 },
  ],
  figma: [
    { topic: "workspace", label: "Figma workspace basics", minutes: 10, foundation: true },
    { topic: "layout", label: "Interface layout", minutes: 18 },
    { topic: "auto layout", label: "Responsive Auto Layout", minutes: 20 },
    { topic: "components", label: "Components and design systems", minutes: 20 },
    { topic: "user flow", label: "User-flow planning", minutes: 15, priority: "useful", aliases: ["user flows"] },
    { topic: "prototyping", label: "Interactive prototyping", minutes: 20 },
    { topic: "export", label: "Asset and prototype export", minutes: 10 },
  ],
  procreate: [
    // A Procreate canvas is not the coding prerequisite named "canvas" in the
    // ontology. Using workspace navigation avoids importing p5.js/JavaScript
    // prerequisites into an illustration project.
    { topic: "workspace", label: "Canvas and gesture basics", minutes: 12, foundation: true },
    { topic: "brushes", label: "Brush control", minutes: 15 },
    { topic: "layers", label: "Layer workflow", minutes: 15 },
    { topic: "illustration", label: "Digital illustration workflow", minutes: 25 },
    { topic: "frame-by-frame", label: "Animation Assist and frame-by-frame animation", minutes: 20, onlyWhen: /animat|video|gif|mp4/ },
    { topic: "export", label: "Artwork and animation export", minutes: 10 },
  ],
  audacity: [
    { topic: "workspace", label: "Audacity workspace basics", minutes: 10, foundation: true },
    { topic: "recording", label: "Audio recording", minutes: 18 },
    { topic: "editing", label: "Audio editing", minutes: 18 },
    { topic: "audio cleanup", label: "Audio cleanup", minutes: 18 },
    { topic: "noise reduction", label: "Noise reduction", minutes: 12, priority: "useful" },
    { topic: "mixing", label: "Basic mixing", minutes: 18 },
    { topic: "export", label: "WAV and MP3 export", minutes: 10 },
  ],
  "fl-studio": [
    { topic: "workspace", label: "FL Studio workspace basics", minutes: 12, foundation: true },
    { topic: "sound design", label: "Sound design and arrangement", minutes: 25 },
    { topic: "recording", label: "Audio recording", minutes: 18, onlyWhen: /record|vocal|voice|microphone/ },
    { topic: "mixing", label: "Mixer and track mixing", minutes: 22 },
    { topic: "export", label: "Master export", minutes: 10 },
  ],
};

const CUSTOM_APPLICATION_WORKFLOW: WorkflowStep[] = [
  {
    topic: "workspace",
    label: "Application workspace and project setup",
    minutes: 12,
    foundation: true,
  },
  {
    topic: "export",
    label: "Project export and delivery",
    minutes: 12,
  },
];

const ACTIONABLE_FAMILIES = new Set([
  "image making characteristics",
  "photography and cinematography",
  "motion and animation",
  "3d production",
  "graphic design",
  "ui ux interaction",
  "web and creative coding",
  "programming concepts",
  "audio and music",
  "traditional and physical media",
  "game design",
  "experience installation physical interaction",
  "production workflow",
  "ai computational creativity",
  "conceptual theoretical metadata",
]);

const NON_PROJECT_FAMILIES = /metadata|classification|recommendation|project state|suggested data schema|agent classification|quality reliability/i;

function mergeDefinition(
  target: Map<string, SkillDefinition>,
  definition: SkillDefinition,
) {
  const existing = target.get(definition.id);
  if (!existing) {
    target.set(definition.id, definition);
    return;
  }
  const priorityRank = { optional: 0, useful: 1, required: 2 } as const;
  const leftPriority = existing.priority ?? "required";
  const rightPriority = definition.priority ?? "required";
  target.set(definition.id, {
    ...existing,
    triggers: [...new Set([...existing.triggers, ...definition.triggers])],
    knownAliases: [...new Set([...(existing.knownAliases ?? []), ...(definition.knownAliases ?? [])])],
    softwareIds: [...new Set([...existing.softwareIds, ...definition.softwareIds])],
    prerequisites: [...new Set([...(existing.prerequisites ?? []), ...(definition.prerequisites ?? [])])],
    relatedTechniqueIds: [...new Set([...(existing.relatedTechniqueIds ?? []), ...(definition.relatedTechniqueIds ?? [])])],
    priority: priorityRank[rightPriority] > priorityRank[leftPriority]
      ? rightPriority
      : leftPriority,
    foundation: existing.foundation || definition.foundation,
    reason: existing.reason ?? definition.reason,
  });
}

function workflowDefinitions(
  project: RoadmapRequest,
  requiredText: string,
): SkillDefinition[] {
  const projectContext = `${requiredText} ${normalizeOntologyLabel(project.outputType)}`;
  return project.requiredApplications.flatMap((softwareId) =>
    (APPLICATION_WORKFLOWS[softwareId] ?? CUSTOM_APPLICATION_WORKFLOW).flatMap((step) => {
      if (step.onlyWhen && !step.onlyWhen.test(projectContext)) return [];
      const id = step.skillId ?? canonicalSkillIdForTopic(step.topic);
      if (!id) return [];
      return [{
        id,
        label: step.label,
        triggers: [],
        knownAliases: [step.topic, ...(step.aliases ?? [])],
        softwareIds: [softwareId],
        minutes: step.minutes,
        priority: step.priority,
        foundation: step.foundation,
        relatedTechniqueIds: [id],
        reason: `Core ${getApplicationName(softwareId)} workflow required to complete and deliver this project.`,
      }];
    }),
  );
}

function conceptDefinitions(
  project: RoadmapRequest,
  creativeDna: CreativeDNA,
): SkillDefinition[] {
  return creativeDna.concepts.flatMap((concept) => {
    if (concept.status === "user_rejected" || !concept.ontologyId) return [];
    const node = getOntologyConcept(concept.ontologyId);
    if (!node) return [];
    const family = normalizeOntologyLabel(node.family).replace(/[^a-z0-9]+/g, " ").trim();
    const explicitlyChosen = concept.source === "explicit_requirement" || concept.source === "user_added";
    if (!ACTIONABLE_FAMILIES.has(family) && !explicitlyChosen) return [];
    if (NON_PROJECT_FAMILIES.test(node.family) && !explicitlyChosen) return [];
    const canonicalId = canonicalSkillIdForTopic(node.label) ?? node.id;
    return [{
      id: canonicalId,
      label: node.label,
      triggers: [],
      knownAliases: [node.label, ...node.aliases],
      softwareIds: project.requiredApplications,
      minutes: 15,
      priority: explicitlyChosen ? "required" as const : "useful" as const,
      relatedTechniqueIds: [...new Set([node.id, canonicalId])],
      reason: `Required to implement the confirmed Creative DNA concept: ${node.label}.`,
    }];
  });
}

function decompositionDefinitions(
  project: RoadmapRequest,
  creativeDna: CreativeDNA,
  requiredText: string,
) {
  const definitions = new Map<string, SkillDefinition>();
  for (const definition of SPECIALIZED_SKILLS) {
    const matchingRequiredApplications = project.requiredApplications.filter(
      (requiredId) => definition.softwareIds.some(
        (definitionId) =>
          normalizeOntologyLabel(getApplicationName(definitionId)) ===
          normalizeOntologyLabel(getApplicationName(requiredId)),
      ),
    );
    mergeDefinition(definitions, {
      ...definition,
      softwareIds:
        matchingRequiredApplications.length > 0
          ? matchingRequiredApplications
          : definition.softwareIds,
    });
  }
  for (const definition of workflowDefinitions(project, requiredText)) {
    mergeDefinition(definitions, definition);
  }
  for (const definition of conceptDefinitions(project, creativeDna)) {
    mergeDefinition(definitions, definition);
  }
  return definitions;
}

function boundedId(prefix: "gap" | "need", id: string): string {
  const value = `${prefix}:${id}`;
  if (value.length <= 160) return value;
  return `${prefix}:${id.slice(0, 145)}-${stableHash(id)}`;
}

function containsAny(text: string, values: string[]): boolean {
  const haystack = text.replace(/[-_/]+/g, " ");
  return values.some((value) =>
    haystack.includes(normalizeOntologyLabel(value).replace(/[-_/]+/g, " ")),
  );
}

function hasNegated(text: string, phrase: string): boolean {
  const normalizedText = normalizeOntologyLabel(text)
    .replace(/[^\p{L}\p{N}+#]+/gu, " ");
  const escaped = normalizeOntologyLabel(phrase)
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `\\b(?:never|not|no|without|chua|khong)\\b(?:(?!\\b(?:but|however|yet|nhung)\\b).){0,120}\\b${escaped}\\b|\\b${escaped}\\b(?:\\s+\\w+){0,3}\\s+(?:beginner|new|chua|khong)`,
  ).test(normalizedText);
}

function softwareHasLevel(
  experience: string,
  applicationNames: string[],
  levelPattern: string,
): boolean {
  return applicationNames.some((application) => {
    const name = normalizeOntologyLabel(application)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `(?:${name})(?:\\s+\\w+){0,6}\\s+(?:${levelPattern})|(?:${levelPattern})(?:\\s+\\w+){0,6}\\s+(?:${name})`,
    ).test(experience);
  });
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
  const beginner = softwareHasLevel(
    experience,
    appNames,
    "beginner|new|never used|complete beginner|moi bat dau|chua tung|co ban",
  );
  const proficient = softwareHasLevel(
    experience,
    appNames,
    "intermediate|advanced|expert|trung cap|nang cao|chuyen sau",
  );
  if (definition.foundation && appMentioned && proficient) return "known";
  if (!definition.foundation && appMentioned && proficient) return "partial";
  if (definition.foundation && appMentioned && beginner) return "partial";
  return "needs_learning";
}

function inputText(project: RoadmapRequest, creativeDna: CreativeDNA): string {
  return normalizeOntologyLabel(
    [
      project.projectBrief,
      creativeDna.projectIntent,
      ...project.requiredApplications.flatMap((id) => [id, getApplicationName(id)]),
      ...creativeDna.concepts
        .filter((concept) => concept.status !== "user_rejected")
        .map((concept) => concept.label),
      ...creativeDna.unknownConcepts
        .filter((concept) => concept.status !== "user_rejected")
        .map((concept) => concept.raw),
    ].join(" "),
  );
}

function expandPrerequisites(
  ids: string[],
  byId: Map<string, SkillDefinition>,
  maximumDepth = 2,
): string[] {
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
  const byId = decompositionDefinitions(project, creativeDna, requiredText);
  const automaticIds = [
    ...workflowDefinitions(project, requiredText),
    ...conceptDefinitions(project, creativeDna),
  ].map((definition) => definition.id);
  const triggeredIds = [...byId.values()]
    .filter(
      (definition) =>
        definition.triggers.length > 0 &&
        containsAny(requiredText, definition.triggers),
    )
    .map((definition) => definition.id);
  const directlyRequired = [...new Set([...automaticIds, ...triggeredIds])];
  const allSet = new Set([
    ...expandPrerequisites(directlyRequired, byId),
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
        id: boundedId("gap", id),
        skillId: id,
        label: definition.label,
        relatedTechniqueIds: isDirect
          ? [...new Set([id, ...(definition.relatedTechniqueIds ?? [])])]
          : [],
        softwareIds: definition.softwareIds,
        status,
        reason: isDirect
          ? definition.reason ?? `Required by the confirmed project direction: ${definition.label}.`
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
        id: boundedId("need", gap.skillId),
        label: gap.label,
        skillIds: [gap.skillId],
        techniqueIds: gap.relatedTechniqueIds,
        softwareIds: gap.softwareIds,
        prerequisiteIds: gap.prerequisiteSkillIds,
        aestheticIds,
        outputIds: [],
        productionStageIds: [],
        userLevel: level,
        preferredLanguage:
          project.tutorialLanguage === "either"
            ? project.interfaceLanguage
            : project.tutorialLanguage,
        preferredDurationMinutes: durationFor(project),
        searchQueries: [...new Set(queries)].slice(0, 3),
        priority: gap.priority,
        status: "active",
      }),
    ];
  });
}
