import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const originalHeroAssetSha256 =
  "5d418625e7a3cb95673c8754a6da6d42afc111c73ac03569bc2e7bf5a7686a41";

describe("hero illustration", () => {
  it("keeps the original project-owned tree artwork unchanged", () => {
    const asset = readFileSync("public/assets/hero-vector-garden.svg");
    const checksum = createHash("sha256").update(asset).digest("hex");

    expect(checksum).toBe(originalHeroAssetSha256);
  });
});
