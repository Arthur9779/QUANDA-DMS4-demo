import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { RuntimeOntologyArtifactSchema } from "../src/ontology/contracts";
import {
  buildOntologySearchDocuments,
  createSearchDocumentsManifest,
  serializeSearchDocuments,
} from "../src/ontology/retrieval/searchDocuments";

const projectRoot = resolve(import.meta.dirname, "..");
const ontologyPath = resolve(
  projectRoot,
  "src/ontology/generated/ontology.json",
);
const documentsPath = resolve(
  projectRoot,
  "src/ontology/generated/search-documents.jsonl",
);
const manifestPath = resolve(
  projectRoot,
  "src/ontology/generated/search-documents.manifest.json",
);
const checkOnly = process.argv.includes("--check");

const ontology = RuntimeOntologyArtifactSchema.parse(
  JSON.parse(await readFile(ontologyPath, "utf8")),
);
const documents = buildOntologySearchDocuments(ontology);
const serialized = serializeSearchDocuments(documents);
const manifest = createSearchDocumentsManifest(ontology, serialized);
const serializedManifest = `${JSON.stringify(manifest, null, 2)}\n`;

if (checkOnly) {
  const [currentDocuments, currentManifest] = await Promise.all([
    readFile(documentsPath, "utf8").catch(() => ""),
    readFile(manifestPath, "utf8").catch(() => ""),
  ]);
  if (
    currentDocuments !== serialized ||
    currentManifest !== serializedManifest
  ) {
    throw new Error(
      "Ontology search documents are stale. Run `pnpm ontology:search-documents:build`.",
    );
  }
} else {
  await mkdir(dirname(documentsPath), { recursive: true });
  await Promise.all([
    writeFile(documentsPath, serialized, "utf8"),
    writeFile(manifestPath, serializedManifest, "utf8"),
  ]);
}

console.log("QUANDA ontology search documents\n");
console.log(`Ontology source hash: ${manifest.ontologySourceHash}`);
console.log(`Documents: ${manifest.documentCount}`);
console.log(`Documents hash: ${manifest.documentsSha256}`);
console.log(`Freshness: ${checkOnly ? "current" : "generated"}`);
