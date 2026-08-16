import { describe, expect, it, vi } from "vitest";
import { ontologyArtifact } from "@/src/ontology/runtime";
import type { OntologyRetriever } from "@/src/ontology/retrieval/contracts";
import { HybridOntologyRetriever } from "@/src/ontology/retrieval/hybridRetriever";
import { LocalOntologyRetriever } from "@/src/ontology/retrieval/localRetriever";
import { buildOntologyRetrievalQuery } from "@/src/ontology/retrieval/queryBuilder";

function findNode(label: string, family?: string) {
  const node = ontologyArtifact.nodes.find(
    (candidate) =>
      candidate.label.toLocaleLowerCase() === label.toLocaleLowerCase() &&
      (!family || candidate.family === family),
  );
  if (!node) throw new Error(`Missing test ontology node: ${label}`);
  return node;
}

function hybrid(semanticRetriever?: OntologyRetriever) {
  return new HybridOntologyRetriever({
    nodes: ontologyArtifact.nodes,
    ontologySchemaVersion: ontologyArtifact.ontologySchemaVersion,
    ontologySourceHash: ontologyArtifact.source.sha256,
    semanticRetriever,
    semanticUnavailableReason: semanticRetriever ? undefined : "NOT_CONFIGURED",
    cacheTtlMs: 60_000,
  });
}

describe("ontology retrieval query construction", () => {
  it("keeps creative intent primary and experience explicitly secondary", () => {
    const query = buildOntologyRetrievalQuery({
      projectBrief: "Build an interactive Three.js audio-reactive website.",
      requiredApplications: ["Three.js"],
      outputType: "Website",
      currentExperience: "I know Blender and Photoshop.",
      tutorialLanguage: "en",
    });

    expect(query.indexOf("interactive Three.js")).toBeLessThan(
      query.indexOf("I know Blender"),
    );
    expect(query).toContain("EXPLICIT REQUIRED APPLICATIONS\nThree.js");
    expect(query).toContain("use for prerequisites only, not creative intent");
  });
});

describe("local ontology retrieval", () => {
  const retriever = new LocalOntologyRetriever(ontologyArtifact.nodes);

  it("includes explicit named concepts", async () => {
    const results = await retriever.search({
      query: "Create a Bauhaus poster in p5.js using GLSL.",
      maxResults: 30,
    });
    expect(results.some((candidate) => candidate.label === "Bauhaus")).toBe(true);
    expect(results.some((candidate) => candidate.label === "p5.js")).toBe(true);
    expect(results.some((candidate) => candidate.label === "GLSL")).toBe(true);
  });

  it("preserves explicitly required applications", async () => {
    const results = await retriever.search({
      query: "Build a hand-tracking projection installation.",
      requiredApplications: ["TouchDesigner"],
      maxResults: 30,
    });
    expect(
      results.some(
        (candidate) =>
          candidate.label === "TouchDesigner" &&
          candidate.matchSource === "exact",
      ),
    ).toBe(true);
  });

  it("supports family and category filters", async () => {
    const familyResults = await retriever.search({
      query: "dreamy Y2K glassy aesthetic",
      families: ["Creative Direction"],
      maxResults: 20,
    });
    const categoryResults = await retriever.search({
      query: "dreamy Y2K glassy aesthetic",
      categories: ["Aesthetic"],
      maxResults: 20,
    });
    expect(familyResults.length).toBeGreaterThan(0);
    expect(
      familyResults.every((candidate) => candidate.family === "Creative Direction"),
    ).toBe(true);
    expect(categoryResults.length).toBeGreaterThan(0);
    expect(
      categoryResults.every((candidate) => candidate.category === "Aesthetic"),
    ).toBe(true);
  });

  it("handles Vietnamese and technical terminology", async () => {
    const vietnamese = await retriever.search({
      query: "Tạo poster màu nước có chuyển động phản ứng với âm nhạc.",
      maxResults: 30,
    });
    expect(vietnamese.some((candidate) => candidate.label === "watercolor")).toBe(
      true,
    );

    for (const term of [
      "p5.js",
      "C++",
      "Three.js",
      "GLSL",
      "TouchDesigner",
      "Geometry Nodes",
    ]) {
      const results = await retriever.search({ query: term, maxResults: 20 });
      expect(
        results.some(
          (candidate) =>
            candidate.label.toLocaleLowerCase() === term.toLocaleLowerCase(),
        ),
        term,
      ).toBe(true);
    }
  });

  it("does not let experience-only software dominate intent retrieval", async () => {
    const query = buildOntologyRetrievalQuery({
      projectBrief: "Make a generative audio-reactive interactive website.",
      currentExperience: "I know Blender.",
      outputType: "Website",
    });
    const results = await retriever.search({ query, maxResults: 30 });
    const blenderCount = results.filter(
      (candidate) => candidate.label === "Blender",
    ).length;
    expect(blenderCount).toBe(0);
    expect(
      results.some((candidate) =>
        ["creative coding", "audio-reactive", "interactive"].includes(
          candidate.label.toLocaleLowerCase(),
        ),
      ),
    ).toBe(true);
  });
});

describe("hybrid ontology retrieval", () => {
  it("substitutes a semantic provider and deduplicates canonical IDs", async () => {
    const bauhaus = findNode("Bauhaus", "Creative Direction");
    const webgpu = findNode("WebGPU", "Web and Creative Coding");
    const semantic: OntologyRetriever = {
      search: vi.fn().mockResolvedValue([
        { ...bauhaus, score: 0.92, matchSource: "semantic" },
        { ...webgpu, score: 0.86, matchSource: "semantic" },
        { ...webgpu, score: 0.80, matchSource: "semantic" },
      ]),
    };
    const result = await hybrid(semantic).searchWithDiagnostics({
      query: "Bauhaus generative poster",
      maxResults: 20,
    });

    expect(result.candidates.filter((candidate) => candidate.id === webgpu.id)).toHaveLength(
      1,
    );
    expect(
      result.candidates.find((candidate) => candidate.id === bauhaus.id)
        ?.matchSource,
    ).toBe("exact");
    expect(result.diagnostics.semanticResults).toBe(3);
    expect(result.diagnostics.fallbackUsed).toBe(false);
  });

  it("falls back deterministically when the provider fails", async () => {
    const semantic: OntologyRetriever = {
      search: vi.fn().mockRejectedValue(Object.assign(new Error("offline"), { code: "TIMEOUT" })),
    };
    const result = await hybrid(semantic).searchWithDiagnostics({
      query: "Bauhaus poster",
      maxResults: 20,
    });
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.diagnostics.fallbackUsed).toBe(true);
    expect(result.diagnostics.providerErrorCode).toBe("TIMEOUT");
    expect(
      result.candidates.some((candidate) => candidate.matchSource === "fallback"),
    ).toBe(true);
  });

  it("never exceeds the requested result limit", async () => {
    const results = await hybrid().search({
      query: "design motion animation creative production interactive",
      maxResults: 10,
    });
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it("reuses equivalent requests from the in-memory cache", async () => {
    const semanticSearch = vi.fn().mockResolvedValue([]);
    const retriever = hybrid({ search: semanticSearch });
    const request = { query: "Bauhaus poster", maxResults: 20 };
    const first = await retriever.searchWithDiagnostics(request);
    const second = await retriever.searchWithDiagnostics(request);
    expect(first.diagnostics.cacheHit).toBe(false);
    expect(second.diagnostics.cacheHit).toBe(true);
    expect(semanticSearch).toHaveBeenCalledOnce();
    expect(second.candidates).toEqual(first.candidates);
  });
});
