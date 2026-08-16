import { z } from "zod";

export const LocalOntologyIndexManifestSchema = z.object({
  provider: z.literal("gemini_file_search"),
  storeName: z.string().regex(/^fileSearchStores\/[a-z0-9-]+$/),
  documentName: z.string().min(1).optional(),
  ontologySchemaVersion: z.number().int().positive(),
  ontologySourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  indexedConcepts: z.number().int().nonnegative(),
  indexedAt: z.string().datetime(),
});

export type LocalOntologyIndexManifest = z.infer<
  typeof LocalOntologyIndexManifestSchema
>;

export type OntologyIndexFreshness = "CURRENT" | "STALE" | "NOT_INDEXED";

export function getOntologyIndexFreshness(input: {
  localOntologyHash: string;
  indexedOntologyHash?: string;
  storeName?: string;
}): OntologyIndexFreshness {
  if (!input.storeName || !input.indexedOntologyHash) return "NOT_INDEXED";
  return input.localOntologyHash === input.indexedOntologyHash
    ? "CURRENT"
    : "STALE";
}
