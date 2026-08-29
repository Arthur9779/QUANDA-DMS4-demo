require("dotenv").config();

const { loadEnvironment } = require("../src/config/environment");
const { createPool } = require("../src/db/pool");
const { boundedRate, createSyntheticService } = require("../src/services/synthetic-service");
const { numeric, parseArguments } = require("./arguments");

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 120 * 86_400_000);
  const users = Math.floor(numeric(arguments_, "users", 100));
  if (users < 1 || users > 10_000) throw new Error("--users must be between 1 and 10000");
  const input = {
    name: String(arguments_.name || `Synthetic scenario ${now.toISOString()}`),
    seed: String(arguments_.seed || cryptoRandomSeed()),
    users,
    start: new Date(String(arguments_.start || defaultStart.toISOString())),
    end: new Date(String(arguments_.end || now.toISOString())),
    d1Retention: boundedRate(numeric(arguments_, "d1", 0.42)),
    d7Retention: boundedRate(numeric(arguments_, "d7", 0.24)),
    d30Retention: boundedRate(numeric(arguments_, "d30", 0.12)),
    sessionsPerUser: Math.max(1, numeric(arguments_, "sessions", 3.2)),
    tutorialEngagement: boundedRate(numeric(arguments_, "tutorial", 0.55)),
    calendarAdoption: boundedRate(numeric(arguments_, "calendar", 0.35)),
    roadmapCompletion: boundedRate(numeric(arguments_, "completion", 0.18)),
  };
  if (Number.isNaN(input.start.getTime()) || Number.isNaN(input.end.getTime()) || input.start >= input.end) {
    throw new Error("--start and --end must define a valid increasing date range");
  }

  const config = loadEnvironment();
  const pool = createPool(config.db);
  try {
    const result = await createSyntheticService({ pool }).generate(input);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

function cryptoRandomSeed() {
  return require("node:crypto").randomBytes(12).toString("hex");
}

main().catch((error) => {
  console.error(`[QUANDA API] synthetic_seed_failed: ${error.message}`);
  process.exitCode = 1;
});
