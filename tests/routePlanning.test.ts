import { describe, expect, it } from "vitest";
import { generateEngineeringRoadmap, interpretEngineeringProject } from "@/src/agentic-engineering";
import { createDesignRouteEvaluation, createEngineeringRouteEvaluation } from "@/src/route-planning/generate";
import { EngineeringProjectSchema } from "@/src/project-path";
import type { RoadmapRequest } from "@/src/types";

const engineering = EngineeringProjectSchema.parse({
  path: "agentic_engineering",
  interfaceLanguage: "en",
  technicalBrief: "Build a 2D top-down survival game with movement, enemy waves, healing items, score, and a playable Windows build.",
  startingPoint: "new_project",
  repositoryUrl: "",
  projectLocation: "",
  definitionOfDone: "Start, gameplay, game over, restart, movement, attacks, enemy AI, three enemy types, HP, score, waves, and a stable Windows build.",
  targetPlatform: "game",
  technologies: "Godot 4, GDScript",
  currentExperience: "Basic programming knowledge; new to Godot and GDScript.",
  deploymentTarget: "Windows playable build",
  deadline: "2026-09-01",
  hoursPerDay: 2,
  daysPerWeek: 6,
  constraints: "Solo project; gameplay before graphics.",
  existingErrors: "",
});

describe("evidence-backed route planning", () => {
  it("scores six criteria and exposes alternatives without inventing user familiarity", () => {
    const interpretation = interpretEngineeringProject(engineering);
    const evaluation = createEngineeringRouteEvaluation(engineering, interpretation, 600);

    expect(evaluation.routes.length).toBeGreaterThanOrEqual(2);
    expect(evaluation.recommendedRouteId).toBe("declared-stack");
    expect(evaluation.routes[0].score).toBeGreaterThanOrEqual(0);
    expect(evaluation.routes[0].score).toBeLessThanOrEqual(100);
    expect(evaluation.routes[0].scoreBreakdown).toHaveLength(6);
    expect(evaluation.routes[0].scoreBreakdown.every((item) => item.evidence.length > 0)).toBe(true);
    expect(evaluation.routes.some((route) => route.status === "rejected")).toBe(true);
    expect(evaluation.routes.find((route) => route.id === "switch-stack")?.rejectionReason).toContain("declares");
  });

  it("is deterministic and is included in generated engineering roadmaps", () => {
    const interpretation = interpretEngineeringProject(engineering);
    const first = generateEngineeringRoadmap(engineering, interpretation);
    const second = generateEngineeringRoadmap(engineering, interpretation);
    expect(first.routeEvaluation).toEqual(second.routeEvaluation);
    expect(first.routeEvaluation?.routes.map((route) => route.title)).toContain("Keep the declared stack");
  });

  it("keeps design route evidence separate from engineering contracts", () => {
    const design: RoadmapRequest = {
      interfaceLanguage: "vi",
      projectBrief: "Tạo poster minh họa cho bài tập đại học, giao file PNG đúng kích thước.",
      deadline: "2026-09-01",
      currentExperience: "Biết Illustrator cơ bản.",
      hoursPerDay: 2,
      daysPerWeek: 6,
      tutorialLanguage: "either",
      requiredApplications: ["illustrator"],
      outputType: "graphic",
      targetQuality: "portfolio",
    };
    const evaluation = createDesignRouteEvaluation(design, 180);
    expect(evaluation.recommendedRouteId).toBe("confirmed-tools");
    expect(evaluation.routes[0].scoreBreakdown.map((item) => item.criterion)).not.toContain("risk-free");
    expect(evaluation.routes[0].scoreBreakdown.some((item) => item.evidence.some((evidence) => evidence.source === "existing_tools"))).toBe(true);
  });
});
