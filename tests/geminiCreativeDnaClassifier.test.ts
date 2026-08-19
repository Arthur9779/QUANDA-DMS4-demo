import { describe, expect, it, vi } from "vitest";
import {
  GeminiCreativeDnaClassifier,
  CreativeDnaClassifierError,
} from "@/src/project-analysis/geminiClassifier";

const validOutput = {
  projectIntent: "Create a Bauhaus poster.",
  concepts: [
    {
      ontologyId: "creative-direction.aesthetic.bauhaus",
      rawLabel: "Bauhaus",
      source: "user_preference",
      confidence: 0.95,
    },
  ],
  unknownConcepts: [],
  constraints: [],
};

describe("Gemini Creative DNA classifier", () => {
  it("uses strict structured output with the configurable model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(validOutput) }] } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const classifier = new GeminiCreativeDnaClassifier({
      apiKey: "test-key",
      model: "test-classifier",
      fetchImpl: fetchMock,
    });
    await expect(classifier.classify("compact candidate prompt")).resolves.toEqual(
      validOutput,
    );
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/models/test-classifier:generateContent");
    const body = JSON.parse(String(options.body));
    expect(body.generationConfig).toMatchObject({
      temperature: 0.15,
      responseMimeType: "application/json",
    });
    expect(body.generationConfig).not.toHaveProperty("responseSchema");
    expect(String(options.body)).not.toContain("quanda.skills");
  });

  it("rejects schema-invalid output", async () => {
    const classifier = new GeminiCreativeDnaClassifier({
      apiKey: "test-key",
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        ...validOutput,
                        concepts: [
                          { ...validOutput.concepts[0], confidence: 2 },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    });
    await expect(classifier.classify("prompt")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("requires a server-side API key", () => {
    expect(
      () => new GeminiCreativeDnaClassifier({ apiKey: "" }),
    ).toThrowError(CreativeDnaClassifierError);
  });
});
