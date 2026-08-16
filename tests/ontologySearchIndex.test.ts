import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ontologyArtifact } from "@/src/ontology/runtime";
import {
  getOntologyIndexFreshness,
} from "@/src/ontology/retrieval/indexFreshness";
import { indexOntologyWithGeminiFileSearch } from "@/src/ontology/retrieval/geminiFileSearchAdmin";
import {
  buildOntologySearchDocuments,
  createSearchDocumentsManifest,
  serializeSearchDocuments,
} from "@/src/ontology/retrieval/searchDocuments";

describe("ontology semantic index artifacts", () => {
  it("generates one honest search document per canonical node", () => {
    const documents = buildOntologySearchDocuments(ontologyArtifact);
    expect(documents).toHaveLength(ontologyArtifact.nodes.length);
    expect(documents[0].text).toContain(`Canonical ID: ${documents[0].id}`);
    expect(documents[0].text).toContain("Family:");
    expect(documents[0].text).toContain("Category:");
  });

  it("matches the tracked search documents and manifest", async () => {
    const documents = buildOntologySearchDocuments(ontologyArtifact);
    const serialized = serializeSearchDocuments(documents);
    const manifest = createSearchDocumentsManifest(ontologyArtifact, serialized);
    const projectRoot = resolve(import.meta.dirname, "..");
    expect(
      await readFile(
        resolve(projectRoot, "src/ontology/generated/search-documents.jsonl"),
        "utf8",
      ),
    ).toBe(serialized);
    expect(
      JSON.parse(
        await readFile(
          resolve(
            projectRoot,
            "src/ontology/generated/search-documents.manifest.json",
          ),
          "utf8",
        ),
      ),
    ).toEqual(manifest);
  });

  it("reports current, stale, and unconfigured indexes", () => {
    const localOntologyHash = ontologyArtifact.source.sha256;
    expect(
      getOntologyIndexFreshness({
        localOntologyHash,
        indexedOntologyHash: localOntologyHash,
        storeName: "fileSearchStores/current",
      }),
    ).toBe("CURRENT");
    expect(
      getOntologyIndexFreshness({
        localOntologyHash,
        indexedOntologyHash: "0".repeat(64),
        storeName: "fileSearchStores/stale",
      }),
    ).toBe("STALE");
    expect(getOntologyIndexFreshness({ localOntologyHash })).toBe("NOT_INDEXED");
  });

  it("creates and uploads a fresh managed index without exposing the key", async () => {
    const responses = [
      new Response(JSON.stringify({ name: "fileSearchStores/new-store" }), {
        status: 200,
      }),
      new Response(null, {
        status: 200,
        headers: { "x-goog-upload-url": "https://upload.example/session" },
      }),
      new Response(
        JSON.stringify({
          name: "operations/index-1",
          done: true,
          response: { documentName: "fileSearchStores/new-store/documents/quanda" },
        }),
        { status: 200 },
      ),
    ];
    const fetchMock = vi.fn().mockImplementation(async () => responses.shift());
    const result = await indexOntologyWithGeminiFileSearch(
      {
        content: new TextEncoder().encode("test index"),
        ontologySourceHash: ontologyArtifact.source.sha256,
        ontologySchemaVersion: ontologyArtifact.ontologySchemaVersion,
        documentCount: ontologyArtifact.nodes.length,
      },
      {
        apiKey: "secret-test-key",
        fetchImpl: fetchMock,
        now: () => new Date("2026-08-16T00:00:00.000Z"),
      },
    );
    expect(result).toMatchObject({
      storeName: "fileSearchStores/new-store",
      indexedAt: "2026-08-16T00:00:00.000Z",
    });
    expect(
      fetchMock.mock.calls.map((call) => String(call[0])).join(" "),
    ).not.toContain("secret-test-key");
  });
});
