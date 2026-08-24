import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/applications/search/route";

async function search(query: string) {
  const response = await GET(
    new Request(
      `http://localhost/api/applications/search?q=${encodeURIComponent(query)}`,
    ),
  );
  return {
    response,
    body: await response.json() as {
      results: Array<{
        id: string;
        name: string;
        category: string;
        source: string;
      }>;
    },
  };
}

describe("application-only search route", () => {
  for (const expected of [
    "TouchDesigner",
    "Cinema 4D",
    "CapCut",
    "Unity",
    "Houdini",
    "Final Cut Pro",
    "p5.js",
  ]) {
    it(`finds ${expected} without returning Creative DNA concepts`, async () => {
      const { response, body } = await search(expected);
      expect(response.status).toBe(200);
      expect(body.results.some((result) => result.name === expected)).toBe(true);
      expect(
        body.results.some((result) =>
          /aesthetic|symbolism|composition theory|visual complexity/i.test(
            result.category,
          ),
        ),
      ).toBe(false);
    });
  }

  it("maps built-in applications to their stable form ID", async () => {
    const { body } = await search("Blender");
    expect(body.results[0]).toEqual(
      expect.objectContaining({
        id: "blender",
        name: "Blender",
        source: "built_in",
      }),
    );
  });

  it("does not treat a non-application concept as an application", async () => {
    const { body } = await search("simple");
    expect(body.results).toEqual([]);
  });

  it("returns no invented catalogue entry for an unindexed application", async () => {
    const { body } = await search("Canva");
    expect(body.results).toEqual([]);
  });

  it("rejects undersized queries", async () => {
    const { response } = await search("x");
    expect(response.status).toBe(400);
  });
});
