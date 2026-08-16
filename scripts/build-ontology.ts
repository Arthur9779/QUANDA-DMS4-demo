import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  compileOntologySource,
  formatOntologySummary,
  serializeOntologyArtifact,
} from "../src/ontology/compiler";

const projectRoot = resolve(import.meta.dirname, "..");
const sourcePath = resolve(projectRoot, "knowledge/quanda.skills");
const outputPath = resolve(
  projectRoot,
  "src/ontology/generated/ontology.json",
);
const checkOnly = process.argv.includes("--check");

async function main() {
  const source = await readFile(sourcePath, "utf8");
  const artifact = compileOntologySource(source, {
    sourcePath: "knowledge/quanda.skills",
  });
  const generated = serializeOntologyArtifact(artifact);

  if (checkOnly) {
    let current: string;
    try {
      current = await readFile(outputPath, "utf8");
    } catch {
      throw new Error(
        "Generated ontology is missing. Run `pnpm ontology:build` and commit the result.",
      );
    }
    if (current !== generated) {
      throw new Error(
        "Generated ontology is stale. Run `pnpm ontology:build` and commit the result.",
      );
    }
  } else {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, generated, "utf8");
  }

  console.log(formatOntologySummary(artifact));
  if (checkOnly) console.log("Freshness: current");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
