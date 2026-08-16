import { describe, expect, it } from "vitest";
import { preciseTutorials } from "@/src/data/preciseTutorials";
import {
  classifyTutorial,
  clearTutorialClassificationCache,
  getTutorialClassificationCacheSize,
} from "@/src/tutorial-matching/classifier";
import { YouTubeDataApiProvider } from "@/src/tutorial-matching/providers";

describe("tutorial discovery and classification", () => {
  it("keeps stable provider IDs and direct discovered URLs", () => {
    for (const tutorial of preciseTutorials) {
      expect(tutorial.externalId).toBeTruthy();
      expect(tutorial.url).toBe(
        `https://www.youtube.com/watch?v=${tutorial.externalId}`,
      );
    }
  });

  it("caches unchanged tutorial classification by metadata hash and version", () => {
    clearTutorialClassificationCache();
    const first = classifyTutorial(preciseTutorials[0]);
    const second = classifyTutorial(preciseTutorials[0]);
    expect(second).toBe(first);
    expect(getTutorialClassificationCacheSize()).toBe(1);
  });

  it("uses only video IDs returned by the official YouTube API", async () => {
    const provider = new YouTubeDataApiProvider("server-secret", async (url) => {
      expect(String(url)).toContain("type=video");
      return new Response(JSON.stringify({
        items: [{
          id: { videoId: "abcDEF12345" },
          snippet: {
            title: "Focused Blender tutorial",
            channelTitle: "Creator",
            publishedAt: "2026-01-01T00:00:00Z",
            defaultAudioLanguage: "en",
          },
        }],
      }), { status: 200 });
    });
    const [result] = await provider.search({
      query: "Blender toon shading",
      language: "en",
      softwareIds: ["blender"],
      maxResults: 5,
    });
    expect(result.tutorial.externalId).toBe("abcDEF12345");
    expect(result.tutorial.url).toBe(
      "https://www.youtube.com/watch?v=abcDEF12345",
    );
    expect(result.sourceTier).toBe("live");
  });
});
