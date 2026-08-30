import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/reference-image/route";

function requestWithFile(
  bytes: Uint8Array,
  type: string,
  ip: string,
  name = "reference.png",
) {
  const body = new FormData();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  body.append("image", new File([arrayBuffer], name, { type }));
  body.append("projectBrief", "Create an abstract visual installation.");
  return new NextRequest("http://localhost/api/reference-image", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body,
  });
}

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
});

describe("reference-image API", () => {
  it("rejects unsupported file types before calling AI", async () => {
    const response = await POST(
      requestWithFile(
        new TextEncoder().encode("<svg></svg>"),
        "image/svg+xml",
        "reference-route-svg",
        "reference.svg",
      ),
    );
    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({
      error: "unsupported_type",
    });
  });

  it("rejects a forged MIME type using the file signature", async () => {
    const response = await POST(
      requestWithFile(
        new TextEncoder().encode("this is not a png"),
        "image/png",
        "reference-route-forged",
      ),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "invalid_image",
    });
  });

  it("fails clearly when image analysis is not configured", async () => {
    const response = await POST(
      requestWithFile(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
        "reference-route-no-key",
      ),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "not_configured",
    });
  });

  it("rejects oversized declared payloads before parsing multipart data", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/reference-image", {
        method: "POST",
        headers: {
          "content-length": String(5 * 1024 * 1024),
          "x-forwarded-for": "reference-route-large",
        },
        body: "too large",
      }),
    );
    expect(response.status).toBe(413);
  });
});
