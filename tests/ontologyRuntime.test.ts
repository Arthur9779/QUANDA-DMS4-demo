import { describe, expect, it } from "vitest";
import {
  findOntologyConcepts,
  getConceptsByCategory,
  getConceptsByFamily,
  getOntologyConcept,
  ontologyArtifact,
  ontologyHasId,
  searchOntologyByLabel,
} from "@/src/ontology/runtime";

describe("runtime ontology lookup", () => {
  it("looks up a concept by canonical ID", () => {
    const node = ontologyArtifact.nodes.find((candidate) => candidate.label === "Bauhaus");
    expect(node).toBeDefined();
    expect(ontologyHasId(node?.id as string)).toBe(true);
    expect(getOntologyConcept(node?.id as string)).toEqual(node);
    expect(ontologyHasId("unknown.concept")).toBe(false);
  });

  it("looks up family and category membership deterministically", () => {
    const family = getConceptsByFamily("Creative Direction");
    const category = getConceptsByCategory("Aesthetic", "Creative Direction");

    expect(family.length).toBeGreaterThan(category.length);
    expect(category.some((node) => node.label === "Bauhaus")).toBe(true);
    expect([...category].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      category,
    );
  });

  it.each([
    ["toon shading", "toon shading"],
    ["bauhaus", "Bauhaus"],
    ["y2k", "Y2K"],
    ["javascript", "JavaScript"],
    ["watercolor", "watercolor"],
    ["geometry nodes", "geometry nodes"],
  ])("returns a sensible lexical candidate for %s", (query, expectedLabel) => {
    expect(
      searchOntologyByLabel(query, { limit: 25 }).some(
        (node) => node.label === expectedLabel,
      ),
    ).toBe(true);
  });

  it("returns every exact candidate when a label is globally ambiguous", () => {
    const results = findOntologyConcepts("composition");
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((node) => node.normalizedLabel === "composition")).toBe(
      true,
    );
  });
});
