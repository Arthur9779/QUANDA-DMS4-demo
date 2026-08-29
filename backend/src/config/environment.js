const { z } = require("zod");

const DatabaseEnvironmentSchema = z.object({
  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().trim().min(1),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string(),
});

const EnvironmentSchema = DatabaseEnvironmentSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SESSION_SECRET: z.string().min(32),
  ADMIN_API_TOKEN: z.string().min(32),
  ALLOWED_ORIGINS: z.string().trim().min(1),
  SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  EVENT_BATCH_LIMIT: z.coerce.number().int().min(1).max(100).default(50),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

function invalidEnvironmentError(prefix, issues) {
  const fields = issues.map((issue) => issue.path.join(".")).join(", ");
  return new Error(`${prefix}: ${fields}`);
}

function databaseConfig(data) {
  return {
    host: data.DB_HOST,
    port: data.DB_PORT,
    database: data.DB_NAME,
    user: data.DB_USER,
    password: data.DB_PASSWORD,
  };
}

function loadDatabaseEnvironment(source = process.env) {
  const parsed = DatabaseEnvironmentSchema.safeParse(source);
  if (!parsed.success) {
    throw invalidEnvironmentError(
      "Invalid database environment configuration",
      parsed.error.issues,
    );
  }
  return { db: databaseConfig(parsed.data) };
}

function loadEnvironment(source = process.env) {
  const parsed = EnvironmentSchema.safeParse(source);
  if (!parsed.success) {
    throw invalidEnvironmentError(
      "Invalid backend environment configuration",
      parsed.error.issues,
    );
  }

  const allowedOrigins = parsed.data.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (parsed.data.NODE_ENV === "production" && allowedOrigins.includes("*")) {
    throw new Error("ALLOWED_ORIGINS cannot contain * in production");
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    db: databaseConfig(parsed.data),
    sessionSecret: parsed.data.SESSION_SECRET,
    adminApiToken: parsed.data.ADMIN_API_TOKEN,
    allowedOrigins,
    sessionIdleMinutes: parsed.data.SESSION_IDLE_MINUTES,
    eventBatchLimit: parsed.data.EVENT_BATCH_LIMIT,
    logLevel: parsed.data.LOG_LEVEL,
  };
}

module.exports = {
  DatabaseEnvironmentSchema,
  EnvironmentSchema,
  loadDatabaseEnvironment,
  loadEnvironment,
};
