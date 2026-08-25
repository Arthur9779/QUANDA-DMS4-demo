import { describe, expect, it } from "vitest";
import { generateEngineeringGuidedPlan, generateEngineeringRoadmap, interpretEngineeringProject } from "@/src/agentic-engineering";
import { PreparationMethodSchema } from "@/src/project-path/contracts";
import { getTranslation } from "@/src/i18n/translations";

const project = {
  path: "agentic_engineering" as const,
  interfaceLanguage: "en" as const,
  technicalBrief: "Build a Next.js portfolio website with a searchable project gallery and a reviewable Vercel preview.",
  startingPoint: "new_project" as const,
  definitionOfDone: "The gallery works on mobile and desktop, is keyboard accessible, and the preview is deployed.",
  targetPlatform: "web_application" as const,
  technologies: "Next.js, TypeScript",
  currentExperience: "I can review React code and run npm scripts.",
  deploymentTarget: "Vercel preview",
  deadline: "2030-01-01",
  hoursPerDay: 2,
  daysPerWeek: 5,
  constraints: "Keep the existing visual identity.",
};

describe("preparation methods", () => {
  it("keeps the method contract explicit", () => {
    expect(PreparationMethodSchema.parse("guided_tutorials")).toBe("guided_tutorials");
    expect(PreparationMethodSchema.parse("agentic_project_plan")).toBe("agentic_project_plan");
  });

  it("creates a guided supervision plan with verified resources", () => {
    const interpretation = interpretEngineeringProject(project);
    const plan = generateEngineeringGuidedPlan(project, interpretation);
    expect(plan.method).toBe("guided_tutorials");
    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.steps.some((step) => step.resources.length > 0)).toBe(true);
    expect(plan.steps.flatMap((step) => step.resources).every((resource) => resource.url.startsWith("https://"))).toBe(true);
  });

  it("keeps the agentic result separate from the guided result", () => {
    const interpretation = interpretEngineeringProject(project);
    const plan = generateEngineeringRoadmap(project, interpretation);
    expect(plan.tasks.every((task) => task.acceptanceCriteria.length > 0 && task.verificationChecks.length > 0)).toBe(true);
    expect(plan.tasks.every((task) => ["agent", "human", "hybrid"].includes(task.executor))).toBe(true);
  });

  it("ships the user-facing copy in both languages", () => {
    expect(getTranslation("en").review.title).toBe("Let’s shape your project plan");
    expect(getTranslation("vi").review.title).toBe("Cùng định hình kế hoạch dự án");
    expect(getTranslation("en").learning.title).toBe("Choose what will help you make this project");
    expect(getTranslation("vi").learning.title).toBe("Chọn điều giúp bạn hoàn thành dự án");
    expect(getTranslation("en").preparation.title).toBe("Choose how you want to prepare");
    expect(getTranslation("vi").preparation.title).toBe("Chọn cách bạn muốn chuẩn bị cho dự án");
  });
});
