import type {
  TutorialDNA,
  TutorialMetadata,
} from "@/src/contracts/knowledge";
import { TutorialDNASchema } from "@/src/contracts/knowledge";
import type { Tutorial } from "@/src/lib/tutorialMatcher";
import { stableHash } from "@/src/tutorial-matching/hash";
import { canonicalSkillIdsForTopics } from "@/src/tutorial-matching/skillTaxonomy";

const CLASSIFIER_VERSION = 1 as const;
const classificationCache = new Map<string, TutorialDNA>();

function existingIds(topics: string[]): string[] {
  return canonicalSkillIdsForTopics(topics);
}

function legacyMetadata(tutorial: Tutorial): TutorialMetadata {
  const conceptIds = existingIds(tutorial.topics);
  const broad =
    tutorial.durationMinutes !== null && tutorial.durationMinutes >= 60 ||
    /\b(?:full|complete|course|beginner tutorial)\b/i.test(tutorial.title.en);
  return {
    tutorialMetadataVersion: 1,
    // Keep the catalogue ID stable across the learning-path and roadmap
    // systems. Sample/fallback roadmaps already store this ID, so adding a
    // provider prefix here makes selected tutorials disappear at handoff.
    id: tutorial.id,
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
