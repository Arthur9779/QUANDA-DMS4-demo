import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { EvaluationBenchmarkSchema } from "../src/evaluation/contracts";
import { ontologyArtifact } from "../src/ontology/runtime";
import { createOntologyRetriever } from "../src/ontology/retrieval";
import {
  evaluateOntologyRetrieval,
  formatOntologyRetrievalEvaluation,
} from "../src/ontology/retrieval/evaluation";

const benchmarkPath = resolve(
  process.cwd(),
  process.argv[2] ?? "evals/briefs.v1.json",
);
const benchmark = EvaluationBenchmarkSchema.parse(
  JSON.parse(await readFile(benchmarkPath, "utf8")),
);
const retriever = createOntologyRetriever({
  semantic: false,
  includeDevelopmentQuery: false,
});
const metrics = await evaluateOntologyRetrieval(
  benchmark,
  retriever,
  ontologyArtifact.nodes,
);
console.log(formatOntologyRetrievalEvaluation(metrics));
