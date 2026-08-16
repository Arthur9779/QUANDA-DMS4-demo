import type { OntologyCandidate } from "@/src/ontology/retrieval";
import type { ProjectAnalysisRequest } from "@/src/project-analysis/contracts";

export const CREATIVE_DNA_SYSTEM_INSTRUCTION = `You classify creative project intent into QUANDA Creative DNA.
Use only the supplied ontology candidate IDs. Never invent a canonical ID.
Extract explicit requirements before preferences, then add restrained inferences.
Preserve unknown user wording rather than forcing an uncertain ontology mapping.
Treat current experience as capability context, never as the primary project intent.
Do not recommend tutorials, software, roadmap stages, or production plans.
Evidence must be a short observable excerpt copied from the supplied input; never include hidden reasoning.
Return only JSON matching the response schema.`;

function compactCandidates(candidates: OntologyCandidate[]) {
  return candidates.map(({ id, label, family, category }) => ({
    id,
    label,
    family,
    category,
  }));
}

export function buildCreativeDnaPrompt(input: {
  request: ProjectAnalysisRequest;
  candidates: OntologyCandidate[];
}): string {
  const { request } = input;
  return [
    "CLASSIFICATION RESPONSIBILITIES",
    "1. Write a concise, grounded projectIntent in the interface language.",
    "2. Classify directly mandatory items as explicit_requirement.",
    "3. Classify desired but negotiable aesthetics and choices as user_preference.",
    "4. Use ai_inferred only for concepts supported by observable project evidence.",
    "5. Do not infer software or coding unless named, required, or behaviorally necessary.",
    "6. Keep deadlines, deliverables, quality, and available time as constraints rather than aesthetics.",
    "7. Preserve unsupported phrases under unknownConcepts; nearest IDs are suggestions only.",
    "8. Return ontology IDs only from ALLOWED ONTOLOGY CANDIDATES.",
    "",
    "PROJECT INPUT",
    JSON.stringify(request),
    "",
    "ALLOWED ONTOLOGY CANDIDATES",
    JSON.stringify(compactCandidates(input.candidates)),
  ].join("\n");
}
