import { describe, expect, it } from "vitest";
import {
  readCalendarTasks,
  readCompletion,
  readCreativeDnaAnalysis,
  readCreativeDnaReview,
  readDraft,
  readLanguage,
  readLearningPlan,
  readRoadmap,
  readRoadmapForProject,
  STORAGE_KEYS,
  writeCreativeDnaAnalysis,
  writeCreativeDnaReview,
  writeLearningPlan,
  writeRoadmap,
  readEngineeringDraft,
  readEngineeringRoadmap,
  readProjectPath,
  writeEngineeringDraft,
  writeEngineeringRoadmap,
  writeProjectPath,
} from "@/src/lib/storage";
import { generateEngineeringRoadmap } from "@/src/agentic-engineering";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import type { RoadmapRequest } from "@/src/types";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("local storage recovery", () => {
  it("ignores corrupted and structurally invalid saved state", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.language, "fr");
    storage.setItem(STORAGE_KEYS.draft, "{broken");
    storage.setItem(STORAGE_KEYS.roadmap, JSON.stringify({ id: "incomplete" }));
    storage.setItem(
      STORAGE_KEYS.creativeDnaAnalysis,
      JSON.stringify({ creativeDna: { creativeDnaVersion: 1 } }),
    );
    storage.setItem(
      STORAGE_KEYS.completion,
      JSON.stringify({
        valid: ["stage-1", "stage-1", "stage-2"],
        invalid: ["stage-1", 2],
      }),
    );
    storage.setItem(
      STORAGE_KEYS.calendar,
      JSON.stringify([
        {
          id: "task-1",
          title: "Finish draft",
          deadline: "2026-08-12",
          category: "sage",
          source: "manual",
          done: false,
          createdAt: "2026-08-05T00:00:00.000Z",
        },
        { id: "invalid-task" },
      ]),
    );

    expect(readLanguage(storage)).toBeNull();
    expect(readDraft(storage)).toBeNull();
    expect(readRoadmap(storage)).toBeNull();
    expect(readCreativeDnaAnalysis(storage)).toBeNull();
    expect(readCompletion(storage)).toEqual({
      valid: ["stage-1", "stage-2"],
    });
    expect(readCalendarTasks(storage)).toEqual([
      {
        id: "task-1",
        title: "Finish draft",
        deadline: "2026-08-12",
        category: "sage",
        source: "manual",
        done: false,
        createdAt: "2026-08-05T00:00:00.000Z",
      },
    ]);
  });

  it("round-trips versioned Creative DNA analysis without changing the active flow", () => {
    const storage = new MemoryStorage();
    const analysis = {
      creativeDna: {
        creativeDnaVersion: 1 as const,
        projectIntent: "Create a Bauhaus poster.",
        concepts: [],
        unknownConcepts: [],
        constraints: [],
      },
      retrieval: {
        candidateCount: 0,
        backend: "local" as const,
        fallbackUsed: true,
      },
      capabilityContext: {
        currentExperience: "Not provided",
        requiredApplications: [],
      },
      source: "fallback" as const,
      diagnostics: {
        classificationDurationMs: 1,
        retrievedCandidateIds: [],
        acceptedOntologyIds: [],
        rejectedOntologyIds: [],
        unknownConceptCount: 0,
        fallbackUsed: true,
        failureCode: "NOT_CONFIGURED",
      },
    };
    writeCreativeDnaAnalysis(storage, analysis);
    expect(readCreativeDnaAnalysis(storage)).toEqual(analysis);

    const review = {
      reviewVersion: 1 as const,
      inputFingerprint: "12ab34cd",
      confirmed: true,
      analysis: {
        ...analysis,
        creativeDna: {
          ...analysis.creativeDna,
          concepts: [
            {
              ontologyId: "creative-direction.aesthetic.y2k",
              label: "Y2K",
              source: "user_added" as const,
              status: "user_confirmed" as const,
            },
            {
              ontologyId: "creative-direction.aesthetic.cyberpunk",
              label: "Cyberpunk",
              source: "ai_inferred" as const,
              status: "user_rejected" as const,
            },
          ],
          unknownConcepts: [
            {
              raw: "neo-y2k eco rave",
              nearestOntologyIds: [],
              source: "user_added" as const,
              status: "user_confirmed" as const,
            },
          ],
        },
      },
    };
    writeCreativeDnaReview(storage, review);
    expect(readCreativeDnaReview(storage)).toEqual(review);
    expect(readCreativeDnaAnalysis(storage)).toEqual(review.analysis);
  });

  it("fails safely for an incompatible review version", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEYS.creativeDnaAnalysis,
      JSON.stringify({ reviewVersion: 99, inputFingerprint: "12ab34cd" }),
    );
    expect(readCreativeDnaReview(storage)).toBeNull();
  });

  it("round-trips skill overrides and tutorial decisions", () => {
    const storage = new MemoryStorage();
    const plan = {
      learningPlanVersion: 1 as const,
      tutorialRankingVersion: 1 as const,
      inputFingerprint: "12ab34cd",
      skillGaps: [],
      tutorialNeeds: [],
      tutorialMatches: [],
      source: "catalogue" as const,
      createdAt: "2026-08-16T00:00:00.000Z",
    };
    writeLearningPlan(storage, plan);
    expect(readLearningPlan(storage)).toEqual(plan);
    storage.setItem(STORAGE_KEYS.learningPlan, JSON.stringify({ ...plan, learningPlanVersion: 9 }));
    expect(readLearningPlan(storage)).toBeNull();
  });

  it("never restores a roadmap for a different project brief", () => {
    const storage = new MemoryStorage();
    const project: RoadmapRequest = {
      interfaceLanguage: "en",
      projectBrief: "Create an interactive p5.js poster that reacts to music.",
      deadline: "2026-09-30",
      currentExperience: "JavaScript beginner",
      hoursPerDay: 2,
      daysPerWeek: 4,
      tutorialLanguage: "en",
      requiredApplications: ["custom:p5.js"],
      outputType: "other",
      targetQuality: "portfolio",
    };
    const roadmap = createSampleRoadmap(project);
    writeRoadmap(storage, roadmap);

    expect(readRoadmapForProject(storage, project)?.id).toBe(roadmap.id);
    expect(
      readRoadmapForProject(storage, {
        ...project,
        projectBrief: "Build a TouchDesigner flower installation controlled by movement.",
        requiredApplications: ["custom:TouchDesigner"],
      }),
    ).toBeNull();
  });

  it("keeps engineering state in separate versioned storage keys", () => {
    const storage = new MemoryStorage();
    const engineering = {
      path: "agentic_engineering" as const,
      interfaceLanguage: "en" as const,
      technicalBrief: "Build a REST API for a class project with tests and deployment.",
      startingPoint: "new_project" as const,
      repositoryUrl: "",
      projectLocation: "",
      definitionOfDone: "The endpoint returns the documented response and tests pass.",
      targetPlatform: "api_backend" as const,
      technologies: "Python, FastAPI",
      currentExperience: "Beginner with Python.",
      deploymentTarget: "Local preview",
      deadline: "2026-09-30",
      hoursPerDay: 2,
      daysPerWeek: 5,
      constraints: "",
      existingErrors: "",
    };
    const roadmap = generateEngineeringRoadmap(engineering);
    writeProjectPath(storage, "agentic_engineering");
    writeEngineeringDraft(storage, engineering);
    writeEngineeringRoadmap(storage, roadmap);
    expect(readProjectPath(storage)).toBe("agentic_engineering");
    expect(readEngineeringDraft(storage)?.path).toBe("agentic_engineering");
    expect(readEngineeringRoadmap(storage)?.tasks).toHaveLength(9);
    expect(readRoadmap(storage)).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.creativeDnaAnalysis)).toBeNull();
  });
});
