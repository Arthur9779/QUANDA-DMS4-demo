import {
  queueBackendEvent,
  type BackendEventName,
  type EventProperties,
} from "@/src/lib/quandaApi";

export type AnalyticsEvent = BackendEventName;

type AnalyticsWorkflow = "design" | "agentic_engineering";

interface AnalyticsJourney {
  id: string;
  fingerprint: string;
}

const workflowJourneys: Partial<Record<AnalyticsWorkflow, AnalyticsJourney>> = {};

function stableJourneyHash(value: unknown): string {
  const serialized = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (const character of serialized) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function beginAnalyticsJourney(
  workflow: AnalyticsWorkflow,
  projectInput: unknown,
  options: { newJourney?: boolean } = {},
): string {
  const fingerprint = stableJourneyHash(projectInput);
  const current = workflowJourneys[workflow];
  if (!options.newJourney && current?.fingerprint === fingerprint) {
    return current.id;
  }
  const nonce =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const journeyId = `${workflow}:${fingerprint}:${nonce}`;
  workflowJourneys[workflow] = { id: journeyId, fingerprint };
  return journeyId;
}

export function trackEvent(
  event: AnalyticsEvent,
  properties: EventProperties = {},
): void {
  const workflow = properties.workflow;
  const journeyId =
    workflow === "design" || workflow === "agentic_engineering"
      ? workflowJourneys[workflow]?.id
      : undefined;
  queueBackendEvent(event, {
    ...properties,
    ...(journeyId && !properties.workflowRunId
      ? { workflowRunId: journeyId }
      : {}),
  });
}
