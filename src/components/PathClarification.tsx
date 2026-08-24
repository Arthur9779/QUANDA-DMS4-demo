"use client";

import { ArrowRight, Palette, TerminalSquare } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { ProjectPath } from "@/src/project-path";

export function PathClarification({ t, onChoose }: { t: Translation; onChoose: (path: ProjectPath) => void }) {
  return (
    <section className="path-clarification" aria-labelledby="path-clarification-title">
      <p className="eyebrow">{t.path.clarificationTitle}</p>
      <h2 id="path-clarification-title">{t.path.initialTitle}</h2>
      <p>{t.path.clarificationIntro}</p>
      <div className="path-choice-grid">
        <button className="path-choice-card" onClick={() => onChoose("design")} type="button">
          <Palette aria-hidden="true" size={24} /><span>{t.path.creativeChoice}</span><small>{t.path.designDescription}</small><ArrowRight aria-hidden="true" size={18} />
        </button>
        <button className="path-choice-card" onClick={() => onChoose("agentic_engineering")} type="button">
          <TerminalSquare aria-hidden="true" size={24} /><span>{t.path.engineeringChoice}</span><small>{t.path.engineeringDescription}</small><ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>
    </section>
  );
}
