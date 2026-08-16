import { describe, expect, it } from "vitest";
import { groupCreativeDnaConcepts } from "@/src/creative-dna-review/grouping";

describe("Creative DNA display grouping", () => {
  it("uses ontology category meaning before broad family names", () => {
    const groups = groupCreativeDnaConcepts([
      {
        ontologyId: "graphic-design.poster-style.bauhaus",
        label: "Bauhaus",
        family: "Graphic Design",
        category: "Poster Style",
        source: "user_preference",
        status: "unconfirmed",
      },
      {
        ontologyId: "project-requirements.required-software.blender",
        label: "Blender",
        family: "Project Requirements",
        category: "Required Software",
        source: "explicit_requirement",
        status: "unconfirmed",
      },
      {
        ontologyId: "visual-characteristics.surface-quality.glossy",
        label: "glossy",
        family: "Visual Characteristics",
        category: "Surface Quality",
        source: "ai_inferred",
        status: "unconfirmed",
        confidence: 0.8,
      },
    ]);
    expect(groups).toEqual([
      expect.objectContaining({
        key: "creativeDirection",
        concepts: [expect.objectContaining({ label: "Bauhaus" })],
      }),
      expect.objectContaining({
        key: "visualQualities",
        concepts: [expect.objectContaining({ label: "glossy" })],
      }),
    ]);
  });
});
