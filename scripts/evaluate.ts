import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  EvaluationBenchmarkSchema,
  EvaluationPredictionFixtureSchema,
} from "../src/evaluation/contracts";
import {
  evaluateBenchmark,
  formatEvaluationSummary,
} from "../src/evaluation/metrics";

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

const benchmarkPath = resolve(process.cwd(), process.argv[2] ?? "evals/briefs.v1.json");
const fixturePath = resolve(
  process.cwd(),
  process.argv[3] ?? "evals/fixtures/naive-software-first.json",
);

const benchmark = EvaluationBenchmarkSchema.parse(await readJson(benchmarkPath));
const fixture = EvaluationPredictionFixtureSchema.parse(await readJson(fixturePath));
const metrics = evaluateBenchmark(benchmark, fixture);

console.log(formatEvaluationSummary(benchmark, fixture, metrics));
