import { CheckCircle2, ExternalLink } from "lucide-react";
import type { EngineeringGuidedPlan as EngineeringGuidedPlanValue } from "@/src/project-path/contracts";
import type { Translation } from "@/src/i18n/translations";

export function EngineeringGuidedPlan({ plan, t, onStartOver }: { plan: EngineeringGuidedPlanValue; t: Translation; onStartOver: () => void }) {
  return (
    <section className="engineering-guided-plan" id="engineering-guided-plan" aria-labelledby="engineering-guided-title">
      <div className="section-heading"><p className="eyebrow">{t.preparation.guidedEyebrow}</p><h2 id="engineering-guided-title">{plan.title}</h2><p>{plan.summary}</p></div>
      <div className="engineering-guided-list">
        {plan.steps.map((step, index) => (
          <article className="engineering-guided-card" key={step.id}>
            <span className="engineering-guided-number">{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{step.title}</h3><p><strong>{t.preparation.outcome}:</strong> {step.outcome}</p><p><strong>{t.preparation.why}:</strong> {step.whyItMatters}</p><h4>{t.preparation.checks}</h4><ul>{step.checks.map((check) => <li key={check}>{check}</li>)}</ul>{step.resources.length > 0 && <div className="engineering-guided-resources"><h4>{t.preparation.resources}</h4>{step.resources.map((resource) => <a href={resource.url} key={resource.url} rel="noreferrer" target="_blank">{resource.label}<ExternalLink aria-hidden="true" size={14} /><small>{resource.reason}</small></a>)}</div>}</div>
          </article>
        ))}
      </div>
      <div className="engineering-guided-footer"><p>{t.preparation.humanNote}</p><button className="button button-secondary" onClick={onStartOver} type="button"><CheckCircle2 aria-hidden="true" size={17} />{t.results.startOver}</button></div>
    </section>
  );
}
