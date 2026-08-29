require("dotenv").config();

const path = require("node:path");
const { loadDatabaseEnvironment } = require("../src/config/environment");
const { createPool } = require("../src/db/pool");
const { migrate } = require("./migration-runner");

async function main() {
  const config = loadDatabaseEnvironment();
  const pool = createPool(config.db);
  try {
    const result = await migrate(pool, path.join(__dirname, "migrations"));
    console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
