"use client";

import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Translation } from "@/src/i18n/translations";

interface InitialBriefFormProps {
  brief: string;
  t: Translation;
  isSubmitting: boolean;
  embedded?: boolean;
  onChange: (brief: string) => void;
  onSubmit: (brief: string) => void;
}

export function InitialBriefForm({ brief, t, isSubmitting, embedded = false, onChange, onSubmit }: InitialBriefFormProps) {
  const [error, setError] = useState(false);
  const form = (
    <form className="project-form" noValidate onSubmit={(event) => {
      event.preventDefault();
      if (brief.trim().length < 30 || brief.trim().length > 3_000) {
        setError(true);
        return;
      }
      setError(false);
      onSubmit(brief.trim());
    }}>
      {error && <div className="error-summary" role="alert"><strong>{t.form.errorsTitle}</strong><p>{t.form.errors.projectBrief}</p></div>}
      <div className="field field-wide">
        <div className="label-row"><label htmlFor="initialProjectBrief">{t.form.brief}</label><span>{t.form.required}</span></div>
        <textarea aria-describedby="initial-brief-hint" aria-invalid={error} id="initialProjectBrief" maxLength={3_000} onChange={(event) => onChange(event.target.value)} placeholder={t.path.initialBriefPlaceholder} rows={8} value={brief} />
        <div className="field-meta" id="initial-brief-hint"><span>{t.path.initialBriefHint}</span><span>{brief.length}/3,000</span></div>
      </div>
      <div className="form-submit">
        <button className="button button-primary" disabled={isSubmitting} type="submit"><Sparkles aria-hidden="true" size={17} />{t.path.initialSubmit}<ArrowRight aria-hidden="true" size={17} /></button>
        <p><LockKeyhole aria-hidden="true" size={14} />{t.form.privacy}</p>
      </div>
    </form>
  );

  if (embedded) return form;

  return (
    <section className="form-section path-entry-section" id="project-form" aria-labelledby="form-title">
      <div className="form-intro">
        <p className="eyebrow">{t.path.initialEyebrow}</p>
        <h2 id="form-title">{t.path.initialTitle}</h2>
        <p>{t.path.initialIntro}</p>
      </div>
      {form}
    </section>
  );
}
