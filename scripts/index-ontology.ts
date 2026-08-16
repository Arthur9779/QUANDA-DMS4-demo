import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ontologyArtifact } from "../src/ontology/runtime";
import { LocalOntologyIndexManifestSchema } from "../src/ontology/retrieval/indexFreshness";
import { indexOntologyWithGeminiFileSearch } from "../src/ontology/retrieval/geminiFileSearchAdmin";
import { OntologySearchDocumentsManifestSchema } from "../src/ontology/retrieval/searchDocuments";

const projectRoot = resolve(import.meta.dirname, "..");
try {
  process.loadEnvFile(resolve(projectRoot, ".env.local"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
const storeArgument = process.argv.find((argument) => argument.startsWith("--store="));
const storeName = storeArgument?.slice("--store=".length);
const documentsPath = resolve(
  projectRoot,
  "src/ontology/generated/search-documents.jsonl",
);
const documentsManifest = OntologySearchDocumentsManifestSchema.parse(
  JSON.parse(
    await readFile(
      resolve(
        projectRoot,
        "src/ontology/generated/search-documents.manifest.json",
      ),
      "utf8",
    ),
  ),
);
if (documentsManifest.ontologySourceHash !== ontologyArtifact.source.sha256) {
  throw new Error(
    "Search documents are stale. Run `pnpm ontology:search-documents:build` first.",
  );
}

const result = await indexOntologyWithGeminiFileSearch(
  {
    content: await readFile(documentsPath),
    ontologySourceHash: ontologyArtifact.source.sha256,
    ontologySchemaVersion: ontologyArtifact.ontologySchemaVersion,
    documentCount: documentsManifest.documentCount,
    storeName,
  },
  {
    apiKey,
    baseUrl: process.env.GEMINI_BASE_URL,
    uploadBaseUrl: process.env.GEMINI_FILE_SEARCH_UPLOAD_BASE_URL,
    embeddingModel: process.env.GEMINI_FILE_SEARCH_EMBEDDING_MODEL,
  },
);

const manifest = LocalOntologyIndexManifestSchema.parse({
  provider: "gemini_file_search",
  storeName: result.storeName,
  documentName: result.documentName,
  ontologySchemaVersion: ontologyArtifact.ontologySchemaVersion,
  ontologySourceHash: ontologyArtifact.source.sha256,
  indexedConcepts: documentsManifest.documentCount,
  indexedAt: result.indexedAt,
});
const manifestDirectory = resolve(projectRoot, ".quanda");
await mkdir(manifestDirectory, { recursive: true });
await writeFile(
  resolve(manifestDirectory, "ontology-index.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log("QUANDA ontology indexed with Gemini File Search\n");
console.log(`Ontology schema version: ${manifest.ontologySchemaVersion}`);
console.log(`Indexed concepts: ${manifest.indexedConcepts}`);
console.log(`Store: ${manifest.storeName}`);
console.log(`Ontology source hash: ${manifest.ontologySourceHash}`);
console.log("\nConfigure the same server environment in local development and Vercel:");
console.log(`GEMINI_FILE_SEARCH_STORE=${manifest.storeName}`);
console.log(
  `GEMINI_FILE_SEARCH_ONTOLOGY_HASH=${manifest.ontologySourceHash}`,
);
