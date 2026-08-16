import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/tutorial-matching/route";

const project = {
  interfaceLanguage: "en" as const,
  projectBrief: "I am new to Blender and need a toon-shaded product animation with a simple camera move.",
  deadline: "2026-09-30",
  currentExperience: "Blender: complete beginner",
  hoursPerDay: 2,
  daysPerWeek: 5,
  tutorialLanguage: "en" as const,
  requiredApplications: ["blender"],
  outputType: "video" as const,
  targetQuality: "portfolio" as const,
};

describe("tutorial matching route", () => {
  it("rejects unconfirmed Creative DNA", async () => {
    const response = await POST(new Request("http://localhost/api/tutorial-matching", {
      method: "POST",
      body: JSON.stringify({ project, review: { confirmed: false } }),
    }));
    expect(response.status).toBe(400);
  });

  it("returns an offline skill-gap plan for confirmed Creative DNA", async () => {
    const review = {
      reviewVersion: 1 as const,
      inputFingerprint: "12ab34cd",
      confirmed: true,
      analysis: {
        creativeDna: {
          creativeDnaVersion: 1 as const,
          projectIntent: "Toon-shaded Blender product animation",
          concepts: [], unknownConcepts: [], constraints: [],
        },
        retrieval: { candidateCount: 0, backend: "local" as const, fallbackUsed: true },
        capabilityContext: { currentExperience: project.currentExperience, requiredApplications: ["blender"] },
        source: "fallback" as const,
        diagnostics: {
          classificationDurationMs: 0,
          retrievedCandidateIds: [], acceptedOntologyIds: [], rejectedOntologyIds: [],
          unknownConceptCount: 0, fallbackUsed: true,
        },
      },
    };
    const response = await POST(new Request("http://localhost/api/tutorial-matching", {
      method: "POST",
      body: JSON.stringify({ project, review }),
    }));
    expect(response.status).toBe(200);
    const data = await response.json() as {
      skillGaps: Array<{ label: string }>;
      tutorialRankingVersion: number;
    };
    expect(data.skillGaps.some((gap: { label: string }) => gap.label === "Toon shading"))
      .toBe(true);
    expect(data.tutorialRankingVersion).toBe(1);
  });
});
