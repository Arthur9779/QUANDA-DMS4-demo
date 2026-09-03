const { z } = require("zod");
const {
  EventPropertiesSchema,
  IsoDateTimeSchema,
  UuidSchema,
} = require("./common");

const CanonicalEventNameSchema = z.enum([
  "site_opened",
  "brief_submitted",
  "creative_dna_analysis_completed",
  "creative_dna_confirmed",
  "tutorial_matching_completed",
  "tutorial_opened",
  "tutorial_replaced",
  "tutorial_replacement_undone",
  "skill_gap_updated",
  "roadmap_generated",
  "roadmap_viewed",
  "roadmap_stage_completed",
  "calendar_opened",
  "calendar_item_created",
  "calendar_item_completed",
  "calendar_navigation_used",
  "project_created",
  "project_updated",
  "project_completed",
  "language_changed",
]);

const LegacyEventNameSchema = z.enum([
  "creative_dna_analysis_started",
  "creative_dna_analysis_succeeded",
  "creative_dna_analysis_fallback",
  "creative_dna_review_viewed",
  "creative_dna_concept_removed",
  "creative_dna_concept_added",
  "creative_dna_unknown_added",
  "creative_dna_reanalysis_requested",
  "tutorial_matching_started",
  "tutorial_matching_succeeded",
  "roadmap_generate_started",
  "roadmap_generate_failed",
  "roadmap_generate_succeeded",
  "roadmap_generate_fallback",
  "roadmap_regenerated",
  "engineering_interpretation_started",
  "engineering_interpretation_completed",
  "engineering_interpretation_failed",
  "engineering_preparation_selected",
  "engineering_plan_generate_started",
  "engineering_plan_generate_failed",
  "engineering_plan_generated",
  "engineering_task_completed",
  "stage_completed",
]);

const EventNameSchema = z.union([CanonicalEventNameSchema, LegacyEventNameSchema]);

const EventSchema = z.object({
  id: UuidSchema,
  name: EventNameSchema,
  eventTime: IsoDateTimeSchema,
  projectId: UuidSchema.optional(),
  properties: EventPropertiesSchema.default({}),
}).strict();

function createEventBatchSchema(maximum) {
  return z.object({
    events: z.array(EventSchema).min(1).max(maximum),
  }).strict();
}

const EVENT_NAME_ALIASES = {
  creative_dna_analysis_succeeded: "creative_dna_analysis_completed",
  creative_dna_analysis_fallback: "creative_dna_analysis_completed",
  tutorial_matching_succeeded: "tutorial_matching_completed",
  roadmap_generate_succeeded: "roadmap_generated",
  roadmap_generate_fallback: "roadmap_generated",
  stage_completed: "roadmap_stage_completed",
};

function canonicalEventName(name) {
  return EVENT_NAME_ALIASES[name] || name;
}

module.exports = {
  CanonicalEventNameSchema,
  EventNameSchema,
  canonicalEventName,
  createEventBatchSchema,
};
