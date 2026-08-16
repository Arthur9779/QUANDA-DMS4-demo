import { describe, expect, it } from "vitest";
import {
  CreativeDNAConceptSchema,
  CreativeDNASchema,
  OntologyNodeSchema,
  OntologyRelationshipSchema,
  TutorialMetadataSchema,
} from "@/src/contracts/knowledge";

const concept = {
  label: "Toon shading",
  source: "ai_inferred" as const,
  status: "unconfirmed" as const,
  confidence: 0.82,
  evidence: {
    sourceField: "projectBrief" as const,
    excerpt: "stylized product animation with toon shading",
  },
};

describe("knowledge contracts", () => {
  it("rejects confidence below zero", () => {
    expect(
      CreativeDNAConceptSchema.safeParse({ ...concept, confidence: -0.01 }).success,
    ).toBe(false);
  });

  it("rejects confidence above one", () => {
    expect(
      CreativeDNAConceptSchema.safeParse({ ...concept, confidence: 1.01 }).success,
    ).toBe(false);
  });

  it("preserves unknown creative language without forcing an ontology ID", () => {
    const parsed = CreativeDNASchema.parse({
      creativeDnaVersion: 1,
      projectIntent: "Create an experimental motion identity.",
      concepts: [],
      unknownConcepts: [{
        raw: "neo-y2k eco-rave",
        nearestOntologyIds: [],
        confidence: 0.52,
        source: "user_preference",
        status: "unconfirmed",
      }],
      constraints: [],
    });

    expect(parsed.unknownConcepts[0].raw).toBe("neo-y2k eco-rave");
    expect(parsed.unknownConcepts[0].nearestOntologyIds).toEqual([]);
  });

  it.each([
    ["explicit_requirement", "Blender"],
    ["user_preference", "Watercolor-inspired"],
    ["ai_inferred", "Cel shading"],
  ] as const)("preserves %s provenance", (source, label) => {
    const parsed = CreativeDNAConceptSchema.parse({
      label,
      source,
      status: "unconfirmed",
      ...(source === "ai_inferred" ? { confidence: 0.88 } : {}),
    });

    expect(parsed.source).toBe(source);
  });

  it("supports a user-added, user-confirmed concept", () => {
    const parsed = CreativeDNAConceptSchema.parse({
      label: "Datamoshing",
      source: "user_added",
      status: "user_confirmed",
      evidence: { sourceField: "userEdit" },
    });

    expect(parsed).toMatchObject({
      source: "user_added",
      status: "user_confirmed",
    });
  });

  it("preserves user rejection instead of deleting an inferred concept", () => {
    const parsed = CreativeDNAConceptSchema.parse({
      ...concept,
      label: "Cyberpunk",
      status: "user_rejected",
    });

    expect(parsed.status).toBe("user_rejected");
    expect(parsed.evidence?.excerpt).toBeTruthy();
  });

  it("validates a forward-compatible ontology node", () => {
    const parsed = OntologyNodeSchema.parse({
      ontologySchemaVersion: 1,
      id: "technique.toon-shading",
      label: "Toon shading",
      family: "visual-technique",
      category: "shading",
      normalizedLabel: "toon shading",
      aliases: ["cel shading"],
      metadata: { futureField: { allowed: true } },
    });

    expect(parsed.id).toBe("technique.toon-shading");
  });

  it("validates a typed, directional ontology relationship", () => {
    const parsed = OntologyRelationshipSchema.parse({
      ontologySchemaVersion: 1,
      sourceId: "technique.toon-shading",
      targetId: "skill.shader-editor-basics",
      type: "requires",
      origin: "curated",
    });

    expect(parsed.type).toBe("requires");
    expect(parsed.sourceId).not.toBe(parsed.targetId);
  });

  it("rejects unknown ontology relationship types", () => {
    expect(
      OntologyRelationshipSchema.safeParse({
        ontologySchemaVersion: 1,
        sourceId: "technique.toon-shading",
        targetId: "skill.shader-editor-basics",
        type: "sometimes_needs",
      }).success,
    ).toBe(false);
  });

  it("validates tutorial verification status", () => {
    const tutorial = {
      tutorialMetadataVersion: 1,
      id: "tutorial.toon-shading-quickstart",
      provider: "quanda_catalog",
      title: "Focused Toon Shading Quickstart",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      skillIds: ["skill.shader-editor-basics"],
      techniqueIds: ["technique.toon-shading"],
      status: "verified",
    };

    expect(TutorialMetadataSchema.parse(tutorial).status).toBe("verified");
    expect(
      TutorialMetadataSchema.safeParse({ ...tutorial, status: "trusted_forever" })
        .success,
    ).toBe(false);
  });
});
