import { z } from "zod";

const StableOntologyIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/);

export const ReferenceFindingCategorySchema = z.enum([
  "creative_direction",
  "visual_quality",
  "composition",
  "color",
  "lighting",
  "material_texture",
  "image_making",
  "motion_interaction",
]);

export const ReferenceImageModelFindingSchema = z
  .object({
    label: z.string().trim().min(2).max(100),
    category: ReferenceFindingCategorySchema,
    evidence: z.string().trim().min(3).max(220),
    confidence: z.number().finite().min(0).max(1),
  })
  .strict();

export const ReferenceImageModelOutputSchema = z
  .object({
    findings: z.array(ReferenceImageModelFindingSchema).min(1).max(8),
  })
  .strict();

export const ReferenceImageFindingSchema = ReferenceImageModelFindingSchema.extend({
  id: z.string().regex(/^reference-[a-f0-9]{8}$/),
  ontology: z
    .object({
      id: StableOntologyIdSchema,
      label: z.string().trim().min(1).max(200),
      family: z.string().trim().min(1).max(120),
      category: z.string().trim().min(1).max(120),
    })
    .optional(),
});

export const ReferenceImageResponseSchema = z.object({
  findings: z.array(ReferenceImageFindingSchema).min(1).max(8),
  source: z.literal("ai"),
});

export type ReferenceImageModelOutput = z.infer<
  typeof ReferenceImageModelOutputSchema
>;
export type ReferenceImageFinding = z.infer<
  typeof ReferenceImageFindingSchema
>;

