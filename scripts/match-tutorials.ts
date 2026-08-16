import { evaluateTutorialMatching } from "@/src/tutorial-matching/evaluation";

const requested = process.argv.includes("--case")
  ? process.argv[process.argv.indexOf("--case") + 1]
  : process.argv[2];
const { results } = await evaluateTutorialMatching();
const selected = requested
  ? results.filter(({ testCase }) => testCase.id === requested)
  : results;
if (selected.length === 0) {
  console.error(`Unknown case: ${requested}`);
  process.exitCode = 1;
} else {
  for (const { testCase, plan } of selected) {
    console.log(`\n${testCase.id}`);
    console.log("Skill gaps:");
    for (const gap of plan.skillGaps) {
      console.log(`- ${gap.label} [${gap.status}] ~${gap.estimatedLearningMinutes ?? 0}m`);
    }
    console.log("Tutorials:");
    for (const match of plan.tutorialMatches) {
      const need = plan.tutorialNeeds.find((item) => item.id === match.needId);
      const tutorial = match.candidates.find(
        (item) => item.tutorial.id === match.selectedTutorialId,
      );
      console.log(
        `- ${need?.label}: ${tutorial ? `${tutorial.tutorial.title} (${tutorial.score})` : "No suitable tutorial"}`,
      );
    }
  }
}
