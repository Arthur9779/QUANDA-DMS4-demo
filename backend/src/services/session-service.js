const crypto = require("node:crypto");
const { withTransaction } = require("../db/pool");
const { hashToken, randomToken } = require("../lib/tokens");

function publicSessionResult({
  userId,
  sessionId,
  identityToken,
  sessionToken,
  isNewUser,
  isNewSession,
  startedAt,
}) {
  return {
    user: { id: userId, isNew: isNewUser },
    session: {
      id: sessionId,
      isNew: isNewSession,
      startedAt: new Date(startedAt).toISOString(),
    },
    returningUser: !isNewUser,
    identityToken,
    sessionToken,
  };
}

function createSessionService({ pool, config }) {
  async function createSession(connection, userId) {
    const id = crypto.randomUUID();
    const token = randomToken("qus");
    await connection.execute(
      `INSERT INTO sessions
         (id, user_id, token_hash, started_at, last_seen_at, is_synthetic)
       VALUES (?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), FALSE)`,
      [id, userId, hashToken(token, config.sessionSecret)],
    );
    const [rows] = await connection.execute(
      "SELECT started_at FROM sessions WHERE id = ? LIMIT 1",
      [id],
    );
    return { id, token, startedAt: rows[0].started_at };
  }

  async function bootstrap({ identityToken, sessionToken }) {
    return withTransaction(pool, async (connection) => {
      let userId = null;
      let persistentToken = identityToken || null;
      let isNewUser = false;

      if (identityToken?.startsWith("qui_")) {
        const [credentials] = await connection.execute(
          `SELECT c.user_id
             FROM anonymous_credentials c
             JOIN users u ON u.id = c.user_id
            WHERE c.token_hash = ?
              AND c.revoked_at IS NULL
              AND u.deleted_at IS NULL
            LIMIT 1
            FOR UPDATE`,
          [hashToken(identityToken, config.sessionSecret)],
        );
        userId = credentials[0]?.user_id ?? null;
      }

      if (!userId) {
        userId = crypto.randomUUID();
        persistentToken = randomToken("qui");
        isNewUser = true;
        await connection.execute(
          `INSERT INTO users
             (id, account_type, created_at, last_seen_at, is_synthetic)
           VALUES (?, 'anonymous', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), FALSE)`,
          [userId],
        );
        await connection.execute(
          `INSERT INTO anonymous_credentials
             (user_id, token_hash, created_at, last_used_at)
           VALUES (?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
          [userId, hashToken(persistentToken, config.sessionSecret)],
        );
      } else {
        await connection.execute(
          `UPDATE anonymous_credentials
              SET last_used_at = UTC_TIMESTAMP(3)
            WHERE user_id = ? AND revoked_at IS NULL`,
          [userId],
        );
        await connection.execute(
          "UPDATE users SET last_seen_at = UTC_TIMESTAMP(3) WHERE id = ?",
          [userId],
        );
      }

      if (sessionToken?.startsWith("qus_")) {
        const [sessions] = await connection.execute(
          `SELECT id, started_at, last_seen_at
             FROM sessions
            WHERE user_id = ? AND token_hash = ? AND ended_at IS NULL
            LIMIT 1
            FOR UPDATE`,
          [userId, hashToken(sessionToken, config.sessionSecret)],
        );
        const existingSession = sessions[0];
        const idleMs = config.sessionIdleMinutes * 60_000;
        if (
          existingSession &&
          Date.now() - new Date(existingSession.last_seen_at).getTime() <= idleMs
        ) {
          await connection.execute(
            "UPDATE sessions SET last_seen_at = UTC_TIMESTAMP(3) WHERE id = ?",
            [existingSession.id],
          );
          return publicSessionResult({
            userId,
            sessionId: existingSession.id,
            identityToken: persistentToken,
            sessionToken,
            isNewUser,
            isNewSession: false,
            startedAt: existingSession.started_at,
          });
        }
        if (existingSession) {
          await connection.execute(
            "UPDATE sessions SET ended_at = last_seen_at WHERE id = ?",
            [existingSession.id],
          );
        }
      }

      const session = await createSession(connection, userId);
      return publicSessionResult({
        userId,
        sessionId: session.id,
        identityToken: persistentToken,
        sessionToken: session.token,
        isNewUser,
        isNewSession: true,
        startedAt: session.startedAt,
      });
    });
  }

  return { bootstrap };
}

module.exports = { createSessionService };
