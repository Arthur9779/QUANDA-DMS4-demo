import { describe, expect, it } from "vitest";
import {
  extractYouTubeVideoId,
  fillTutorialIds,
  matchTutorialsForStage,
  resolveRoadmapTutorialRecommendations,
  resolveTutorialRecommendations,
  selectCandidateTutorials,
  tutorials,
  validateTutorialIds,
} from "@/src/lib/tutorialMatcher";
import type { RoadmapStage } from "@/src/types";
import { applications } from "@/src/data/applications";

const stage: RoadmapStage = {
  id: "model",
  order: 1,
  title: "Model a simple product",
  goal: "Create clean hard-surface geometry in Blender.",
  why: "The model is the foundation of the animation.",
  applicationId: "blender",
  skillToLearn: "Beginner Blender modelling",
  tasks: ["Block the silhouette", "Refine the geometry"],
  learningMinutes: 60,
  productionMinutes: 120,
  dependsOnStageIds: [],
  tutorialIds: [],
};

describe("tutorial catalogue matching", () => {
  it("contains direct YouTube videos only", () => {
    expect(tutorials).toHaveLength(60);
    expect(
      tutorials.every(
        (tutorial) =>
          tutorial.sourceType === "video" &&
          extractYouTubeVideoId(tutorial.url) === tutorial.youtubeVideoId,
      ),
    ).toBe(true);
    expect(extractYouTubeVideoId("https://www.youtube.com/results?search_query=blender"))
      .toBeNull();
    expect(extractYouTubeVideoId("https://example.com/watch?v=ILqOWe3zAbk"))
      .toBeNull();
    expect(
      tutorials.find((tutorial) => tutorial.id === "audacity-noise-reduction-en")
        ?.youtubeVideoId,
    ).toBe("eAo02yhQBgg");
  });

  it("keeps only unique catalogue IDs", () => {
    expect(
      validateTutorialIds([
        "blender-2026-course-en",
        "not-in-the-catalogue",
        "blender-2026-course-en",
      ]),
    ).toEqual(["blender-2026-course-en"]);
  });

  it("falls back to deterministic catalogue matches for a stage", () => {
    const matches = matchTutorialsForStage(stage, "en");

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(3);
    expect(matches.every((tutorial) => tutorial.applicationId === "blender")).toBe(true);
    expect(
      matchTutorialsForStage(stage, "en").map((tutorial) => tutorial.id),
    ).toEqual(matches.map((tutorial) => tutorial.id));
  });

  it("replaces an AI-selected video when it belongs to another application", () => {
    const ids = fillTutorialIds(
      { ...stage, tutorialIds: ["figma-auto-layout-en"] },
      "en",
    );

    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith("blender-"))).toBe(true);
  });

  it("does not create search links when no verified video matches", () => {
    const unsupportedStage = {
      ...stage,
      applicationId: "unknown-app",
      tutorialIds: [],
    };

    expect(resolveTutorialRecommendations(unsupportedStage, "en", "en"))
      .toEqual([]);
  });

  it("returns a YouTube thumbnail and direct watch action data", () => {
    const [recommendation] = resolveTutorialRecommendations(stage, "en", "en");

    expect(recommendation.badge).toBe("youtube");
    expect(recommendation.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    expect(recommendation.thumbnailUrl).toBe(
      `https://i.ytimg.com/vi/${extractYouTubeVideoId(recommendation.url)}/hqdefault.jpg`,
    );
  });

  it("keeps the catalogue balanced across supported applications and languages", () => {
    const applications = new Set(tutorials.map((tutorial) => tutorial.applicationId));

    expect(applications.size).toBe(10);
    for (const applicationId of applications) {
      expect(
        tutorials.filter(
          (tutorial) =>
            tutorial.applicationId === applicationId && tutorial.language === "en",
        ),
      ).toHaveLength(3);
      expect(
        tutorials.filter(
          (tutorial) =>
            tutorial.applicationId === applicationId && tutorial.language === "vi",
        ),
      ).toHaveLength(3);
    }
    expect(tutorials.every((tutorial) => tutorial.publishedAt && tutorial.versionLabel))
      .toBe(true);
  });

  it("covers every application shown in the project form", () => {
    const catalogueApplicationIds = new Set(
      tutorials.map((tutorial) => tutorial.applicationId),
    );

    expect(
      applications.every((application) => catalogueApplicationIds.has(application.id)),
    ).toBe(true);
  });

  it("gives the AI at least one candidate for every selected application", () => {
    const selected = selectCandidateTutorials({
      interfaceLanguage: "en",
      projectBrief:
        "Create a mixed-media portfolio project using every selected creative application.",
      deadline: "2026-12-01",
      currentExperience: "Beginner across the selected applications.",
      hoursPerDay: 2,
      daysPerWeek: 5,
      tutorialLanguage: "either",
      requiredApplications: applications.map((application) => application.id),
      outputType: "other",
      targetQuality: "basic",
    });
    const selectedApplicationIds = new Set(
      selected.map((tutorial) => tutorial.applicationId),
    );

    expect(
      applications.every((application) => selectedApplicationIds.has(application.id)),
    ).toBe(true);
  });

  it("never repeats a tutorial across stages in one roadmap", () => {
    const roadmapStages = Array.from({ length: 5 }, (_, index) => ({
      ...stage,
      id: `blender-stage-${index + 1}`,
      order: index + 1,
      tutorialIds: [],
    }));
    const recommendations = resolveRoadmapTutorialRecommendations(
      roadmapStages,
      "either",
      "en",
    );
    const ids = Object.values(recommendations)
      .flat()
      .map((tutorial) => tutorial.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
