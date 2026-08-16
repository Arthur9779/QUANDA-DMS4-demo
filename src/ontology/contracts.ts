import { z } from "zod";
import {
  KNOWLEDGE_CONTRACT_VERSIONS,
  OntologyNodeSchema,
  OntologyRelationshipSchema,
} from "@/src/contracts/knowledge";

export const OntologySourcePositionSchema = z.object({
  line: z.number().int().positive(),
  column: z.number().int().positive(),
});

export const RuntimeOntologyNodeSchema = OntologyNodeSchema.extend({
  metadata: z.object({
    sourcePosition: OntologySourcePositionSchema,
    conventions: z
      .array(z.enum(["slash_separated", "parenthetical_disambiguation"]))
      .optional(),
    duplicateSourcePositions: z.array(OntologySourcePositionSchema).optional(),
  }),
});

const StableIdSchema = OntologyNodeSchema.shape.id;

export const OntologyCategoryMetadataSchema = z.object({
  id: StableIdSchema,
  label: z.string().trim().min(1).max(120),
  sourcePosition: OntologySourcePositionSchema,
  conceptCount: z.number().int().nonnegative(),
});

export const OntologyFamilyMetadataSchema = z.object({
  id: StableIdSchema,
  label: z.string().trim().min(1).max(120),
  sourcePosition: OntologySourcePositionSchema,
  categories: z.array(OntologyCategoryMetadataSchema),
});

export const OntologyCollisionSchema = z.object({
  kind: z.enum(["slug_collision", "exact_duplicate"]),
  entityType: z.enum(["family", "category", "concept"]),
  baseId: StableIdSchema,
  labels: z.array(z.string().trim().min(1).max(200)).min(1),
  resolvedIds: z.array(StableIdSchema).min(1),
  sourceLines: z.array(z.number().int().positive()).min(1),
});

export const RuntimeOntologyArtifactSchema = z
  .object({
    ontologySchemaVersion: z.literal(KNOWLEDGE_CONTRACT_VERSIONS.ontology),
    source: z.object({
      path: z.string().trim().min(1),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      version: z.string().trim().min(1),
      title: z.string().trim().min(1),
      metadata: z.record(z.string(), z.string()),
    }),
    stats: z.object({
      familyCount: z.number().int().nonnegative(),
      categoryCount: z.number().int().nonnegative(),
      nodeCount: z.number().int().nonnegative(),
      relationshipCount: z.number().int().nonnegative(),
      collisionCount: z.number().int().nonnegative(),
    }),
    families: z.array(OntologyFamilyMetadataSchema),
    nodes: z.array(RuntimeOntologyNodeSchema),
    relationships: z.array(OntologyRelationshipSchema),
    collisions: z.array(OntologyCollisionSchema),
  })
  .superRefine((artifact, context) => {
    const nodeIds = new Set<string>();
    artifact.nodes.forEach((node, index) => {
      if (nodeIds.has(node.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate canonical ontology ID: ${node.id}`,
          path: ["nodes", index, "id"],
        });
      }
      nodeIds.add(node.id);
    });

    artifact.relationships.forEach((relationship, index) => {
      if (!nodeIds.has(relationship.sourceId)) {
        context.addIssue({
          code: "custom",
          message: `Invalid relationship source ID: ${relationship.sourceId}`,
          path: ["relationships", index, "sourceId"],
        });
      }
      if (!nodeIds.has(relationship.targetId)) {
        context.addIssue({
          code: "custom",
          message: `Invalid relationship target ID: ${relationship.targetId}`,
          path: ["relationships", index, "targetId"],
        });
      }
    });

    const categoryCount = artifact.families.reduce(
      (total, family) => total + family.categories.length,
      0,
    );
    const expectedStats = {
      familyCount: artifact.families.length,
      categoryCount,
      nodeCount: artifact.nodes.length,
      relationshipCount: artifact.relationships.length,
      collisionCount: artifact.collisions.length,
    };

    for (const [key, expected] of Object.entries(expectedStats)) {
      if (artifact.stats[key as keyof typeof expectedStats] !== expected) {
        context.addIssue({
          code: "custom",
          message: `Ontology statistic ${key} is stale: expected ${expected}`,
          path: ["stats", key],
        });
      }
    }
  });

export type RuntimeOntologyNode = z.infer<typeof RuntimeOntologyNodeSchema>;
export type RuntimeOntologyArtifact = z.infer<
  typeof RuntimeOntologyArtifactSchema
>;
export type OntologyCollision = z.infer<typeof OntologyCollisionSchema>;
