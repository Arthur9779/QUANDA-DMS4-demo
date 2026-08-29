require("dotenv").config();

const { loadEnvironment } = require("../src/config/environment");
const { createPool } = require("../src/db/pool");

const MINIMUM_NODE = [20, 20, 2];
const REQUIRED_TABLES = [
  "anonymous_credentials",
  "events",
  "projects",
  "schema_migrations",
  "sessions",
  "synthetic_scenarios",
  "users",
];

function parseNodeVersion(version) {
  const match = String(version).replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error(`Could not parse Node.js version: ${version}`);
  return match.slice(1).map(Number);
}

function assertSupportedNode(version = process.version) {
  const current = parseNodeVersion(version);
  const isNode20 = current[0] === 20;
  const meetsMinimum = current.some(
    (value, index) =>
      value > MINIMUM_NODE[index] &&
      current.slice(0, index).every((part, partIndex) => part === MINIMUM_NODE[partIndex]),
  ) || current.every((value, index) => value === MINIMUM_NODE[index]);

  if (!isNode20 || !meetsMinimum) {
    throw new Error(`Unsupported Node.js ${version}; expected >=20.20.2 <21`);
  }
}

async function inspectDatabase(pool, databaseName) {
  const [identityRows] = await pool.query(
    "SELECT DATABASE() AS database_name, CURRENT_USER() AS database_user, VERSION() AS database_version",
  );
  const [tableRows] = await pool.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
    [databaseName],
  );
  const tableNames = tableRows.map((row) => row.table_name);
  const missingTables = REQUIRED_TABLES.filter((table) => !tableNames.includes(table));

  return {
    database: identityRows[0]?.database_name ?? null,
    databaseUser: identityRows[0]?.database_user ?? null,
    databaseVersion: identityRows[0]?.database_version ?? null,
    missingTables,
  };
}

async function main() {
  assertSupportedNode();
  const config = loadEnvironment();
  if (config.nodeEnv !== "production") {
    throw new Error("NODE_ENV must be production for the production preflight");
  }
  const pool = createPool(config.db);

  try {
    const database = await inspectDatabase(pool, config.db.database);
    if (database.database !== config.db.database) {
      throw new Error("Connected to an unexpected database");
    }
    if (database.missingTables.length > 0) {
      throw new Error(`Missing migrated tables: ${database.missingTables.join(", ")}`);
    }

    console.log(
      JSON.stringify(
        {
          status: "ready",
          node: process.version,
          environment: config.nodeEnv,
          portSource: process.env.PORT ? "hosting-platform" : "default",
          allowedOrigins: config.allowedOrigins,
          database,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `Production preflight failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    process.exitCode = 1;
  });
}

module.exports = { REQUIRED_TABLES, assertSupportedNode, inspectDatabase, parseNodeVersion };
