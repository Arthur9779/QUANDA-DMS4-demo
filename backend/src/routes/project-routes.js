const express = require("express");
const { badRequest } = require("../lib/errors");
const { parseOrThrow, UuidSchema } = require("../validation/common");
const {
  CreateProjectSchema,
  ListProjectsQuerySchema,
  UpdateProjectSchema,
} = require("../validation/projects");

function createProjectRouter({ projectService, authenticateSession }) {
  const router = express.Router();
  router.use(authenticateSession);

  router.post("/", async (request, response, next) => {
    try {
      const input = parseOrThrow(CreateProjectSchema, request.body, badRequest);
      const result = await projectService.create(request.auth.userId, input);
      response.status(result.created ? 201 : 200).json(result.project);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (request, response, next) => {
    try {
      const query = parseOrThrow(ListProjectsQuerySchema, request.query, badRequest);
      response.json({ projects: await projectService.list(request.auth.userId, query) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const id = parseOrThrow(UuidSchema, request.params.id, badRequest);
      response.json(await projectService.get(request.auth.userId, id));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", async (request, response, next) => {
    try {
      const id = parseOrThrow(UuidSchema, request.params.id, badRequest);
      const input = parseOrThrow(UpdateProjectSchema, request.body, badRequest);
      response.json(await projectService.update(request.auth.userId, id, input));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (request, response, next) => {
    try {
      const id = parseOrThrow(UuidSchema, request.params.id, badRequest);
      await projectService.remove(request.auth.userId, id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createProjectRouter };
