import { z } from "zod";

export const ApplicationSearchResultSchema = z.object({
  id: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  source: z.enum(["built_in", "ontology"]),
});

export const ApplicationSearchResponseSchema = z.object({
  results: z.array(ApplicationSearchResultSchema).max(12),
});

export type ApplicationSearchResult = z.infer<
  typeof ApplicationSearchResultSchema
>;
