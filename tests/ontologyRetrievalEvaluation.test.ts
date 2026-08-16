import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EvaluationBenchmarkSchema } from "@/src/evaluation/contracts";
import { ontologyArtifact } from "@/src/ontology/runtime";
import { HybridOntologyRetriever } from "@/src/ontology/retrieval/hybridRetriever";
import { evaluateOntologyRetrieval } from "@/src/ontology/retrieval/evaluation";

describe("ontology retrieval benchmark", () => {
  it("measures canonical-ID recall without penalizing open-world labels", async () => {
    const benchmark = EvaluationBenchmarkSchema.parse(
      JSON.parse(
        await readFile(
          resolve(import.meta.dirname, "../evals/briefs.v1.json"),
          "utf8",
        ),
      ),
    );
    const retriever = new HybridOntologyRetriever({
      nodes: ontologyArtifact.nodes,
      ontologySchemaVersion: ontologyArtifact.ontologySchemaVersion,
      ontologySourceHash: ontologyArtifact.source.sha256,
      semanticUnavailableReason: "OFFLINE_BENCHMARK",
    });
    const metrics = await evaluateOntologyRetrieval(
      benchmark,
      retriever,
      ontologyArtifact.nodes,
    );

    expect(metrics.cases).toBe(25);
    expect(metrics.mappedCandidateExpectations).toBeGreaterThan(0);
    expect(metrics.mappedRequiredExpectations).toBeGreaterThan(0);
    expect(metrics.averageCandidateCount).toBeLessThanOrEqual(60);
    expect(metrics.fallbackCases).toBe(25);
    expect(metrics.candidateRecall).toBeGreaterThan(0);
  });
});
