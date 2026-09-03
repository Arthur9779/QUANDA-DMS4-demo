import { beforeEach, describe, expect, it, vi } from "vitest";

const { queueBackendEvent } = vi.hoisted(() => ({
  queueBackendEvent: vi.fn(),
}));

vi.mock("@/src/lib/quandaApi", () => ({ queueBackendEvent }));

import { beginAnalyticsJourney, trackEvent } from "@/src/lib/analytics";

describe("analytics workflow journeys", () => {
  beforeEach(() => {
    queueBackendEvent.mockReset();
  });

  it("attaches one stable journey id to each workflow milestone", () => {
    const input = { projectBrief: "Design an animated product loop", outputType: "video" };
    const journeyId = beginAnalyticsJourney("design", input);

    trackEvent("brief_submitted", { workflow: "design" });
    trackEvent("roadmap_viewed", { workflow: "design" });

    expect(queueBackendEvent).toHaveBeenNthCalledWith(1, "brief_submitted", {
      workflow: "design",
      workflowRunId: journeyId,
    });
    expect(queueBackendEvent).toHaveBeenNthCalledWith(2, "roadmap_viewed", {
      workflow: "design",
      workflowRunId: journeyId,
    });
  });

  it("keeps design and engineering journeys separate", () => {
    const designId = beginAnalyticsJourney("design", { brief: "Poster" });
    const engineeringId = beginAnalyticsJourney("agentic_engineering", {
      brief: "Build an API",
    });

    expect(designId).not.toBe(engineeringId);
    trackEvent("engineering_plan_generated", {
      workflow: "agentic_engineering",
    });
    expect(queueBackendEvent).toHaveBeenCalledWith(
      "engineering_plan_generated",
      expect.objectContaining({ workflowRunId: engineeringId }),
    );
  });

  it("starts a fresh journey when the same brief is deliberately resubmitted", () => {
    const input = { projectBrief: "Use the same example again" };
    const first = beginAnalyticsJourney("design", input, { newJourney: true });
    const continued = beginAnalyticsJourney("design", input);
    const resubmitted = beginAnalyticsJourney("design", input, { newJourney: true });

    expect(continued).toBe(first);
    expect(resubmitted).not.toBe(first);
  });
});
