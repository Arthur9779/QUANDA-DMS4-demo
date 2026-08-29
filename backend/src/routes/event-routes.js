const express = require("express");
const { badRequest } = require("../lib/errors");
const { parseOrThrow } = require("../validation/common");
const { createEventBatchSchema } = require("../validation/events");

function createEventRouter({ eventService, authenticateSession, maximumBatchSize }) {
  const router = express.Router();
  const schema = createEventBatchSchema(maximumBatchSize);
  router.post("/", authenticateSession, async (request, response, next) => {
    try {
      const input = parseOrThrow(schema, request.body, badRequest);
      const result = await eventService.recordBatch(request.auth, input.events);
      response.status(202).json(result);
    } catch (error) {
      next(error);
    }
  });
  return router;
}

module.exports = { createEventRouter };
