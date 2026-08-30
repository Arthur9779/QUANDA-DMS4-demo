import { describe, expect, it, vi } from "vitest";
import { analyzeReferenceImage } from "@/src/reference-image/analyze";
import {
  GeminiReferenceImageAnalyzer,
  REFERENCE_IMAGE_RESPONSE_JSON_SCHEMA,
} from "@/src/reference-image/geminiAnalyzer";

describe("reference image analysis", () => {
  it("maps exact visual findings into stable quanda.skills ontology nodes", async () => {
    const result = await analyzeReferenceImage(
      {
        bytes: new Uint8Array([0x89, 0x50]),
        mimeType: "image/png",
      },
      {
        analyze: vi.fn().mockResolvedValue({
          findings: [
            {
              label: "High contrast",
              category: "visual_quality",
              evidence: "Bright forms sit against a very dark background.",
              confidence: 0.94,
            },
            {
              label: "Imaginary garden haze",
              category: "creative_direction",
              evidence: "Soft translucent flowers overlap in the frame.",
              confidence: 0.71,
            },
          ],
        }),
      },
    );

    expect(result.findings[0]).toMatchObject({
      label: "High contrast",
      ontology: {
        label: "high contrast",
      },
    });
    expect(result.findings[0].id).toMatch(/^reference-[a-f0-9]{8}$/);
    expect(result.findings[1].ontology).toBeUndefined();
  });

  it("sends image bytes inline with a bounded schema and privacy-safe instruction", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      findings: [
                        {
                          label: "Soft lighting",
                          category: "lighting",
                          evidence: "The shadows have broad, feathered edges.",
                          confidence: 0.9,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const analyzer = new GeminiReferenceImageAnalyzer({
      apiKey: "test-key",
      model: "test-vision",
      fetchImpl: fetchMock,
    });

    await analyzer.analyze({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/png",
      projectBrief: "Create a flower poster.",
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/models/test-vision:generateContent");
    const body = JSON.parse(String(options.body));
    expect(body.generationConfig.responseSchema).toEqual(
      REFERENCE_IMAGE_RESPONSE_JSON_SCHEMA,
    );
    expect(body.contents[0].parts[1]).toEqual({
      inlineData: { mimeType: "image/png", data: "AQID" },
    });
    const instruction = body.systemInstruction.parts[0].text as string;
    expect(instruction).toContain("Do not identify people");
    expect(instruction).toContain("Do not infer age, ethnicity, gender, health");
    expect(instruction).toContain("Do not invent tools");
  });
});

