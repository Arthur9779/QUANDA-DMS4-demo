const { hashToken, safeTokenEqual } = require("../lib/tokens");
const { unauthorized, forbidden } = require("../lib/errors");

function bearerToken(request) {
  const authorization = request.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

function createSessionAuthenticator({ pool, config }) {
  return async function authenticateSession(request, _response, next) {
    try {
      const token = bearerToken(request);
      if (!token || !token.startsWith("qus_")) throw unauthorized();
      const tokenHash = hashToken(token, config.sessionSecret);
      const [rows] = await pool.execute(
        `SELECT s.id AS session_id, s.user_id, s.started_at, s.last_seen_at,
                u.account_type
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ?
            AND s.ended_at IS NULL
            AND u.deleted_at IS NULL
          LIMIT 1`,
        [tokenHash],
      );
      const session = rows[0];
      if (!session) throw unauthorized("invalid_session", "The session is invalid.");

      const idleMs = config.sessionIdleMinutes * 60_000;
      if (Date.now() - new Date(session.last_seen_at).getTime() > idleMs) {
        await pool.execute(
          "UPDATE sessions SET ended_at = last_seen_at WHERE id = ? AND ended_at IS NULL",
          [session.session_id],
        );
        throw unauthorized("session_expired", "The session has expired.");
      }

      await pool.execute(
        `UPDATE sessions s
           JOIN users u ON u.id = s.user_id
            SET s.last_seen_at = UTC_TIMESTAMP(3),
                u.last_seen_at = UTC_TIMESTAMP(3)
          WHERE s.id = ?`,
        [session.session_id],
      );
      request.auth = {
        userId: session.user_id,
        sessionId: session.session_id,
        accountType: session.account_type,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

function createAdminAuthenticator(config) {
  return function authenticateAdmin(request, _response, next) {
    const token = bearerToken(request);
    if (!token || !safeTokenEqual(token, config.adminApiToken)) {
      return next(forbidden("admin_forbidden", "Administrative access is required."));
    }
    next();
  };
}

module.exports = {
  bearerToken,
  createAdminAuthenticator,
  createSessionAuthenticator,
};
