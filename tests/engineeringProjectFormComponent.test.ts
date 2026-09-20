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
  targetPlatform: "web_application",
  currentExperience: "Beginner developer",
  deadline: "2026-09-30",
  hoursPerDay: 2,
  daysPerWeek: 5,
  outputType: "other",
  customOutputs: ["Interactive demo"],
});

describe("EngineeringProjectForm desired output", () => {
  it("provides the same customizable desired-output control", () => {
    const markup = renderToStaticMarkup(
      React.createElement(EngineeringProjectForm, {
        isSubmitting: false,
        onChange: () => undefined,
        onSubmit: () => undefined,
        t: getTranslation("en"),
        value: project,
      }),
    );
    expect(markup).toContain('id="engineeringOutputType"');
    expect(markup).toContain("Add another desired output");
    expect(markup).toContain("Remove custom output: Interactive demo");
  });
});
