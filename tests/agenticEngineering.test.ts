import { describe, expect, it } from "vitest";
import { generateEngineeringRoadmap, interpretEngineeringProject } from "@/src/agentic-engineering";
import { EngineeringProjectSchema } from "@/src/project-path";

const project = EngineeringProjectSchema.parse({
  path: "agentic_engineering",
  interfaceLanguage: "en",
  technicalBrief: "Build a Next.js portfolio website with a searchable project gallery and a Vercel preview.",
  startingPoint: "new_project",
  repositoryUrl: "",
  projectLocation: "",
  definitionOfDone: "Every project is searchable, the gallery works on mobile, and the preview builds successfully.",
  targetPlatform: "web_application",
  technologies: "Next.js, TypeScript",
  currentExperience: "Comfortable with HTML and new to Next.js deployment.",
  deploymentTarget: "Vercel preview",
  deadline: "2026-09-30",
  hoursPerDay: 2,
  daysPerWeek: 5,
  constraints: "Keep the existing visual identity.",
  existingErrors: "",
});

describe("agentic engineering workflow", () => {
  it("produces a separate technical interpretation without Creative DNA fields", () => {
    const interpretation = interpretEngineeringProject(project);
    expect(interpretation.path).toBe("agentic_engineering");
    expect(interpretation.productType).toContain("web");
    expect(interpretation.coreFeatures.join(" ")).toContain("searchable");
    expect(interpretation).not.toHaveProperty("creativeDna");
  });

  it("produces concrete agent tasks with acceptance and verification", () => {
    const roadmap = generateEngineeringRoadmap(project);
    expect(roadmap.path).toBe("agentic_engineering");
    expect(roadmap.tasks).toHaveLength(9);
    for (const task of roadmap.tasks) {
      expect(task.outcome.length).toBeGreaterThan(0);
      expect(task.agentPrompt.length).toBeGreaterThan(0);
      expect(task.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(task.verificationChecks.length).toBeGreaterThan(0);
      expect(task.executor).toMatch(/agent|human|hybrid/);
    }
    expect(roadmap.tasks.map((task) => task.title).join(" ")).not.toMatch(/Learn Git|JavaScript|Coding$/i);
  });
});
