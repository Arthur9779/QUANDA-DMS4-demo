"use client";

import {
  ArrowUpRight,
  BookOpenCheck,
  Check,
  Clock3,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { SkillGap } from "@/src/contracts/knowledge";
import type { Translation } from "@/src/i18n/translations";
import type { LearningPlan } from "@/src/tutorial-matching";

interface LearningPathReviewProps {
  plan: LearningPlan;
  t: Translation;
  isBusy: boolean;
  onContinue: () => void;
  onReplace: (
    needId: string,
    feedback?: "none" | "too_advanced" | "too_long",
  ) => void;
  onSkillStatus: (skillId: string, status: SkillGap["status"]) => void;
}

export function LearningPathReview({
  plan,
  t,
  isBusy,
  onContinue,
  onReplace,
  onSkillStatus,
}: LearningPathReviewProps) {
  const known = plan.skillGaps.filter((gap) => gap.status === "known");
  const active = plan.skillGaps.filter((gap) =>
    ["needs_learning", "partial"].includes(gap.status),
  );
  const totalMinutes = active.reduce(
    (total, gap) => total + (gap.estimatedLearningMinutes ?? 0),
    0,
  );
  const matchByNeed = new Map(
    plan.tutorialMatches.map((match) => [match.needId, match]),
  );

  return (
    <section
      aria-labelledby="learning-path-title"
      className="learning-path-review"
      id="learning-path-review"
    >
      <header className="learning-review-heading">
        <div>
          <p className="eyebrow">{t.learning.eyebrow}</p>
          <h2 id="learning-path-title">{t.learning.title}</h2>
          <p>{t.learning.intro}</p>
        </div>
        <div className="learning-total">
          <Clock3 aria-hidden="true" size={18} />
          <span>{t.learning.estimate}</span>
          <strong>{totalMinutes} {t.results.minutes}</strong>
        </div>
      </header>

      <section aria-labelledby="known-skills-title" className="known-skills">
        <h3 id="known-skills-title"><Check aria-hidden="true" size={18} />{t.learning.alreadyKnow}</h3>
        {known.length > 0 ? (
          <ul>
            {known.map((gap) => <li key={gap.id}>{gap.label}</li>)}
          </ul>
        ) : (
          <p>{t.learning.knownEmpty}</p>
        )}
      </section>

      <div className="learning-needs-heading">
        <Sparkles aria-hidden="true" size={18} />
        <h3>{t.learning.needForProject}</h3>
      </div>
      <div className="learning-need-list">
        {active.map((gap, index) => {
          const need = plan.tutorialNeeds.find((item) =>
            item.skillIds.includes(gap.skillId),
          );
          const match = need ? matchByNeed.get(need.id) : undefined;
          const selected = match?.candidates.find(
            (candidate) => candidate.tutorial.id === match.selectedTutorialId,
          );
          return (
            <article className="learning-need-card" key={gap.id}>
              <div className="learning-need-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="learning-need-content">
                <header>
                  <div>
                    <span className={`learning-priority priority-${gap.priority}`}>
                      {t.learning[gap.priority]}
                    </span>
                    <h4>{gap.label}</h4>
                    <p>
                      {gap.relatedTechniqueIds.length > 0
                        ? t.learning.skillReason
                        : t.learning.prerequisiteReason}
                    </p>
                  </div>
                  <strong className="learning-minutes">
                    ~{gap.estimatedLearningMinutes ?? 10} {t.results.minutes}
                  </strong>
                </header>

                <div aria-label={gap.label} className="skill-state-controls" role="group">
                  <button
                    onClick={() => onSkillStatus(gap.skillId, "known")}
                    type="button"
                  >
                    {t.learning.alreadyKnowThis}
                  </button>
                  <button
                    aria-pressed={gap.status === "needs_learning"}
                    onClick={() => onSkillStatus(gap.skillId, "needs_learning")}
                    type="button"
                  >
                    {t.learning.needHelp}
                  </button>
                  <button
                    onClick={() => onSkillStatus(gap.skillId, "not_required")}
                    type="button"
                  >
                    {t.learning.notRelevant}
                  </button>
                </div>

                {selected ? (
                  <article className="matched-tutorial-card">
                    <div className="matched-tutorial-icon" aria-hidden="true">
                      <BookOpenCheck size={20} />
                    </div>
                    <div className="matched-tutorial-main">
                      <span className="source-badge">
                        {selected.sourceTier === "curated"
                          ? "QUANDA"
                          : selected.sourceTier === "indexed"
                            ? "INDEXED"
                            : "LIVE"}
                      </span>
                      <h5>{selected.tutorial.title}</h5>
                      <p>{selected.tutorial.creator ?? "YouTube"}</p>
                      <dl>
                        <div>
                          <dt>{t.form.tutorialLanguage}</dt>
                          <dd>{selected.tutorial.language === "vi" ? t.results.languageNames.vi : t.results.languageNames.en}</dd>
                        </div>
                        <div>
                          <dt>{t.results.learning}</dt>
                          <dd>{selected.tutorial.difficulty ? t.results.level[selected.tutorial.difficulty === "mixed" ? "beginner" : selected.tutorial.difficulty] : "—"}</dd>
                        </div>
                        <div>
                          <dt>{t.results.minutes}</dt>
                          <dd>{selected.tutorial.durationMinutes ?? t.results.durationUnknown}</dd>
                        </div>
                      </dl>
                      <div className="tutorial-why">
                        <strong>{t.learning.whyTutorial}</strong>
                        <p>{t.learning.whyTutorialCopy}</p>
                      </div>
                      <div className="tutorial-match-actions">
                        <a href={selected.tutorial.url} rel="noreferrer" target="_blank">
                          {t.learning.useThis}<ArrowUpRight aria-hidden="true" size={14} />
                        </a>
                        <button onClick={() => need && onReplace(need.id)} type="button">
                          <RefreshCw aria-hidden="true" size={13} />{t.learning.replace}
                        </button>
                        <button onClick={() => need && onReplace(need.id, "too_advanced")} type="button">
                          {t.learning.tooAdvanced}
                        </button>
                        <button onClick={() => need && onReplace(need.id, "too_long")} type="button">
                          {t.learning.tooLong}
                        </button>
                      </div>
                      {process.env.NODE_ENV === "development" && (
                        <details className="tutorial-debug">
                          <summary>{t.review.debugDetails}</summary>
                          <code>{selected.tutorial.id} · {selected.score}</code>
                        </details>
                      )}
                    </div>
                  </article>
                ) : (
                  <div className="tutorial-no-match" role="status">
                    <strong>{t.learning.noTutorial}</strong>
                    <p>{t.learning.noTutorialHelp}</p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <footer className="learning-review-footer">
        <p>{t.learning.saved}</p>
        <button
          className="button button-primary"
          disabled={isBusy}
          onClick={onContinue}
          type="button"
        >
          {t.learning.continue}
        </button>
      </footer>
    </section>
  );
}
