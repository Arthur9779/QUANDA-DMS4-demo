import { describe, expect, it } from "vitest";
import { classifyProjectPath, inferEngineeringHints } from "@/src/project-path";

describe("project path classification", () => {
  const designFixtures = [
    "Create a Blender product animation for a university assignment.",
    "Design a poster campaign for an exhibition.",
    "Edit a short documentary with interviews and archival footage.",
    "Create an illustrated brand identity for a local cafe.",
    "Create an interactive projected artwork for a gallery installation.",
  ];
  const engineeringFixtures = [
    "Build a Next.js portfolio website and deploy it with a searchable project gallery.",
    "Implement a React Native mobile application for booking appointments.",
    "Create a Python data-processing automation that cleans weekly CSV exports.",
    "Build a REST API with authentication and documented endpoints.",
    "Develop a browser extension that saves and searches the current page.",
    "Debug an existing repository where the production build fails on deployment.",
    "Add an AI-powered search feature to the existing web application.",
  ];

  it.each(designFixtures)("routes design brief: %s", (brief) => {
    expect(classifyProjectPath(brief).path).toBe("design");
  });

  it.each(engineeringFixtures)("routes engineering brief: %s", (brief) => {
    expect(classifyProjectPath(brief).path).toBe("agentic_engineering");
  });

  it("asks exactly one clarification for an ambiguous brief", () => {
    expect(classifyProjectPath("I need help with a project for next week.").path).toBe("clarification");
  });

  it("infers only explicit engineering hints without inventing the definition of done", () => {
    expect(inferEngineeringHints("Implement a React Native mobile application in an existing repository with a bug at https://github.com/example/app")).toEqual({
      targetPlatform: "mobile_application",
      startingPoint: "existing_bug",
      repositoryUrl: "https://github.com/example/app",
      technologies: "React Native",
    });
  });
});
