const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_PATHS = [
  "app.js",
  "package.json",
  "database/migrate.js",
  "database/status.js",
  "database/migrations/001_initial_schema.sql",
  "src/app.js",
  "src/config/environment.js",
  "src/db/pool.js",
  "src/routes/health-routes.js",
];

const REQUIRED_DEPENDENCIES = [
  "cors",
  "dotenv",
  "express",
  "express-rate-limit",
  "helmet",
  "mysql2",
  "zod",
];

function inspectDeploymentPackage(rootDirectory) {
  const missingPaths = REQUIRED_PATHS.filter(
    (relativePath) => !fs.existsSync(path.join(rootDirectory, relativePath)),
  );
  const packageJsonPath = path.join(rootDirectory, "package.json");
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    : {};
  const missingDependencies = REQUIRED_DEPENDENCIES.filter(
    (dependency) => !packageJson.dependencies?.[dependency],
  );
  const errors = [];

  if (missingPaths.length > 0) {
    errors.push(`Missing deployment paths: ${missingPaths.join(", ")}`);
  }
  if (missingDependencies.length > 0) {
    errors.push(`Missing production dependencies: ${missingDependencies.join(", ")}`);
  }
  if (packageJson.type !== "commonjs") {
    errors.push("package.json must use CommonJS for the cPanel Passenger runtime");
  }
  if (packageJson.engines?.node !== ">=20.20.2 <21") {
    errors.push("package.json must declare Node >=20.20.2 <21");
  }
  if (fs.existsSync(path.join(rootDirectory, ".env"))) {
    errors.push("A .env file is present; do not include it in the cPanel upload");
  }

  return {
    ok: errors.length === 0,
    errors,
    requiredPaths: REQUIRED_PATHS,
    nodeEngine: packageJson.engines?.node ?? null,
    startupFile: "app.js",
  };
}

function main() {
  const rootDirectory = path.resolve(__dirname, "..");
  const result = inspectDeploymentPackage(rootDirectory);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { REQUIRED_DEPENDENCIES, REQUIRED_PATHS, inspectDeploymentPackage };
