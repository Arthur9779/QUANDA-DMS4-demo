import { afterEach, describe, expect, it, vi } from "vitest";
import { callGoogleAiForRoadmap } from "@/src/lib/ai/googleAi";

describe("Google AI Studio roadmap client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_BASE_URL;
    delete process.env.GEMINI_MODEL;
  });

  it("requests JSON from the configured Gemini model", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "test-model";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '{"source":"ai"}' }] } },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callGoogleAiForRoadmap("Build a roadmap", new AbortController().signal),
    ).resolves.toBe('{"source":"ai"}');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/models/test-model:generateContent");
    expect(options.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    expect(JSON.parse(String(options.body))).toMatchObject({
      generationConfig: { responseMimeType: "application/json" },
    });
  });

  it("requires a server-side Gemini key", async () => {
    await expect(
      callGoogleAiForRoadmap("Build a roadmap", new AbortController().signal),
    ).rejects.toThrow("GEMINI_API_KEY is not configured");
  });
});
