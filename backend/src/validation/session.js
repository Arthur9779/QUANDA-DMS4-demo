const { z } = require("zod");

const BootstrapSessionSchema = z.object({
  identityToken: z.string().max(100).optional(),
  sessionToken: z.string().max(100).optional(),
}).strict();

module.exports = { BootstrapSessionSchema };
