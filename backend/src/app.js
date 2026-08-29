const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { forbidden } = require("./lib/errors");
const { requestContext } = require("./middleware/request-context");
const { errorHandler, notFoundHandler } = require("./middleware/error-handler");
const {
  createAdminAuthenticator,
  createSessionAuthenticator,
} = require("./middleware/authenticate");
const { createSessionService } = require("./services/session-service");
const { createEventService } = require("./services/event-service");
const { createProjectService } = require("./services/project-service");
const { createAnalyticsService } = require("./services/analytics-service");
const { createHealthRouter } = require("./routes/health-routes");
const { createSessionRouter } = require("./routes/session-routes");
const { createEventRouter } = require("./routes/event-routes");
const { createProjectRouter } = require("./routes/project-routes");
const { createAnalyticsRouter } = require("./routes/analytics-routes");

function limiter(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "rate_limit", message: "Too many requests. Please try again shortly." },
  });
}

function createApplication({ pool, config }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      credentials: false,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
      maxAge: 600,
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
        return callback(forbidden("origin_forbidden", "This origin is not allowed."));
      },
    }),
  );
  app.use(limiter(15 * 60_000, 500));
  app.use(express.json({ limit: "600kb", strict: true }));

  const authenticateSession = createSessionAuthenticator({ pool, config });
  const authenticateAdmin = createAdminAuthenticator(config);
  const sessionService = createSessionService({ pool, config });
  const eventService = createEventService({ pool });
  const projectService = createProjectService({ pool });
  const analyticsService = createAnalyticsService({ pool });

  app.use("/health", createHealthRouter({ pool }));
  app.use(
    "/api/v1/session",
    limiter(10 * 60_000, 30),
    createSessionRouter({ sessionService }),
  );
  app.use(
    "/api/v1/events",
    limiter(60_000, 120),
    createEventRouter({
      eventService,
      authenticateSession,
      maximumBatchSize: config.eventBatchLimit,
    }),
  );
  app.use(
    "/api/v1/projects",
    limiter(60_000, 90),
    createProjectRouter({ projectService, authenticateSession }),
  );
  app.use(
    "/api/v1/admin/analytics",
    limiter(60_000, 30),
    createAnalyticsRouter({ analyticsService, authenticateAdmin }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApplication };
