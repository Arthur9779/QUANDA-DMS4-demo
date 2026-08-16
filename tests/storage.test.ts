import { describe, expect, it } from "vitest";
import {
  readCalendarTasks,
  readCompletion,
  readCreativeDnaAnalysis,
  readDraft,
  readLanguage,
  readRoadmap,
  STORAGE_KEYS,
  writeCreativeDnaAnalysis,
} from "@/src/lib/storage";

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
  });
});
