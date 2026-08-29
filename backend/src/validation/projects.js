const { z } = require("zod");
const { UuidSchema } = require("./common");

const ProjectStatusSchema = z.enum([
  "draft",
  "planning",
  "active",
  "completed",
  "archived",
]);

const ProjectDataSchema = z.unknown().superRefine((value, context) => {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    context.addIssue({ code: "custom", message: "Project data must be valid JSON" });
    return;
  }
  if (serialized === undefined) {
    context.addIssue({ code: "custom", message: "Project data is required" });
  } else if (Buffer.byteLength(serialized, "utf8") > 500_000) {
    context.addIssue({ code: "custom", message: "Project data is too large" });
  }
});

const CreateProjectSchema = z.object({
  clientProjectId: UuidSchema,
  schemaVersion: z.number().int().min(1).max(100).default(1),
  title: z.string().trim().min(1).max(140),
  status: ProjectStatusSchema.default("draft"),
  inputFingerprint: z.string().trim().max(200).optional(),
  data: ProjectDataSchema,
}).strict();

const UpdateProjectSchema = z.object({
  expectedVersion: z.number().int().min(1),
  schemaVersion: z.number().int().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(140).optional(),
  status: ProjectStatusSchema.optional(),
  inputFingerprint: z.string().trim().max(200).nullable().optional(),
  data: ProjectDataSchema.optional(),
}).strict().refine(
  (value) => Object.keys(value).some((key) => key !== "expectedVersion"),
  { message: "At least one project field must be updated" },
);

const ListProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: ProjectStatusSchema.optional(),
}).strict();

module.exports = {
  CreateProjectSchema,
  ListProjectsQuerySchema,
  ProjectStatusSchema,
  UpdateProjectSchema,
};
