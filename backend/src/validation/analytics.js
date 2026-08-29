const { z } = require("zod");
const { UuidSchema } = require("./common");

const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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
    const start = new Date(`${value.start}T00:00:00.000Z`);
    const end = new Date(`${value.end}T00:00:00.000Z`);
    const days = (end.getTime() - start.getTime()) / 86_400_000;
    if (days < 0 || days > 366) {
      context.addIssue({ code: "custom", message: "Analytics range must be between 0 and 366 days" });
    }
  }
});

function analyticsWindow(query, now = new Date()) {
  const endDate = query.end ? new Date(`${query.end}T00:00:00.000Z`) : now;
  const exclusiveEnd = new Date(endDate);
  if (query.end) exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
  const start = query.start
    ? new Date(`${query.start}T00:00:00.000Z`)
    : new Date(exclusiveEnd.getTime() - 30 * 86_400_000);
  return { ...query, start, end: exclusiveEnd };
}

module.exports = { AnalyticsQuerySchema, analyticsWindow };
