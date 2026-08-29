const express = require("express");
const { badRequest } = require("../lib/errors");
const { parseOrThrow } = require("../validation/common");
const { BootstrapSessionSchema } = require("../validation/session");

function createSessionRouter({ sessionService }) {
  const router = express.Router();
  router.post("/", async (request, response, next) => {
    try {
      const input = parseOrThrow(BootstrapSessionSchema, request.body, badRequest);
      const result = await sessionService.bootstrap(input);
      response.status(result.user.isNew ? 201 : 200).json(result);
    } catch (error) {
      next(error);
    }
  });
  return router;
}

module.exports = { createSessionRouter };
