import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { EvaluationBenchmarkSchema } from "../src/evaluation/contracts";
import {
  evaluateCreativeDna,
  formatCreativeDnaEvaluation,
} from "../src/project-analysis/evaluation";

const benchmarkPath = resolve(
  process.cwd(),
  process.argv[2] ?? "evals/briefs.v1.json",
);
const benchmark = EvaluationBenchmarkSchema.parse(
  JSON.parse(await readFile(benchmarkPath, "utf8")),
);
const metrics = await evaluateCreativeDna(benchmark);
console.log(formatCreativeDnaEvaluation(metrics));
