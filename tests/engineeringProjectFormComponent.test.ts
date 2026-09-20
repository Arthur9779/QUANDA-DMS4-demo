import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EngineeringProjectForm } from "@/src/components/EngineeringProjectForm";
import { getTranslation } from "@/src/i18n/translations";
import { EngineeringProjectSchema } from "@/src/project-path/contracts";

const project = EngineeringProjectSchema.parse({
  path: "agentic_engineering",
  interfaceLanguage: "en",
  technicalBrief: "Build a small web application for a university project.",
  startingPoint: "new_project",
  definitionOfDone: "The main workflow works and is tested.",
  targetPlatform: "other",
  targetPlatforms: ["web_application", "game"],
  customTargetPlatforms: ["Console build"],
  currentExperience: "Beginner developer",
  deadline: "2026-09-30",
  hoursPerDay: 2,
  daysPerWeek: 5,
});

describe("EngineeringProjectForm target platform controls", () => {
  it("uses target platform customization instead of a desired-output control", () => {
    const markup = renderToStaticMarkup(
      React.createElement(EngineeringProjectForm, {
        isSubmitting: false,
        onChange: () => undefined,
        onSubmit: () => undefined,
        t: getTranslation("en"),
        value: project,
      }),
    );
    expect(markup).not.toContain('id="engineeringOutputType"');
    expect(markup).toContain("Choose all target platforms that apply");
    expect(markup).toContain('id="custom-target-platform-search"');
    expect(markup).toContain("Remove custom target: Console build");
    expect(markup).toContain("Visual reference");
  });
});
