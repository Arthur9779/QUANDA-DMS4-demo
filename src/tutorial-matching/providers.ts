import { preciseTutorials } from "@/src/data/preciseTutorials";
import { tutorials } from "@/src/lib/tutorialMatcher";
import { classifyTutorial } from "@/src/tutorial-matching/classifier";
import type {
  TutorialDiscoveryRequest,
  TutorialDiscoveryResult,
} from "@/src/tutorial-matching/contracts";

export interface TutorialDiscoveryProvider {
  readonly name: string;
  search(request: TutorialDiscoveryRequest): Promise<TutorialDiscoveryResult[]>;
}

function terms(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !["tutorial", "beginner"].includes(term));
}

function catalogueScore(
  request: TutorialDiscoveryRequest,
  candidate: TutorialDiscoveryResult,
): number {
  const queryTerms = new Set(terms(request.query));
  const metadataTopics = candidate.tutorial.metadata?.topics;
  const candidateTerms = new Set(
    terms(
      [
        candidate.tutorial.title,
        ...(Array.isArray(metadataTopics)
          ? metadataTopics.filter((item): item is string => typeof item === "string")
          : []),
      ].join(" "),
    ),
  );
  let score = 0;
  for (const term of queryTerms) if (candidateTerms.has(term)) score += 2;
  if (
    request.softwareIds.length > 0 &&
    candidate.tutorial.softwareIds.some((id) => request.softwareIds.includes(id))
  ) {
    score += 8;
  }
  if (
    request.language &&
    request.language !== "either" &&
    candidate.tutorial.language === request.language
  ) {
    score += 2;
  }
  return score;
}

export class CatalogueTutorialProvider implements TutorialDiscoveryProvider {
  readonly name = "quanda-catalogue";

  async search(
    request: TutorialDiscoveryRequest,
  ): Promise<TutorialDiscoveryResult[]> {
    const candidates: TutorialDiscoveryResult[] = [
      ...tutorials.map((tutorial) => ({
        tutorial: classifyTutorial(tutorial),
        sourceTier: "curated" as const,
      })),
      ...preciseTutorials.map((tutorial) => ({
        tutorial: classifyTutorial(tutorial),
        sourceTier:
          tutorial.status === "verified" ? "curated" as const : "indexed" as const,
      })),
    ];
    return candidates
      .map((candidate) => ({
        candidate,
        score: catalogueScore(request, candidate),
      }))
      .filter(({ score }) => score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.candidate.tutorial.id.localeCompare(right.candidate.tutorial.id),
      )
      .slice(0, request.maxResults)
      .map(({ candidate }) => candidate);
  }
}

function youtubeVideoId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const id = (value as { id?: { videoId?: unknown } }).id?.videoId;
  return typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export class YouTubeDataApiProvider implements TutorialDiscoveryProvider {
  readonly name = "youtube-data-api";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async search(
    request: TutorialDiscoveryRequest,
  ): Promise<TutorialDiscoveryResult[]> {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: String(Math.min(request.maxResults, 15)),
      q: request.query,
      key: this.apiKey,
    });
    if (request.language && request.language !== "either") {
      params.set("relevanceLanguage", request.language);
    }
    const response = await this.fetchImpl(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) throw new Error(`youtube_discovery_${response.status}`);
    const payload = (await response.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          publishedAt?: string;
          defaultAudioLanguage?: string;
          defaultLanguage?: string;
          description?: string;
        };
      }>;
    };
    return (payload.items ?? []).flatMap((item) => {
      const externalId = youtubeVideoId(item);
      const title = item.snippet?.title?.trim();
      if (!externalId || !title) return [];
      const tutorial = classifyTutorial({
        tutorialMetadataVersion: 1,
        id: `youtube:${externalId.toLowerCase()}`,
        provider: "youtube",
        externalId,
        title,
        ...(item.snippet?.channelTitle
          ? { creator: item.snippet.channelTitle }
          : {}),
        url: `https://www.youtube.com/watch?v=${externalId}`,
        language:
          item.snippet?.defaultAudioLanguage ??
          item.snippet?.defaultLanguage ??
          request.language === "either"
            ? "en"
            : request.language,
        ...(item.snippet?.publishedAt
          ? { publishedAt: item.snippet.publishedAt.slice(0, 10) }
          : {}),
        softwareIds: request.softwareIds,
        softwareVersions: [],
        skillIds: [],
        techniqueIds: [],
        prerequisiteIds: [],
        aestheticIds: [],
        productionStageIds: [],
        outputIds: [],
        tutorialType: "other",
        sourceQuality: 0.45,
        classificationConfidence: 0.35,
        status: "unverified",
        metadata: { description: item.snippet?.description ?? "" },
      });
      return [{ tutorial, sourceTier: "live" as const }];
    });
  }
}

export class TieredTutorialDiscoveryProvider
  implements TutorialDiscoveryProvider
{
  readonly name = "tiered";

  constructor(private readonly providers: TutorialDiscoveryProvider[]) {}

  async search(
    request: TutorialDiscoveryRequest,
  ): Promise<TutorialDiscoveryResult[]> {
    const results: TutorialDiscoveryResult[] = [];
    const seen = new Set<string>();
    for (const provider of this.providers) {
      try {
        const candidates = await provider.search(request);
        for (const candidate of candidates) {
          if (seen.has(candidate.tutorial.id)) continue;
          seen.add(candidate.tutorial.id);
          results.push(candidate);
          if (results.length >= request.maxResults) return results;
        }
      } catch {
        // A lower source tier must not break curated/indexed recommendations.
      }
    }
    return results;
  }
}

export function createTutorialDiscoveryProvider(
  environment: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): TutorialDiscoveryProvider {
  const providers: TutorialDiscoveryProvider[] = [
    new CatalogueTutorialProvider(),
  ];
  if (environment.YOUTUBE_API_KEY) {
    providers.push(
      new YouTubeDataApiProvider(environment.YOUTUBE_API_KEY, fetchImpl),
    );
  }
  return new TieredTutorialDiscoveryProvider(providers);
}
