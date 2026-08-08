"use client";

import { ArrowLeft, Clock3, RotateCcw, Sprout, Trash2 } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { RoadmapResponse, TutorialLanguage } from "@/src/types";
import { FeasibilityCard } from "./FeasibilityCard";
import { RoadmapStageCard } from "./RoadmapStageCard";
import { resolveRoadmapTutorialRecommendations } from "@/src/lib/tutorialMatcher";

interface RoadmapResultsProps {
  roadmap: RoadmapResponse;
  completedStageIds: string[];
  t: Translation;
  tutorialLanguage: TutorialLanguage;
  onEdit: () => void;
  onRegenerate: () => void;
  onStartOver: () => void;
  onToggleStage: (stageId: string) => void;
}

function formatTotal(minutes: number, t: Translation) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest
    ? `${hours} ${t.results.hours} ${rest} ${t.results.minutes}`
    : `${hours} ${t.results.hours}`;
}

export function RoadmapResults({
  roadmap,
  completedStageIds,
  t,
  tutorialLanguage,
  onEdit,
  onRegenerate,
  onStartOver,
  onToggleStage,
}: RoadmapResultsProps) {
  const allComplete =
    roadmap.stages.length > 0 &&
    roadmap.stages.every((stage) => completedStageIds.includes(stage.id));
  const tutorialsByStage = resolveRoadmapTutorialRecommendations(
    roadmap.stages,
    tutorialLanguage,
    roadmap.language,
  );

  return (
    <section className="results-section" id="roadmap-results" aria-labelledby="roadmap-title">
      <div className="results-hero">
        <div>
          <div className="results-labels">
            <p className="eyebrow">{t.results.eyebrow}</p>
            {roadmap.source === "demo" && <span className="demo-badge">{t.results.demo}</span>}
          </div>
          <h2 id="roadmap-title">{roadmap.title}</h2>
          <p className="results-summary">{roadmap.summary}</p>
        </div>
        <div className="total-card">
          <Clock3 aria-hidden="true" size={19} />
          <span>{t.results.totalTime}</span>
          <strong>{formatTotal(roadmap.totalEstimatedMinutes, t)}</strong>
        </div>
      </div>

      <FeasibilityCard feasibility={roadmap.feasibility} t={t} />

      {roadmap.notice && (
        <p className="fallback-notice" role="status">{roadmap.notice}</p>
      )}

      {allComplete && (
        <div className="success-state" role="status">
          <Sprout aria-hidden="true" size={24} />
          <div>
            <strong>{t.results.completeTitle}</strong>
            <p>{t.results.completeMessage}</p>
          </div>
        </div>
      )}

      <div className="timeline" aria-label={t.results.eyebrow}>
        {roadmap.stages.map((stage) => (
          <RoadmapStageCard
            isComplete={completedStageIds.includes(stage.id)}
            key={stage.id}
            onToggle={() => onToggleStage(stage.id)}
            stage={stage}
            t={t}
            tutorials={tutorialsByStage[stage.id] ?? []}
          />
        ))}
      </div>

      <div className="results-grid">
        <section className="schedule-card">
          <h3>{t.results.schedule}</h3>
          <ol>
            {roadmap.schedule.map((item) => (
              <li key={`${item.label}-${item.stageIds.join("-")}`}>
                <span>{item.label}</span>
                <strong>{item.plannedMinutes} {t.results.minutes}</strong>
                <small>{t.results.priority[item.priority]}</small>
              </li>
            ))}
          </ol>
        </section>
        <div className="notes-column">
          <section className="note-card">
            <h3>{t.results.assumptions}</h3>
            <ul>{roadmap.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {roadmap.warnings.length > 0 && (
            <section className="note-card warning-card">
              <h3>{t.results.warnings}</h3>
              <ul>{roadmap.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}
        </div>
      </div>

      <div className="results-actions">
        <button className="button button-secondary" onClick={onEdit} type="button">
          <ArrowLeft aria-hidden="true" size={16} />{t.results.edit}
        </button>
        <button className="button button-secondary" onClick={onRegenerate} type="button">
          <RotateCcw aria-hidden="true" size={16} />{t.results.regenerate}
        </button>
        <button className="button button-text" onClick={onStartOver} type="button">
          <Trash2 aria-hidden="true" size={16} />{t.results.startOver}
        </button>
      </div>
    </section>
  );
}
