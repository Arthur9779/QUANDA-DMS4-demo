import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";
import { isCalendarTask } from "@/src/lib/calendar";
import { ProjectAnalysisResponseSchema } from "@/src/project-analysis/contracts";
import {
  CREATIVE_DNA_REVIEW_VERSION,
  CreativeDnaReviewRecordSchema,
  type CreativeDnaReviewRecord,
} from "@/src/creative-dna-review/contracts";
import { createProjectInputFingerprint } from "@/src/creative-dna-review/fingerprint";
import {
  LearningPlanSchema,
  type LearningPlan,
} from "@/src/tutorial-matching/contracts";
import type {
  CalendarTask,
  Locale,
  RoadmapRequest,
  RoadmapResponse,
} from "@/src/types";
import type { ProjectAnalysisResponse } from "@/src/project-analysis/contracts";

export const STORAGE_KEYS = {
  language: "quanda:v1:language",
  draft: "quanda:v1:draft",
  roadmap: "quanda:v1:last-roadmap",
  completion: "quanda:v1:completion",
  calendar: "quanda:v1:calendar-tasks",
  creativeDnaAnalysis: "quanda:v1:creative-dna-analysis",
  learningPlan: "quanda:v1:learning-plan",
} as const;

function safeParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function readLanguage(storage: Storage): Locale | null {
  const value = storage.getItem(STORAGE_KEYS.language);
  return value === "en" || value === "vi" ? value : null;
}

export function writeLanguage(storage: Storage, locale: Locale): void {
  try {
    storage.setItem(STORAGE_KEYS.language, locale);
  } catch {
    // Private browsing and storage quotas must not break the app.
  }
}

export function readDraft(storage: Storage): RoadmapRequest | null {
  const parsed = RoadmapRequestSchema.safeParse(
    safeParse(storage.getItem(STORAGE_KEYS.draft)),
  );
  return parsed.success ? parsed.data : null;
}

export function writeDraft(storage: Storage, draft: RoadmapRequest): void {
  try {
    storage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
  } catch {
    // Draft persistence is a progressive enhancement.
  }
}

export function readRoadmap(storage: Storage): RoadmapResponse | null {
  const parsed = RoadmapResponseSchema.safeParse(
    safeParse(storage.getItem(STORAGE_KEYS.roadmap)),
  );
  return parsed.success ? parsed.data : null;
}

export function readRoadmapForProject(
  storage: Storage,
  currentInput: RoadmapRequest,
): RoadmapResponse | null {
  const roadmap = readRoadmap(storage);
  return roadmap?.projectInputFingerprint ===
    createProjectInputFingerprint(currentInput)
    ? roadmap
    : null;
}

export function writeRoadmap(
  storage: Storage,
  roadmap: RoadmapResponse,
): void {
  try {
    storage.setItem(STORAGE_KEYS.roadmap, JSON.stringify(roadmap));
  } catch {
    // The generated roadmap remains usable in memory.
  }
}

export function clearRoadmap(storage: Storage): void {
  try {
    storage.removeItem(STORAGE_KEYS.roadmap);
  } catch {
    // The in-memory roadmap reset still succeeds.
  }
}

export function readCreativeDnaAnalysis(
  storage: Storage,
): ProjectAnalysisResponse | null {
  const value = safeParse(storage.getItem(STORAGE_KEYS.creativeDnaAnalysis));
  const review = CreativeDnaReviewRecordSchema.safeParse(value);
  if (review.success) return review.data.analysis;
  const analysis = ProjectAnalysisResponseSchema.safeParse(value);
  return analysis.success ? analysis.data : null;
}

export function writeCreativeDnaAnalysis(
  storage: Storage,
  analysis: ProjectAnalysisResponse,
): void {
  try {
    storage.setItem(
      STORAGE_KEYS.creativeDnaAnalysis,
      JSON.stringify(analysis),
    );
  } catch {
    // Creative DNA remains usable in memory when storage is unavailable.
  }
}

export function readCreativeDnaReview(
  storage: Storage,
  currentInput?: RoadmapRequest,
): CreativeDnaReviewRecord | null {
  const value = safeParse(storage.getItem(STORAGE_KEYS.creativeDnaAnalysis));
  const review = CreativeDnaReviewRecordSchema.safeParse(value);
  if (review.success) return review.data;

  const legacyAnalysis = ProjectAnalysisResponseSchema.safeParse(value);
  if (!legacyAnalysis.success || !currentInput) return null;
  return {
    reviewVersion: CREATIVE_DNA_REVIEW_VERSION,
    inputFingerprint: createProjectInputFingerprint(currentInput),
    analysis: legacyAnalysis.data,
    confirmed: false,
  };
}

export function writeCreativeDnaReview(
  storage: Storage,
  review: CreativeDnaReviewRecord,
): void {
  const parsed = CreativeDnaReviewRecordSchema.safeParse(review);
  if (!parsed.success) return;
  try {
    storage.setItem(
      STORAGE_KEYS.creativeDnaAnalysis,
      JSON.stringify(parsed.data),
    );
  } catch {
    // Review edits remain usable in memory when storage is unavailable.
  }
}

export function clearCreativeDnaReview(storage: Storage): void {
  try {
    storage.removeItem(STORAGE_KEYS.creativeDnaAnalysis);
  } catch {
    // In-memory review reset still succeeds.
  }
}

export function readLearningPlan(storage: Storage): LearningPlan | null {
  const parsed = LearningPlanSchema.safeParse(
    safeParse(storage.getItem(STORAGE_KEYS.learningPlan)),
  );
  return parsed.success ? parsed.data : null;
}

export function writeLearningPlan(storage: Storage, plan: LearningPlan): void {
  const parsed = LearningPlanSchema.safeParse(plan);
  if (!parsed.success) return;
  try {
    storage.setItem(STORAGE_KEYS.learningPlan, JSON.stringify(parsed.data));
  } catch {
    // Tutorial decisions remain available in memory.
  }
}

export function clearLearningPlan(storage: Storage): void {
  try {
    storage.removeItem(STORAGE_KEYS.learningPlan);
  } catch {
    // In-memory reset still succeeds.
  }
}

export function readCompletion(
  storage: Storage,
): Record<string, string[]> {
  const value = safeParse(storage.getItem(STORAGE_KEYS.completion));
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) &&
          entry[1].every((item) => typeof item === "string"),
      )
      .map(([id, stageIds]) => [id, [...new Set(stageIds)]]),
  );
}

export function writeCompletion(
  storage: Storage,
  completion: Record<string, string[]>,
): void {
  try {
    storage.setItem(STORAGE_KEYS.completion, JSON.stringify(completion));
  } catch {
    // Completion persistence is a progressive enhancement.
  }
}

export function readCalendarTasks(storage: Storage): CalendarTask[] {
  const value = safeParse(storage.getItem(STORAGE_KEYS.calendar));
  if (!Array.isArray(value)) return [];
  return value.filter(isCalendarTask);
}

export function writeCalendarTasks(
  storage: Storage,
  tasks: CalendarTask[],
): void {
  try {
    storage.setItem(STORAGE_KEYS.calendar, JSON.stringify(tasks));
  } catch {
    // Calendar tasks remain usable in memory when storage is unavailable.
  }
}

export function clearProjectStorage(storage: Storage): void {
  try {
    storage.removeItem(STORAGE_KEYS.draft);
    storage.removeItem(STORAGE_KEYS.roadmap);
    storage.removeItem(STORAGE_KEYS.completion);
    storage.removeItem(STORAGE_KEYS.creativeDnaAnalysis);
    storage.removeItem(STORAGE_KEYS.learningPlan);
  } catch {
    // The in-memory reset still succeeds.
  }
}
