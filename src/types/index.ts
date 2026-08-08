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
  schedule: RoadmapScheduleItem[];
  source?: "ai" | "demo" | "fallback";
  notice?: string;
}
