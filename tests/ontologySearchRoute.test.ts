import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/ontology/search/route";

describe("ontology search route", () => {
  for (const query of [
    "Y2K",
    "Bauhaus",
    "toon shading",
    "Geometry Nodes",
    "p5.js",
    "Three.js",
    "GLSL",
    "watercolor",
    "TouchDesigner",
  ]) {
    it(`returns bounded canonical context for ${query}`, async () => {
      const response = await GET(
        new Request(`http://localhost/api/ontology/search?q=${encodeURIComponent(query)}`),
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        results: Array<Record<string, string>>;
      };
      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results.length).toBeLessThanOrEqual(12);
      expect(body.results[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          label: expect.any(String),
          family: expect.any(String),
          category: expect.any(String),
        }),
      );
    });
  }

  it("normalizes case and surrounding whitespace", async () => {
    const response = await GET(
      new Request("http://localhost/api/ontology/search?q=%20%20touchdesigner%20%20"),
    );
    const body = (await response.json()) as { results: Array<{ label: string }> };
    expect(body.results.some((result) => result.label === "TouchDesigner")).toBe(true);
  });

  it("rejects empty searches without scanning the ontology", async () => {
    const response = await GET(
      new Request("http://localhost/api/ontology/search?q=x"),
    );
    expect(response.status).toBe(400);
  });
});
