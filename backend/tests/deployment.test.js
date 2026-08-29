const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  REQUIRED_DEPENDENCIES,
  REQUIRED_PATHS,
  inspectDeploymentPackage,
} = require("../scripts/check-deployment-package");
const {
  assertSupportedNode,
  parseNodeVersion,
} = require("../scripts/production-preflight");

test("the checked-in backend is a complete deployment package", () => {
  const result = inspectDeploymentPackage(path.resolve(__dirname, ".."));
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.startupFile, "app.js");
});

test("deployment package inspection rejects missing runtime files", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "quanda-deploy-check-"));
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      type: "commonjs",
      engines: { node: ">=20.20.2 <21" },
      dependencies: Object.fromEntries(REQUIRED_DEPENDENCIES.map((name) => [name, "1"])),
    }),
  );

  const result = inspectDeploymentPackage(root);
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors,
    [`Missing deployment paths: ${REQUIRED_PATHS.filter((name) => name !== "package.json").join(", ")}`],
  );
});

test("production runtime accepts only the supported Node 20 range", () => {
  assert.deepEqual(parseNodeVersion("v20.20.2"), [20, 20, 2]);
  assert.doesNotThrow(() => assertSupportedNode("v20.20.2"));
  assert.doesNotThrow(() => assertSupportedNode("20.21.0"));
  assert.throws(() => assertSupportedNode("v20.20.1"), /Unsupported Node/);
  assert.throws(() => assertSupportedNode("v21.0.0"), /Unsupported Node/);
});
