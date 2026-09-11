const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { withTransaction } = require("../db/pool");
const { hashToken, randomToken } = require("../lib/tokens");
const { conflict, unauthorized } = require("../lib/errors");

function publicUser(row) {
  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    avatar: row.avatar ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function createAuthService({ pool, config }) {
  async function createAccountSession(connection, userId) {
    const id = crypto.randomUUID();
    const token = randomToken("qua");
    const expiresAt = new Date(Date.now() + config.authSessionDays * 86_400_000);
    await connection.execute(
      `INSERT INTO authenticated_sessions
         (id, user_id, token_hash, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, UTC_TIMESTAMP(3), ?, UTC_TIMESTAMP(3))`,
      [id, userId, hashToken(token, config.sessionSecret), expiresAt],
    );
    return { token, expiresAt: expiresAt.toISOString() };
  }

  async function findAnonymousUser(connection, token) {
    if (!token) return null;
    const [rows] = await connection.execute(
      `SELECT s.user_id
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.ended_at IS NULL
          AND s.last_seen_at >= TIMESTAMPADD(MINUTE, -?, UTC_TIMESTAMP(3))
          AND u.account_type = 'anonymous' AND u.deleted_at IS NULL
        LIMIT 1 FOR UPDATE`,
      [hashToken(token, config.sessionSecret), config.sessionIdleMinutes],
    );
    return rows[0]?.user_id ?? null;
  }

  async function register(input) {
    const passwordHash = await bcrypt.hash(input.password, config.passwordHashRounds);
    return withTransaction(pool, async (connection) => {
      const [duplicates] = await connection.execute(
        "SELECT user_id FROM accounts WHERE email = ? LIMIT 1 FOR UPDATE",
        [input.email],
      );
      if (duplicates[0]) throw conflict("account_exists", "An account already exists for this email.");

      let userId = await findAnonymousUser(connection, input.anonymousSessionToken);
      if (userId) {
        await connection.execute(
          "UPDATE users SET account_type = 'registered', last_seen_at = UTC_TIMESTAMP(3) WHERE id = ?",
          [userId],
        );
      } else {
        userId = crypto.randomUUID();
        await connection.execute(
          `INSERT INTO users (id, account_type, created_at, last_seen_at, is_synthetic)
           VALUES (?, 'registered', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), FALSE)`,
          [userId],
        );
      }
      try {
        await connection.execute(
          `INSERT INTO accounts
             (user_id, email, password_hash, display_name, avatar, created_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
          [userId, input.email, passwordHash, input.displayName],
        );
      } catch (error) {
        if (error?.code === "ER_DUP_ENTRY") {
          throw conflict("account_exists", "An account already exists for this email.");
        }
        throw error;
      }
      const session = await createAccountSession(connection, userId);
      const [rows] = await connection.execute(
        "SELECT * FROM accounts WHERE user_id = ? LIMIT 1",
        [userId],
      );
      return { user: publicUser(rows[0]), sessionToken: session.token, expiresAt: session.expiresAt };
    });
  }

  async function login(input) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.deleted_at
         FROM accounts a JOIN users u ON u.id = a.user_id
        WHERE a.email = ? LIMIT 1`,
      [input.email],
    );
    const account = rows[0];
    const valid = account && !account.deleted_at && await bcrypt.compare(input.password, account.password_hash);
    if (!valid) throw unauthorized("invalid_credentials", "Email or password is incorrect.");
    return withTransaction(pool, async (connection) => {
      const session = await createAccountSession(connection, account.user_id);
      return { user: publicUser(account), sessionToken: session.token, expiresAt: session.expiresAt };
    });
  }

  async function getProfile(userId) {
    const [rows] = await pool.execute("SELECT * FROM accounts WHERE user_id = ? LIMIT 1", [userId]);
    if (!rows[0]) throw unauthorized();
    return publicUser(rows[0]);
  }

  async function updateProfile(userId, input) {
    const assignments = [];
    const values = [];
    if (input.displayName !== undefined) { assignments.push("display_name = ?"); values.push(input.displayName); }
    if (input.avatar !== undefined) { assignments.push("avatar = ?"); values.push(input.avatar); }
    assignments.push("updated_at = UTC_TIMESTAMP(3)");
    values.push(userId);
    await pool.execute(`UPDATE accounts SET ${assignments.join(", ")} WHERE user_id = ?`, values);
    return getProfile(userId);
  }

  async function logout(sessionId) {
    await pool.execute(
      "UPDATE authenticated_sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE id = ? AND revoked_at IS NULL",
      [sessionId],
    );
  }

  async function claimAnonymousProjects(accountUserId, anonymousSessionToken) {
    return withTransaction(pool, async (connection) => {
      const anonymousUserId = await findAnonymousUser(connection, anonymousSessionToken);
      if (!anonymousUserId || anonymousUserId === accountUserId) return { claimed: 0, conflictsResolved: 0 };
      const [projects] = await connection.execute(
        "SELECT id, client_project_id FROM projects WHERE user_id = ? AND deleted_at IS NULL FOR UPDATE",
        [anonymousUserId],
      );
      let conflictsResolved = 0;
      for (const project of projects) {
        const [conflicts] = await connection.execute(
          "SELECT id FROM projects WHERE user_id = ? AND client_project_id = ? AND deleted_at IS NULL LIMIT 1",
          [accountUserId, project.client_project_id],
        );
        const clientProjectId = conflicts[0] ? crypto.randomUUID() : project.client_project_id;
        if (conflicts[0]) conflictsResolved += 1;
        await connection.execute(
          "UPDATE projects SET user_id = ?, client_project_id = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ? AND user_id = ?",
          [accountUserId, clientProjectId, project.id, anonymousUserId],
        );
      }
      return { claimed: projects.length, conflictsResolved };
    });
  }

  return { claimAnonymousProjects, getProfile, login, logout, register, updateProfile };
}

module.exports = { createAuthService, publicUser };
