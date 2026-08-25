import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LearningPathReview } from "@/src/components/LearningPathReview";
import { getTranslation } from "@/src/i18n/translations";
import { evaluateTutorialMatching } from "@/src/tutorial-matching/evaluation";

describe("LearningPathReview", () => {
  it("renders contextual skills, focused tutorial actions, and no raw IDs", async () => {
    const { results } = await evaluateTutorialMatching();
    const markup = renderToStaticMarkup(
      <LearningPathReview
        isBusy={false}
        onContinue={() => undefined}
        onReplace={() => undefined}
        onRestoreTutorial={() => undefined}
        onSkillStatus={() => undefined}
        plan={results[0].plan}
        t={getTranslation("en")}
      />,
    );
    expect(markup).toContain("Choose what will help you make this project");
    expect(markup).toContain("Toon shading");
    expect(markup).toContain("I already know this");
    expect(markup).toContain("Too advanced");
    expect(markup).toContain("Why this tutorial?");
    if (process.env.NODE_ENV !== "development") {
      expect(markup).not.toContain(
        "tutorial-content-classification.tutorial-technique.toon-shading",
      );
    }
  }, 10_000);
});
