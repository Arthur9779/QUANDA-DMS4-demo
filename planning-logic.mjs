const OUTPUT_PROFILES = {
  video: {
    defaultApplication: "Blender",
    alternatives: ["Adobe After Effects", "DaVinci Resolve"],
    coreTechnique: "Motion blocking and keyframe animation",
  },
  "3d": {
    defaultApplication: "Blender",
    alternatives: ["Maya", "Cinema 4D"],
    coreTechnique: "3D modelling and material setup",
  },
  graphic: {
    defaultApplication: "Adobe Illustrator",
    alternatives: ["Adobe Photoshop", "Procreate"],
    coreTechnique: "Composition, typography, and visual hierarchy",
  },
  uiux: {
    defaultApplication: "Figma",
    alternatives: ["Adobe XD", "Sketch"],
    coreTechnique: "Wireframing and interactive prototyping",
  },
  audio: {
    defaultApplication: "Audacity",
    alternatives: ["FL Studio", "Adobe Audition"],
    coreTechnique: "Audio editing and mix cleanup",
  },
  photo: {
    defaultApplication: "Adobe Photoshop",
    alternatives: ["Adobe Lightroom", "GIMP"],
    coreTechnique: "Non-destructive photo editing",
  },
  other: {
    defaultApplication: "Blender",
    alternatives: ["Adobe Photoshop", "Figma"],
    coreTechnique: "The primary technique required by the brief",
  },
};

const APPLICATION_ALIASES = {
  Blender: ["blender"],
  Maya: ["maya", "autodesk maya"],
  "Cinema 4D": ["cinema 4d", "c4d"],
  "Adobe After Effects": ["after effects", "adobe after effects", "ae"],
  "DaVinci Resolve": ["davinci resolve", "davinci"],
  "Adobe Illustrator": ["illustrator", "adobe illustrator"],
  "Adobe Photoshop": ["photoshop", "adobe photoshop"],
  Procreate: ["procreate"],
  Figma: ["figma"],
  "Adobe XD": ["adobe xd", "xd"],
  Sketch: ["sketch"],
  Audacity: ["audacity"],
  "FL Studio": ["fl studio"],
  "Adobe Audition": ["adobe audition", "audition"],
  "Adobe Lightroom": ["lightroom", "adobe lightroom"],
  GIMP: ["gimp"],
};

const INTERMEDIATE_TERMS = /intermediate|trung cấp|mid-level|khá|thành thạo|proficient/i;
const ADVANCED_TERMS = /advanced|expert|professional|nâng cao|chuyên nghiệp/i;
const BEGINNER_TERMS = /beginner|new|new to|complete beginner|mới|chưa từng|hoàn toàn mới/i;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalize(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function applicationSupportsOutput(application, outputType) {
  const profile = OUTPUT_PROFILES[outputType] || OUTPUT_PROFILES.other;
  if (application === profile.defaultApplication || profile.alternatives.includes(application)) return true;
  const normalized = normalize(application);
  return Object.entries(OUTPUT_PROFILES).some(([type, candidate]) => type === outputType && [candidate.defaultApplication, ...candidate.alternatives].some((item) => normalize(item) === normalized));
}

function inferLevel(text) {
  if (ADVANCED_TERMS.test(text)) return "advanced";
  if (INTERMEDIATE_TERMS.test(text)) return "intermediate";
  if (BEGINNER_TERMS.test(text)) return "beginner";
  return "not-stated";
}

export function parseKnownApplications(experience = "") {
  const text = String(experience || "");
  return Object.entries(APPLICATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => normalize(text).includes(alias)))
    .map(([application, aliases]) => {
      const alias = aliases.find((candidate) => normalize(text).includes(candidate));
      const start = normalize(text).indexOf(alias);
      const context = start >= 0 ? text.slice(Math.max(0, start - 12), start + alias.length + 80) : text;
      return { application, level: inferLevel(context) };
    });
}

function skillRank(level) {
  return { advanced: 3, intermediate: 2, beginner: 1, "not-stated": 0 }[level] || 0;
}

export function choosePrimaryApplication({ applications = [], experience = "", outputType = "other" } = {}) {
  const profile = OUTPUT_PROFILES[outputType] || OUTPUT_PROFILES.other;
  const explicit = unique(applications.map((application) => String(application).trim()).filter(Boolean));
  const known = parseKnownApplications(experience);
  const knownByName = new Map(known.map((item) => [normalize(item.application), item]));
  const viableExplicit = explicit.find((application) => applicationSupportsOutput(application, outputType));
  if (viableExplicit) {
    return {
      application: viableExplicit,
      source: "required-tool",
      skillLevel: knownByName.get(normalize(viableExplicit))?.level || "not-stated",
      knownApplications: known,
      explicitApplications: explicit,
    };
  }

  const viableKnown = known
    .filter((item) => skillRank(item.level) >= 2 && applicationSupportsOutput(item.application, outputType))
    .sort((a, b) => skillRank(b.level) - skillRank(a.level));
  if (viableKnown.length) {
    return {
      application: viableKnown[0].application,
      source: "existing-tool",
      skillLevel: viableKnown[0].level,
      knownApplications: known,
      explicitApplications: explicit,
    };
  }

  const fallback = explicit[0] || profile.defaultApplication;
  return {
    application: fallback,
    source: explicit.length ? "required-tool" : "output-fit",
    skillLevel: knownByName.get(normalize(fallback))?.level || "not-stated",
    knownApplications: known,
    explicitApplications: explicit,
  };
}

export function buildRouteEvidence({ applications = [], experience = "", outputType = "other", totalDays = 1, availableHours = 0 } = {}) {
  const profile = OUTPUT_PROFILES[outputType] || OUTPUT_PROFILES.other;
  const primary = choosePrimaryApplication({ applications, experience, outputType });
  const candidates = unique([
    primary.application,
    ...primary.knownApplications.map((item) => item.application),
    ...primary.explicitApplications,
    ...profile.alternatives,
  ]).slice(0, 4);
  const selectedReasonCode = primary.source === "required-tool"
    ? "required-tool"
    : primary.source === "existing-tool"
      ? "existing-tool"
      : "output-fit";
  const routes = candidates.map((application) => {
    if (application === primary.application) {
      return { application, status: "selected", reasonCode: selectedReasonCode };
    }
    const known = primary.knownApplications.find((item) => item.application === application);
    let reasonCode = "no-need-to-switch";
    if (known && skillRank(known.level) >= 2 && primary.source === "required-tool") reasonCode = "required-tool-wins";
    else if (known && skillRank(known.level) >= 2) reasonCode = "existing-tool-wins";
    else if (!applicationSupportsOutput(application, outputType)) reasonCode = "output-mismatch";
    else reasonCode = "switch-cost";
    return { application, status: "rejected", reasonCode };
  });

  const avoidableHours = primary.skillLevel === "advanced" ? 2.5 : primary.skillLevel === "intermediate" ? 1.5 : null;
  const skippedSteps = avoidableHours
    ? [
      `A full beginner course in ${primary.application}`,
      "Parallel comparison of multiple applications",
    ]
    : ["Parallel comparison of multiple applications"];

  return {
    primaryApplication: primary.application,
    primarySource: primary.source,
    primarySkillLevel: primary.skillLevel,
    coreTechnique: profile.coreTechnique,
    routes,
    skippedSteps,
    timeAvoidedHours: avoidableHours,
    totalDays,
    availableHours,
    basis: {
      outputType,
      existingTools: primary.knownApplications,
      requiredTools: primary.explicitApplications,
    },
  };
}

export function buildStageDecisions({ outputType = "other", application = "Blender", skillLevel = "not-stated" } = {}) {
  const profile = OUTPUT_PROFILES[outputType] || OUTPUT_PROFILES.other;
  return [
    {
      application,
      technique: "Project setup and delivery settings",
      reasonCode: "setup",
      tutorialQuery: `${application} project setup delivery settings tutorial`,
    },
    {
      application,
      technique: profile.coreTechnique,
      reasonCode: "core-technique",
      tutorialQuery: `${application} ${profile.coreTechnique} tutorial`,
    },
    {
      application,
      technique: "First complete production pass",
      reasonCode: "first-pass",
      tutorialQuery: `${application} ${profile.coreTechnique} complete project tutorial`,
    },
    {
      application,
      technique: "Targeted quality-control and troubleshooting",
      reasonCode: "refinement",
      tutorialQuery: `${application} quality control troubleshooting tutorial`,
    },
    {
      application,
      technique: "Export and final-file verification",
      reasonCode: "handoff",
      tutorialQuery: `${application} export settings final file tutorial`,
    },
  ].map((decision) => ({ ...decision, skillLevel }));
}

export function outputProfile(outputType = "other") {
  return OUTPUT_PROFILES[outputType] || OUTPUT_PROFILES.other;
}
