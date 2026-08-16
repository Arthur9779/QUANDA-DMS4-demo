import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ontologyArtifact } from "../src/ontology/runtime";
import {
  getOntologyIndexFreshness,
  LocalOntologyIndexManifestSchema,
  type LocalOntologyIndexManifest,
} from "../src/ontology/retrieval/indexFreshness";

const projectRoot = resolve(import.meta.dirname, "..");
try {
  process.loadEnvFile(resolve(projectRoot, ".env.local"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

let localManifest: LocalOntologyIndexManifest | undefined;
try {
  localManifest = LocalOntologyIndexManifestSchema.parse(
    JSON.parse(
      await readFile(
        resolve(projectRoot, ".quanda/ontology-index.json"),
        "utf8",
      ),
    ),
  );
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    console.warn("Local index manifest is unavailable or invalid.");
  }
}

const storeName =
  process.env.GEMINI_FILE_SEARCH_STORE ?? localManifest?.storeName;
const indexedHash =
  process.env.GEMINI_FILE_SEARCH_ONTOLOGY_HASH ??
  localManifest?.ontologySourceHash;
const freshness = getOntologyIndexFreshness({
  localOntologyHash: ontologyArtifact.source.sha256,
  indexedOntologyHash: indexedHash,
  storeName,
});

console.log("QUANDA ontology semantic index status\n");
console.log(`Local ontology hash: ${ontologyArtifact.source.sha256}`);
console.log(`Indexed ontology hash: ${indexedHash ?? "not configured"}`);
console.log(`Store: ${storeName ?? "not configured"}`);
console.log(`Status: ${freshness}`);
if (freshness !== "CURRENT") {
  console.log("Run `pnpm ontology:index` and configure the printed environment values.");
  process.exitCode = 1;
}
