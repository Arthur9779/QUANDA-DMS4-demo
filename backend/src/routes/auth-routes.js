const express = require("express");
const { badRequest } = require("../lib/errors");
const { parseOrThrow } = require("../validation/common");
const { ClaimAnonymousSchema, LoginSchema, RegisterSchema, RequestPasswordResetSchema, ResetPasswordSchema, UpdateProfileSchema } = require("../validation/auth");

function createAuthRouter({ authService, authenticateAccount }) {
  const router = express.Router();
  router.post("/register", async (request, response, next) => {
    try {
      const input = parseOrThrow(RegisterSchema, request.body, badRequest);
      response.status(201).json(await authService.register(input));
    } catch (error) { next(error); }
  });
  router.post("/login", async (request, response, next) => {
    try {
      const input = parseOrThrow(LoginSchema, request.body, badRequest);
      response.json(await authService.login(input));
    } catch (error) { next(error); }
  });
  router.post("/forgot-password", async (request, response, next) => {
    try {
      const input = parseOrThrow(RequestPasswordResetSchema, request.body, badRequest);
      await authService.requestPasswordReset(input.email);
      response.status(202).json({ message: "If an account exists for that email, a reset link has been sent." });
    } catch (error) { next(error); }
  });
  router.post("/reset-password", async (request, response, next) => {
    try {
      const input = parseOrThrow(ResetPasswordSchema, request.body, badRequest);
      await authService.resetPassword(input);
      response.status(204).end();
    } catch (error) { next(error); }
  });
  router.get("/me", authenticateAccount, async (request, response, next) => {
    try { response.json({ user: await authService.getProfile(request.auth.userId) }); }
    catch (error) { next(error); }
  });
  router.patch("/profile", authenticateAccount, async (request, response, next) => {
    try {
      const input = parseOrThrow(UpdateProfileSchema, request.body, badRequest);
      response.json({ user: await authService.updateProfile(request.auth.userId, input) });
    } catch (error) { next(error); }
  });
  router.post("/claim-anonymous-data", authenticateAccount, async (request, response, next) => {
    try {
      const input = parseOrThrow(ClaimAnonymousSchema, request.body, badRequest);
      response.json(await authService.claimAnonymousProjects(request.auth.userId, input.anonymousSessionToken));
    } catch (error) { next(error); }
  });
  router.post("/logout", authenticateAccount, async (request, response, next) => {
    try { await authService.logout(request.auth.sessionId); response.status(204).end(); }
    catch (error) { next(error); }
  });
  return router;
}

module.exports = { createAuthRouter };
