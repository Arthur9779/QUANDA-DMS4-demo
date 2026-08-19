export type Locale = "en" | "vi";

export type TutorialLanguage = Locale | "either";

export type CalendarTaskCategory =
  | "sage"
  | "peach"
  | "lavender"
  | "sky"
  | "butter";

export interface CalendarTask {
  id: string;
  title: string;
  deadline: string;
  category: CalendarTaskCategory;
  source: "manual" | "roadmap";
  done: boolean;
  createdAt: string;
  roadmapId?: string;
  stageId?: string;
}

export type TargetQuality = "basic" | "portfolio" | "unsure";

export type OutputType =
  | "video"
  | "3d"
  | "graphic"
  | "uiux"
  | "audio"
  | "photo"
  | "other";

export interface RouteEvidence {
  primaryApplicationId: string;
  primaryReasonCode: string;
  primarySkillLevel: "beginner" | "intermediate" | "advanced" | "not-stated";
  selectedTechnique: string;
  routes: Array<{ applicationId: string; status: "selected" | "rejected"; reasonCode: string }>;
  skippedLearning: string[];
  estimatedLearningAvoidedMinutes: number | null;
  basis: {
    outputType: string;
    requiredApplicationIds: string[];
    knownApplications: Array<{ applicationId: string; level: "beginner" | "intermediate" | "advanced" | "not-stated" }>;
    daysRemaining: number;
    availableMinutes: number;
  };
}

export interface RoadmapRequest {
  interfaceLanguage: Locale;
  projectBrief: string;
  deadline: string;
  currentExperience: string;
  hoursPerDay: number;
  daysPerWeek: number;
  tutorialLanguage: TutorialLanguage;
  requiredApplications: string[];
  outputType: OutputType;
  targetQuality: TargetQuality;
}

export interface RoadmapStage {
  id: string;
  order: number;
  title: string;
  goal: string;
  why: string;
  applicationId: string | null;
  skillToLearn: string;
  tasks: string[];
  learningMinutes: number;
  productionMinutes: number;
  dependsOnStageIds: string[];
  tutorialIds: string[];
  /** Production work stays distinct from just-in-time learning. */
  productionTasks?: string[];
  learningTasks?: string[];
  definitionOfDone?: string[];
  classification?: "required" | "useful" | "optional";
  creativeDnaIds?: string[];
  skillIds?: string[];
}

export interface RoadmapScheduleItem {
  label: string;
  stageIds: string[];
  plannedMinutes: number;
  priority: "high" | "medium" | "low";
}

export interface RoadmapResponse {
  id: string;
  language: Locale;
  title: string;
  summary: string;
  feasibility: {
    status: "comfortable" | "tight" | "unrealistic";
    message: string;
    daysRemaining: number;
    availableMinutes: number;
    estimatedRequiredMinutes: number;
  };
  totalEstimatedMinutes: number;
  assumptions: string[];
  warnings: string[];
  stages: RoadmapStage[];
  routeEvidence?: RouteEvidence;
  schedule: RoadmapScheduleItem[];
  source?: "ai" | "demo" | "fallback";
  notice?: string;
  roadmapGeneratorVersion?: number;
  inputFingerprint?: string;
}
