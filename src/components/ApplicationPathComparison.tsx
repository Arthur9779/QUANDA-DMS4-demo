import { ArrowRight, Check, Clock3, Scale } from "lucide-react";
import type {
  ApplicationPathComparison,
  ApplicationPathFactor,
  DesignApplicationPathCandidate,
  DesignApplicationPathDecision,
} from "@/src/application-paths";
import type { Translation } from "@/src/i18n/translations";

interface ApplicationPathComparisonProps {
  decision: DesignApplicationPathDecision;
  t: Translation;
}

const factors: ApplicationPathFactor[] = [
  "requirements",
  "deliverableFit",
  "familiarity",
  "techniqueCoverage",
  "tutorialCoverage",
  "switchingCost",
  "deadlineFit",
];

function Route({ candidate }: { candidate: DesignApplicationPathCandidate }) {
  return (
    <div className="application-path-route" aria-label={candidate.applicationNames.join(" to ")}>
      {candidate.applicationNames.map((name, index) => (
        <span key={`${candidate.id}-${name}`}>
          <span className="application-path-app">{name}</span>
          {index < candidate.applicationNames.length - 1 && (
            <ArrowRight aria-hidden="true" size={17} />
          )}
        </span>
      ))}
    </div>
  );
}

function ScoreEvidence({
  candidate,
  t,
}: {
  candidate: DesignApplicationPathCandidate;
  t: Translation;
}) {
  return (
    <div className="application-path-score-grid">
      {factors.map((factor) => {
        const value = candidate.scoreBreakdown[factor];
        return (
          <div className="application-path-factor" key={factor}>
            <div>
              <span>{t.applicationPaths.factorLabels[factor]}</span>
              <strong>{value}</strong>
            </div>
            <span className="application-path-meter" aria-label={`${t.applicationPaths.factorLabels[factor]} ${value} out of 100`}>
              <span style={{ width: `${value}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonProof({
  comparison,
  t,
}: {
  comparison: ApplicationPathComparison;
  t: Translation;
}) {
  return (
    <div className="application-path-proof">
      <strong>{t.applicationPaths.comparedWith}</strong>
      <p>{comparison.summary}</p>
      {comparison.alternativeAdvantages.length > 0 && (
        <p className="application-path-counterpoint">
          <span>{t.applicationPaths.alternativeStrengths}:</span>{" "}
          {comparison.alternativeAdvantages
            .map(({ factor, points }) => `${t.applicationPaths.factorLabels[factor]} +${points}`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}

export function ApplicationPathComparison({ decision, t }: ApplicationPathComparisonProps) {
  const winner = decision.recommended;
  const comparisonByPath = new Map(
    decision.comparisons.map((comparison) => [comparison.alternativePathId, comparison]),
  );

  return (
    <section className="application-path-comparison" id="application-path-comparison">
      <header className="application-path-heading">
        <p className="section-eyebrow">{t.applicationPaths.eyebrow}</p>
        <h2>{t.applicationPaths.title}</h2>
        <p>{t.applicationPaths.intro}</p>
      </header>

      <article className="application-path-winner">
        <div className="application-path-card-head">
          <div>
            <span className="application-path-badge">
              <Check aria-hidden="true" size={16} />
              {t.applicationPaths.recommended}
            </span>
            <Route candidate={winner} />
            <p className="application-path-fit-band">
              {t.applicationPaths.fitBands[winner.fitBand]}
            </p>
          </div>
          <div className="application-path-score">
            <span>{t.applicationPaths.score}</span>
            <strong>{winner.score}</strong>
            <small>/100</small>
          </div>
        </div>

        <div className="application-path-estimates">
          <span>
            <Clock3 aria-hidden="true" size={18} />
            {t.applicationPaths.learningEstimate}: <strong>{winner.estimatedLearningMinutes} {t.applicationPaths.minutes}</strong>
          </span>
          <span>
            <Clock3 aria-hidden="true" size={18} />
            {t.applicationPaths.productionEstimate}: <strong>{winner.estimatedProductionMinutes} {t.applicationPaths.minutes}</strong>
          </span>
        </div>

        {winner.strengths.length > 0 && (
          <div className="application-path-strengths">
            <h3>{t.applicationPaths.whyWins}</h3>
            <ul>
              {winner.strengths.map((strength) => <li key={strength}>{strength}</li>)}
            </ul>
          </div>
        )}

        <details className="application-path-details">
          <summary>
            <Scale aria-hidden="true" size={18} />
            {t.applicationPaths.scoreDetails}
          </summary>
          <ScoreEvidence candidate={winner} t={t} />
        </details>
      </article>

      <div className="application-path-alternatives">
        <h3>{t.applicationPaths.alternatives}</h3>
        {decision.alternatives.length === 0 ? (
          <p>{t.applicationPaths.noAlternatives}</p>
        ) : (
          decision.alternatives.map((alternative) => {
            const comparison = comparisonByPath.get(alternative.id);
            return (
              <details className="application-path-alternative" key={alternative.id}>
                <summary>
                  <span>
                    <Route candidate={alternative} />
                    <small>{t.applicationPaths.fitBands[alternative.fitBand]}</small>
                  </span>
                  <strong>{alternative.score}<small>/100</small></strong>
                </summary>
                <div className="application-path-alternative-body">
                  {comparison && <ComparisonProof comparison={comparison} t={t} />}
                  <div className="application-path-alternative-columns">
                    {alternative.strengths.length > 0 && (
                      <div>
                        <strong>{t.applicationPaths.strengths}</strong>
                        <ul>{alternative.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}
                    {alternative.tradeoffs.length > 0 && (
                      <div>
                        <strong>{t.applicationPaths.tradeoffs}</strong>
                        <ul>{alternative.tradeoffs.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  <ScoreEvidence candidate={alternative} t={t} />
                </div>
              </details>
            );
          })
        )}
      </div>

      <p className="application-path-note">{t.applicationPaths.proofNote}</p>
    </section>
  );
}
