import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/roadmap/route";
import { matchProjectTutorials } from "@/src/tutorial-matching/matchProject";
import {
  createIntegratedFallback,
  createRoadmapInput,
  selectedTutorialsForPlan,
} from "@/src/roadmap";

const project = {
  interfaceLanguage: "en" as const,
  projectBrief:
    "Create a 20-second Blender product animation with lighting, a camera move, and a final MP4 export.",
  deadline: "2026-09-30",
  currentExperience: "I am new to Blender.",
  hoursPerDay: 2,
  daysPerWeek: 5,
  tutorialLanguage: "en" as const,
  requiredApplications: ["blender"],
  outputType: "video" as const,
  targetQuality: "portfolio" as const,
};

const review = {
  reviewVersion: 1 as const,
  inputFingerprint: "12ab34cd",
  confirmed: true,
  analysis: {
    creativeDna: {
      creativeDnaVersion: 1 as const,
      projectIntent: "A short Blender product animation",
      concepts: [],
      unknownConcepts: [],
      constraints: [],
    },
    retrieval: {
      candidateCount: 0,
      backend: "local" as const,
      fallbackUsed: true,
    },
    capabilityContext: {
      currentExperience: project.currentExperience,
      requiredApplications: project.requiredApplications,
    },
    source: "fallback" as const,
    diagnostics: {
      classificationDurationMs: 0,
      retrievedCandidateIds: [],
      acceptedOntologyIds: [],
      rejectedOntologyIds: [],
      unknownConceptCount: 0,
      fallbackUsed: true,
      failureCode: "NOT_CONFIGURED",
    },
  },
};

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  vi.restoreAllMocks();
});

describe("roadmap API fallback diagnostics", () => {
  it("explains an unconfigured deployment without claiming a connection failure", async () => {
    delete process.env.GEMINI_API_KEY;
    const learningPlan = await matchProjectTutorials(
      { project, review },
      { environment: { NODE_ENV: "test" } },
    );
    const response = await POST(
      new NextRequest("http://localhost/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "roadmap-route-no-key",
        },
        body: JSON.stringify({ project, review, learningPlan }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-QUANDA-Source")).toBe("fallback");
    const body = (await response.json()) as { notice?: string };
    expect(body.notice).toContain("not configured for this deployment");
    expect(body.notice).not.toContain("could not reach");
  });

  it("repairs a schema-valid AI plan that omitted selected tutorials", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const learningPlan = await matchProjectTutorials(
      { project, review },
      { environment: { NODE_ENV: "test" } },
    );
    const roadmapInput = createRoadmapInput({ project, review, learningPlan });
    const validRoadmap = {
      ...createIntegratedFallback(roadmapInput),
      source: "ai" as const,
      notice: undefined,
    };
    const incompleteRoadmap = {
      ...validRoadmap,
      stages: validRoadmap.stages.map((stage) => ({
        ...stage,
        tutorialIds: [],
      })),
    };
    const googleResponse = (roadmap: object) =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(roadmap) }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(googleResponse(incompleteRoadmap))
      .mockResolvedValueOnce(googleResponse(validRoadmap));

    const response = await POST(
      new NextRequest("http://localhost/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "roadmap-route-constraint-repair",
        },
        body: JSON.stringify({ project, review, learningPlan }),
      }),
    );
    const body = (await response.json()) as ReturnType<
      typeof createIntegratedFallback
    >;
    const selectedTutorialIds = selectedTutorialsForPlan(learningPlan).map(
      (item) => item.tutorial.id,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-QUANDA-Source")).toBe("ai");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.stages.flatMap((stage) => stage.tutorialIds).sort()).toEqual(
      [...new Set(selectedTutorialIds)].sort(),
    );
  });
});
