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
  readCalendarTasks,
  readCompletion,
  readDraft,
  readCreativeDnaReview,
  readLearningPlan,
  readLanguage,
  readRoadmap,
  writeCompletion,
  writeCalendarTasks,
  writeDraft,
  writeCreativeDnaReview,
  writeLearningPlan,
  writeLanguage,
  writeRoadmap,
} from "@/src/lib/storage";
import { RoadmapResponseSchema } from "@/src/schemas/roadmapResponse";
import { trackEvent } from "@/src/lib/analytics";
import {
  removeRoadmapCalendarTasks,
  syncRoadmapCalendarTasks,
} from "@/src/lib/calendar";
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
  type LearningPlan,
} from "@/src/tutorial-matching";
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

export function QuandaApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [form, setForm] = useState<RoadmapRequest>(() => emptyForm("en"));
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [creativeDnaReview, setCreativeDnaReview] =
    useState<CreativeDnaReviewRecord | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [completion, setCompletion] = useState<Record<string, string[]>>({});
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatchingTutorials, setIsMatchingTutorials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const t = getTranslation(locale);
  const completedStageIds = roadmap ? completion[roadmap.id] ?? [] : [];
  const creativeDnaIsStale = creativeDnaReview
    ? creativeDnaReview.inputFingerprint !== createProjectInputFingerprint(form)
    : false;
  const learningPlanIsStale = learningPlan
    ? learningPlan.inputFingerprint !== createProjectInputFingerprint(form)
    : false;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLocale = readLanguage(window.localStorage);
      const savedDraft = readDraft(window.localStorage);
      const savedRoadmap = readRoadmap(window.localStorage);
      const savedCompletion = readCompletion(window.localStorage);
      const savedCalendarTasks = readCalendarTasks(window.localStorage);
      const restoredLocale =
        savedLocale ?? savedDraft?.interfaceLanguage ?? savedRoadmap?.language ?? "en";
      const restoredForm = savedDraft
        ? { ...savedDraft, interfaceLanguage: restoredLocale }
        : emptyForm(restoredLocale);
      const savedCreativeDnaReview = readCreativeDnaReview(
        window.localStorage,
        restoredForm,
      );
      const savedLearningPlan = readLearningPlan(window.localStorage);

      setLocale(restoredLocale);
      setForm(restoredForm);
      setRoadmap(savedRoadmap);
      setCreativeDnaReview(savedCreativeDnaReview);
      setLearningPlan(
        savedLearningPlan &&
          savedLearningPlan.inputFingerprint ===
            createProjectInputFingerprint(restoredForm)
          ? savedLearningPlan
          : null,
      );
      setCompletion(savedCompletion);
      setCalendarTasks(
        savedRoadmap
          ? syncRoadmapCalendarTasks(
              savedCalendarTasks,
              savedRoadmap,
              restoredForm.deadline,
              savedCompletion[savedRoadmap.id] ?? [],
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
    if (isHydrated && roadmap) {
      writeRoadmap(window.localStorage, roadmap);
    }
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
    if (isHydrated) {
      writeCompletion(window.localStorage, completion);
    }
  }, [completion, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      writeCalendarTasks(window.localStorage, calendarTasks);
    }
  }, [calendarTasks, isHydrated]);

  const changeLanguage = (nextLocale: Locale) => {
    setLocale(nextLocale);
    trackEvent("language_changed", { language: nextLocale });
    const nextForm = { ...form, interfaceLanguage: nextLocale };
    setForm(nextForm);
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
    }
  };

  const scrollToForm = () => {
    document.querySelector("#project-form")?.scrollIntoView({ behavior: "smooth" });
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
        body: JSON.stringify(request),
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

        <section className={`hero hero-${locale}`} aria-labelledby="hero-title">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1 id="hero-title">
            {t.hero.titleLead} <em>{t.hero.titleAccent}</em>
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

        <ProjectBriefForm
          isSubmitting={isLoading || isAnalyzing || isMatchingTutorials || !isHydrated}
          onChange={setForm}
          onSubmit={(request) => void analyzeProject(request)}
          t={t}
          value={form}
        />

        <div aria-live="polite">
          {isAnalyzing && <LoadingAnalysis t={t} />}
          {isMatchingTutorials && <LoadingLearningPath t={t} />}
          {analysisError && (
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
          {matchingError && (
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
          {isLoading && <LoadingRoadmap t={t} />}
          {error && (
            <div className="api-error" role="alert">
              <strong>{t.form.errorsTitle}</strong>
              <p>{error}</p>
            </div>
          )}
        </div>

        {creativeDnaReview && !isAnalyzing && !isMatchingTutorials && (
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

        {learningPlan &&
          creativeDnaReview?.confirmed &&
          !learningPlanIsStale &&
          !isMatchingTutorials && (
            <LearningPathReview
              isBusy={isLoading}
              onContinue={() => void generateRoadmap(form)}
              onReplace={(needId, feedback) => {
                setLearningPlan((current) =>
                  current ? replaceTutorial(current, needId, feedback) : current,
                );
                trackEvent("tutorial_replaced", { feedback: feedback ?? "none" });
              }}
              onSkillStatus={(skillId, status) => {
                setLearningPlan((current) =>
                  current ? markSkillGap(current, skillId, status) : current,
                );
                trackEvent("skill_gap_updated", { status });
              }}
              plan={learningPlan}
              t={t}
            />
          )}

        {roadmap && (
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
              clearProjectStorage(window.localStorage);
              setForm(emptyForm(locale));
              setRoadmap(null);
              setCreativeDnaReview(null);
              setLearningPlan(null);
              setCompletion({});
              setCalendarTasks((current) => removeRoadmapCalendarTasks(current));
              setError(null);
              setAnalysisError(null);
              setMatchingError(null);
              writeLanguage(window.localStorage, locale);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onToggleStage={toggleStage}
            roadmap={roadmap}
            roadmapRequest={form}
            t={t}
            tutorialLanguage={form.tutorialLanguage}
          />
        )}

        <ProjectCalendar
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
        />

        <footer>
          <a className="brand footer-brand" href="#top">QUANDA</a>
          <p>{t.hero.tagline}</p>
          <span>© {new Date().getFullYear()} QUANDA</span>
        </footer>
      </div>
    </main>
  );
}
