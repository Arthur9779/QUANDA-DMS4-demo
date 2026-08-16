import { createHash } from "node:crypto";
import { z } from "zod";
import type { RuntimeOntologyArtifact } from "@/src/ontology/contracts";

export const OntologySearchDocumentSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().min(1).max(2_000),
});

export const OntologySearchDocumentsManifestSchema = z.object({
  ontologySchemaVersion: z.number().int().positive(),
  ontologySourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  documentCount: z.number().int().nonnegative(),
  documentsSha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export type OntologySearchDocument = z.infer<
  typeof OntologySearchDocumentSchema
>;
export type OntologySearchDocumentsManifest = z.infer<
  typeof OntologySearchDocumentsManifestSchema
>;

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildOntologySearchDocuments(
  artifact: RuntimeOntologyArtifact,
): OntologySearchDocument[] {
  return artifact.nodes.map((node) => {
    const context = [
      `Concept: ${node.label}`,
      `Family: ${node.family}`,
      `Category: ${node.category}`,
      node.aliases.length > 0 ? `Aliases: ${node.aliases.join(", ")}` : "",
      node.description ? `Description: ${node.description}` : "",
      `Canonical ID: ${node.id}`,
    ].filter(Boolean);
    return OntologySearchDocumentSchema.parse({
      id: node.id,
      text: context.join("\n"),
    });
  });
}

export function serializeSearchDocuments(
  documents: OntologySearchDocument[],
): string {
  return `${documents.map((document) => JSON.stringify(document)).join("\n")}\n`;
}

export function createSearchDocumentsManifest(
  artifact: RuntimeOntologyArtifact,
  serializedDocuments: string,
): OntologySearchDocumentsManifest {
  return {
    ontologySchemaVersion: artifact.ontologySchemaVersion,
    ontologySourceHash: artifact.source.sha256,
    documentCount: artifact.nodes.length,
    documentsSha256: sha256(serializedDocuments),
  };
}
