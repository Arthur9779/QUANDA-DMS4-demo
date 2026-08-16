import { describe, expect, it } from "vitest";
import { CreativeDnaModelOutputSchema } from "@/src/project-analysis/contracts";
import { normalizeCreativeDna } from "@/src/project-analysis/normalizeCreativeDna";
import { ontologyArtifact } from "@/src/ontology/runtime";
import type { OntologyCandidate } from "@/src/ontology/retrieval";

const request = {
  interfaceLanguage: "en" as const,
  projectBrief:
    "I want a minimalist poster but also an extremely dense maximalist composition with a Bauhaus influence.",
  currentExperience: "Intermediate graphic designer",
  requiredApplications: [] as string[],
  outputType: "graphic",
  targetQuality: "portfolio" as const,
  tutorialLanguage: "en" as const,
};

function node(id: string) {
  const value = ontologyArtifact.nodes.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing ontology node ${id}`);
  return value;
}

function candidate(id: string, matchSource: OntologyCandidate["matchSource"] = "semantic") {
  const value = node(id);
  return {
    id: value.id,
    label: value.label,
    family: value.family,
    category: value.category,
    score: 0.9,
    matchSource,
  } satisfies OntologyCandidate;
}

const bauhausId = "creative-direction.aesthetic.bauhaus";
const minimalistId = "creative-direction.aesthetic.minimalist";
const maximalistId = "creative-direction.aesthetic.maximalist";

describe("Creative DNA canonical normalization", () => {
  it("rejects invented IDs, preserves their wording, and overwrites model metadata", () => {
    const normalized = normalizeCreativeDna({
      request,
      candidates: [candidate(bauhausId)],
      modelOutput: {
        projectIntent: "Create a contrasting Bauhaus poster.",
        concepts: [
          {
            ontologyId: bauhausId,
            rawLabel: "Wrong model label",
            source: "user_preference",
            confidence: 0.94,
            evidence: {
              sourceField: "projectBrief",
              excerpt: "Bauhaus influence",
            },
          },
          {
            ontologyId: "creative-direction.aesthetic.super-cool-anime",
            rawLabel: "super cool anime",
            source: "ai_inferred",
            confidence: 0.8,
          },
        ],
        unknownConcepts: [],
        constraints: [],
      },
    });

    expect(
      normalized.creativeDna.concepts.find(
        (concept) => concept.ontologyId === bauhausId,
      ),
    ).toMatchObject({
      label: "Bauhaus",
      family: "Creative Direction",
      category: "Aesthetic",
    });
    expect(normalized.rejectedOntologyIds).toEqual([
      "creative-direction.aesthetic.super-cool-anime",
    ]);
    expect(normalized.creativeDna.unknownConcepts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ raw: "super cool anime" }),
      ]),
    );
  });

  it("deduplicates IDs by provenance priority without deleting conflicts", () => {
    const normalized = normalizeCreativeDna({
      request,
      candidates: [
        candidate(bauhausId),
        candidate(minimalistId),
        candidate(maximalistId),
      ],
      modelOutput: {
        projectIntent: "Create a deliberately conflicting poster.",
        concepts: [
          {
            ontologyId: bauhausId,
            rawLabel: "Bauhaus",
            source: "ai_inferred",
            confidence: 0.7,
          },
          {
            ontologyId: bauhausId,
            rawLabel: "Bauhaus",
            source: "user_preference",
            confidence: 0.9,
          },
          {
            ontologyId: minimalistId,
            rawLabel: "minimalist",
            source: "user_preference",
            confidence: 0.95,
          },
          {
            ontologyId: maximalistId,
            rawLabel: "maximalist",
            source: "user_preference",
            confidence: 0.95,
          },
        ],
        unknownConcepts: [],
        constraints: [],
      },
    });
    expect(
      normalized.creativeDna.concepts.filter(
        (concept) => concept.ontologyId === bauhausId,
      ),
    ).toHaveLength(1);
    expect(
      normalized.creativeDna.concepts.find(
        (concept) => concept.ontologyId === bauhausId,
      )?.source,
    ).toBe("user_preference");
    expect(
      normalized.creativeDna.concepts.map((concept) => concept.ontologyId),
    ).toEqual(expect.arrayContaining([minimalistId, maximalistId]));
  });

  it("rejects out-of-range model confidence", () => {
    expect(() =>
      CreativeDnaModelOutputSchema.parse({
        projectIntent: "Create a poster.",
        concepts: [
          {
            ontologyId: bauhausId,
            rawLabel: "Bauhaus",
            source: "ai_inferred",
            confidence: 1.2,
          },
        ],
        unknownConcepts: [],
        constraints: [],
      }),
    ).toThrow();
  });

  it("preserves unknown aesthetic wording and validates nearest IDs", () => {
    const customRequest = {
      ...request,
      projectBrief:
        "Create an After Effects ident with a neo-y2k eco-rave look.",
    };
    const normalized = normalizeCreativeDna({
      request: customRequest,
      candidates: [candidate(bauhausId)],
      modelOutput: {
        projectIntent: "Create an experimental ident.",
        concepts: [],
        unknownConcepts: [
          {
            raw: "neo-y2k eco-rave",
            nearestOntologyIds: [
              bauhausId,
              "creative-direction.aesthetic.not-real",
            ],
            source: "user_preference",
            confidence: 0.6,
          },
        ],
        constraints: [],
      },
    });
    expect(normalized.creativeDna.unknownConcepts).toContainEqual(
      expect.objectContaining({
        raw: "neo-y2k eco-rave",
        nearestOntologyIds: [bauhausId],
      }),
    );
  });

  it("demotes an unsupported explicit claim to a stated preference", () => {
    const blenderTool =
      "tools-and-software.software.blender";
    const preferenceRequest = {
      ...request,
      projectBrief: "I prefer Blender for this poster, but it is optional.",
    };
    const normalized = normalizeCreativeDna({
      request: preferenceRequest,
      candidates: [candidate(blenderTool)],
      modelOutput: {
        projectIntent: "Create a poster, preferably with Blender.",
        concepts: [
          {
            ontologyId: blenderTool,
            rawLabel: "Blender",
            source: "explicit_requirement",
            confidence: 0.9,
            evidence: {
              sourceField: "projectBrief",
              excerpt: "I prefer Blender for this poster",
            },
          },
        ],
        unknownConcepts: [],
        constraints: [],
      },
    });
    expect(normalized.creativeDna.concepts).toContainEqual(
      expect.objectContaining({
        ontologyId: blenderTool,
        source: "user_preference",
      }),
    );
  });
});
