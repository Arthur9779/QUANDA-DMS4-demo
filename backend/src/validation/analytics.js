const { z } = require("zod");
const { UuidSchema } = require("./common");

const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ANALYTICS_TIME_ZONE_OFFSET = "+07:00";

function localDay(date) {
  return new Date(`${date}T00:00:00.000${ANALYTICS_TIME_ZONE_OFFSET}`);
}

const AnalyticsQuerySchema = z.object({
  start: DateOnlySchema.optional(),
  end: DateOnlySchema.optional(),
  source: z.enum(["real", "synthetic"]).default("real"),
  scenarioId: UuidSchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.source === "real" && value.scenarioId) {
    context.addIssue({ code: "custom", path: ["scenarioId"], message: "A scenario requires synthetic source" });
  }
  if (value.start && value.end) {
    const start = localDay(value.start);
    const end = localDay(value.end);
    const days = (end.getTime() - start.getTime()) / 86_400_000;
    if (days < 0 || days > 366) {
      context.addIssue({ code: "custom", message: "Analytics range must be between 0 and 366 days" });
    }
  }
});

function analyticsWindow(query, now = new Date()) {
  const endDate = query.end ? localDay(query.end) : now;
  const exclusiveEnd = new Date(endDate);
  if (query.end) exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
  const start = query.start
    ? localDay(query.start)
    : new Date(exclusiveEnd.getTime() - 30 * 86_400_000);
  return { ...query, start, end: exclusiveEnd };
}

module.exports = { AnalyticsQuerySchema, analyticsWindow };
