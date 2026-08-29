import {
  queueBackendEvent,
  type BackendEventName,
  type EventProperties,
} from "@/src/lib/quandaApi";

export type AnalyticsEvent = BackendEventName;

export function trackEvent(
  event: AnalyticsEvent,
  properties: EventProperties = {},
): void {
  queueBackendEvent(event, properties);
}
