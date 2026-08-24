import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectBriefForm } from "@/src/components/ProjectBriefForm";
import { getTranslation } from "@/src/i18n/translations";
import type { RoadmapRequest } from "@/src/types";

const request: RoadmapRequest = {
  interfaceLanguage: "en",
  projectBrief: "Create a finished project for a university assignment.",
  deadline: "2026-09-30",
  currentExperience: "I am a beginner.",
  hoursPerDay: 2,
  daysPerWeek: 5,
  tutorialLanguage: "either",
  requiredApplications: [],
  outputType: "other",
  targetQuality: "unsure",
};

function renderForm(value: RoadmapRequest) {
  return renderToStaticMarkup(
    React.createElement(ProjectBriefForm, {
      isSubmitting: false,
      onChange: () => undefined,
      onSubmit: () => undefined,
      t: getTranslation("en"),
      value,
    }),
  );
}

describe("ProjectBriefForm application picker", () => {
  it("renders an application search instead of the old preset grid", () => {
    const markup = renderForm(request);
    expect(markup).toContain("Search applications");
    expect(markup).toContain("Suggestions are restricted to applications");
    expect(markup).not.toContain("Adobe Photoshop</span>");
    expect(markup).not.toContain(">Other</span>");
  });

  it("shows selected ontology-backed and custom applications as removable chips", () => {
    const markup = renderForm({
      ...request,
      requiredApplications: ["custom:TouchDesigner", "custom:Canva"],
    });
    expect(markup).toContain("Remove application: TouchDesigner");
    expect(markup).toContain("Remove application: Canva");
  });
});
