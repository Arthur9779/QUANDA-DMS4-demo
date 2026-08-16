import { describe, expect, it } from "vitest";
import type { CreativeDNA } from "@/src/contracts/knowledge";
import {
  addOntologyConcept,
  addUnknownConcept,
  confirmCreativeDna,
  conceptIdentity,
  mergeReviewOverrides,
  rejectConcept,
} from "@/src/creative-dna-review/operations";

const dna: CreativeDNA = {
  creativeDnaVersion: 1,
  projectIntent: "Create a Y2K Blender animation.",
  concepts: [
    {
      ontologyId: "project-requirements.required-software.blender",
      label: "Blender",
      family: "Project Requirements",
      category: "Required Software",
      source: "explicit_requirement",
      status: "unconfirmed",
    },
    {
      ontologyId: "creative-direction.aesthetic.cyberpunk",
      label: "Cyberpunk",
      family: "Creative Direction",
      category: "Aesthetic",
      source: "ai_inferred",
      status: "unconfirmed",
      confidence: 0.61,
    },
  ],
  unknownConcepts: [],
  constraints: [],
};

describe("Creative DNA review operations", () => {
  it("rejects an AI inference without deleting its history", () => {
    const cyberpunk = dna.concepts[1];
    const result = rejectConcept(dna, conceptIdentity(cyberpunk));
    expect(result.concepts).toHaveLength(2);
    expect(result.concepts[1].status).toBe("user_rejected");
  });

  it("protects an explicit requirement from casual removal", () => {
    const blender = dna.concepts[0];
    const casual = rejectConcept(dna, conceptIdentity(blender));
    expect(casual.concepts[0].status).toBe("unconfirmed");

    const deliberate = rejectConcept(dna, conceptIdentity(blender), {
      allowExplicitRequirement: true,
    });
    expect(deliberate.concepts[0].status).toBe("user_rejected");
  });

  it("adds a canonical concept as a confirmed user choice", () => {
    const result = addOntologyConcept(dna, {
      id: "image-making-characteristics.post-processing-style.fisheye",
      label: "fisheye",
      family: "Image-Making Characteristics",
      category: "Post-Processing Style",
    });
    expect(result.concepts.at(-1)).toEqual(
      expect.objectContaining({
        label: "fisheye",
        source: "user_added",
        status: "user_confirmed",
      }),
    );
  });

  it("preserves exact free-text wording", () => {
    const result = addUnknownConcept(dna, "  neo-y2k   eco rave  ");
    expect(result.unknownConcepts).toContainEqual(
      expect.objectContaining({
        raw: "neo-y2k eco rave",
        source: "user_added",
        status: "user_confirmed",
      }),
    );
  });

  it("confirms unconfirmed concepts without reviving rejections", () => {
    const rejected = rejectConcept(dna, conceptIdentity(dna.concepts[1]));
    const confirmed = confirmCreativeDna(rejected);
    expect(confirmed.concepts[0].status).toBe("user_confirmed");
    expect(confirmed.concepts[1].status).toBe("user_rejected");
  });

  it("keeps user additions and rejections across intentional re-analysis", () => {
    const edited = addOntologyConcept(
      rejectConcept(dna, conceptIdentity(dna.concepts[1])),
      {
        id: "image-making-characteristics.post-processing-style.fisheye",
        label: "fisheye",
        family: "Image-Making Characteristics",
        category: "Post-Processing Style",
      },
    );
    const merged = mergeReviewOverrides(edited, dna);
    expect(
      merged.concepts.find((concept) => concept.label === "Cyberpunk")?.status,
    ).toBe("user_rejected");
    expect(
      merged.concepts.find((concept) => concept.label === "fisheye"),
    ).toEqual(
      expect.objectContaining({
        source: "user_added",
        status: "user_confirmed",
      }),
    );
  });

  it("keeps a user's confirmation authoritative over a repeated inference", () => {
    const confirmed = confirmCreativeDna(dna);
    const merged = mergeReviewOverrides(confirmed, dna);
    expect(
      merged.concepts.find((concept) => concept.label === "Cyberpunk")?.status,
    ).toBe("user_confirmed");
    expect(
      merged.concepts.find((concept) => concept.label === "Blender")?.status,
    ).toBe("unconfirmed");
  });
});
