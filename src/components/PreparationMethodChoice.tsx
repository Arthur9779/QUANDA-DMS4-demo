import { ArrowRight, BookOpenCheck, Bot } from "lucide-react";
import type { PreparationMethod } from "@/src/project-path/contracts";
import type { Translation } from "@/src/i18n/translations";

export function PreparationMethodChoice({
  t,
  value,
  onChoose,
}: {
  t: Translation;
  value: PreparationMethod | null;
  onChoose: (method: PreparationMethod) => void;
}) {
  return (
    <section className="preparation-choice" id="preparation-method" aria-labelledby="preparation-method-title">
      <div className="section-heading">
        <p className="eyebrow">{t.preparation.eyebrow}</p>
        <h2 id="preparation-method-title">{t.preparation.title}</h2>
        <p>{t.preparation.intro}</p>
      </div>
      <div className="preparation-choice-grid">
        <button className={`preparation-choice-card${value === "guided_tutorials" ? " is-selected" : ""}`} onClick={() => onChoose("guided_tutorials")} type="button" aria-pressed={value === "guided_tutorials"}>
          <BookOpenCheck aria-hidden="true" size={24} />
          <strong>{t.preparation.guidedTitle}</strong>
          <span>{t.preparation.guidedDescription}</span>
          <small>{t.preparation.guidedDetail}</small>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
        <button className={`preparation-choice-card${value === "agentic_project_plan" ? " is-selected" : ""}`} onClick={() => onChoose("agentic_project_plan")} type="button" aria-pressed={value === "agentic_project_plan"}>
          <Bot aria-hidden="true" size={24} />
          <strong>{t.preparation.agenticTitle}</strong>
          <span>{t.preparation.agenticDescription}</span>
          <small>{t.preparation.agenticDetail}</small>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>
      {value && <p className="preparation-choice-note" role="status">{t.preparation.selectedNote}</p>}
    </section>
  );
}
