"use client";

import { ArrowDown, ArrowRight, BookOpenCheck, ListChecks, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
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
import { EngineeringInterpretation } from "./EngineeringInterpretation";
import { EngineeringRoadmapResults } from "./EngineeringRoadmapResults";
import { EngineeringGuidedPlan } from "./EngineeringGuidedPlan";
import { PreparationMethodChoice } from "./PreparationMethodChoice";
import { WorkflowProgress } from "./WorkflowProgress";
import { RoadmapResults } from "./RoadmapResults";
import { ProjectCalendar } from "./ProjectCalendar";
import { CreativeDnaReview } from "./CreativeDnaReview";
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
  removeRoadmapCalendarTasks,
  syncRoadmapCalendarTasks,
} from "@/src/lib/calendar";
import {
  removeEngineeringRoadmapCalendarTasks,
  syncEngineeringRoadmapCalendarTasks,
} from "@/src/lib/engineering-calendar";
import { toLocalDateKey } from "@/src/lib/date";
import {
  CREATIVE_DNA_REVIEW_VERSION,
  createProjectInputFingerprint,
  addOntologyConcept,
  addUnknownConcept,
  confirmCreativeDna,
  mergeReviewOverrides,
  rejectConcept,
  rejectConstraint,
  rejectUnknownConcept,
  restoreConcept,
  updateProjectIntent,
  type CreativeDnaReviewRecord,
  type OntologySearchResult,
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
  const t = getTranslation(locale);
  const projectInputFingerprint = createProjectInputFingerprint(form);
  const completedStageIds = roadmap ? completion[roadmap.id] ?? [] : [];
  const creativeDnaIsStale = creativeDnaReview
    ? creativeDnaReview.inputFingerprint !== projectInputFingerprint
    : false;
  const learningPlanIsStale = learningPlan
    ? learningPlan.inputFingerprint !== projectInputFingerprint
    : false;
  const workflowStage: 0 | 1 | 2 | 3 = projectPath === "design"
    ? roadmap ? 3 : learningPlan ? 2 : creativeDnaReview ? 1 : 0
    : projectPath === "agentic_engineering"
      ? engineeringRoadmap || engineeringGuidedPlan ? 3 : preparationMethod ? 2 : engineeringInterpretation ? 1 : 0
      : 0;

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
      setEngineeringCalendarTasks(
        savedEngineeringRoadmap
          ? syncEngineeringRoadmapCalendarTasks(
              savedEngineeringCalendarTasks,
              savedEngineeringRoadmap,
              savedEngineeringDraft?.deadline ?? emptyEngineeringForm(restoredLocale).deadline,
              savedEngineeringCompletion,
            )
          : removeEngineeringRoadmapCalendarTasks(savedEngineeringCalendarTasks),
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

  const changeLanguage = (nextLocale: Locale) => {
    setLocale(nextLocale);
    trackEvent("language_changed", { language: nextLocale });
    const nextForm = { ...form, interfaceLanguage: nextLocale };
    setForm(nextForm);
    setEngineeringForm((current) => ({ ...current, interfaceLanguage: nextLocale }));
    if (projectPath === "agentic_engineering" && engineeringRoadmap) {
      setEngineeringRoadmap((current) => current ? { ...current, language: nextLocale } : current);
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
    const classification = classifyProjectPath(brief);
    setPathClassification(classification);
    if (classification.path !== "clarification") selectPath(classification.path, brief);
    else setForm((current) => ({ ...current, projectBrief: brief }));
  };

  const returnToBeginning = () => {
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
    setLearningPlan(null);
    setCompletion({});
    setCalendarTasks([]);
    setError(null);
    setAnalysisError(null);
    setMatchingError(null);
    setEngineeringError(null);
    clearPreparationState(window.localStorage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const interpretEngineering = async (request: EngineeringProject) => {
    setEngineeringForm(request);
    setEngineeringError(null);
    setEngineeringInterpretation(null);
    setEngineeringRoadmap(null);
    setEngineeringCalendarTasks((current) => removeEngineeringRoadmapCalendarTasks(current));
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
    } catch {
      setEngineeringInterpretation({ ...local, source: "fallback" });
      setEngineeringError(t.errors.networkFallback);
    }
    requestAnimationFrame(() => document.querySelector("#engineering-interpretation")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const generateEngineering = async (method: PreparationMethod = preparationMethod ?? "guided_tutorials") => {
    if (!engineeringInterpretation || method !== "agentic_project_plan") return;
    setEngineeringError(null);
    let finalRoadmap: EngineeringRoadmap;
    try {
      const response = await fetch("/api/engineering/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: engineeringForm, interpretation: engineeringInterpretation }),
      });
      if (!response.ok) throw new Error("engineering_roadmap_failed");
      const parsed = EngineeringRoadmapSchema.parse(await response.json());
      finalRoadmap = parsed;
    } catch {
      finalRoadmap = generateEngineeringRoadmap(engineeringForm, engineeringInterpretation, {
        source: "fallback",
        notice: t.engineering.notice,
      });
    }
    setEngineeringRoadmap(finalRoadmap);
    setEngineeringCalendarTasks((current) =>
      syncEngineeringRoadmapCalendarTasks(
        current,
        finalRoadmap,
        engineeringForm.deadline,
        engineeringCompletion,
      ),
    );
    requestAnimationFrame(() => document.querySelector("#engineering-roadmap-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const choosePreparationMethod = (method: PreparationMethod) => {
    if (!engineeringInterpretation || !engineeringInterpretationConfirmed) return;
    setPreparationMethod(method);
    setEngineeringRoadmap(null);
    setEngineeringGuidedPlan(null);
    setEngineeringCompletion([]);
    setEngineeringCalendarTasks((current) => removeEngineeringRoadmapCalendarTasks(current));
    clearPreparationState(window.localStorage);
    writePreparationMethod(window.localStorage, method);
    if (method === "guided_tutorials") {
      const plan = generateEngineeringGuidedPlan(engineeringForm, engineeringInterpretation);
      setEngineeringGuidedPlan(plan);
      writeEngineeringGuidedPlan(window.localStorage, plan);
      requestAnimationFrame(() => document.querySelector("#engineering-guided-plan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    requestAnimationFrame(() => document.querySelector("#engineering-roadmap-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    void generateEngineering(method);
  };

  const loadExample = () => {
    const nextForm: RoadmapRequest = {
      ...emptyForm(locale),
      projectBrief:
        locale === "en"
          ? "I need to create a 20-second product animation for a university assignment. I know Photoshop at an intermediate level, but I have never used Blender. The project is due in seven days. The final output should be a 1080p MP4 with simple sound."
          : "Tôi cần làm một video hoạt hình sản phẩm dài 20 giây cho bài tập đại học. Tôi sử dụng Photoshop ở mức trung cấp nhưng chưa từng dùng Blender. Dự án phải hoàn thành trong bảy ngày. Sản phẩm cuối là video MP4 1080p có âm thanh đơn giản.",
      currentExperience:
        locale === "en"
          ? "Photoshop: intermediate; Blender: complete beginner"
          : "Photoshop: trung cấp; Blender: chưa từng sử dụng",
      requiredApplications: ["blender"],
      outputType: "video",
      targetQuality: "basic",
    };
    setForm(nextForm);
    setProjectPath("design");
    setPathClassification({ path: "design", confidence: 0.99, reason: "The loaded example explicitly asks for a product animation.", signals: ["creative deliverable"] });
    clearProjectPath(window.localStorage);
    writeProjectPath(window.localStorage, "design");
    clearEngineeringState(window.localStorage);
    setEngineeringRoadmap(null);
    setEngineeringInterpretation(null);
    setPreparationMethod(null);
    setEngineeringGuidedPlan(null);
    setEngineeringInterpretationConfirmed(false);
    setEngineeringCompletion([]);
    setEngineeringCalendarTasks([]);
    setRoadmap(null);
    setCreativeDnaReview(null);
    clearCreativeDnaReview(window.localStorage);
    setLearningPlan(null);
    clearLearningPlan(window.localStorage);
    setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    setError(null);
    setAnalysisError(null);
    setMatchingError(null);
    requestAnimationFrame(scrollToForm);
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

      const creativeDna = mergeReviewOverrides(
        creativeDnaReview?.analysis.creativeDna ?? null,
        parsed.data.creativeDna,
      );
      const review: CreativeDnaReviewRecord = {
        reviewVersion: CREATIVE_DNA_REVIEW_VERSION,
        inputFingerprint: createProjectInputFingerprint(request),
        analysis: { ...parsed.data, creativeDna },
        confirmed: false,
      };
      setCreativeDnaReview(review);
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
      window.setTimeout(() => {
        document.querySelector("#creative-dna-review")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    } catch {
      setAnalysisError(getTranslation(request.interfaceLanguage).review.errorMessage);
    } finally {
      window.clearTimeout(timeout);
      setIsAnalyzing(false);
    }
  };

  const updateCreativeDna = (
    operation: (
      creativeDna: CreativeDnaReviewRecord["analysis"]["creativeDna"],
    ) => CreativeDnaReviewRecord["analysis"]["creativeDna"],
  ) => {
    setRoadmap(null);
    setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
    setLearningPlan(null);
    clearLearningPlan(window.localStorage);
    setCreativeDnaReview((current) =>
      current
        ? {
            ...current,
            analysis: {
              ...current.analysis,
              creativeDna: operation(current.analysis.creativeDna),
            },
            confirmed: false,
          }
        : current,
    );
  };

  const matchTutorials = async (review: CreativeDnaReviewRecord) => {
    setIsMatchingTutorials(true);
    setMatchingError(null);
    setRoadmap(null);
    trackEvent("tutorial_matching_started", {
      language: form.tutorialLanguage,
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
        body: JSON.stringify({ project: form, review }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`tutorial_matching_${response.status}`);
      const parsed = LearningPlanSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("tutorial_matching_invalid");
      const next = mergeLearningDecisions(learningPlan, parsed.data);
      setLearningPlan(next);
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

  const confirmCreativeDnaReview = () => {
    if (!creativeDnaReview) return;
    const confirmedReview: CreativeDnaReviewRecord = {
      ...creativeDnaReview,
      analysis: {
        ...creativeDnaReview.analysis,
        creativeDna: confirmCreativeDna(creativeDnaReview.analysis.creativeDna),
      },
      confirmed: true,
    };
    setCreativeDnaReview(confirmedReview);
    writeCreativeDnaReview(window.localStorage, confirmedReview);
    trackEvent("creative_dna_confirmed", {
      conceptCount: confirmedReview.analysis.creativeDna.concepts.length,
    });
    void matchTutorials(confirmedReview);
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
        const finalRoadmap = generatedRoadmap;
        setRoadmap(finalRoadmap);
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
      return {
        ...current,
        [roadmap.id]: isCompleting
          ? [...new Set([...roadmapCompletion, stageId])]
          : roadmapCompletion.filter((id) => id !== stageId),
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
      <div className="page-shell">
        <Header
          isReady={isHydrated}
          locale={locale}
          t={t}
          onLanguageChange={changeLanguage}
          onLoadExample={loadExample}
        />
        {projectPath && <WorkflowProgress stage={workflowStage} t={t} />}

        <section className={`hero hero-${locale}`} aria-labelledby="hero-title">
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

        {!projectPath && !pathClassification && (
          <InitialBriefForm
            brief={form.projectBrief}
            isSubmitting={!isHydrated}
            onChange={(brief) => setForm((current) => ({ ...current, projectBrief: brief }))}
            onSubmit={submitInitialBrief}
            t={t}
          />
        )}

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
              setEngineeringCalendarTasks((current) => removeEngineeringRoadmapCalendarTasks(current));
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

        {projectPath === "design" && creativeDnaReview && !isAnalyzing && !isMatchingTutorials && (
          <CreativeDnaReview
            creativeDna={creativeDnaReview.analysis.creativeDna}
            isBusy={isLoading || isAnalyzing || isMatchingTutorials}
            isFallback={creativeDnaReview.analysis.source === "fallback"}
            isStale={creativeDnaIsStale}
            onAddOntology={(node: OntologySearchResult) => {
              updateCreativeDna((creativeDna) => addOntologyConcept(creativeDna, node));
              trackEvent("creative_dna_concept_added", {
                family: node.family,
                category: node.category,
              });
            }}
            onAddUnknown={(wording) => {
              updateCreativeDna((creativeDna) => addUnknownConcept(creativeDna, wording));
              trackEvent("creative_dna_unknown_added");
            }}
            onConfirm={confirmCreativeDnaReview}
            onEditDetails={scrollToForm}
            onIntentChange={(intent) =>
              updateCreativeDna((creativeDna) => updateProjectIntent(creativeDna, intent))
            }
            onReanalyze={() => {
              trackEvent("creative_dna_reanalysis_requested");
              void analyzeProject(form);
            }}
            onRejectConcept={(identity, deliberate) => {
              updateCreativeDna((creativeDna) =>
                rejectConcept(creativeDna, identity, {
                  allowExplicitRequirement: deliberate,
                }),
              );
              trackEvent("creative_dna_concept_removed", {
                explicitOverride: Boolean(deliberate),
              });
            }}
            onRejectConstraint={(identity, deliberate) =>
              updateCreativeDna((creativeDna) =>
                rejectConstraint(creativeDna, identity, {
                  allowExplicitRequirement: deliberate,
                }),
              )
            }
            onRejectUnknown={(identity) => {
              updateCreativeDna((creativeDna) =>
                rejectUnknownConcept(creativeDna, identity),
              );
              trackEvent("creative_dna_concept_removed", {
                explicitOverride: false,
              });
            }}
            onRestore={(identity) =>
              updateCreativeDna((creativeDna) => restoreConcept(creativeDna, identity))
            }
            t={t}
          />
        )}

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
          onAddTask={(task) => setCalendarTasks((current) => [...current, task])}
          onDeleteTask={(taskId) =>
            setCalendarTasks((current) =>
              current.filter((task) => task.id !== taskId),
            )
          }
          onToggleTask={toggleCalendarTask}
          t={t}
          tasks={calendarTasks}
        />}

        {projectPath === "agentic_engineering" && engineeringInterpretation && !engineeringInterpretationConfirmed && !preparationMethod && (
          <EngineeringInterpretation
            isBusy={Boolean(engineeringRoadmap) || Boolean(engineeringGuidedPlan)}
            onChange={(next) => setEngineeringInterpretation(next)}
            onConfirm={() => {
              setEngineeringInterpretationConfirmed(true);
              requestAnimationFrame(() => document.querySelector("#preparation-method")?.scrollIntoView({ behavior: "smooth", block: "start" }));
            }}
            onEdit={() => {
              setEngineeringInterpretation(null);
              setEngineeringInterpretationConfirmed(false);
              requestAnimationFrame(() => document.querySelector("#engineering-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
            }}
            t={t}
            value={engineeringInterpretation}
          />
        )}

        {projectPath === "agentic_engineering" && engineeringInterpretation && engineeringInterpretationConfirmed && !preparationMethod && (
          <PreparationMethodChoice t={t} value={preparationMethod} onChoose={choosePreparationMethod} />
        )}

        {projectPath === "agentic_engineering" && engineeringGuidedPlan && preparationMethod === "guided_tutorials" && (
          <EngineeringGuidedPlan plan={engineeringGuidedPlan} t={t} onStartOver={() => {
            if (!window.confirm(t.results.startOverConfirm)) return;
            returnToBeginning();
          }} />
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
