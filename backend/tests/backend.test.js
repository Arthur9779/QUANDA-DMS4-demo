const assert = require("node:assert/strict");
const { afterEach, describe, test } = require("node:test");
const { createApplication } = require("../src/app");
const { loadEnvironment } = require("../src/config/environment");
const { hashToken } = require("../src/lib/tokens");
const { createAnalyticsService } = require("../src/services/analytics-service");
const { EventNameSchema, canonicalEventName } = require("../src/validation/events");

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise((resolve) => server.close(resolve)),
    ),
  );
});

function testConfig() {
  return {
    nodeEnv: "test",
    port: 0,
    db: {},
    sessionSecret: "test-session-secret-with-at-least-32-characters",
    adminApiToken: "test-admin-token-with-at-least-32-characters",
    allowedOrigins: ["https://quanda.example"],
    sessionIdleMinutes: 30,
    eventBatchLimit: 50,
    logLevel: "error",
  };
}

async function start(pool = new FakePool()) {
  const app = createApplication({ pool, config: testConfig() });
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  return { baseUrl: `http://127.0.0.1:${address.port}`, pool };
}

async function json(response) {
  return response.json();
}

describe("environment security", () => {
  test("rejects wildcard production CORS", () => {
    assert.throws(
      () =>
        loadEnvironment({
          NODE_ENV: "production",
          PORT: "3001",
          DB_HOST: "localhost",
          DB_PORT: "3306",
          DB_NAME: "quanda",
          DB_USER: "quanda",
          DB_PASSWORD: "private",
          SESSION_SECRET: "a".repeat(32),
          ADMIN_API_TOKEN: "b".repeat(32),
          ALLOWED_ORIGINS: "*",
        }),
      /cannot contain \*/,
    );
  });

  test("token hashing is stable and does not retain plaintext", () => {
    const token = "qui_private-token";
    const first = hashToken(token, testConfig().sessionSecret);
    const second = hashToken(token, testConfig().sessionSecret);
    assert.deepEqual(first, second);
    assert.equal(first.length, 32);
    assert.equal(first.includes(Buffer.from(token)), false);
  });
});

describe("local API", () => {
  test("health reports database availability", async () => {
    const { baseUrl } = await start();
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(await json(response)).filter(([key]) => key !== "requestId"),
      ),
      { status: "ok", service: "quanda-api", database: "ok" },
    );
  });

  test("serves a no-store analytics dashboard without embedding credentials", async () => {
    const { baseUrl } = await start();
    const response = await fetch(`${baseUrl}/admin/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.match(html, /QUANDA Live Analytics/);
    assert.match(html, /Anonymous browser identities/);
    assert.match(html, /internal testing may still appear/);
    assert.match(html, /type="password"/);
    assert.match(html, /\/admin\/app\.js/);
    assert.match(html, /roadmap-generation-gap/);
    assert.match(html, /Workflow branches/);
    assert.match(html, /engineering-plans/);
    assert.doesNotMatch(html, /test-admin-token-with-at-least-32-characters/);

    const script = await fetch(`${baseUrl}/admin/app.js`);
    assert.equal(script.status, 200);
    const scriptBody = await script.text();
    assert.match(scriptBody, /Authorization: `Bearer/);
    assert.match(scriptBody, /planStartToCompletionRate/);
  });

  test("CORS permits only configured browser origins", async () => {
    const { baseUrl } = await start();
    const allowed = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://quanda.example" },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://quanda.example");

    const blocked = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://attacker.example" },
    });
    assert.equal(blocked.status, 403);
    assert.equal((await json(blocked)).error, "origin_forbidden");
  });

  test("invalid JSON returns a safe client error", async () => {
    const { baseUrl } = await start();
    const response = await fetch(`${baseUrl}/api/v1/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error, "invalid_json");
  });

  test("creates and resumes an anonymous identity and session", async () => {
    const { baseUrl } = await start();
    const createdResponse = await fetch(`${baseUrl}/api/v1/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(createdResponse.status, 201);
    const created = await json(createdResponse);
    assert.equal(created.user.isNew, true);
    assert.equal(created.session.isNew, true);
    assert.match(created.identityToken, /^qui_/);
    assert.match(created.sessionToken, /^qus_/);

    const resumedResponse = await fetch(`${baseUrl}/api/v1/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: created.identityToken,
        sessionToken: created.sessionToken,
      }),
    });
    assert.equal(resumedResponse.status, 200);
    const resumed = await json(resumedResponse);
    assert.equal(resumed.user.id, created.user.id);
    assert.equal(resumed.session.id, created.session.id);
    assert.equal(resumed.user.isNew, false);
    assert.equal(resumed.session.isNew, false);
    assert.equal(resumed.returningUser, true);
  });

  test("accepts idempotent authenticated event batches", async () => {
    const { baseUrl, pool } = await start();
    const sessionResponse = await fetch(`${baseUrl}/api/v1/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const session = await json(sessionResponse);
    const event = {
      id: "e1c2657b-0faf-4bb5-887d-f05642928a6a",
      name: "roadmap_generated",
      eventTime: new Date().toISOString(),
      properties: { source: "test", stageCount: 6 },
    };
    const first = await fetch(`${baseUrl}/api/v1/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events: [event] }),
    });
    assert.equal(first.status, 202);
    assert.deepEqual(await json(first), { accepted: 1, duplicate: 0 });

    const repeated = await fetch(`${baseUrl}/api/v1/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events: [event] }),
    });
    assert.deepEqual(await json(repeated), { accepted: 0, duplicate: 1 });
    assert.equal(pool.events.size, 1);
  });

  test("protects project and analytics APIs", async () => {
    const { baseUrl } = await start();
    const project = await fetch(`${baseUrl}/api/v1/projects`);
    assert.equal(project.status, 401);
    assert.equal((await json(project)).error, "unauthorized");

    const analytics = await fetch(`${baseUrl}/api/v1/admin/analytics/overview`);
    assert.equal(analytics.status, 403);
    assert.match(analytics.headers.get("cache-control"), /no-store/);
    assert.equal((await json(analytics)).error, "admin_forbidden");
  });

  test("creates, reads, lists, and softly removes an owned project", async () => {
    const { baseUrl } = await start();
    const sessionResponse = await fetch(`${baseUrl}/api/v1/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const session = await json(sessionResponse);
    const authorization = { Authorization: `Bearer ${session.sessionToken}` };
    const createdResponse = await fetch(`${baseUrl}/api/v1/projects`, {
      method: "POST",
      headers: { ...authorization, "Content-Type": "application/json" },
      body: JSON.stringify({
        clientProjectId: "754d11d7-f3ce-4eca-a666-8f25948bea5c",
        title: "Local API test project",
        status: "planning",
        data: { brief: "A local API test snapshot" },
      }),
    });
    assert.equal(createdResponse.status, 201);
    const created = await json(createdResponse);
    assert.equal(created.title, "Local API test project");
    assert.deepEqual(created.data, { brief: "A local API test snapshot" });

    const fetched = await fetch(`${baseUrl}/api/v1/projects/${created.id}`, {
      headers: authorization,
    });
    assert.equal(fetched.status, 200);
    assert.equal((await json(fetched)).id, created.id);

    const list = await fetch(`${baseUrl}/api/v1/projects`, { headers: authorization });
    const projects = (await json(list)).projects;
    assert.equal(projects.length, 1);
    assert.equal(projects[0].id, created.id);
    assert.equal("data" in projects[0], false);

    const removed = await fetch(`${baseUrl}/api/v1/projects/${created.id}`, {
      method: "DELETE",
      headers: authorization,
    });
    assert.equal(removed.status, 204);
    const missing = await fetch(`${baseUrl}/api/v1/projects/${created.id}`, {
      headers: authorization,
    });
    assert.equal(missing.status, 404);
  });
});

test("analytics activity uses one coherent last-seen window", async () => {
  const calls = [];
  const pool = {
    async execute(sql, parameters) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), parameters });
      if (sql.includes("COUNT(*) AS total_users")) {
        return [[{ total_users: 2, new_users: 1 }], []];
      }
      if (sql.includes("COUNT(*) AS total_sessions")) {
        return [[{ total_sessions: 3, active_users: 2 }], []];
      }
      if (sql.includes("returning_users")) {
        return [[{ returning_users: 1 }], []];
      }
      if (sql.includes("AS dau")) {
        return [[{ dau: 2, wau: 2, mau: 2 }], []];
      }
      return [[{
        briefs: 8,
        roadmaps: 4,
        engineering_plans: 2,
        plan_starts: 7,
        plan_failures: 1,
        design_briefs: 6,
        design_analyses: 6,
        design_tutorial_matches: 6,
        engineering_briefs: 2,
        engineering_interpretations: 2,
        engineering_guided_plans: 1,
        engineering_agentic_plans: 1,
        engineering_tasks_completed: 3,
        viewed_projects: 0,
        tutorial_projects: 0,
        roadmap_users: 0,
        calendar_users: 0,
        stages_completed: 0,
        projects_completed: 0,
      }], []];
    },
  };
  const start = new Date("2026-08-30T00:00:00.000Z");
  const end = new Date("2026-09-01T00:00:00.000Z");
  const overview = await createAnalyticsService({ pool }).overview({
    start,
    end,
    source: "real",
  });

  assert.match(calls[1].sql, /s\.last_seen_at >= \? AND s\.last_seen_at < \?/);
  assert.match(calls[2].sql, /s\.last_seen_at >= \? AND s\.last_seen_at < \?/);
  assert.match(calls[2].sql, /EXISTS \( SELECT 1 FROM sessions previous/);
  assert.match(calls[2].sql, /previous\.started_at < s\.started_at/);
  assert.equal(calls[2].parameters.length, 2);
  assert.equal(calls[3].parameters[0].toISOString(), "2026-08-31T00:00:00.000Z");
  assert.equal(calls[3].parameters[1].toISOString(), start.toISOString());
  assert.equal(calls[3].parameters[2].toISOString(), start.toISOString());
  assert.match(overview.definitions.identity, /browser identity/i);
  assert.match(overview.definitions.returning, /earlier session/i);
  assert.equal(overview.sessions.averagePerActiveUser, 1.5);
  assert.equal(overview.product.plansGenerated, 6);
  assert.equal(overview.product.briefToPlanConversion, 0.75);
  assert.equal(overview.product.planStartToCompletionRate, 0.8571);
  assert.equal(overview.product.planGenerationFailures, 1);
  assert.equal(overview.product.planGenerationGap, 1);
  assert.equal(overview.product.workItemsCompleted, 3);
  assert.equal(overview.branches.design.conversion, 0.6667);
  assert.equal(overview.branches.engineering.conversion, 1);
  assert.equal(overview.branches.engineering.tasksCompleted, 3);
});

test("legacy event names normalize to canonical analytics names", () => {
  assert.equal(canonicalEventName("roadmap_generate_fallback"), "roadmap_generated");
  assert.equal(canonicalEventName("roadmap_generate_failed"), "roadmap_generate_failed");
  assert.equal(canonicalEventName("engineering_plan_generated"), "engineering_plan_generated");
  assert.equal(EventNameSchema.safeParse("engineering_interpretation_started").success, true);
  assert.equal(EventNameSchema.safeParse("engineering_plan_generate_failed").success, true);
  assert.equal(canonicalEventName("stage_completed"), "roadmap_stage_completed");
  assert.equal(canonicalEventName("tutorial_opened"), "tutorial_opened");
});

class FakePool {
  constructor() {
    this.users = new Map();
    this.credentials = new Map();
    this.sessionsById = new Map();
    this.sessionsByHash = new Map();
    this.events = new Set();
    this.projects = new Map();
  }

  async query(sql) {
    if (/SELECT 1/i.test(sql)) return [[{ 1: 1 }], []];
    throw new Error(`Unsupported fake query: ${sql}`);
  }

  async getConnection() {
    return this;
  }

  async beginTransaction() {}
  async commit() {}
  async rollback() {}
  release() {}

  async execute(sql, parameters) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    if (normalized.startsWith("INSERT INTO users")) {
      this.users.set(parameters[0], {
        id: parameters[0],
        account_type: "anonymous",
        created_at: new Date(),
        last_seen_at: new Date(),
      });
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("INSERT INTO anonymous_credentials")) {
      this.credentials.set(parameters[1].toString("hex"), parameters[0]);
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("SELECT c.user_id")) {
      const userId = this.credentials.get(parameters[0].toString("hex"));
      return [[...(userId ? [{ user_id: userId }] : [])], []];
    }
    if (normalized.startsWith("INSERT INTO sessions")) {
      const session = {
        id: parameters[0],
        user_id: parameters[1],
        tokenHash: parameters[2].toString("hex"),
        started_at: new Date(),
        last_seen_at: new Date(),
      };
      this.sessionsById.set(session.id, session);
      this.sessionsByHash.set(session.tokenHash, session);
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("SELECT started_at FROM sessions")) {
      const session = this.sessionsById.get(parameters[0]);
      return [[{ started_at: session.started_at }], []];
    }
    if (normalized.startsWith("SELECT id, started_at, last_seen_at FROM sessions")) {
      const session = this.sessionsByHash.get(parameters[1].toString("hex"));
      return [[...(session && session.user_id === parameters[0] ? [session] : [])], []];
    }
    if (normalized.startsWith("SELECT s.id AS session_id")) {
      const session = this.sessionsByHash.get(parameters[0].toString("hex"));
      const user = session && this.users.get(session.user_id);
      return [[
        ...(session && user
          ? [{
              session_id: session.id,
              user_id: session.user_id,
              started_at: session.started_at,
              last_seen_at: session.last_seen_at,
              account_type: user.account_type,
            }]
          : []),
      ], []];
    }
    if (
      normalized.startsWith("UPDATE anonymous_credentials") ||
      normalized.startsWith("UPDATE users SET last_seen_at") ||
      normalized.startsWith("UPDATE sessions SET last_seen_at") ||
      normalized.startsWith("UPDATE sessions s JOIN users")
    ) {
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("INSERT IGNORE INTO events")) {
      const eventId = parameters[0];
      if (this.events.has(eventId)) return [{ affectedRows: 0 }, []];
      this.events.add(eventId);
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("INSERT INTO projects")) {
      const now = new Date();
      const project = {
        id: parameters[0],
        user_id: parameters[1],
        client_project_id: parameters[2],
        schema_version: parameters[3],
        title: parameters[4],
        status: parameters[5],
        input_fingerprint: parameters[6],
        project_data: parameters[7],
        version: 1,
        created_at: now,
        updated_at: now,
        completed_at: parameters[8] === "completed" ? now : null,
        deleted_at: null,
      };
      this.projects.set(project.id, project);
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("SELECT * FROM projects WHERE user_id")) {
      const project = [...this.projects.values()].find(
        (candidate) =>
          candidate.user_id === parameters[0] &&
          candidate.client_project_id === parameters[1] &&
          !candidate.deleted_at,
      );
      return [[...(project ? [project] : [])], []];
    }
    if (normalized.startsWith("SELECT * FROM projects WHERE id")) {
      const project = this.projects.get(parameters[0]);
      return [[
        ...(project && project.user_id === parameters[1] && !project.deleted_at
          ? [project]
          : []),
      ], []];
    }
    if (normalized.startsWith("SELECT id, client_project_id")) {
      const rows = [...this.projects.values()]
        .filter((project) => project.user_id === parameters[0] && !project.deleted_at)
        .sort((left, right) => right.updated_at - left.updated_at);
      return [rows, []];
    }
    if (normalized.startsWith("UPDATE projects SET status = 'archived'")) {
      const project = this.projects.get(parameters[0]);
      if (!project || project.user_id !== parameters[1] || project.deleted_at) {
        return [{ affectedRows: 0 }, []];
      }
      project.status = "archived";
      project.deleted_at = new Date();
      project.updated_at = new Date();
      project.version += 1;
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unsupported fake execute: ${normalized}`);
  }
}
