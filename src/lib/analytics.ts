export type AnalyticsEvent =
  | "creative_dna_analysis_started"
  | "creative_dna_analysis_succeeded"
  | "creative_dna_analysis_fallback"
  | "creative_dna_review_viewed"
  | "creative_dna_concept_removed"
  | "creative_dna_concept_added"
  | "creative_dna_unknown_added"
  | "creative_dna_confirmed"
  | "creative_dna_reanalysis_requested"
  | "tutorial_matching_started"
  | "tutorial_matching_succeeded"
  | "tutorial_replaced"
  | "tutorial_replacement_undone"
  | "skill_gap_updated"
  | "roadmap_generate_started"
  | "roadmap_generate_succeeded"
  | "roadmap_generate_fallback"
  | "roadmap_regenerated"
  | "tutorial_opened"
  | "stage_completed"
  | "language_changed";

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  // Privacy-conscious no-op. Connect an approved provider here later.
  void event;
  void properties;
}
