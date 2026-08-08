"use client";

import { Box, Check, Clock3, Link2, Wrench } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { RoadmapStage } from "@/src/types";
import type { TutorialRecommendation } from "@/src/lib/tutorialMatcher";
import { TutorialCard } from "./TutorialCard";
import { applicationById } from "@/src/data/applications";

interface RoadmapStageCardProps {
  stage: RoadmapStage;
  isComplete: boolean;
  t: Translation;
  tutorials: TutorialRecommendation[];
  onToggle: () => void;
}

export function RoadmapStageCard({
  stage,
  isComplete,
  t,
  tutorials,
  onToggle,
}: RoadmapStageCardProps) {
  if (isComplete) {
    return (
      <article className="stage-card stage-card-collapsed is-complete">
        <div className="stage-rail" aria-hidden="true">
          <span>{String(stage.order).padStart(2, "0")}</span>
        </div>
        <div className="stage-collapsed-content">
          <div>
            <p className="stage-kicker">{t.results.stage} {stage.order}</p>
            <h3>{stage.title}</h3>
          </div>
          <label className="completion-control">
            <input
              checked
              data-testid="stage-completion"
              onChange={onToggle}
              type="checkbox"
            />
            <span aria-hidden="true"><Check size={15} /></span>
            {t.results.completed}
          </label>
        </div>
      </article>
    );
  }

  return (
    <article className="stage-card">
      <div className="stage-rail" aria-hidden="true">
        <span>{String(stage.order).padStart(2, "0")}</span>
      </div>
      <div className="stage-content">
        <div className="stage-heading">
          <div>
            <p className="stage-kicker">{t.results.stage} {stage.order}</p>
            <h3>{stage.title}</h3>
          </div>
          <label className="completion-control">
            <input
              checked={false}
              data-testid="stage-completion"
              onChange={onToggle}
              type="checkbox"
            />
            <span aria-hidden="true"><Check size={15} /></span>
            {t.results.markComplete}
          </label>
        </div>

        <div className="stage-goal">
          <div>
            <strong>{t.results.goal}</strong>
            <p>{stage.goal}</p>
          </div>
          <div>
            <strong>{t.results.why}</strong>
            <p>{stage.why}</p>
          </div>
        </div>

        <dl className="stage-facts">
          <div>
            <dt><Box aria-hidden="true" size={15} />{t.results.application}</dt>
            <dd>
              {stage.applicationId
                ? applicationById[stage.applicationId]?.name ?? stage.applicationId
                : "—"}
            </dd>
          </div>
          <div>
            <dt><Wrench aria-hidden="true" size={15} />{t.results.skill}</dt>
            <dd>{stage.skillToLearn}</dd>
          </div>
          <div>
            <dt><Clock3 aria-hidden="true" size={15} />{t.results.learning}</dt>
            <dd>{stage.learningMinutes} {t.results.minutes}</dd>
          </div>
          <div>
            <dt><Clock3 aria-hidden="true" size={15} />{t.results.production}</dt>
            <dd>{stage.productionMinutes} {t.results.minutes}</dd>
          </div>
        </dl>

        <div className="stage-lower">
          <div>
            <h4>{t.results.tasks}</h4>
            <ul className="task-list">
              {stage.tasks.map((task) => <li key={task}>{task}</li>)}
            </ul>
            {stage.dependsOnStageIds.length > 0 && (
              <p className="dependencies">
                <Link2 aria-hidden="true" size={14} />
                {t.results.dependencies}: {stage.dependsOnStageIds.join(", ")}
              </p>
            )}
          </div>
          <div className="tutorial-list">
            <h4>{t.results.tutorials}</h4>
            {tutorials.length > 0 ? (
              tutorials.map((tutorial) => (
                <TutorialCard key={tutorial.id} t={t} tutorial={tutorial} />
              ))
            ) : (
              <p className="no-tutorial">{t.results.noTutorial}</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
