import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileOntologySource,
  OntologyCompilerError,
  parseOntologySource,
  serializeOntologyArtifact,
  slugifyOntologyLabel,
} from "@/src/ontology/compiler";

const fixture = (name: string) =>
  readFile(resolve(import.meta.dirname, "fixtures/ontology", name), "utf8");

describe("ontology source parser", () => {
  it("parses family, category, concept, version, and source positions", async () => {
    const parsed = parseOntologySource(await fixture("minimal.skills"));

    expect(parsed.version).toBe("1.0");
    expect(parsed.families[0].label).toBe("Creative Direction");
    expect(parsed.families[0].categories[0].label).toBe("Aesthetic");
    expect(parsed.families[0].categories[0].concepts[0]).toMatchObject({
      label: "Bauhaus",
      sourcePosition: { line: 7, column: 3 },
    });
  });

  it("rejects concepts outside a category", async () => {
    await expect(
      fixture("malformed.skills").then((source) => parseOntologySource(source)),
    ).rejects.toThrow("Concept appears outside a category");
  });

  it("rejects empty labels and unrecognized structural content", () => {
    expect(() =>
      parseOntologySource("# Fixture\nVersion: 1.0\n## Family\n### Category\n-   \n"),
    ).toThrow("Empty concept label");
    expect(() =>
      parseOntologySource(
        "# Fixture\nVersion: 1.0\n## Family\n### Category\nplain text\n",
      ),
    ).toThrow("would be silently discarded");
  });

  it("requires a family heading", () => {
    expect(() => parseOntologySource("# Fixture\nVersion: 1.0\n")).toThrow(
      "Missing family heading",
    );
  });
});

describe("canonical ontology IDs", () => {
  it("is stable across runs and independent of concept ordering", async () => {
    const source = await fixture("minimal.skills");
    const reordered = source.replace(
      "- Bauhaus\n- toon shading",
      "- toon shading\n- Bauhaus",
    );
    const first = compileOntologySource(source);
    const second = compileOntologySource(source);
    const moved = compileOntologySource(reordered);

    expect(first.nodes.map((node) => node.id)).toEqual(
      second.nodes.map((node) => node.id),
    );
    expect(first.nodes.map((node) => node.id)).toEqual(
      moved.nodes.map((node) => node.id),
    );
  });

  it("keeps duplicate labels in different categories distinct", () => {
    const source = [
      "# Fixture",
      "Version: 1.0",
      "## 1. Family",
      "### First",
      "- shared label",
      "### Second",
      "- shared label",
    ].join("\n");
    const artifact = compileOntologySource(source);
    expect(artifact.nodes).toHaveLength(2);
    expect(new Set(artifact.nodes.map((node) => node.id)).size).toBe(2);
  });

  it("merges exact duplicates and reports their source lines", async () => {
    const artifact = compileOntologySource(await fixture("collisions.skills"));
    const bauhaus = artifact.nodes.filter((node) => node.label === "Bauhaus");
    const duplicate = artifact.collisions.find(
      (collision) => collision.kind === "exact_duplicate",
    );

    expect(bauhaus).toHaveLength(1);
    expect(duplicate?.sourceLines).toEqual([11, 12]);
  });

  it("resolves artificial ASCII-slug collisions deterministically", async () => {
    const source = await fixture("collisions.skills");
    const artifact = compileOntologySource(source);
    const repeated = compileOntologySource(source);
    const collisions = artifact.collisions.filter(
      (collision) => collision.kind === "slug_collision",
    );

    expect(collisions.length).toBeGreaterThanOrEqual(2);
    expect(artifact.nodes.map((node) => node.id)).toEqual(
      repeated.nodes.map((node) => node.id),
    );
    expect(new Set(artifact.nodes.map((node) => node.id)).size).toBe(
      artifact.nodes.length,
    );
  });

  it.each([
    ["p5.js", "p5-js"],
    ["Three.js", "three-js"],
    ["C++", "c-plus-plus"],
    ["C#", "c-sharp"],
    ["GLSL", "glsl"],
    ["HTML/CSS", "html-css"],
    ["DaVinci Resolve", "davinci-resolve"],
    ["After Effects", "after-effects"],
    ["black-and-white", "black-and-white"],
    ["audio-reactive", "audio-reactive"],
    ["UI/UX", "ui-ux"],
    ["2D/3D", "2d-3d"],
  ])("creates a readable technical slug for %s", (label, expected) => {
    expect(slugifyOntologyLabel(label)).toBe(expected);
  });

  it("creates ASCII-safe, readable Vietnamese IDs", async () => {
    const artifact = compileOntologySource(await fixture("unicode.skills"));
    expect(artifact.nodes.find((node) => node.label === "tranh Đông Hồ")?.id).toContain(
      "tranh-dong-ho",
    );
    expect(artifact.nodes.every((node) => /^[a-z0-9._:-]+$/.test(node.id))).toBe(
      true,
    );
  });
});

describe("compiler validation and generated artifact", () => {
  it("rejects incompatible source versions", () => {
    expect(() =>
      compileOntologySource(
        "# Fixture\nVersion: 2.0\n## Family\n### Category\n- concept\n",
      ),
    ).toThrow("incompatible with ontology schema version 1");
  });

  it("validates relationship types and endpoints", async () => {
    const source = await fixture("minimal.skills");
    const artifact = compileOntologySource(source);
    const [sourceNode, targetNode] = artifact.nodes;
    const relationship = {
      ontologySchemaVersion: 1,
      sourceId: sourceNode.id,
      targetId: targetNode.id,
      type: "requires",
      origin: "curated",
    };

    expect(
      compileOntologySource(source, { relationships: [relationship] })
        .relationships,
    ).toHaveLength(1);
    expect(() =>
      compileOntologySource(source, {
        relationships: [{ ...relationship, type: "invented_relation" }],
      }),
    ).toThrow("Invalid ontology relationship");
    expect(() =>
      compileOntologySource(source, {
        relationships: [{ ...relationship, sourceId: "missing.node" }],
      }),
    ).toThrow("Invalid relationship source ID");
    expect(() =>
      compileOntologySource(source, {
        relationships: [{ ...relationship, targetId: "missing.node" }],
      }),
    ).toThrow("Invalid relationship target ID");
  });

  it("compiles the real ontology and matches the tracked generated artifact", async () => {
    const projectRoot = resolve(import.meta.dirname, "..");
    const source = await readFile(
      resolve(projectRoot, "knowledge/quanda.skills"),
      "utf8",
    );
    const generated = await readFile(
      resolve(projectRoot, "src/ontology/generated/ontology.json"),
      "utf8",
    );
    const artifact = compileOntologySource(source, {
      sourcePath: "knowledge/quanda.skills",
    });

    expect(artifact.stats.familyCount).toBe(45);
    expect(artifact.stats.categoryCount).toBe(879);
    expect(artifact.stats.nodeCount).toBeGreaterThan(24_000);
    expect(serializeOntologyArtifact(artifact)).toBe(generated);
  });

  it("uses explicit compiler errors", () => {
    expect(
      () =>
        parseOntologySource(
          "# Fixture\nVersion: 1.0\n## Family\n### Empty category\n",
        ),
    ).toThrow(OntologyCompilerError);
  });
});
