import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { scoreDesignApplicationPaths } from "@/src/application-paths";
import { ApplicationPathComparison } from "@/src/components/ApplicationPathComparison";
import type { CreativeDNA } from "@/src/contracts/knowledge";
import { getTranslation } from "@/src/i18n/translations";
import { deriveSkillGaps } from "@/src/tutorial-matching/skillGap";

const creativeDna: CreativeDNA = {
  creativeDnaVersion: 1,
  projectIntent: "Create a glossy product animation with a camera move and final edit.",
  concepts: [
    {
      label: "rendering",
      family: "Production Workflow",
      category: "Production Stage",
      source: "ai_inferred",
      status: "user_confirmed",
      confidence: 0.9,
    },
  ],
  unknownConcepts: [],
  constraints: [],
};

const project = {
  interfaceLanguage: "en" as const,
  projectBrief: "Create a 20-second glossy product animation with lighting, a camera move, and a final MP4 edit.",
  currentExperience: "I know Photoshop but I am new to Blender.",
  requiredApplications: [] as string[],
  outputType: "video" as const,
  targetQuality: "portfolio" as const,
  tutorialLanguage: "en" as const,
  deadline: "2099-09-30",
  hoursPerDay: 2,
  daysPerWeek: 5,
};

describe("design application path scoring", () => {
  it("filters hard requirements before ranking", () => {
    const decision = scoreDesignApplicationPaths(
      { ...project, requiredApplications: ["blender"] },
      creativeDna,
    );

    expect(decision.hardRequiredApplicationIds).toEqual(["blender"]);
    expect(decision.recommended.applicationIds).toContain("blender");
    expect(decision.alternatives.every((path) => path.applicationIds.includes("blender"))).toBe(true);
    expect(decision.recommended.scoreBreakdown.requirements).toBe(100);
  });

  it("produces a deterministic winner and winner-versus-alternative proof", () => {
    const first = scoreDesignApplicationPaths(project, creativeDna);
    const second = scoreDesignApplicationPaths(project, creativeDna);

    expect(first.recommended.id).toBe(second.recommended.id);
    expect(first.recommended.score).toBe(second.recommended.score);
    expect(first.alternatives.length).toBeGreaterThan(0);
    expect(first.comparisons).toHaveLength(first.alternatives.length);
    expect(first.comparisons[0].summary).toContain("ranks above");
    expect(first.comparisons[0].alternativePathId).toBe(first.alternatives[0].id);
    expect(first.recommended.applicationIds.some((id) =>
      ["after-effects", "blender", "procreate"].includes(id),
    )).toBe(true);
    expect(first.recommended.applicationIds).not.toEqual([
      "photoshop",
      "davinci-resolve",
    ]);
  });

  it("keeps custom required software in every viable route", () => {
    const decision = scoreDesignApplicationPaths(
      {
        ...project,
        projectBrief: "Build an interactive TouchDesigner installation controlled by live movement.",
        currentExperience: "I know TouchDesigner basics.",
        requiredApplications: ["custom:touchdesigner"],
      },
      {
        ...creativeDna,
        projectIntent: "An interactive TouchDesigner installation",
      },
    );

    expect(decision.recommended.applicationIds).toContain("custom:touchdesigner");
    expect(decision.alternatives.every((path) => path.applicationIds.includes("custom:touchdesigner"))).toBe(true);
  });

  it("renders the scored route before learning choices without exposing internal path IDs", () => {
    const decision = scoreDesignApplicationPaths(project, creativeDna);
    const markup = renderToStaticMarkup(
      React.createElement(ApplicationPathComparison, {
        decision,
        t: getTranslation("en"),
      }),
    );

    expect(markup).toContain("The strongest way to make this project");
    expect(markup).toContain("Why this route wins");
    expect(markup).toContain("Other viable routes considered");
    expect(markup).toContain("Why the winner fits better");
    expect(markup).toContain("/100");
    expect(markup).not.toContain("design-path:");
  });

  it("does not leak a losing application's specialized skills into the winning route", () => {
    const decision = scoreDesignApplicationPaths(project, creativeDna);
    const selectedProject = {
      ...project,
      deadline: "2099-09-30",
      requiredApplications: decision.recommended.applicationIds,
    };
    const gaps = deriveSkillGaps(selectedProject, creativeDna);

    expect(gaps.every((gap) =>
      gap.softwareIds.length === 0 ||
      gap.softwareIds.some((id) => selectedProject.requiredApplications.includes(id)),
    )).toBe(true);
    if (!selectedProject.requiredApplications.includes("blender")) {
      expect(gaps.some((gap) => gap.softwareIds.includes("blender"))).toBe(false);
    }
  });
});
