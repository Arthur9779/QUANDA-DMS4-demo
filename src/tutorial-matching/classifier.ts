import type {
  TutorialDNA,
  TutorialMetadata,
} from "@/src/contracts/knowledge";
import { TutorialDNASchema } from "@/src/contracts/knowledge";
import type { Tutorial } from "@/src/lib/tutorialMatcher";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { ontologyHasId } from "@/src/ontology/runtime";
import { stableHash } from "@/src/tutorial-matching/hash";

const CLASSIFIER_VERSION = 1 as const;
const classificationCache = new Map<string, TutorialDNA>();

const TOPIC_ONTOLOGY_IDS: Record<string, string> = {
  navigation: "learning-classification.prerequisite-software-knowledge.viewport-navigation",
  interface: "learning-classification.prerequisite-software-knowledge.workspace-navigation",
  basics: "ai-inferred-creative-dna.required-knowledge.software-navigation",
  modeling: "3d-production.modeling-technique.polygon-modeling",
  modelling: "3d-production.modeling-technique.polygon-modeling",
  materials: "learning-classification.prerequisite-software-knowledge.materials",
  shading: "learning-classification.prerequisite-technique-knowledge.shaders",
  animation: "motion-and-animation.animation-medium.object-animation",
  camera: "tutorial-content-classification.tutorial-prerequisite.camera-basics",
  "máy quay": "tutorial-content-classification.tutorial-prerequisite.camera-basics",
  keyframes: "motion-and-animation.animation-technique.keyframe-animation",
  lighting: "tutorial-content-classification.tutorial-topic.lighting",
  prototype: "tutorial-content-classification.tutorial-topic.prototyping",
  components: "tutorial-content-classification.tutorial-topic.components",
  layout: "tutorial-content-classification.tutorial-topic.layout",
  "auto layout": "tutorial-content-classification.tutorial-skill.auto-layout",
  vector: "tutorial-content-classification.tutorial-topic.vector-graphics",
  "pen tool": "tutorial-content-classification.tutorial-skill.pen-tool",
  masks: "learning-classification.prerequisite-software-knowledge.masks",
  masking: "tutorial-content-classification.tutorial-skill.masking",
  "color grading": "tutorial-content-classification.tutorial-skill.color-grading",
  color: "tutorial-content-classification.tutorial-topic.color",
  editing: "tutorial-content-classification.tutorial-skill.video-editing",
  "video editing": "tutorial-content-classification.tutorial-skill.video-editing",
  audio: "tutorial-content-classification.tutorial-topic.audio",
  "noise reduction": "tutorial-content-classification.tutorial-technique.noise-reduction",
  recording: "tutorial-content-classification.tutorial-skill.recording",
  mixing: "tutorial-content-classification.tutorial-skill.mixing",
  export: "tutorial-content-classification.tutorial-skill.export",
  rendering: "tutorial-content-classification.tutorial-skill.rendering",
};

function existingIds(topics: string[]): string[] {
  return [
    ...new Set(
      topics.flatMap((topic) => {
        const normalized = normalizeOntologyLabel(topic);
        const direct = TOPIC_ONTOLOGY_IDS[normalized];
        return direct && ontologyHasId(direct) ? [direct] : [];
      }),
    ),
  ];
}

function legacyMetadata(tutorial: Tutorial): TutorialMetadata {
  const conceptIds = existingIds(tutorial.topics);
  const broad =
    tutorial.durationMinutes !== null && tutorial.durationMinutes >= 60 ||
    /\b(?:full|complete|course|beginner tutorial)\b/i.test(tutorial.title.en);
  return {
    tutorialMetadataVersion: 1,
    id: `quanda:${tutorial.id}`,
    provider: "quanda_catalog",
    externalId: tutorial.youtubeVideoId,
    title: tutorial.title.en,
    creator: tutorial.creator,
    url: tutorial.url,
    language: tutorial.language,
    ...(tutorial.durationMinutes ? { durationMinutes: tutorial.durationMinutes } : {}),
    publishedAt: tutorial.publishedAt,
    verifiedAt: tutorial.verifiedAt,
    softwareIds: [tutorial.applicationId],
    softwareVersions: [tutorial.versionLabel],
    skillIds: conceptIds,
    techniqueIds: conceptIds,
    prerequisiteIds: [],
    aestheticIds: [],
    productionStageIds: [],
    outputIds: [],
    difficulty: tutorial.level,
    tutorialType: broad ? "broad_course" : "focused",
    sourceQuality: 0.92,
    classificationConfidence: conceptIds.length > 0 ? 0.9 : 0.65,
    status: "verified",
    metadata: { topics: tutorial.topics, versionLabel: tutorial.versionLabel },
  };
}

export function classifyTutorial(
  input: TutorialMetadata | Tutorial,
): TutorialDNA {
  const metadata = "tutorialMetadataVersion" in input ? input : legacyMetadata(input);
  const metadataHash = stableHash(
    JSON.stringify({
      id: metadata.id,
      title: metadata.title,
      url: metadata.url,
      softwareIds: metadata.softwareIds,
      skillIds: metadata.skillIds,
      techniqueIds: metadata.techniqueIds,
      publishedAt: metadata.publishedAt,
      status: metadata.status,
    }),
  );
  const cacheKey = `${metadata.provider}:${metadata.externalId ?? metadata.id}:${metadataHash}:${CLASSIFIER_VERSION}`;
  const cached = classificationCache.get(cacheKey);
  if (cached) return cached;

  const classified = TutorialDNASchema.parse({
    ...metadata,
    classifierVersion: CLASSIFIER_VERSION,
    metadataHash,
    learningObjectives: [metadata.title],
  });
  classificationCache.set(cacheKey, classified);
  return classified;
}

export function getTutorialClassificationCacheSize(): number {
  return classificationCache.size;
}

export function clearTutorialClassificationCache(): void {
  classificationCache.clear();
}
