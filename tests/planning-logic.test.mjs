import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRouteEvidence,
  buildStageDecisions,
  choosePrimaryApplication,
  parseKnownApplications,
} from "../planning-logic.mjs";

test("parses stated application experience and level", () => {
  const skills = parseKnownApplications("Photoshop: intermediate; Blender: complete beginner");
  assert.deepEqual(skills, [
    { application: "Blender", level: "beginner" },
    { application: "Adobe Photoshop", level: "intermediate" },
  ]);
});

test("keeps a user-selected required application", () => {
  const route = choosePrimaryApplication({
    applications: ["Blender"],
    experience: "Photoshop: intermediate; Blender: complete beginner",
    outputType: "video",
  });
  assert.equal(route.application, "Blender");
  assert.equal(route.source, "required-tool");
  assert.equal(route.skillLevel, "beginner");
});

test("prefers a known viable tool when no required application is selected", () => {
  const route = choosePrimaryApplication({
    experience: "Adobe Photoshop: intermediate",
    outputType: "graphic",
  });
  assert.equal(route.application, "Adobe Photoshop");
  assert.equal(route.source, "existing-tool");
  assert.equal(route.skillLevel, "intermediate");
});

test("only estimates avoided learning when relevant experience is stated", () => {
  const knownRoute = buildRouteEvidence({
    experience: "Adobe Photoshop: intermediate",
    outputType: "graphic",
    totalDays: 7,
    availableHours: 12,
  });
  assert.equal(knownRoute.timeAvoidedHours, 1.5);
  assert.ok(knownRoute.skippedSteps.some((step) => step.includes("beginner course")));
  assert.ok(knownRoute.routes.some((route) => route.status === "rejected"));

  const unknownRoute = buildRouteEvidence({
    outputType: "video",
    totalDays: 7,
    availableHours: 12,
  });
  assert.equal(unknownRoute.primaryApplication, "Blender");
  assert.equal(unknownRoute.timeAvoidedHours, null);
});

test("every production stage resolves its technique to the selected application", () => {
  const stages = buildStageDecisions({ outputType: "uiux", application: "Figma", skillLevel: "beginner" });
  assert.equal(stages.length, 5);
  assert.ok(stages.every((stage) => stage.application === "Figma" && stage.technique && stage.tutorialQuery));
});
