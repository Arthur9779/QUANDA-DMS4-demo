require("dotenv").config();

const { loadEnvironment } = require("../src/config/environment");
const { createPool } = require("../src/db/pool");
const { createSyntheticService } = require("../src/services/synthetic-service");
const { parseArguments } = require("./arguments");

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const scenarioId = String(arguments_.scenario || "");
  const expectedConfirmation = `DELETE-SYNTHETIC-${scenarioId}`;
  if (!/^[0-9a-f-]{36}$/i.test(scenarioId)) {
    throw new Error("Provide the exact scenario UUID with --scenario");
  }
  if (arguments_.confirm !== expectedConfirmation) {
    throw new Error(`Refusing deletion. Pass --confirm ${expectedConfirmation}`);
  }

  const config = loadEnvironment();
  const pool = createPool(config.db);
  try {
    const result = await createSyntheticService({ pool }).remove(scenarioId);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`[QUANDA API] synthetic_delete_failed: ${error.message}`);
  process.exitCode = 1;
});
