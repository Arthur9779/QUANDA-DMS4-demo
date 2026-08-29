const assert = require("node:assert/strict");
const path = require("node:path");
const { describe, test } = require("node:test");
const { loadDatabaseEnvironment } = require("../src/config/environment");
const {
  compareMigrations,
  ensureAppliedMigrationsExist,
  loadMigrations,
  migrate,
  splitSql,
} = require("../database/migration-runner");

const migrationsDirectory = path.join(__dirname, "..", "database", "migrations");

describe("migration source", () => {
  test("loads the versioned initial schema with a stable checksum", async () => {
    const migrations = await loadMigrations(migrationsDirectory);
    assert.equal(migrations.length, 1);
    assert.equal(migrations[0].version, "001_initial_schema");
    assert.match(migrations[0].checksum, /^[a-f0-9]{64}$/);
    assert.equal(migrations[0].statements.length, 6);
  });

  test("defines every table and relationship required by the backend queries", async () => {
    const [migration] = await loadMigrations(migrationsDirectory);
    const sql = migration.statements.join(";\n");

    for (const table of [
      "synthetic_scenarios",
      "users",
      "anonymous_credentials",
      "sessions",
      "projects",
      "events",
    ]) {
      assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
    }

    for (const requiredFragment of [
      "UNIQUE KEY uq_anonymous_credentials_token_hash",
      "UNIQUE KEY uq_sessions_token_hash",
      "UNIQUE KEY uq_projects_user_client_id",
      "UNIQUE KEY uq_events_client_event_id",
      "FOREIGN KEY (session_id) REFERENCES sessions (id)",
      "FOREIGN KEY (project_id) REFERENCES projects (id)",
      "project_data LONGTEXT NOT NULL",
      "properties_json LONGTEXT NOT NULL",
      "is_synthetic TINYINT(1) NOT NULL DEFAULT 0",
    ]) {
      assert.ok(sql.includes(requiredFragment), `missing schema fragment: ${requiredFragment}`);
    }
  });

  test("splits SQL without breaking quoted semicolons or retaining comments", () => {
    const statements = splitSql(`
      -- comment with a ;
      INSERT INTO example (value) VALUES ('one;two');
      /* another ; comment */
      SELECT "three;four";
    `);
    assert.deepEqual(statements, [
      "INSERT INTO example (value) VALUES ('one;two')",
      'SELECT "three;four"',
    ]);
  });
});

describe("migration safety", () => {
  test("database-only commands do not require API secrets", () => {
    const config = loadDatabaseEnvironment({
      DB_HOST: "localhost",
      DB_PORT: "3307",
      DB_NAME: "quanda_test",
      DB_USER: "quanda",
      DB_PASSWORD: "private",
    });
    assert.deepEqual(config.db, {
      host: "localhost",
      port: 3307,
      database: "quanda_test",
      user: "quanda",
      password: "private",
    });
  });

  test("reports pending, applied, and checksum-mismatched migrations", () => {
    const migrations = [
      { version: "001_first", checksum: "one" },
      { version: "002_second", checksum: "two" },
      { version: "003_third", checksum: "three" },
    ];
    const applied = new Map([
      ["001_first", { checksum: "one", applied_at: "2026-08-28" }],
      ["002_second", { checksum: "changed", applied_at: "2026-08-28" }],
    ]);
    assert.deepEqual(
      compareMigrations(migrations, applied).map((item) => item.status),
      ["applied", "checksum_mismatch", "pending"],
    );
  });

  test("refuses a database history whose migration file is missing", () => {
    assert.throws(
      () =>
        ensureAppliedMigrationsExist(
          [{ version: "001_first" }],
          new Map([["002_missing", { checksum: "two" }]]),
        ),
      /Applied migration files are missing locally: 002_missing/,
    );
  });

  test("applies the initial migration once and records its checksum", async () => {
    const pool = new FakeMigrationPool();
    const first = await migrate(pool, migrationsDirectory);
    assert.deepEqual(first, { applied: ["001_initial_schema"], alreadyApplied: 0 });
    assert.equal(pool.applicationStatements.length, 6);
    assert.equal(pool.applied.size, 1);

    const second = await migrate(pool, migrationsDirectory);
    assert.deepEqual(second, { applied: [], alreadyApplied: 1 });
    assert.equal(pool.applicationStatements.length, 6);
    assert.equal(pool.releaseCount, 2);
  });
});

class FakeMigrationPool {
  constructor() {
    this.applied = new Map();
    this.applicationStatements = [];
    this.releaseCount = 0;
  }

  async getConnection() {
    return {
      query: async (sql) => {
        if (sql.startsWith("SELECT GET_LOCK")) return [[{ acquired: 1 }], []];
        if (sql.startsWith("CREATE TABLE IF NOT EXISTS schema_migrations")) return [[], []];
        if (sql.startsWith("SELECT version, checksum, applied_at")) {
          return [[...this.applied.values()], []];
        }
        if (sql.startsWith("SELECT RELEASE_LOCK")) return [[{ released: 1 }], []];
        this.applicationStatements.push(sql);
        return [[], []];
      },
      execute: async (sql, values) => {
        assert.match(sql, /^INSERT INTO schema_migrations/);
        const [version, checksum] = values;
        this.applied.set(version, {
          version,
          checksum,
          applied_at: "2026-08-28T00:00:00.000Z",
        });
        return [{ affectedRows: 1 }, []];
      },
      release: () => {
        this.releaseCount += 1;
      },
    };
  }
}
