const express = require("express");

function createHealthRouter({ pool }) {
  const router = express.Router();
  router.get("/", async (request, response) => {
    try {
      await pool.query("SELECT 1");
      response.json({
        status: "ok",
        service: "quanda-api",
        database: "ok",
        requestId: request.requestId,
      });
    } catch {
      response.status(503).json({
        status: "degraded",
        service: "quanda-api",
        database: "unavailable",
        requestId: request.requestId,
      });
    }
  });
  return router;
}

module.exports = { createHealthRouter };
