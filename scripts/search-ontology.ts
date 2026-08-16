import { resolve } from "node:path";
import { createOntologyRetriever } from "../src/ontology/retrieval";

const projectRoot = resolve(import.meta.dirname, "..");
try {
  process.loadEnvFile(resolve(projectRoot, ".env.local"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const live = process.argv.includes("--live");
const valueFor = (prefix: string) =>
  process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
const application = valueFor("--app=");
const family = valueFor("--family=");
const category = valueFor("--category=");
const limitValue = Number(valueFor("--limit=") ?? 60);
const query = process.argv
  .slice(2)
  .filter((argument) => !argument.startsWith("--"))
  .join(" ")
  .trim();
if (!query) {
  throw new Error(
    'Provide a query, for example: pnpm ontology:search "Bauhaus audio-reactive poster"',
  );
}
if (
  live &&
  (!process.env.GEMINI_API_KEY ||
    !process.env.GEMINI_FILE_SEARCH_STORE ||
    !process.env.GEMINI_FILE_SEARCH_ONTOLOGY_HASH)
) {
  throw new Error(
    "Live search requires GEMINI_API_KEY, GEMINI_FILE_SEARCH_STORE, and GEMINI_FILE_SEARCH_ONTOLOGY_HASH",
  );
}

const retriever = createOntologyRetriever({
  semantic: live,
  includeDevelopmentQuery: true,
});
const result = await retriever.searchWithDiagnostics({
  query,
  maxResults: limitValue,
  requiredApplications: application ? [application] : [],
  families: family ? [family] : [],
  categories: category ? [category] : [],
});

console.log(`QUANDA ontology search (${live ? "live hybrid" : "offline fallback"})\n`);
console.log(`Query: ${query}`);
console.log(`Candidates: ${result.candidates.length}`);
console.log(`Fallback used: ${result.diagnostics.fallbackUsed ? "yes" : "no"}`);
console.log(`Duration: ${result.diagnostics.durationMs} ms`);
if (result.diagnostics.providerErrorCode) {
  console.log(`Provider state: ${result.diagnostics.providerErrorCode}`);
}
console.log("");
result.candidates.forEach((candidate, index) => {
  console.log(
    `${index + 1}. ${candidate.label} — ${candidate.family} / ${candidate.category}`,
  );
  console.log(
    `   ${candidate.id} [${candidate.matchSource}${candidate.score === undefined ? "" : ` ${candidate.score.toFixed(3)}`}]`,
  );
});
