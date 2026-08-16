import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/project-analysis/route";

const requestBody = {
  interfaceLanguage: "en",
  projectBrief:
    "The assignment requires Blender for a glossy Y2K product animation.",
  currentExperience: "New to Blender",
  requiredApplications: ["blender"],
  outputType: "video",
  targetQuality: "portfolio",
  tutorialLanguage: "en",
};

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
});

describe("project-analysis API", () => {
  it("validates requests and returns a safe no-key fallback", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/project-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "route-test-valid",
        },
        body: JSON.stringify(requestBody),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-QUANDA-Source")).toBe("fallback");
    const body = (await response.json()) as {
      creativeDna: { concepts: unknown[] };
    };
    expect(body).toMatchObject({
      source: "fallback",
      creativeDna: { creativeDnaVersion: 1 },
    });
    expect(body.creativeDna.concepts).toContainEqual(
      expect.objectContaining({
        label: "Blender",
        source: "explicit_requirement",
      }),
    );
  });

  it("rejects structurally invalid input before analysis", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/project-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "route-test-invalid",
        },
        body: JSON.stringify({ projectBrief: "too short" }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "validation",
    });
  });
});
