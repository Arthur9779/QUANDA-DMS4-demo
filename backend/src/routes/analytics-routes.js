const express = require("express");
const { badRequest } = require("../lib/errors");
const { parseOrThrow } = require("../validation/common");
const { AnalyticsQuerySchema, analyticsWindow } = require("../validation/analytics");

function createAnalyticsRouter({ analyticsService, authenticateAdmin }) {
  const router = express.Router();
  router.use((_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });
  router.use(authenticateAdmin);

  function endpoint(operation) {
    return async (request, response, next) => {
      try {
        const query = parseOrThrow(AnalyticsQuerySchema, request.query, badRequest);
        response.json(await operation(analyticsWindow(query)));
      } catch (error) {
        next(error);
      }
    };
  }

  router.get("/overview", endpoint(analyticsService.overview));
  router.get("/retention", endpoint(analyticsService.retention));
  router.get("/events", endpoint(analyticsService.eventCounts));
  return router;
}

module.exports = { createAnalyticsRouter };
