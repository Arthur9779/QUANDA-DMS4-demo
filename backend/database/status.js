require("dotenv").config();

const path = require("node:path");
const { loadDatabaseEnvironment } = require("../src/config/environment");
const { createPool } = require("../src/db/pool");
const { migrationStatus } = require("./migration-runner");

async function main() {
  const config = loadDatabaseEnvironment();
  const pool = createPool(config.db);
  try {
    const migrations = await migrationStatus(pool, path.join(__dirname, "migrations"));
    console.log(
      JSON.stringify(
        migrations.map(({ version, filename, checksum, status, appliedAt }) => ({
          version,
          filename,
          checksum,
          status,
          appliedAt,
        })),
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(
    `Migration status failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
