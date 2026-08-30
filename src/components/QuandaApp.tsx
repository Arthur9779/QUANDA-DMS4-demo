"use client";

import { ArrowDown, ArrowRight, BookOpenCheck, ListChecks, PencilLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./Header";
import { getTranslation } from "@/src/i18n/translations";
import type {
  CalendarTask,
  Locale,
  RoadmapRequest,
  RoadmapResponse,
} from "@/src/types";
import { ProjectBriefForm } from "./ProjectBriefForm";
import { InitialBriefForm } from "./InitialBriefForm";
import { PathClarification } from "./PathClarification";
import { EngineeringProjectForm } from "./EngineeringProjectForm";
import { EngineeringRoadmapResults } from "./EngineeringRoadmapResults";
import { EngineeringGuidedPlan } from "./EngineeringGuidedPlan";
import { PreparationMethodChoice } from "./PreparationMethodChoice";
import { RoadmapResults } from "./RoadmapResults";
import { ProjectCalendar } from "./ProjectCalendar";
import { LoadingAnalysis } from "./LoadingAnalysis";
import { LoadingLearningPath } from "./LoadingLearningPath";
import { LearningPathReview } from "./LearningPathReview";
import { createSampleRoadmap } from "@/src/data/sampleRoadmaps";
import { LoadingRoadmap } from "./LoadingRoadmap";
import {
  clearProjectStorage,
  clearCreativeDnaReview,
  clearLearningPlan,
  clearRoadmap,
  readCalendarTasks,
  readEngineeringCalendarTasks,
  readCompletion,
  readDraft,
  readCreativeDnaReview,
  readLearningPlan,
  readLanguage,
  readRoadmapForProject,
  writeCompletion,
  writeCalendarTasks,
  writeEngineeringCalendarTasks,
  writeDraft,
  writeCreativeDnaReview,
  writeLearningPlan,
  writeLanguage,
  writeRoadmap,
  clearEngineeringState,
  clearEngineeringCalendarTasks,
  clearProjectPath,
  readEngineeringCompletion,
  readEngineeringDraft,
  readEngineeringInterpretation,
  readEngineeringRoadmap,
  readProjectPath,
  writeEngineeringCompletion,
  writeEngineeringDraft,
  writeEngineeringInterpretation,
  writeEngineeringRoadmap,
  writeProjectPath,
  readPreparationMethod,
  writePreparationMethod,
  clearPreparationState,
  readEngineeringGuidedPlan,
  writeEngineeringGuidedPlan,
} from "@/src/lib/storage";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";
import { trackEvent } from "@/src/lib/analytics";
import {
  archiveCurrentQuandaProject,
  initializeQuandaApi,
  persistQuandaProject,
  restoreLatestQuandaProject,
} from "@/src/lib/quandaApi";
import {
  createProjectSnapshot,
  parseProjectSnapshot,
  projectStatus,
  projectTitle,
} from "@/src/lib/projectSnapshot";
import {
  removeRoadmapCalendarTasks,
  syncRoadmapCalendarTasks,
} from "@/src/lib/calendar";
import {
  removeEngineeringCalendarTasks,
  syncEngineeringGuidedPlanCalendarTasks,
  syncEngineeringRoadmapCalendarTasks,
} from "@/src/lib/engineering-calendar";
import { toLocalDateKey } from "@/src/lib/date";
import {
  CREATIVE_DNA_REVIEW_VERSION,
  createProjectInputFingerprint,
  confirmCreativeDna,
  mergeApprovedReferenceFindings,
  mergeReviewOverrides,
  type CreativeDnaReviewRecord,
} from "@/src/creative-dna-review";
import { ProjectAnalysisResponseSchema } from "@/src/project-analysis/contracts";
import {
  LearningPlanSchema,
  markSkillGap,
  mergeLearningDecisions,
  replaceTutorial,
  restorePreviousTutorial,
  type LearningPlan,
} from "@/src/tutorial-matching";
import { classifyProjectPath, EngineeringRoadmapSchema, inferEngineeringHints, type EngineeringInterpretation as EngineeringInterpretationValue, type EngineeringProject, type EngineeringRoadmap, type PathClassification, type ProjectPath, type PreparationMethod, type EngineeringGuidedPlan as EngineeringGuidedPlanValue } from "@/src/project-path";
import { generateEngineeringGuidedPlan, generateEngineeringRoadmap, interpretEngineeringProject } from "@/src/agentic-engineering";
import { WorkflowToast, type WorkflowStage } from "./WorkflowToast";
import { createDesignRouteEvaluation, createEngineeringRouteEvaluation } from "@/src/route-planning/generate";
import type { ReferenceImageFinding } from "@/src/reference-image/contracts";
const stepIcons = [PencilLine, ListChecks, BookOpenCheck] as const;

function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

function emptyForm(locale: Locale): RoadmapRequest {
  return {
    interfaceLanguage: locale,
    projectBrief: "",
    deadline: dateFromToday(7),
    currentExperience: "",
    hoursPerDay: 2,
    daysPerWeek: 6,
    tutorialLanguage: "either",
    requiredApplications: [],
    outputType: "video",
    targetQuality: "unsure",
  };
}

function emptyEngineeringForm(locale: Locale, brief = ""): EngineeringProject {
  const hints = inferEngineeringHints(brief);
  return {
    path: "agentic_engineering",
    interfaceLanguage: locale,
    technicalBrief: brief,
    startingPoint: hints.startingPoint,
    repositoryUrl: hints.repositoryUrl,
    projectLocation: "",
    definitionOfDone: "",
    targetPlatform: hints.targetPlatform,
    technologies: hints.technologies,
    currentExperience: "",
    deploymentTarget: "",
    deadline: dateFromToday(7),
    hoursPerDay: 2,
    daysPerWeek: 6,
    constraints: "",
    existingErrors: "",
  };
}

export function QuandaApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [projectPath, setProjectPath] = useState<ProjectPath | null>(null);
  const [pathClassification, setPathClassification] = useState<PathClassification | null>(null);
  const [form, setForm] = useState<RoadmapRequest>(() => emptyForm("en"));
  const [engineeringForm, setEngineeringForm] = useState<EngineeringProject>(() => emptyEngineeringForm("en"));
  const [engineeringInterpretation, setEngineeringInterpretation] = useState<EngineeringInterpretationValue | null>(null);
  const [engineeringRoadmap, setEngineeringRoadmap] = useState<EngineeringRoadmap | null>(null);
  const [preparationMethod, setPreparationMethod] = useState<PreparationMethod | null>(null);
  const [engineeringGuidedPlan, setEngineeringGuidedPlan] = useState<EngineeringGuidedPlanValue | null>(null);
  const [engineeringInterpretationConfirmed, setEngineeringInterpretationConfirmed] = useState(false);
  const [engineeringCompletion, setEngineeringCompletion] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [creativeDnaReview, setCreativeDnaReview] =
    useState<CreativeDnaReviewRecord | null>(null);
  const [approvedReferenceFindings, setApprovedReferenceFindings] = useState<
    ReferenceImageFinding[]
  >([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [completion, setCompletion] = useState<Record<string, string[]>>({});
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [engineeringCalendarTasks, setEngineeringCalendarTasks] = useState<CalendarTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatchingTutorials, setIsMatchingTutorials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [engineeringError, setEngineeringError] = useState<string | null>(null);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage | null>(null);
  const calendarViewTracked = useRef(false);
  const viewedRoadmapIds = useRef(new Set<string>());
  const t = getTranslation(locale);
  const announceWorkflowStage = (stage: WorkflowStage) => setWorkflowStage(stage);
  const guidedRouteEvaluation = useMemo(() => {
    if (!engineeringGuidedPlan || !engineeringInterpretation) return null;
    // Use the existing engineering estimate and route scorer so guided preparation
    // shows the same evidence-backed evaluation as the project-plan route.
    return generateEngineeringRoadmap(engineeringForm, engineeringInterpretation).routeEvaluation ?? null;
  }, [engineeringForm, engineeringGuidedPlan, engineeringInterpretation]);
  const projectInputFingerprint = createProjectInputFingerprint(form);
  const completedStageIds = roadmap ? completion[roadmap.id] ?? [] : [];
  const creativeDnaIsStale = creativeDnaReview
    ? creativeDnaReview.inputFingerprint !== projectInputFingerprint
    : false;
  const learningPlanIsStale = learningPlan
    ? learningPlan.inputFingerprint !== projectInputFingerprint
    : false;
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLocale = readLanguage(window.localStorage);
      const savedDraft = readDraft(window.localStorage);
      const savedCompletion = readCompletion(window.localStorage);
      const savedCalendarTasks = readCalendarTasks(window.localStorage);
      const savedEngineeringCalendarTasks = readEngineeringCalendarTasks(window.localStorage);
      const savedPath = readProjectPath(window.localStorage);
      const savedEngineeringDraft = readEngineeringDraft(window.localStorage);
      const savedEngineeringInterpretation = readEngineeringInterpretation(window.localStorage);
      const savedEngineeringRoadmap = readEngineeringRoadmap(window.localStorage);
      const savedEngineeringCompletion = readEngineeringCompletion(window.localStorage);
      const savedPreparationMethod = readPreparationMethod(window.localStorage);
      const savedEngineeringGuidedPlan = readEngineeringGuidedPlan(window.localStorage);
      const restoredLocale =
        savedLocale ?? savedDraft?.interfaceLanguage ?? "en";
      const restoredForm = savedDraft
        ? { ...savedDraft, interfaceLanguage: restoredLocale }
        : emptyForm(restoredLocale);
      const savedRoadmap = readRoadmapForProject(
        window.localStorage,
        restoredForm,
      );
      const savedCreativeDnaReview = readCreativeDnaReview(
        window.localStorage,
        restoredForm,
      );
      const savedLearningPlan = readLearningPlan(window.localStorage);
      const restoredFingerprint = createProjectInputFingerprint(restoredForm);
      const restoredRoadmap = savedRoadmap;
      const restoredPath: ProjectPath | null = savedPath ??
        (savedEngineeringDraft || savedEngineeringRoadmap ? "agentic_engineering" :
          (savedRoadmap || savedCreativeDnaReview ? "design" : null));

      setLocale(restoredLocale);
      setProjectPath(restoredPath);
      setForm(restoredForm);
      setEngineeringForm(savedEngineeringDraft ?? emptyEngineeringForm(restoredLocale, restoredForm.projectBrief));
      setEngineeringInterpretation(savedEngineeringInterpretation);
      setEngineeringRoadmap(savedEngineeringRoadmap);
      setPreparationMethod(savedPreparationMethod);
      setEngineeringGuidedPlan(savedEngineeringGuidedPlan);
      setEngineeringInterpretationConfirmed(Boolean(savedPreparationMethod || savedEngineeringGuidedPlan || savedEngineeringRoadmap));
      setEngineeringCompletion(savedEngineeringCompletion);
      const engineeringDeadline = savedEngineeringDraft?.deadline ?? emptyEngineeringForm(restoredLocale).deadline;
      setEngineeringCalendarTasks(
        savedEngineeringRoadmap
          ? syncEngineeringRoadmapCalendarTasks(
              savedEngineeringCalendarTasks,
              savedEngineeringRoadmap,
              engineeringDeadline,
              savedEngineeringCompletion,
            )
          : savedEngineeringGuidedPlan
            ? syncEngineeringGuidedPlanCalendarTasks(
                savedEngineeringCalendarTasks,
                savedEngineeringGuidedPlan,
                engineeringDeadline,
              )
            : removeEngineeringCalendarTasks(savedEngineeringCalendarTasks),
      );
      setRoadmap(restoredRoadmap);
      setCreativeDnaReview(savedCreativeDnaReview);
      setLearningPlan(
        savedLearningPlan &&
          savedLearningPlan.inputFingerprint === restoredFingerprint
          ? savedLearningPlan
          : null,
      );
      setCompletion(savedCompletion);
      setCalendarTasks(
        restoredRoadmap
          ? syncRoadmapCalendarTasks(
              savedCalendarTasks,
              restoredRoadmap,
              restoredForm.deadline,
              savedCompletion[restoredRoadmap.id] ?? [],
            )
          : removeRoadmapCalendarTasks(savedCalendarTasks),
      );
      setIsHydrated(true);

      const hasLocalProject = Boolean(
        savedDraft?.projectBrief.trim() ||
          savedRoadmap ||
          savedCreativeDnaReview ||
          savedLearningPlan ||
          savedCalendarTasks.length ||
          savedEngineeringDraft?.technicalBrief.trim() ||
          savedEngineeringInterpretation ||
          savedEngineeringRoadmap ||
          savedPreparationMethod ||
          savedEngineeringGuidedPlan ||
          savedEngineeringCalendarTasks.length,
      );
      void initializeQuandaApi().then(async (session) => {
        if (!session) return;
        trackEvent("site_opened", {
          returningUser: session.returningUser,
          language: restoredLocale,
        });
        if (hasLocalProject) return;
        const remoteProject = await restoreLatestQuandaProject();
        const snapshot = parseProjectSnapshot(remoteProject?.data);
        if (!snapshot) return;
        setProjectPath("design");
        setPathClassification(null);
        setLocale(snapshot.form.interfaceLanguage);
        setForm(snapshot.form);
        setRoadmap(snapshot.roadmap);
        setCreativeDnaReview(snapshot.creativeDnaReview);
        setLearningPlan(snapshot.learningPlan);
        setCompletion(snapshot.completion);
        setCalendarTasks(
          snapshot.roadmap
            ? syncRoadmapCalendarTasks(
                snapshot.calendarTasks,
                snapshot.roadmap,
                snapshot.form.deadline,
                snapshot.completion[snapshot.roadmap.id] ?? [],
              )
            : removeRoadmapCalendarTasks(snapshot.calendarTasks),
        );
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (isHydrated) writeLanguage(window.localStorage, locale);
  }, [isHydrated, locale]);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = window.setTimeout(
      () => writeDraft(window.localStorage, form),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [form, isHydrated]);

  useEffect(() => {
    if (!isHydrated || projectPath !== "agentic_engineering") return;
    const timeout = window.setTimeout(
      () => writeEngineeringDraft(window.localStorage, engineeringForm),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [engineeringForm, isHydrated, projectPath]);

  useEffect(() => {
    if (!isHydrated) return;
    if (projectPath) writeProjectPath(window.localStorage, projectPath);
    else clearProjectPath(window.localStorage);
  }, [isHydrated, projectPath]);

  useEffect(() => {
    if (!isHydrated) return;
    if (roadmap) writeRoadmap(window.localStorage, roadmap);
    else clearRoadmap(window.localStorage);
  }, [isHydrated, roadmap]);

  useEffect(() => {
    if (isHydrated && creativeDnaReview) {
      writeCreativeDnaReview(window.localStorage, creativeDnaReview);
    }
  }, [creativeDnaReview, isHydrated]);

  useEffect(() => {
    if (isHydrated && learningPlan) {
      writeLearningPlan(window.localStorage, learningPlan);
    }
  }, [isHydrated, learningPlan]);

  useEffect(() => {
    if (!isHydrated || projectPath !== "agentic_engineering") return;
    if (engineeringInterpretation) writeEngineeringInterpretation(window.localStorage, engineeringInterpretation);
  }, [engineeringInterpretation, isHydrated, projectPath]);

  useEffect(() => {
    if (!isHydrated || projectPath !== "agentic_engineering") return;
    if (engineeringRoadmap) writeEngineeringRoadmap(window.localStorage, engineeringRoadmap);
  }, [engineeringRoadmap, isHydrated, projectPath]);

  useEffect(() => {
    if (!isHydrated || projectPath !== "agentic_engineering") return;
    if (preparationMethod) writePreparationMethod(window.localStorage, preparationMethod);
  }, [isHydrated, preparationMethod, projectPath]);

  useEffect(() => {
    if (!isHydrated || projectPath !== "agentic_engineering") return;
    if (engineeringGuidedPlan) writeEngineeringGuidedPlan(window.localStorage, engineeringGuidedPlan);
  }, [engineeringGuidedPlan, isHydrated, projectPath]);

  useEffect(() => {
    if (!isHydrated || projectPath !== "agentic_engineering") return;
    writeEngineeringCompletion(window.localStorage, engineeringCompletion);
  }, [engineeringCompletion, isHydrated, projectPath]);

  useEffect(() => {
    if (isHydrated) {
      writeCompletion(window.localStorage, completion);
    }
  }, [completion, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      writeCalendarTasks(window.localStorage, calendarTasks);
    }
  }, [calendarTasks, isHydrated]);

  useEffect(() => {
    if (isHydrated && projectPath === "agentic_engineering") {
      writeEngineeringCalendarTasks(window.localStorage, engineeringCalendarTasks);
    }
  }, [engineeringCalendarTasks, isHydrated, projectPath]);

  useEffect(() => {
    if (
      !isHydrated ||
      projectPath !== "design" ||
      form.projectBrief.trim().length < 30
    ) {
      return;
    }
    const snapshot = createProjectSnapshot({
      form,
      creativeDnaReview,
      learningPlan,
      roadmap,
      completion,
      calendarTasks,
    });
    const timeout = window.setTimeout(() => {
      void persistQuandaProject({
        title: projectTitle(snapshot),
        status: projectStatus(snapshot),
        inputFingerprint: createProjectInputFingerprint(form),
        data: snapshot,
      });
    }, 1_200);
    return () => window.clearTimeout(timeout);
  }, [
    calendarTasks,
    completion,
    creativeDnaReview,
    form,
    isHydrated,
    learningPlan,
    projectPath,
    roadmap,
  ]);

  useEffect(() => {
    if (
      !isHydrated ||
      projectPath !== "design" ||
      calendarViewTracked.current
    ) {
      return;
    }
    const calendar = document.querySelector("#calendar");
    if (!calendar || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        calendarViewTracked.current = true;
        trackEvent("calendar_opened");
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(calendar);
    return () => observer.disconnect();
  }, [isHydrated, projectPath]);

  useEffect(() => {
    if (
      !isHydrated ||
      projectPath !== "design" ||
      !roadmap ||
      roadmap.projectInputFingerprint !== projectInputFingerprint ||
      viewedRoadmapIds.current.has(roadmap.id)
    ) {
      return;
    }
    viewedRoadmapIds.current.add(roadmap.id);
    trackEvent("roadmap_viewed", {
      source: roadmap.source ?? "ai",
      stageCount: roadmap.stages.length,
    });
  }, [isHydrated, projectInputFingerprint, projectPath, roadmap]);

  const changeLanguage = (nextLocale: Locale) => {
    setLocale(nextLocale);
    trackEvent("language_changed", { language: nextLocale });
    const nextForm = { ...form, interfaceLanguage: nextLocale };
    setForm(nextForm);
    const nextEngineeringForm = { ...engineeringForm, interfaceLanguage: nextLocale };
    setEngineeringForm(nextEngineeringForm);
    if (projectPath === "agentic_engineering" && engineeringRoadmap) {
      setEngineeringRoadmap((current) => current ? {
        ...current,
        language: nextLocale,
        routeEvaluation: createEngineeringRouteEvaluation(
          nextEngineeringForm,
          current.interpretation,
          current.totalEstimatedAgentMinutes + current.totalEstimatedHumanReviewMinutes,
        ),
      } : current);
    }
    if (projectPath === "agentic_engineering") return;
    if (roadmap?.source === "demo") {
      const nextRoadmap = createSampleRoadmap(nextForm);
      setRoadmap(nextRoadmap);
      setCalendarTasks((current) =>
        syncRoadmapCalendarTasks(
          current,
          nextRoadmap,
          nextForm.deadline,
          completion[nextRoadmap.id] ?? [],
        ),
      );
    } else if (roadmap?.source === "fallback") {
      // Fallback roadmaps are generated once per confirmed review. Keep their
      // project-specific content intact while updating the visible title when
      // the user switches language.
      const isProductAnimationExample = /20[- ]second product animation|hoạt hình sản phẩm.*20 giây/i.test(form.projectBrief);
      setRoadmap({
        ...roadmap,
        language: nextLocale,
        projectInputFingerprint: createProjectInputFingerprint(nextForm),
        routeEvaluation: createDesignRouteEvaluation(nextForm, roadmap.totalEstimatedMinutes),
        title: isProductAnimationExample
          ? nextLocale === "vi"
            ? "Lộ trình làm hoạt hình sản phẩm 20 giây"
            : "20-second product animation roadmap"
          : roadmap.title,
      });
    } else if (roadmap) {
      setRoadmap(null);
      setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    }
  };

  const scrollToForm = () => {
    document.querySelector("#project-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectPath = (nextPath: ProjectPath, brief = form.projectBrief) => {
    setProjectPath(nextPath);
    setPathClassification(null);
    setRoadmap(null);
    setCreativeDnaReview(null);
    setApprovedReferenceFindings([]);
    setLearningPlan(null);
    setEngineeringRoadmap(null);
    setPreparationMethod(null);
    setEngineeringGuidedPlan(null);
    setEngineeringInterpretationConfirmed(false);
    setEngineeringInterpretation(null);
    setEngineeringCompletion([]);
    setEngineeringCalendarTasks([]);
    setEngineeringError(null);
    setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    clearCreativeDnaReview(window.localStorage);
    clearLearningPlan(window.localStorage);
    clearPreparationState(window.localStorage);
    clearEngineeringCalendarTasks(window.localStorage);
    if (nextPath === "design") {
      setForm((current) => ({ ...current, projectBrief: brief, interfaceLanguage: locale }));
      clearEngineeringState(window.localStorage);
    } else {
      setEngineeringForm(emptyEngineeringForm(locale, brief));
      setForm((current) => ({ ...current, projectBrief: brief, interfaceLanguage: locale }));
    }
    requestAnimationFrame(() => {
      document.querySelector(nextPath === "design" ? "#project-form" : "#engineering-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const submitInitialBrief = (brief: string) => {
    announceWorkflowStage("brief");
    const classification = classifyProjectPath(brief);
    setPathClassification(classification);
    if (classification.path !== "clarification") selectPath(classification.path, brief);
    else setForm((current) => ({ ...current, projectBrief: brief }));
  };

  const returnToBeginning = () => {
    void archiveCurrentQuandaProject();
    clearProjectStorage(window.localStorage);
    setProjectPath(null);
    setPathClassification(null);
    setForm(emptyForm(locale));
    setEngineeringForm(emptyEngineeringForm(locale));
    setEngineeringInterpretation(null);
    setEngineeringRoadmap(null);
    setPreparationMethod(null);
    setEngineeringGuidedPlan(null);
    setEngineeringInterpretationConfirmed(false);
    setEngineeringCompletion([]);
    setEngineeringCalendarTasks([]);
    setRoadmap(null);
    setCreativeDnaReview(null);
    setApprovedReferenceFindings([]);
    setLearningPlan(null);
    setCompletion({});
    setCalendarTasks([]);
    setError(null);
    setAnalysisError(null);
    setMatchingError(null);
    setEngineeringError(null);
    setWorkflowStage(null);
    clearPreparationState(window.localStorage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const interpretEngineering = async (request: EngineeringProject) => {
    setEngineeringForm(request);
    setEngineeringError(null);
    setEngineeringInterpretation(null);
    setEngineeringRoadmap(null);
    setEngineeringCalendarTasks((current) => removeEngineeringCalendarTasks(current));
    setEngineeringGuidedPlan(null);
    setEngineeringInterpretationConfirmed(false);
    const local = interpretEngineeringProject(request);
    try {
      const response = await fetch("/api/engineering/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error("engineering_interpretation_failed");
      setEngineeringInterpretation(local);
      setEngineeringInterpretationConfirmed(true);
      announceWorkflowStage("review");
    } catch {
      setEngineeringInterpretation({ ...local, source: "fallback" });
      setEngineeringInterpretationConfirmed(true);
      setEngineeringError(t.errors.networkFallback);
    }
    requestAnimationFrame(() => document.querySelector("#preparation-method")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const generateEngineering = async (
    method: PreparationMethod = preparationMethod ?? "guided_tutorials",
    project: EngineeringProject = engineeringForm,
    interpretation: EngineeringInterpretationValue | null = engineeringInterpretation,
  ) => {
    if (!interpretation || method !== "agentic_project_plan") return;
    setEngineeringError(null);
    let finalRoadmap: EngineeringRoadmap;
    try {
      const response = await fetch("/api/engineering/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, interpretation }),
      });
      if (!response.ok) throw new Error("engineering_roadmap_failed");
      const parsed = EngineeringRoadmapSchema.parse(await response.json());
      finalRoadmap = parsed;
    } catch {
      finalRoadmap = generateEngineeringRoadmap(project, interpretation, {
        source: "fallback",
        notice: t.engineering.notice,
      });
    }
    const withEvaluation = finalRoadmap.routeEvaluation
      ? finalRoadmap
      : {
          ...finalRoadmap,
          routeEvaluation: createEngineeringRouteEvaluation(
            project,
            finalRoadmap.interpretation,
            finalRoadmap.totalEstimatedAgentMinutes + finalRoadmap.totalEstimatedHumanReviewMinutes,
          ),
        };
    setEngineeringRoadmap(withEvaluation);
    announceWorkflowStage("plan");
    setEngineeringCalendarTasks((current) =>
      syncEngineeringRoadmapCalendarTasks(
        current,
        withEvaluation,
        project.deadline,
        engineeringCompletion,
      ),
    );
    requestAnimationFrame(() => document.querySelector("#engineering-roadmap-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const choosePreparationMethod = (method: PreparationMethod) => {
    if (!engineeringInterpretation || !engineeringInterpretationConfirmed) return;
    setPreparationMethod(method);
    announceWorkflowStage("prepare");
    setEngineeringRoadmap(null);
    setEngineeringGuidedPlan(null);
    setEngineeringCompletion([]);
    setEngineeringCalendarTasks((current) => removeEngineeringCalendarTasks(current));
    clearPreparationState(window.localStorage);
    writePreparationMethod(window.localStorage, method);
    if (method === "guided_tutorials") {
      const plan = generateEngineeringGuidedPlan(engineeringForm, engineeringInterpretation);
      setEngineeringGuidedPlan(plan);
      writeEngineeringGuidedPlan(window.localStorage, plan);
      setEngineeringCalendarTasks((current) =>
        syncEngineeringGuidedPlanCalendarTasks(current, plan, engineeringForm.deadline),
      );
      requestAnimationFrame(() => document.querySelector("#engineering-guided-plan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    requestAnimationFrame(() => document.querySelector("#engineering-roadmap-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    void generateEngineering(method, engineeringForm, engineeringInterpretation);
  };

  const loadExample = () => {
    const technicalBrief = locale === "en"
      ? "Build a 2D top-down survival game called Last Night. The player controls a character on a small map and must survive enemy waves. The character can move, attack, and collect healing items. Enemies automatically find and approach the player. Each wave increases the number and difficulty of enemies. The game needs Start, Gameplay, Game Over, Restart, HP, score, survival time, at least three enemy types, and a playable Windows build."
      : "Xây dựng game sinh tồn 2D góc nhìn từ trên xuống tên Last Night. Người chơi điều khiển nhân vật trên bản đồ nhỏ và phải sống sót trước các đợt quái vật. Nhân vật có thể di chuyển, tấn công và nhặt vật phẩm hồi máu. Quái vật tự tìm và tiến về phía người chơi. Mỗi đợt tăng số lượng và độ khó của quái vật. Game cần Start, Gameplay, Game Over, Restart, HP, điểm số, thời gian sống sót, ít nhất ba loại quái vật và bản build Windows có thể chơi được.";
    const nextEngineering: EngineeringProject = {
      ...emptyEngineeringForm(locale, technicalBrief),
      technicalBrief,
      startingPoint: "new_project",
      targetPlatform: "game",
      definitionOfDone: locale === "en"
        ? "Complete playable flow from Start to Gameplay to Game Over to Restart. Player movement and attacks work; enemies find the player; there are at least three enemy types; HP, damage, healing items, score, survival time, enemy waves; and a stable playable Windows build."
        : "Luồng chơi hoàn chỉnh từ Start đến Gameplay, Game Over rồi Restart. Nhân vật di chuyển và tấn công được; quái vật tìm đến người chơi; có ít nhất ba loại quái vật; HP, damage, vật phẩm hồi máu, điểm số, thời gian sống sót, các đợt quái vật và bản build Windows ổn định có thể chơi được.",
      technologies: "Godot 4, GDScript",
      currentExperience: locale === "en"
        ? "Basic programming knowledge of variables, conditions, loops, and functions; new to Godot and GDScript."
        : "Biết kiến thức lập trình cơ bản như variable, condition, loop và function; mới bắt đầu sử dụng Godot và GDScript.",
      deploymentTarget: locale === "en" ? "Playable Windows build" : "Bản build Windows có thể chơi được",
      deadline: "2026-09-01",
      hoursPerDay: 2,
      daysPerWeek: 6,
      constraints: locale === "en"
        ? "Solo project. No Blender or Photoshop. Use free assets or simple self-created shapes. No multiplayer, backend, or user accounts. Prioritise working gameplay before graphics and animation."
        : "Làm một mình. Không dùng Blender hoặc Photoshop. Chỉ dùng asset miễn phí hoặc hình dạng đơn giản tự tạo. Không multiplayer, backend hoặc tài khoản người dùng. Ưu tiên gameplay hoạt động trước đồ họa và animation.",
    };
    clearProjectStorage(window.localStorage);
    setProjectPath("agentic_engineering");
    setPathClassification({ path: "agentic_engineering", confidence: 1, reason: "The example is a working software project.", signals: ["example engineering brief"] });
    setEngineeringForm(nextEngineering);
    setEngineeringInterpretation(null);
    setEngineeringInterpretationConfirmed(false);
    setPreparationMethod(null);
    setEngineeringRoadmap(null);
    setEngineeringGuidedPlan(null);
    setForm(emptyForm(locale));
    setEngineeringCompletion([]);
    setEngineeringCalendarTasks([]);
    setRoadmap(null);
    setCreativeDnaReview(null);
    setApprovedReferenceFindings([]);
    clearCreativeDnaReview(window.localStorage);
    setLearningPlan(null);
    clearLearningPlan(window.localStorage);
    setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    setError(null);
    setAnalysisError(null);
    setMatchingError(null);
    setEngineeringError(null);
    requestAnimationFrame(() => {
      document.querySelector("#engineering-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const analyzeProject = async (request: RoadmapRequest) => {
    setForm(request);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setError(null);
    setRoadmap(null);
    setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    trackEvent("creative_dna_analysis_started", {
      language: request.interfaceLanguage,
      outputType: request.outputType,
    });
    trackEvent("brief_submitted", {
      language: request.interfaceLanguage,
      outputType: request.outputType,
      requiredApplicationCount: request.requiredApplications.length,
    });
    requestAnimationFrame(() => {
      document.querySelector("#analysis-loading")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/project-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`analysis_${response.status}`);
      const parsed = ProjectAnalysisResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("analysis_invalid");

      const creativeDna = mergeApprovedReferenceFindings(mergeReviewOverrides(
        creativeDnaReview?.analysis.creativeDna ?? null,
        parsed.data.creativeDna,
      ), approvedReferenceFindings);
      const review: CreativeDnaReviewRecord = {
        reviewVersion: CREATIVE_DNA_REVIEW_VERSION,
        inputFingerprint: createProjectInputFingerprint(request),
        analysis: { ...parsed.data, creativeDna },
        confirmed: false,
      };
      const confirmedReview: CreativeDnaReviewRecord = {
        ...review,
        analysis: {
          ...review.analysis,
          creativeDna: confirmCreativeDna(review.analysis.creativeDna),
        },
        confirmed: true,
      };
      setCreativeDnaReview(confirmedReview);
      announceWorkflowStage("review");
      writeCreativeDnaReview(window.localStorage, confirmedReview);
      trackEvent("creative_dna_review_viewed", { source: parsed.data.source });
      trackEvent(
        parsed.data.source === "fallback"
          ? "creative_dna_analysis_fallback"
          : "creative_dna_analysis_succeeded",
        {
          source: parsed.data.source,
          conceptCount: creativeDna.concepts.length,
          unknownCount: creativeDna.unknownConcepts.length,
        },
      );
      void matchTutorials(confirmedReview, request);
    } catch {
      setAnalysisError(getTranslation(request.interfaceLanguage).review.errorMessage);
    } finally {
      window.clearTimeout(timeout);
      setIsAnalyzing(false);
    }
  };

  const matchTutorials = async (
    review: CreativeDnaReviewRecord,
    project: RoadmapRequest = form,
  ) => {
    setIsMatchingTutorials(true);
    setMatchingError(null);
    setRoadmap(null);
    trackEvent("tutorial_matching_started", {
      language: project.tutorialLanguage,
    });
    requestAnimationFrame(() => {
      document.querySelector("#learning-path-loading")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/tutorial-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, review }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`tutorial_matching_${response.status}`);
      const parsed = LearningPlanSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("tutorial_matching_invalid");
      const next = mergeLearningDecisions(learningPlan, parsed.data);
      setLearningPlan(next);
      announceWorkflowStage("prepare");
      trackEvent("tutorial_matching_succeeded", {
        gapCount: next.skillGaps.length,
        matchedCount: next.tutorialMatches.filter(
          (match) => Boolean(match.selectedTutorialId),
        ).length,
      });
      window.setTimeout(() => {
        document.querySelector("#learning-path-review")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    } catch {
      setMatchingError(t.learning.errorMessage);
    } finally {
      window.clearTimeout(timeout);
      setIsMatchingTutorials(false);
    }
  };

  const generateRoadmap = async (request: RoadmapRequest) => {
    if (!creativeDnaReview?.confirmed) {
      void analyzeProject(request);
      return;
    }
    if (!learningPlan || learningPlan.inputFingerprint !== createProjectInputFingerprint(request)) {
      void matchTutorials(creativeDnaReview);
      return;
    }
    setForm(request);
    setIsLoading(true);
    setError(null);
    setRoadmap(null);
    setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    trackEvent("roadmap_generate_started", {
      language: request.interfaceLanguage,
      outputType: request.outputType,
    });
    requestAnimationFrame(() => {
      document.querySelector("#roadmap-loading")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    let generatedRoadmap: RoadmapResponse | null = null;
    const requestTranslation = getTranslation(request.interfaceLanguage);
    try {
      const apiResponse = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: request,
          review: creativeDnaReview,
          learningPlan,
        }),
        signal: controller.signal,
      });
      if (apiResponse.status === 429) {
        setError(requestTranslation.errors.rateLimit);
        return;
      }
      if (!apiResponse.ok) {
        setError(requestTranslation.errors.api);
        return;
      }

      const parsed = RoadmapResponseSchema.safeParse(await apiResponse.json());
      if (!parsed.success) {
        generatedRoadmap = {
          ...createSampleRoadmap(request),
          source: "fallback",
          notice: requestTranslation.errors.malformedFallback,
        };
      } else {
        generatedRoadmap = parsed.data;
      }
    } catch (caughtError) {
      generatedRoadmap = {
        ...createSampleRoadmap(request),
        source: "fallback",
        notice:
          caughtError instanceof DOMException && caughtError.name === "AbortError"
            ? requestTranslation.errors.timeoutFallback
            : requestTranslation.errors.networkFallback,
      };
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
      if (generatedRoadmap) {
        const finalRoadmap = generatedRoadmap.routeEvaluation
          ? generatedRoadmap
          : {
              ...generatedRoadmap,
              routeEvaluation: createDesignRouteEvaluation(request, generatedRoadmap.totalEstimatedMinutes),
            };
        setRoadmap(finalRoadmap);
        announceWorkflowStage("plan");
        setCompletion((current) => ({
          ...current,
          [finalRoadmap.id]: [],
        }));
        setCalendarTasks((current) =>
          syncRoadmapCalendarTasks(current, finalRoadmap, request.deadline),
        );
        trackEvent(
          finalRoadmap.source === "fallback"
            ? "roadmap_generate_fallback"
            : "roadmap_generate_succeeded",
          {
            source: finalRoadmap.source ?? "ai",
            stageCount: finalRoadmap.stages.length,
          },
        );
        window.setTimeout(() => {
          document.querySelector("#roadmap-results")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      }
    }
  };

  const toggleStage = (stageId: string) => {
    if (!roadmap) return;
    const isCompleting = !completedStageIds.includes(stageId);
    setCompletion((current) => {
      const roadmapCompletion = current[roadmap.id] ?? [];
      if (isCompleting) {
        trackEvent("stage_completed", { roadmapId: roadmap.id, stageId });
      }
      const nextStageIds = isCompleting
        ? [...new Set([...roadmapCompletion, stageId])]
        : roadmapCompletion.filter((id) => id !== stageId);
      return {
        ...current,
        [roadmap.id]: nextStageIds,
      };
    });
    setCalendarTasks((current) =>
      current.map((task) =>
        task.source === "roadmap" &&
        task.roadmapId === roadmap.id &&
        task.stageId === stageId
          ? { ...task, done: isCompleting }
          : task,
      ),
    );
  };

  const toggleCalendarTask = (taskId: string) => {
    const task = calendarTasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    const nextDone = !task.done;
    setCalendarTasks((current) =>
      current.map((candidate) =>
        candidate.id === taskId ? { ...candidate, done: nextDone } : candidate,
      ),
    );

    if (
      task.source === "roadmap" &&
      task.roadmapId &&
      task.stageId &&
      roadmap?.id === task.roadmapId
    ) {
      setCompletion((current) => {
        const roadmapCompletion = current[task.roadmapId!] ?? [];
        return {
          ...current,
          [task.roadmapId!]: nextDone
            ? [...new Set([...roadmapCompletion, task.stageId!])]
            : roadmapCompletion.filter((id) => id !== task.stageId),
        };
      });
    }
    if (nextDone) {
      trackEvent(
        task.source === "roadmap"
          ? "roadmap_stage_completed"
          : "calendar_item_completed",
        {
          taskSource: task.source,
          ...(task.stageId ? { stageId: task.stageId } : {}),
        },
      );
    }
  };

  const toggleEngineeringRoadmapTask = (taskId: string) => {
    if (!engineeringRoadmap) return;
    const isCompleting = !engineeringCompletion.includes(taskId);
    setEngineeringCompletion((current) =>
      isCompleting
        ? [...new Set([...current, taskId])]
        : current.filter((id) => id !== taskId),
    );
    setEngineeringCalendarTasks((current) =>
      current.map((task) =>
        task.source === "roadmap" &&
        task.roadmapId === `engineering-roadmap:${engineeringRoadmap.id}` &&
        task.stageId === taskId
          ? { ...task, done: isCompleting }
          : task,
      ),
    );
  };

  const toggleEngineeringCalendarTask = (taskId: string) => {
    const task = engineeringCalendarTasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    const nextDone = !task.done;
    setEngineeringCalendarTasks((current) =>
      current.map((candidate) =>
        candidate.id === taskId ? { ...candidate, done: nextDone } : candidate,
      ),
    );
    if (task.source === "roadmap" && task.stageId && engineeringRoadmap) {
      setEngineeringCompletion((current) =>
        nextDone
          ? [...new Set([...current, task.stageId!])]
          : current.filter((id) => id !== task.stageId),
      );
    }
  };

  return (
    <main id="top">
      <Header
        isReady={isHydrated}
        locale={locale}
        t={t}
        onLanguageChange={changeLanguage}
        onLoadExample={loadExample}
      />
      <div className="page-shell">
        {workflowStage && <WorkflowToast onDismiss={() => setWorkflowStage(null)} stage={workflowStage} t={t} />}
        {!projectPath && !pathClassification ? (
          <section className="landing-entry-section" id="project-form" aria-labelledby="hero-title">
            <div className={`landing-entry-copy hero-${locale}`}>
              <p className="eyebrow">{t.hero.eyebrow}</p>
              <h1 id="hero-title">
                {t.hero.titleLead}{t.hero.titleAccent ? <> <em>{t.hero.titleAccent}</em></> : null}
              </h1>
              <p className="hero-tagline">{t.hero.tagline}</p>
              <p className="hero-description">{t.hero.description}</p>
              <div className="hero-actions">
                <span>{t.hero.note}</span>
              </div>
            </div>
            <div className="landing-entry-form">
              <InitialBriefForm
                brief={form.projectBrief}
                embedded
                isSubmitting={!isHydrated}
                onChange={(brief) => setForm((current) => ({ ...current, projectBrief: brief }))}
                onSubmit={submitInitialBrief}
                t={t}
              />
            </div>
          </section>
        ) : (
          <section className={`hero hero-${locale}`} aria-labelledby="hero-title">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1 id="hero-title">
              {t.hero.titleLead}{t.hero.titleAccent ? <> <em>{t.hero.titleAccent}</em></> : null}
            </h1>
            <p className="hero-tagline">{t.hero.tagline}</p>
            <p className="hero-description">{t.hero.description}</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={scrollToForm} type="button">
                {t.hero.start}
                <ArrowDown aria-hidden="true" size={17} />
              </button>
              <span>{t.hero.note}</span>
            </div>
          </section>
        )}
        <section className="how-section" id="how-it-works" aria-labelledby="how-title">
          <div className="section-heading">
            <p className="eyebrow">{t.how.eyebrow}</p>
            <h2 id="how-title">{t.how.title}</h2>
          </div>
          <ol className="steps">
            {t.how.steps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <li key={step.title}>
                  <span className="step-number">0{index + 1}</span>
                  <span className="step-icon" aria-hidden="true">
                    <Icon size={21} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {index < t.how.steps.length - 1 && (
                    <ArrowRight className="step-arrow" aria-hidden="true" size={20} />
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {!projectPath && pathClassification?.path === "clarification" && (
          <PathClarification t={t} onChoose={(nextPath) => selectPath(nextPath, form.projectBrief)} />
        )}

        {projectPath && !engineeringRoadmap && (
          <div className="path-status" role="status"><span>{t.path.detectedAs} <strong>{projectPath === "design" ? t.path.designLabel : t.path.engineeringLabel}</strong>.</span><button className="button button-text" onClick={returnToBeginning} type="button">{t.path.returnToStart}</button></div>
        )}

        {projectPath === "design" && (
          <ProjectBriefForm
            isSubmitting={isLoading || isAnalyzing || isMatchingTutorials || !isHydrated}
            onChange={(nextForm) => {
              setForm(nextForm);
              if (roadmap && roadmap.projectInputFingerprint !== createProjectInputFingerprint(nextForm)) {
                setRoadmap(null);
                setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
              }
            }}
            onSubmit={(request) => void analyzeProject(request)}
            onApprovedReferenceFindingsChange={(findings) => {
              setApprovedReferenceFindings(findings);
              setCreativeDnaReview(null);
              setLearningPlan(null);
              setRoadmap(null);
              setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
            }}
            t={t}
            value={form}
          />
        )}

        {projectPath === "agentic_engineering" && (
          <EngineeringProjectForm
            isSubmitting={!isHydrated || Boolean(engineeringInterpretation) || Boolean(engineeringRoadmap)}
            onChange={(next) => {
              setEngineeringForm(next);
              setEngineeringInterpretation(null);
              setEngineeringInterpretationConfirmed(false);
              setPreparationMethod(null);
              setEngineeringGuidedPlan(null);
              setEngineeringRoadmap(null);
              setEngineeringCompletion([]);
              setEngineeringCalendarTasks((current) => removeEngineeringCalendarTasks(current));
              clearPreparationState(window.localStorage);
            }}
            onSubmit={(request) => void interpretEngineering(request)}
            t={t}
            value={engineeringForm}
          />
        )}

        <div aria-live="polite">
          {projectPath === "agentic_engineering" && engineeringError && <div className="api-error" role="status"><strong>{t.engineering.notice}</strong><p>{engineeringError}</p></div>}
          {projectPath === "design" && isAnalyzing && <LoadingAnalysis t={t} />}
          {projectPath === "design" && isMatchingTutorials && <LoadingLearningPath t={t} />}
          {projectPath === "design" && analysisError && (
            <div className="api-error analysis-error" role="alert">
              <strong>{t.review.errorTitle}</strong>
              <p>{analysisError}</p>
              <div className="analysis-error-actions">
                <button
                  className="button button-primary"
                  disabled={isAnalyzing}
                  onClick={() => void analyzeProject(form)}
                  type="button"
                >
                  {t.review.retry}
                </button>
                <button className="button button-text" onClick={scrollToForm} type="button">
                  {t.review.editDetails}
                </button>
              </div>
            </div>
          )}
          {projectPath === "design" && matchingError && (
            <div className="api-error analysis-error" role="alert">
              <strong>{t.learning.errorTitle}</strong>
              <p>{matchingError}</p>
              <button
                className="button button-primary"
                disabled={isMatchingTutorials || !creativeDnaReview?.confirmed}
                onClick={() =>
                  creativeDnaReview && void matchTutorials(creativeDnaReview)
                }
                type="button"
              >
                {t.learning.retry}
              </button>
            </div>
          )}
          {projectPath === "design" && isLoading && <LoadingRoadmap t={t} />}
          {projectPath === "design" && error && (
            <div className="api-error" role="alert">
              <strong>{t.form.errorsTitle}</strong>
              <p>{error}</p>
            </div>
          )}
        </div>

        {projectPath === "design" && learningPlan &&
          creativeDnaReview?.confirmed &&
          !learningPlanIsStale &&
          !isMatchingTutorials && (
            <LearningPathReview
              isBusy={isLoading}
              onContinue={() => void generateRoadmap(form)}
              onReplace={(needId, feedback) => {
                setRoadmap(null);
                setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
                setLearningPlan((current) =>
                  current ? replaceTutorial(current, needId, feedback) : current,
                );
                trackEvent("tutorial_replaced", { feedback: feedback ?? "none" });
              }}
              onRestoreTutorial={(needId) => {
                setRoadmap(null);
                setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
                setLearningPlan((current) =>
                  current ? restorePreviousTutorial(current, needId) : current,
                );
                trackEvent("tutorial_replacement_undone");
              }}
              onSkillStatus={(skillId, status) => {
                setRoadmap(null);
                setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
                setLearningPlan((current) =>
                  current ? markSkillGap(current, skillId, status) : current,
                );
                trackEvent("skill_gap_updated", { status });
              }}
              plan={learningPlan}
              t={t}
            />
          )}

        {projectPath === "design" && roadmap &&
          roadmap.projectInputFingerprint === projectInputFingerprint && (
          <RoadmapResults
            completedStageIds={completedStageIds}
            onEdit={scrollToForm}
            onRegenerate={() => {
              trackEvent("roadmap_regenerated");
              if (
                creativeDnaReview?.confirmed &&
                learningPlan &&
                !creativeDnaIsStale &&
                !learningPlanIsStale
              ) {
                void generateRoadmap(form);
              } else if (creativeDnaReview?.confirmed && !creativeDnaIsStale) {
                void matchTutorials(creativeDnaReview);
              } else {
                void analyzeProject(form);
              }
            }}
            onStartOver={() => {
              if (!window.confirm(t.results.startOverConfirm)) return;
              returnToBeginning();
            }}
            onToggleStage={toggleStage}
            roadmap={roadmap}
            roadmapRequest={form}
            t={t}
            learningPlan={learningPlan}
          />
        )}

        {projectPath === "design" && <ProjectCalendar
          locale={locale}
          onAddTask={(task) => {
            setCalendarTasks((current) => [...current, task]);
            trackEvent("calendar_item_created", {
              taskSource: task.source,
              category: task.category,
            });
          }}
          onDeleteTask={(taskId) =>
            setCalendarTasks((current) =>
              current.filter((task) => task.id !== taskId),
            )
          }
          onToggleTask={toggleCalendarTask}
          onNavigate={(direction) =>
            trackEvent("calendar_navigation_used", { direction })
          }
          t={t}
          tasks={calendarTasks}
        />}

        {projectPath === "agentic_engineering" && engineeringInterpretation && engineeringInterpretationConfirmed && !preparationMethod && (
          <PreparationMethodChoice t={t} value={preparationMethod} onChoose={choosePreparationMethod} />
        )}

        {projectPath === "agentic_engineering" && engineeringGuidedPlan && preparationMethod === "guided_tutorials" && (
          <>
            <EngineeringGuidedPlan
              plan={engineeringGuidedPlan}
              routeEvaluation={guidedRouteEvaluation}
              t={t}
              onStartOver={() => {
                if (!window.confirm(t.results.startOverConfirm)) return;
                returnToBeginning();
              }}
            />
            <ProjectCalendar
              locale={locale}
              onAddTask={(task) => setEngineeringCalendarTasks((current) => [...current, task])}
              onDeleteTask={(taskId) =>
                setEngineeringCalendarTasks((current) =>
                  current.filter((task) => task.id !== taskId),
                )
              }
              onNavigate={(direction) =>
                trackEvent("calendar_navigation_used", {
                  direction,
                  path: "agentic_engineering_guided",
                })
              }
              onToggleTask={toggleEngineeringCalendarTask}
              t={t}
              tasks={engineeringCalendarTasks}
            />
          </>
        )}

        {projectPath === "agentic_engineering" && engineeringRoadmap && preparationMethod === "agentic_project_plan" && (
          <>
            <EngineeringRoadmapResults
              completedTaskIds={engineeringCompletion}
              onStartOver={() => {
                if (!window.confirm(t.results.startOverConfirm)) return;
                returnToBeginning();
              }}
              onToggleTask={toggleEngineeringRoadmapTask}
              roadmap={engineeringRoadmap}
              t={t}
            />
            <ProjectCalendar
              locale={locale}
              onAddTask={(task) => setEngineeringCalendarTasks((current) => [...current, task])}
              onDeleteTask={(taskId) =>
                setEngineeringCalendarTasks((current) =>
                  current.filter((task) => task.id !== taskId),
                )
              }
              onNavigate={(direction) =>
                trackEvent("calendar_navigation_used", {
                  direction,
                  path: "agentic_engineering",
                })
              }
              onToggleTask={toggleEngineeringCalendarTask}
              t={t}
              tasks={engineeringCalendarTasks}
            />
          </>
        )}

        <footer>
          <a className="brand footer-brand" href="#top">QUANDA</a>
          <p>{t.hero.tagline}</p>
          <span>© {new Date().getFullYear()} QUANDA</span>
        </footer>
      </div>
    </main>
  );
}
