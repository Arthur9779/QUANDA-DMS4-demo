const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const bcrypt = require("bcryptjs");
const { createAuthService } = require("../src/services/auth-service");
const { createProjectService } = require("../src/services/project-service");
const { hashToken } = require("../src/lib/tokens");
const { LoginSchema, RegisterSchema } = require("../src/validation/auth");

const config = {
  sessionSecret: "account-test-session-secret-at-least-32-characters",
  sessionIdleMinutes: 30,
  authSessionDays: 30,
  passwordHashRounds: 10,
};

describe("optional accounts", () => {
  test("validates normalized email and a meaningful password policy", () => {
    const parsed = RegisterSchema.parse({
      displayName: "Thao Nguyen",
      email: "  THAO@Example.com ",
      password: "StrongPass1",
    });
    assert.equal(parsed.email, "thao@example.com");
    assert.equal(RegisterSchema.safeParse({ ...parsed, password: "password" }).success, false);
    assert.equal(LoginSchema.safeParse({ email: "not-an-email", password: "x" }).success, false);
  });

  test("upgrades an anonymous owner, preserves projects, logs in elsewhere, and never returns a password", async () => {
    const pool = new AuthPool();
    const anonymousUserId = "11111111-1111-4111-8111-111111111111";
    const anonymousToken = "qus_existing-anonymous-session";
    pool.users.set(anonymousUserId, { id: anonymousUserId, account_type: "anonymous", deleted_at: null });
    pool.anonymousSessions.set(hashToken(anonymousToken, config.sessionSecret).toString("hex"), anonymousUserId);
    pool.projects.set("22222222-2222-4222-8222-222222222222", {
      id: "22222222-2222-4222-8222-222222222222",
      user_id: anonymousUserId,
      client_project_id: "33333333-3333-4333-8333-333333333333",
      schema_version: 1,
      title: "Preserved project",
      status: "active",
      input_fingerprint: "brief-hash",
      project_data: JSON.stringify({ roadmap: { title: "Keep me" }, completion: ["stage-1"] }),
      version: 4,
      created_at: new Date(), updated_at: new Date(), completed_at: null, deleted_at: null,
    });
    const auth = createAuthService({ pool, config });
    const registered = await auth.register({
      displayName: "Thao Nguyen", email: "thao@example.com", password: "StrongPass1", anonymousSessionToken: anonymousToken,
    });
    assert.equal(registered.user.id, anonymousUserId);
    assert.equal(registered.user.email, "thao@example.com");
    assert.equal("password" in registered, false);
    assert.equal("passwordHash" in registered.user, false);
    assert.equal(pool.projects.values().next().value.user_id, anonymousUserId);
    assert.equal(await bcrypt.compare("StrongPass1", pool.accounts.get(anonymousUserId).password_hash), true);

    const loggedIn = await auth.login({ email: "thao@example.com", password: "StrongPass1" });
    assert.equal(loggedIn.user.id, anonymousUserId);
    assert.match(loggedIn.sessionToken, /^qua_/);
    await assert.rejects(() => auth.login({ email: "thao@example.com", password: "WrongPass1" }), /Email or password/);
    await assert.rejects(() => auth.register({ displayName: "Duplicate", email: "thao@example.com", password: "StrongPass2" }), /already exists/);

    const projects = await createProjectService({ pool }).list(loggedIn.user.id, { limit: 50 });
    assert.equal(projects.length, 1);
    assert.equal(projects[0].title, "Preserved project");
  });

  test("claims another verified anonymous session and enforces project ownership", async () => {
    const pool = new AuthPool();
    const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const anonymousId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const token = "qus_second-browser-guest";
    pool.users.set(accountId, { id: accountId, account_type: "registered", deleted_at: null });
    pool.users.set(anonymousId, { id: anonymousId, account_type: "anonymous", deleted_at: null });
    pool.anonymousSessions.set(hashToken(token, config.sessionSecret).toString("hex"), anonymousId);
    const projectId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    pool.projects.set(projectId, {
      id: projectId, user_id: anonymousId, client_project_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      schema_version: 1, title: "Browser B draft", status: "draft", input_fingerprint: null,
      project_data: "{}", version: 1, created_at: new Date(), updated_at: new Date(), completed_at: null, deleted_at: null,
    });
    const auth = createAuthService({ pool, config });
    assert.deepEqual(await auth.claimAnonymousProjects(accountId, token), { claimed: 1, conflictsResolved: 0 });
    const service = createProjectService({ pool });
    assert.equal((await service.get(accountId, projectId)).title, "Browser B draft");
    await assert.rejects(() => service.get(anonymousId, projectId), /not found/i);
    await assert.rejects(() => service.get("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", projectId), /not found/i);
  });
});

describe("password reset", () => {
  test("creates an expiring hashed token without revealing unknown accounts", async () => {
    const pool = new PasswordResetPool();
    const deliveries = [];
    const auth = createAuthService({
      pool,
      config: { ...config, passwordResetTokenMinutes: 30, publicAppUrl: "https://quanda.example" },
      passwordResetEmailSender: { send: async (message) => deliveries.push(message) },
    });

    await auth.requestPasswordReset("missing@example.com");
    assert.equal(deliveries.length, 0);
    await auth.requestPasswordReset("artist@example.com");
    assert.equal(deliveries.length, 1);
    const token = new URL(deliveries[0].resetUrl).searchParams.get("resetToken");
    assert.match(token, /^qur_/);
    const stored = [...pool.resetTokens.values()][0];
    assert.notEqual(stored.token_hash.toString("base64"), Buffer.from(token).toString("base64"));
    assert.ok(stored.expires_at > new Date());
  });

  test("updates the password once, rejects reuse, and rejects expired tokens", async () => {
    const pool = new PasswordResetPool();
    let delivery;
    const auth = createAuthService({
      pool,
      config: { ...config, passwordResetTokenMinutes: 30, publicAppUrl: "https://quanda.example" },
      passwordResetEmailSender: { send: async (message) => { delivery = message; } },
    });
    await auth.requestPasswordReset("artist@example.com");
    const token = new URL(delivery.resetUrl).searchParams.get("resetToken");

    await auth.resetPassword({ token, password: "NewStrongPass1" });
    assert.equal(await bcrypt.compare("NewStrongPass1", pool.accounts.get("account-user").password_hash), true);
    await assert.rejects(() => auth.resetPassword({ token, password: "AnotherStrongPass1" }), /invalid or expired/);

    await auth.requestPasswordReset("artist@example.com");
    const nextToken = new URL(delivery.resetUrl).searchParams.get("resetToken");
    [...pool.resetTokens.values()].find((row) => row.used_at === null && row.token_hash.equals(hashToken(nextToken, config.sessionSecret))).expires_at = new Date(Date.now() - 1);
    await assert.rejects(() => auth.resetPassword({ token: nextToken, password: "ExpiredStrongPass1" }), /invalid or expired/);
  });
});

class AuthPool {
  constructor() {
    this.users = new Map(); this.accounts = new Map(); this.authSessions = new Map();
    this.anonymousSessions = new Map(); this.projects = new Map();
  }
  async getConnection() { return this; }
  async beginTransaction() {}
  async commit() {}
  async rollback() {}
  release() {}
  async execute(sql, parameters = []) {
    const query = sql.replace(/\s+/gu, " ").trim();
    if (query.startsWith("SELECT user_id FROM accounts WHERE email")) {
      const rows = [...this.accounts.values()].filter((row) => row.email === parameters[0]).map((row) => ({ user_id: row.user_id }));
      return [rows, []];
    }
    if (query.startsWith("SELECT s.user_id FROM sessions")) {
      const userId = this.anonymousSessions.get(parameters[0].toString("hex"));
      return [[...(userId ? [{ user_id: userId }] : [])], []];
    }
    if (query.startsWith("UPDATE users SET account_type")) { this.users.get(parameters[0]).account_type = "registered"; return [{ affectedRows: 1 }, []]; }
    if (query.startsWith("INSERT INTO users")) {
      this.users.set(parameters[0], { id: parameters[0], account_type: "registered", deleted_at: null }); return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("INSERT INTO accounts")) {
      const now = new Date(); this.accounts.set(parameters[0], { user_id: parameters[0], email: parameters[1], password_hash: parameters[2], display_name: parameters[3], avatar: null, created_at: now, updated_at: now }); return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("INSERT INTO authenticated_sessions")) {
      this.authSessions.set(parameters[0], { id: parameters[0], user_id: parameters[1], token_hash: parameters[2], expires_at: parameters[3] }); return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("SELECT * FROM accounts WHERE user_id")) { const row = this.accounts.get(parameters[0]); return [[...(row ? [row] : [])], []]; }
    if (query.startsWith("SELECT a.*, u.deleted_at")) {
      const row = [...this.accounts.values()].find((item) => item.email === parameters[0]); return [[...(row ? [{ ...row, deleted_at: null }] : [])], []];
    }
    if (query.startsWith("SELECT id, client_project_id FROM projects WHERE user_id")) {
      const rows = [...this.projects.values()].filter((row) => row.user_id === parameters[0] && !row.deleted_at).map((row) => ({ id: row.id, client_project_id: row.client_project_id }));
      return [rows, []];
    }
    if (query.startsWith("SELECT id FROM projects WHERE user_id")) {
      const row = [...this.projects.values()].find((item) => item.user_id === parameters[0] && item.client_project_id === parameters[1] && !item.deleted_at); return [[...(row ? [{ id: row.id }] : [])], []];
    }
    if (query.startsWith("UPDATE projects SET user_id")) {
      const row = this.projects.get(parameters[2]); row.user_id = parameters[0]; row.client_project_id = parameters[1]; row.updated_at = new Date(); return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("SELECT id, client_project_id, schema_version")) {
      const rows = [...this.projects.values()].filter((row) => row.user_id === parameters[0] && !row.deleted_at).sort((a, b) => b.updated_at - a.updated_at); return [rows.slice(0, parameters.at(-1)), []];
    }
    if (query.startsWith("SELECT * FROM projects WHERE id")) {
      const row = this.projects.get(parameters[0]); return [[...(row && row.user_id === parameters[1] && !row.deleted_at ? [row] : [])], []];
    }
    throw new Error(`Unsupported AuthPool query: ${query}`);
  }
}

class PasswordResetPool {
  constructor() {
    this.accounts = new Map([["account-user", {
      user_id: "account-user", email: "artist@example.com", password_hash: bcrypt.hashSync("OldStrongPass1", 4),
      display_name: "Artist", avatar: null, created_at: new Date(), updated_at: new Date(),
    }]]);
    this.users = new Map([["account-user", { deleted_at: null }]]);
    this.resetTokens = new Map();
    this.authSessions = new Map([["session", { user_id: "account-user", revoked_at: null }]]);
  }
  async getConnection() { return this; }
  async beginTransaction() {}
  async commit() {}
  async rollback() {}
  release() {}
  async execute(sql, parameters = []) {
    const query = sql.replace(/\s+/gu, " ").trim();
    if (query.startsWith("SELECT a.user_id, a.email FROM accounts")) {
      const account = [...this.accounts.values()].find((row) => row.email === parameters[0]);
      return [[...(account && !this.users.get(account.user_id).deleted_at ? [{ user_id: account.user_id, email: account.email }] : [])], []];
    }
    if (query.startsWith("UPDATE password_reset_tokens SET used_at") && query.includes("WHERE user_id")) {
      for (const row of this.resetTokens.values()) if (row.user_id === parameters[0] && row.used_at === null) row.used_at = new Date();
      return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("INSERT INTO password_reset_tokens")) {
      this.resetTokens.set(parameters[0], { id: parameters[0], user_id: parameters[1], token_hash: parameters[2], expires_at: parameters[3], used_at: null });
      return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("SELECT id, user_id FROM password_reset_tokens")) {
      const row = [...this.resetTokens.values()].find((candidate) => candidate.token_hash.equals(parameters[0]) && candidate.used_at === null && candidate.expires_at > new Date());
      return [[...(row ? [{ id: row.id, user_id: row.user_id }] : [])], []];
    }
    if (query.startsWith("UPDATE accounts SET password_hash")) {
      const account = this.accounts.get(parameters[1]); account.password_hash = parameters[0]; account.updated_at = new Date(); return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith("UPDATE password_reset_tokens SET used_at") && query.includes("WHERE id")) {
      const row = this.resetTokens.get(parameters[0]); if (row?.used_at === null) row.used_at = new Date(); return [{ affectedRows: row ? 1 : 0 }, []];
    }
    if (query.startsWith("UPDATE authenticated_sessions SET revoked_at")) {
      for (const row of this.authSessions.values()) if (row.user_id === parameters[0] && row.revoked_at === null) row.revoked_at = new Date();
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unsupported PasswordResetPool query: ${query}`);
  }
}
