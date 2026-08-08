export type AnalyticsEvent =
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
