const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const MIGRATION_FILE_PATTERN = /^\d{3,}_[a-z0-9_]+\.sql$/;
const MIGRATION_LOCK = "quanda_schema_migrations";

function checksum(contents) {
  return crypto.createHash("sha256").update(contents, "utf8").digest("hex");
}

function splitSql(contents) {
  const statements = [];
  let current = "";
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];
    const next = contents[index + 1];

    if (lineComment) {
      if (character === "\n") {
        lineComment = false;
        current += "\n";
      }
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && character === "-" && next === "-") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (!quote && character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (quote) {
      current += character;
      if (character === "\\" && next) {
        current += next;
        index += 1;
      } else if (character === quote) {
        if (next === quote) {
          current += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      current += character;
      continue;
    }
    if (character === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }

  if (quote || blockComment) throw new Error("Migration contains an unterminated quote or comment");
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function loadMigrations(directory) {
  const names = (await fs.readdir(directory))
    .filter((name) => MIGRATION_FILE_PATTERN.test(name))
    .sort((left, right) => left.localeCompare(right));
  if (names.length === 0) throw new Error("No migration files were found");
  const seenNumbers = new Set();
  const migrations = [];
  for (const name of names) {
    const number = name.split("_", 1)[0];
    if (seenNumbers.has(number)) throw new Error(`Duplicate migration number: ${number}`);
    seenNumbers.add(number);
    const contents = await fs.readFile(path.join(directory, name), "utf8");
    const statements = splitSql(contents);
    if (statements.length === 0) throw new Error(`Migration is empty: ${name}`);
    migrations.push({
      version: name.slice(0, -4),
      filename: name,
      checksum: checksum(contents),
      statements,
    });
  }
  return migrations;
}

async function ensureMigrationTable(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    applied_at DATETIME(3) NOT NULL,
    PRIMARY KEY (version)
  ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

async function readApplied(connection) {
  const [rows] = await connection.query(
    "SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version",
  );
  return new Map(rows.map((row) => [row.version, row]));
}

function compareMigrations(migrations, applied) {
  return migrations.map((migration) => {
    const record = applied.get(migration.version);
    return {
      ...migration,
      status: !record
        ? "pending"
        : record.checksum === migration.checksum
          ? "applied"
          : "checksum_mismatch",
      appliedAt: record?.applied_at ?? null,
    };
  });
}

function ensureAppliedMigrationsExist(migrations, applied) {
  const localVersions = new Set(migrations.map((migration) => migration.version));
  const missing = [...applied.keys()].filter((version) => !localVersions.has(version));
  if (missing.length > 0) {
    throw new Error(`Applied migration files are missing locally: ${missing.join(", ")}`);
  }
}

async function migrationStatus(pool, directory) {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationTable(connection);
    const migrations = await loadMigrations(directory);
    const applied = await readApplied(connection);
    ensureAppliedMigrationsExist(migrations, applied);
    return compareMigrations(migrations, applied);
  } finally {
    connection.release();
  }
}

async function migrate(pool, directory) {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [lockRows] = await connection.query("SELECT GET_LOCK(?, 10) AS acquired", [MIGRATION_LOCK]);
    locked = Number(lockRows[0]?.acquired) === 1;
    if (!locked) throw new Error("Could not acquire the QUANDA migration lock");
    await ensureMigrationTable(connection);
    const localMigrations = await loadMigrations(directory);
    const applied = await readApplied(connection);
    ensureAppliedMigrationsExist(localMigrations, applied);
    const migrations = compareMigrations(localMigrations, applied);
    const mismatch = migrations.find((migration) => migration.status === "checksum_mismatch");
    if (mismatch) {
      throw new Error(`Applied migration checksum changed: ${mismatch.filename}`);
    }

    const appliedNow = [];
    for (const migration of migrations.filter((item) => item.status === "pending")) {
      for (const statement of migration.statements) await connection.query(statement);
      await connection.execute(
        "INSERT INTO schema_migrations (version, checksum, applied_at) VALUES (?, ?, UTC_TIMESTAMP(3))",
        [migration.version, migration.checksum],
      );
      appliedNow.push(migration.version);
    }
    return { applied: appliedNow, alreadyApplied: migrations.length - appliedNow.length };
  } finally {
    if (locked) await connection.query("SELECT RELEASE_LOCK(?)", [MIGRATION_LOCK]).catch(() => {});
    connection.release();
  }
}

module.exports = {
  MIGRATION_FILE_PATTERN,
  checksum,
  compareMigrations,
  ensureAppliedMigrationsExist,
  loadMigrations,
  migrate,
  migrationStatus,
  splitSql,
};
