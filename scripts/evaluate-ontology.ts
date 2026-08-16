import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { EvaluationBenchmarkSchema } from "../src/evaluation/contracts";
import { mapBenchmarkLabelsToOntology } from "../src/ontology/benchmarkMapping";
import { ontologyArtifact } from "../src/ontology/runtime";

const benchmarkPath = resolve(
  process.cwd(),
  process.argv[2] ?? "evals/briefs.v1.json",
);

const benchmark = EvaluationBenchmarkSchema.parse(
  JSON.parse(await readFile(benchmarkPath, "utf8")),
);
const report = mapBenchmarkLabelsToOntology(benchmark, ontologyArtifact.nodes);

console.log("Benchmark ontology mapping\n");
console.log(`Exact matches: ${report.exact}`);
console.log(`Ambiguous: ${report.ambiguous}`);
console.log(`Unknown: ${report.unknown}`);

const ambiguous = report.entries.filter((entry) => entry.status === "ambiguous");
if (ambiguous.length > 0) {
  console.log("\nAmbiguous labels (not guessed):");
  for (const entry of ambiguous) {
    console.log(`- ${entry.label}: ${entry.candidateIds.join(", ")}`);
  }
}

const unknown = report.entries.filter((entry) => entry.status === "unknown");
if (unknown.length > 0) {
  console.log("\nUnknown labels (allowed by the open-world benchmark):");
  for (const entry of unknown) console.log(`- ${entry.label}`);
}
