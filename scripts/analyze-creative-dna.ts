import { resolve } from "node:path";
import { analyzeProject } from "../src/project-analysis/analyzeProject";

const projectRoot = resolve(import.meta.dirname, "..");
try {
  process.loadEnvFile(resolve(projectRoot, ".env.local"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const flagValue = (prefix: string) =>
  process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
const applications = process.argv
  .filter((argument) => argument.startsWith("--app="))
  .map((argument) => argument.slice("--app=".length))
  .filter(Boolean);
const live = process.argv.includes("--live");
const json = process.argv.includes("--json");
const locale = process.argv.includes("--vi") ? "vi" : "en";
const projectBrief = process.argv
  .slice(2)
  .filter((argument) => !argument.startsWith("--"))
  .join(" ")
  .trim();
if (!projectBrief) {
  throw new Error(
    'Provide a brief, for example: pnpm creative-dna "Bauhaus poster reacting to music"',
  );
}
if (live && !process.env.GEMINI_API_KEY) {
  throw new Error("Live Creative DNA analysis requires GEMINI_API_KEY");
}

const result = await analyzeProject(
  {
    interfaceLanguage: locale,
    projectBrief,
    currentExperience:
      flagValue("--experience=") ??
      (locale === "vi" ? "Chưa cung cấp" : "Not provided"),
    requiredApplications: applications,
    outputType: flagValue("--output=") ?? "other",
    targetQuality: flagValue("--quality=") ?? "unsure",
    tutorialLanguage: flagValue("--tutorial-language=") ?? "either",
  },
  live
    ? { semantic: true, logDiagnostics: false }
    : { semantic: false, classifier: null, logDiagnostics: false },
);

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`QUANDA Creative DNA (${result.source})\n`);
  console.log(`Project intent:\n${result.creativeDna.projectIntent}\n`);
  for (const source of [
    "explicit_requirement",
    "user_preference",
    "ai_inferred",
    "user_added",
  ] as const) {
    const concepts = result.creativeDna.concepts.filter(
      (concept) => concept.source === source,
    );
    if (concepts.length === 0) continue;
    console.log(`${source.replaceAll("_", " ").toUpperCase()}:`);
    concepts.forEach((concept) =>
      console.log(
        `- ${concept.label} — ${concept.family} / ${concept.category}${concept.confidence === undefined ? "" : ` (${concept.confidence.toFixed(2)})`}`,
      ),
    );
    console.log("");
  }
  if (result.creativeDna.unknownConcepts.length > 0) {
    console.log("UNKNOWN CONCEPTS:");
    result.creativeDna.unknownConcepts.forEach((concept) =>
      console.log(`- ${concept.raw}`),
    );
    console.log("");
  }
  console.log(
    `Retrieval: ${result.retrieval.candidateCount} candidates via ${result.retrieval.backend}`,
  );
  console.log(
    `Accepted IDs: ${result.diagnostics.acceptedOntologyIds.length}; rejected IDs: ${result.diagnostics.rejectedOntologyIds.length}`,
  );
  if (result.diagnostics.failureCode) {
    console.log(`Provider state: ${result.diagnostics.failureCode}`);
  }
}
