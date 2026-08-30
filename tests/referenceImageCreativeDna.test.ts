import { describe, expect, it } from "vitest";
import type { CreativeDNA } from "@/src/contracts/knowledge";
import { mergeApprovedReferenceFindings } from "@/src/creative-dna-review/operations";

const emptyDna: CreativeDNA = {
  creativeDnaVersion: 1,
  projectIntent: "Create a visual project.",
  concepts: [],
  unknownConcepts: [],
  constraints: [],
};

describe("approved reference findings", () => {
  it("adds only caller-approved findings with reference provenance", () => {
    const merged = mergeApprovedReferenceFindings(emptyDna, [
      {
        id: "reference-1234abcd",
        label: "High contrast",
        category: "visual_quality",
        evidence: "Very light forms sit on a black background.",
        confidence: 0.93,
        ontology: {
          id: "visual-characteristics.contrast.high-contrast",
          label: "high contrast",
          family: "Visual Characteristics",
          category: "Contrast",
        },
      },
      {
        id: "reference-5678abcd",
        label: "Dreamlike petal drift",
        category: "motion_interaction",
        evidence: "Petal-like forms appear suspended across the frame.",
        confidence: 0.74,
      },
    ]);

    expect(merged.concepts).toContainEqual(
      expect.objectContaining({
        ontologyId: "visual-characteristics.contrast.high-contrast",
        source: "user_added",
        status: "user_confirmed",
        evidence: expect.objectContaining({ sourceField: "reference" }),
      }),
    );
    expect(merged.unknownConcepts).toContainEqual(
      expect.objectContaining({
        raw: "Dreamlike petal drift",
        source: "user_added",
        status: "user_confirmed",
        evidence: expect.objectContaining({ sourceField: "reference" }),
      }),
    );
  });

  it("does not change Creative DNA when no findings were approved", () => {
    expect(mergeApprovedReferenceFindings(emptyDna, [])).toEqual(emptyDna);
  });
});

