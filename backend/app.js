require("dotenv").config();

const { loadEnvironment } = require("./src/config/environment");
const { createPool } = require("./src/db/pool");
const { createApplication } = require("./src/app");

const config = loadEnvironment();
const pool = createPool(config.db);
const app = createApplication({ pool, config });

if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`[QUANDA API] listening on port ${config.port}`);
  });

  async function shutdown(signal) {
    console.log(`[QUANDA API] ${signal} received; shutting down`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

module.exports = app;
