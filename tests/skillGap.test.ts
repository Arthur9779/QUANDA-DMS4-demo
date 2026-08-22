import { describe, expect, it } from "vitest";
import { deriveSkillGaps, buildTutorialNeeds } from "@/src/tutorial-matching/skillGap";
import type { CreativeDNA } from "@/src/contracts/knowledge";
import { applications } from "@/src/data/applications";
import type { RoadmapRequest } from "@/src/types";

function project(overrides: Partial<RoadmapRequest> = {}): RoadmapRequest {
  return {
    interfaceLanguage: "en",
    projectBrief: "I am new to Blender and need a toon-shaded product animation with a simple camera move.",
    deadline: "2026-09-30",
    currentExperience: "Blender: complete beginner",
    hoursPerDay: 2,
    daysPerWeek: 5,
    tutorialLanguage: "en",
    requiredApplications: ["blender"],
    outputType: "video",
    targetQuality: "portfolio",
    ...overrides,
  };
}

function creativeDna(intent: string): CreativeDNA {
  return {
    creativeDnaVersion: 1,
    projectIntent: intent,
    concepts: [],
    unknownConcepts: [],
    constraints: [],
  };
}

describe("contextual skill-gap analysis", () => {
  it("creates a minimum, deduplicated prerequisite chain for a Blender beginner", () => {
    const gaps = deriveSkillGaps(project(), creativeDna("Toon-shaded product animation"));
    expect(gaps.map((gap) => gap.label)).toEqual([
      "Basic viewport navigation",
      "Product modelling and scene assembly",
      "Shader Editor and material basics",
      "Lighting the product",
      "Camera basics",
      "Object and keyframe animation",
      "Render settings",
      "Final render and export",
      "Toon shading",
      "Camera animation",
    ]);
    expect(new Set(gaps.map((gap) => gap.skillId)).size).toBe(gaps.length);
    expect(buildTutorialNeeds(project(), creativeDna("Toon shading"), gaps))
      .toHaveLength(gaps.length);
  });

  it("does not turn required software or a duplicated rendering concept into learning nodes", () => {
    const dna = creativeDna("A 20-second product animation rendered in Blender");
    dna.concepts.push(
      {
        ontologyId: "project-requirements.required-software.blender",
        label: "Blender",
        family: "Project Requirements",
        category: "Required Software",
        source: "explicit_requirement",
        status: "user_confirmed",
        confidence: 1,
      },
      {
        ontologyId: "production-workflow.production-stage.rendering",
        label: "rendering",
        family: "Production Workflow",
        category: "Production Stage",
        source: "ai_inferred",
        status: "user_confirmed",
        confidence: 0.9,
      },
    );
    const gaps = deriveSkillGaps(project(), dna);
    expect(gaps.some((gap) => gap.label === "Blender")).toBe(false);
    expect(gaps.filter((gap) => gap.label === "Render settings")).toHaveLength(1);
    expect(gaps.filter((gap) => gap.label === "Final render and export")).toHaveLength(1);
    expect(new Set(gaps.map((gap) => gap.skillId)).size).toBe(gaps.length);
  });

  it("does not repeat explicitly known navigation or materials", () => {
    const gaps = deriveSkillGaps(
      project({
        currentExperience: "I know Blender modelling, navigation and materials at an intermediate level.",
      }),
      creativeDna("Toon-shaded product animation"),
    );
    expect(gaps.find((gap) => gap.label === "Basic viewport navigation")?.status)
      .toBe("known");
    expect(gaps.find((gap) => gap.label === "Shader Editor and material basics")?.status)
      .toBe("known");
    expect(gaps.find((gap) => gap.label === "Toon shading")?.status)
      .toBe("needs_learning");
  });

  it("does not expand a creative-coding brief into unrelated web development", () => {
    const codingProject = project({
      projectBrief: "Make a Bauhaus poster where shapes react to music using p5.js.",
      currentExperience: "I know Illustrator but have never coded.",
      requiredApplications: ["custom:p5.js"],
      outputType: "other",
    });
    const gaps = deriveSkillGaps(codingProject, creativeDna(codingProject.projectBrief));
    expect(gaps.map((gap) => gap.label)).toEqual([
      "Application workspace and project setup",
      "Project export and delivery",
      "Minimal JavaScript basics",
      "p5.js canvas and drawing basics",
      "Audio input and FFT",
      "Animation loop",
    ]);
    expect(gaps.some((gap) => /React|database|authentication/i.test(gap.label)))
      .toBe(false);
  });

  it("decomposes Figma work into a complete interface workflow", () => {
    const figmaProject = project({
      projectBrief: "Design and prototype a responsive mobile banking app in Figma.",
      currentExperience: "I am new to Figma.",
      requiredApplications: ["figma"],
      outputType: "uiux",
    });
    const gaps = deriveSkillGaps(
      figmaProject,
      creativeDna(figmaProject.projectBrief),
    );
    expect(gaps.map((gap) => gap.label)).toEqual([
      "Figma workspace basics",
      "Interface layout",
      "Responsive Auto Layout",
      "Components and design systems",
      "User-flow planning",
      "Interactive prototyping",
      "Asset and prototype export",
    ]);
  });

  it("understands a negated list of skills instead of marking them as known", () => {
    const figmaProject = project({
      projectBrief: "Design and prototype a responsive mobile banking app in Figma.",
      currentExperience:
        "I know Figma basics but not Auto Layout, components, user flows, or prototyping.",
      requiredApplications: ["figma"],
      outputType: "uiux",
    });
    const gaps = deriveSkillGaps(
      figmaProject,
      creativeDna(figmaProject.projectBrief),
    );
    for (const label of [
      "Responsive Auto Layout",
      "Components and design systems",
      "User-flow planning",
      "Interactive prototyping",
    ]) {
      expect(gaps.find((gap) => gap.label === label)?.status).toBe("needs_learning");
    }
  });

  it("decomposes editing work through colour, sound, and delivery", () => {
    const resolveProject = project({
      projectBrief: "Edit an interview, clean its sound, colour grade it, and deliver an MP4.",
      currentExperience: "DaVinci Resolve beginner",
      requiredApplications: ["davinci-resolve"],
      outputType: "video",
    });
    const gaps = deriveSkillGaps(
      resolveProject,
      creativeDna(resolveProject.projectBrief),
    );
    expect(gaps.map((gap) => gap.label)).toEqual([
      "DaVinci Resolve workspace basics",
      "Timeline navigation",
      "Video editing and trimming",
      "Colour correction and grading",
      "Fairlight audio mixing",
      "Delivery page and export",
    ]);
  });

  it("turns a confirmed quanda.skills concept into a tutorial need", () => {
    const installationProject = project({
      projectBrief: "Build an interactive projected installation in TouchDesigner.",
      currentExperience: "I know TouchDesigner basics.",
      requiredApplications: ["custom:TouchDesigner"],
      outputType: "other",
    });
    const dna = creativeDna(installationProject.projectBrief);
    dna.concepts.push({
      ontologyId: "experience-installation-physical-interaction.projection-technique.projection-mapping",
      label: "projection mapping",
      family: "Experience / Installation / Physical Interaction",
      category: "Projection Technique",
      source: "user_added",
      status: "user_confirmed",
      confidence: 1,
    });
    const gaps = deriveSkillGaps(installationProject, dna);
    const projection = gaps.find((gap) => gap.label === "projection mapping");
    expect(projection?.skillId).toBe(
      "experience-installation-physical-interaction.projection-technique.projection-mapping",
    );
    expect(projection?.priority).toBe("required");
    expect(projection?.softwareIds).toEqual(["custom:TouchDesigner"]);
    expect(buildTutorialNeeds(installationProject, dna, gaps))
      .toContainEqual(expect.objectContaining({
        label: "projection mapping",
        skillIds: [
          "experience-installation-physical-interaction.projection-technique.projection-mapping",
        ],
      }));
  });

  it("keeps Creative DNA descriptors out of the teachable skill list", () => {
    const dna = creativeDna("A simple product animation");
    dna.concepts.push({
      ontologyId: "ui-ux-interaction.interaction-complexity.simple",
      label: "simple",
      family: "UI / UX / Interaction",
      category: "Interaction Complexity",
      source: "ai_inferred",
      status: "user_confirmed",
      confidence: 0.92,
    });
    const gaps = deriveSkillGaps(project(), dna);
    expect(gaps.some((gap) => gap.label.toLowerCase() === "simple")).toBe(false);
    expect(gaps.some((gap) => gap.label === "Object and keyframe animation")).toBe(true);
  });

  it("provides a production-to-export decomposition for every built-in application", () => {
    for (const application of applications) {
      const applicationProject = project({
        projectBrief: `Create and deliver a finished project using ${application.name}.`,
        currentExperience: `I am new to ${application.name}.`,
        requiredApplications: [application.id],
        outputType: application.category === "audio" ? "audio" : "other",
      });
      const gaps = deriveSkillGaps(
        applicationProject,
        creativeDna(applicationProject.projectBrief),
      );
      expect(gaps.length, application.id).toBeGreaterThanOrEqual(4);
      expect(
        gaps.some((gap) => /export|delivery/i.test(gap.label)),
        `${application.id} export coverage`,
      ).toBe(true);
    }
  });

  it("does not leak creative-coding prerequisites into Procreate", () => {
    const procreateProject = project({
      projectBrief: "Draw and export a finished editorial illustration in Procreate.",
      currentExperience: "I am new to Procreate.",
      requiredApplications: ["procreate"],
      outputType: "graphic",
    });
    const gaps = deriveSkillGaps(
      procreateProject,
      creativeDna(procreateProject.projectBrief),
    );
    expect(gaps.map((gap) => gap.label)).toEqual([
      "Canvas and gesture basics",
      "Brush control",
      "Layer workflow",
      "Digital illustration workflow",
      "Artwork and animation export",
    ]);
    expect(gaps.some((gap) => /JavaScript|p5\.js/i.test(gap.label))).toBe(false);
  });
});
