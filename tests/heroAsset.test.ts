import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const originalHeroAssetSha256 =
  "281865090444d129aed72cce8f710b45a7ecd3c22b326856c2c564b33c6e350b";

describe("hero illustration", () => {
  it("keeps the original project-owned tree artwork unchanged", () => {
    const asset = readFileSync("public/assets/hero-vector-garden.svg");
    const checksum = createHash("sha256").update(asset).digest("hex");

    expect(checksum).toBe(originalHeroAssetSha256);
  });
});
