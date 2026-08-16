import { describe, expect, it, vi } from "vitest";
import { ontologyArtifact } from "@/src/ontology/runtime";
import {
  GeminiFileSearchError,
  GeminiFileSearchRetriever,
} from "@/src/ontology/retrieval/geminiFileSearchRetriever";

const bauhaus = ontologyArtifact.nodes.find(
  (node) => node.id === "creative-direction.aesthetic.bauhaus",
)!;

describe("Gemini File Search ontology provider", () => {
  it("uses the Interactions File Search tool and accepts canonical IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({ candidateIds: [bauhaus.id, bauhaus.id] }),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const retriever = new GeminiFileSearchRetriever({
      apiKey: "test-key",
      storeName: "fileSearchStores/test-store",
      indexedOntologyHash: ontologyArtifact.source.sha256,
      localOntologyHash: ontologyArtifact.source.sha256,
      nodes: ontologyArtifact.nodes,
      model: "gemini-3.1-flash-lite",
      fetchImpl: fetchMock,
    });
    const results = await retriever.search({
      query: "Bauhaus poster",
      maxResults: 20,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: bauhaus.id, matchSource: "semantic" });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.endsWith("/v1beta/interactions")).toBe(true);
    expect(options.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    const body = JSON.parse(String(options.body));
    expect(body.tools).toEqual([
      {
        type: "file_search",
        file_search_store_names: ["fileSearchStores/test-store"],
      },
    ]);
    expect(body.response_format.mime_type).toBe("application/json");
    expect(String(options.body)).not.toContain(ontologyArtifact.nodes[100].label);
  });

  it("rejects a stale semantic index before making a request", () => {
    expect(
      () =>
        new GeminiFileSearchRetriever({
          apiKey: "test-key",
          storeName: "fileSearchStores/test-store",
          indexedOntologyHash: "0".repeat(64),
          localOntologyHash: ontologyArtifact.source.sha256,
          nodes: ontologyArtifact.nodes,
        }),
    ).toThrowError(GeminiFileSearchError);
  });

  it("rejects invalid provider output so the hybrid layer can fall back", async () => {
    const retriever = new GeminiFileSearchRetriever({
      apiKey: "test-key",
      storeName: "fileSearchStores/test-store",
      indexedOntologyHash: ontologyArtifact.source.sha256,
      localOntologyHash: ontologyArtifact.source.sha256,
      nodes: ontologyArtifact.nodes,
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ output_text: "not json" }), { status: 200 }),
      ),
    });
    await expect(
      retriever.search({ query: "Bauhaus", maxResults: 20 }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
