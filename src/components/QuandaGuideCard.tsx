import { CheckCircle2, Compass, ShieldCheck } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { QuandaGuide } from "@/src/lib/quandaGuide";

interface QuandaGuideCardProps {
  guide: QuandaGuide;
  stageId: string;
  t: Translation;
}

export function QuandaGuideCard({ guide, stageId, t }: QuandaGuideCardProps) {
  const titleId = `${stageId}-quanda-guide-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="quanda-guide"
      data-guide-kind={guide.kind}
      data-testid="quanda-guide"
    >
      <p className="guide-tutorial-status" data-testid="tutorial-status">
        <ShieldCheck aria-hidden="true" size={16} />
        {guide.tutorialStatus === "not-needed"
          ? t.results.guideNoVideoNeeded
          : t.results.noTutorial}
      </p>
      <div className="guide-heading">
        <span aria-hidden="true"><Compass size={20} /></span>
        <h4 id={titleId}>{t.results.quandaGuide}</h4>
      </div>
      <div className="guide-layout">
        <div>
          <h5>{t.results.guideSteps}</h5>
          <ol className="guide-steps">
            {guide.steps.map((step, index) => (
              <li key={`${index}-${step}`}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="guide-review">
          <section className="guide-done">
            <h5><CheckCircle2 aria-hidden="true" size={16} />{t.results.guideDoneWhen}</h5>
            <p>{guide.doneWhen}</p>
          </section>
          <section>
            <h5>{t.results.guideChecks}</h5>
            <ul>
              {guide.checks.map((check) => <li key={check}>{check}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
