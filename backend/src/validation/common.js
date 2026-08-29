const { z } = require("zod");

const UuidSchema = z.string().uuid();
const IsoDateTimeSchema = z.string().datetime({ offset: true });

const PrimitivePropertySchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const EventPropertiesSchema = z
  .record(z.string().min(1).max(64), PrimitivePropertySchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 30) {
      context.addIssue({ code: "custom", message: "Too many event properties" });
    }
    if (Buffer.byteLength(JSON.stringify(value), "utf8") > 8_192) {
      context.addIssue({ code: "custom", message: "Event properties are too large" });
    }
  });

function parseOrThrow(schema, value, badRequest) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw badRequest(
      "validation",
      "Please review the request and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }
  return parsed.data;
}

module.exports = {
  EventPropertiesSchema,
  IsoDateTimeSchema,
  UuidSchema,
  parseOrThrow,
};
