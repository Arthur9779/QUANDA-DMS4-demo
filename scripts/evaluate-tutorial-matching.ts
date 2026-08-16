import {
  evaluateTutorialMatching,
  formatTutorialMatchingMetrics,
} from "@/src/tutorial-matching/evaluation";

const { metrics } = await evaluateTutorialMatching();
console.log(formatTutorialMatchingMetrics(metrics));
