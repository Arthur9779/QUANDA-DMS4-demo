import { describe, expect, it, vi } from "vitest";
import { analyzeProject } from "@/src/project-analysis/analyzeProject";
import {
  CreativeDnaClassifierError,
  type CreativeDnaClassifier,
} from "@/src/project-analysis/geminiClassifier";
import type { OntologyCandidate, OntologyRetrievalResult } from "@/src/ontology/retrieval";
import { ontologyArtifact } from "@/src/ontology/runtime";

const baseRequest = {
  interfaceLanguage: "en" as const,
  projectBrief:
    "The assignment requires Blender. I want a glossy Y2K product animation with chrome materials and a fisheye camera.",
  currentExperience: "I know Photoshop but I am new to Blender.",
  requiredApplications: ["blender"],
  outputType: "video",
  targetQuality: "portfolio" as const,
  tutorialLanguage: "en" as const,
};

function ontologyCandidate(id: string): OntologyCandidate {
  const node = ontologyArtifact.nodes.find((candidate) => candidate.id === id)!;
  return {
    id: node.id,
    label: node.label,
    family: node.family,
    category: node.category,
    score: 0.9,
    matchSource: "semantic",
  };
}

function retrieval(candidates: OntologyCandidate[] = []) {
  const result: OntologyRetrievalResult = {
    candidates,
    diagnostics: {
      backend: "local",
      ontologySchemaVersion: 1,
      ontologySourceHash: ontologyArtifact.source.sha256,
      queryHash: "0".repeat(64),
      queryLength: 20,
      semanticResults: 0,
      exactResults: 0,
      lexicalResults: candidates.length,
      finalCandidateCount: candidates.length,
      topCandidateIds: candidates.map((candidate) => candidate.id).slice(0, 10),
      durationMs: 1,
      fallbackUsed: true,
      cacheHit: false,
    },
  };
  return { searchWithDiagnostics: vi.fn().mockResolvedValue(result) };
}

describe("project analysis service", () => {
  it("preserves an exact required application outside retrieved candidates", async () => {
    const result = await analyzeProject(baseRequest, {
      retriever: retrieval(),
      classifier: null,
    });
    expect(result.source).toBe("fallback");
    expect(result.diagnostics.failureCode).toBe("NOT_CONFIGURED");
    expect(result.creativeDna.concepts).toContainEqual(
      expect.objectContaining({
        ontologyId: "project-requirements.required-software.blender",
        source: "explicit_requirement",
        label: "Blender",
      }),
    );
    expect(result.capabilityContext.currentExperience).toContain("Photoshop");
  });

  it("uses a substitutable classifier and rejects invented IDs", async () => {
    const y2k = ontologyCandidate("creative-direction.aesthetic.y2k");
    const classifier: CreativeDnaClassifier = {
      classify: vi.fn().mockResolvedValue({
        projectIntent: "Create a glossy Y2K product animation.",
        concepts: [
          {
            ontologyId: y2k.id,
            rawLabel: "Y2K",
            source: "user_preference",
            confidence: 0.97,
            evidence: {
              sourceField: "projectBrief",
              excerpt: "glossy Y2K product animation",
            },
          },
          {
            ontologyId: "creative-direction.aesthetic.invented-style",
            rawLabel: "invented style",
            source: "ai_inferred",
            confidence: 0.7,
          },
        ],
        unknownConcepts: [],
        constraints: [],
      }),
    };
    const result = await analyzeProject(baseRequest, {
      retriever: retrieval([y2k]),
      classifier,
    });
    expect(result.source).toBe("ai");
    expect(result.creativeDna.concepts).toContainEqual(
      expect.objectContaining({ ontologyId: y2k.id, label: "Y2K" }),
    );
    expect(result.diagnostics.rejectedOntologyIds).toEqual([
      "creative-direction.aesthetic.invented-style",
    ]);
    expect(result.creativeDna.unknownConcepts).toContainEqual(
      expect.objectContaining({ raw: "invented style" }),
    );
  });

  it("falls back safely when classification fails", async () => {
    const classifier: CreativeDnaClassifier = {
      classify: vi.fn().mockRejectedValue(new Error("offline")),
    };
    const result = await analyzeProject(baseRequest, {
      retriever: retrieval(),
      classifier,
    });
    expect(result.source).toBe("fallback");
    expect(result.diagnostics.failureCode).toBe("CLASSIFICATION_FAILED");
    expect(result.creativeDna.projectIntent).toContain("assignment requires Blender");
  });

  it("logs only a bounded classifier failure detail", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const classifier: CreativeDnaClassifier = {
      classify: vi.fn().mockRejectedValue(
        new CreativeDnaClassifierError(
          "HTTP_ERROR",
          "Gemini Creative DNA classification failed (400_INVALID_ARGUMENT)",
        ),
      ),
    };

    await analyzeProject(baseRequest, {
      retriever: retrieval(),
      classifier,
    });

    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("detail=Gemini Creative DNA classification failed (400_INVALID_ARGUMENT)"),
    );
    warning.mockRestore();
  });

  it("preserves Vietnamese input and provenance", async () => {
    const result = await analyzeProject(
      {
        ...baseRequest,
        interfaceLanguage: "vi",
        projectBrief:
          "Bài tập bắt buộc dùng Blender để tạo animation sản phẩm phong cách Y2K, bề mặt chrome và góc máy fisheye.",
        currentExperience: "Mới học Blender",
        tutorialLanguage: "vi",
      },
      { retriever: retrieval(), classifier: null },
    );
    expect(result.creativeDna.projectIntent).toContain("Bài tập bắt buộc");
    expect(result.creativeDna.concepts).toContainEqual(
      expect.objectContaining({
        label: "Blender",
        source: "explicit_requirement",
      }),
    );
  });

  it("does not over-infer software or coding in deterministic fallback", async () => {
    const watercolor = await analyzeProject(
      {
        ...baseRequest,
        projectBrief:
          "I want a watercolor children's-book illustration with paper texture.",
        requiredApplications: [],
        outputType: "illustration",
      },
      { semantic: false, classifier: null },
    );
    expect(
      watercolor.creativeDna.concepts.some((concept) =>
        ["Blender", "Photoshop", "Procreate", "Illustrator"].includes(
          concept.label,
        ),
      ),
    ).toBe(false);

    const bauhaus = await analyzeProject(
      {
        ...baseRequest,
        projectBrief: "I want an animated Bauhaus poster.",
        requiredApplications: [],
        outputType: "graphic",
      },
      { semantic: false, classifier: null },
    );
    expect(
      bauhaus.creativeDna.concepts.some((concept) =>
        ["JavaScript", "p5.js"].includes(concept.label),
      ),
    ).toBe(false);
  });

  it("keeps compound unknown aesthetics and rejects misleading generic matches", async () => {
    const result = await analyzeProject(
      {
        ...baseRequest,
        projectBrief:
          "The lecturer requires After Effects for a neo-y2k eco-rave title sequence",
        requiredApplications: ["Adobe After Effects"],
        outputType: "video",
      },
      { semantic: false, classifier: null },
    );
    expect(result.creativeDna.unknownConcepts).toContainEqual(
      expect.objectContaining({ raw: "neo-y2k eco-rave" }),
    );
    expect(
      result.creativeDna.concepts.map((concept) => concept.label),
    ).not.toEqual(expect.arrayContaining(["title", "sequence"]));
  });
});
