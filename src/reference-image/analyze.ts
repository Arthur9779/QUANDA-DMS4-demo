import { createHash } from "node:crypto";
import { findExactOntologyConcepts } from "@/src/ontology/runtime";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import {
  ReferenceImageResponseSchema,
  type ReferenceImageFinding,
} from "@/src/reference-image/contracts";
import type { ReferenceImageAnalyzer } from "@/src/reference-image/geminiAnalyzer";

export async function analyzeReferenceImage(
  input: {
    bytes: Uint8Array;
    mimeType: string;
    projectBrief?: string;
    signal?: AbortSignal;
  },
  analyzer: ReferenceImageAnalyzer,
) {
  const output = await analyzer.analyze(input);
  const seen = new Set<string>();
  const findings: ReferenceImageFinding[] = [];

  for (const finding of output.findings) {
    const normalized = normalizeOntologyLabel(finding.label);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    const exact = findExactOntologyConcepts(finding.label)[0];
    findings.push({
      ...finding,
      id: `reference-${createHash("sha256")
        .update(`${normalized}|${finding.category}`)
        .digest("hex")
        .slice(0, 8)}`,
      ...(exact
        ? {
            ontology: {
              id: exact.id,
              label: exact.label,
              family: exact.family,
              category: exact.category,
            },
          }
        : {}),
    });
  }

  return ReferenceImageResponseSchema.parse({ findings, source: "ai" });
}

