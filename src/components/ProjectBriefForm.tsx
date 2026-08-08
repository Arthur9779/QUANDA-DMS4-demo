"use client";

import { ArrowRight, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import { RoadmapRequestSchema } from "@/src/schemas/roadmapRequest";
import type { RoadmapRequest } from "@/src/types";
import { applications } from "@/src/data/applications";
import { toLocalDateKey } from "@/src/lib/date";

interface ProjectBriefFormProps {
  value: RoadmapRequest;
  t: Translation;
  onChange: (value: RoadmapRequest) => void;
  onSubmit: (value: RoadmapRequest) => void;
  demoMode: boolean;
  isSubmitting: boolean;
}

export function ProjectBriefForm({
  value,
  t,
  onChange,
  onSubmit,
  demoMode,
  isSubmitting,
}: ProjectBriefFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <Key extends keyof RoadmapRequest>(
    key: Key,
    nextValue: RoadmapRequest[Key],
  ) => onChange({ ...value, [key]: nextValue });

  const toggleApplication = (applicationId: string) => {
    const hasApplication = value.requiredApplications.includes(applicationId);
    update(
      "requiredApplications",
      hasApplication
        ? value.requiredApplications.filter((item) => item !== applicationId)
        : [...value.requiredApplications, applicationId],
    );
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = RoadmapRequestSchema.safeParse(value);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "generic");
        nextErrors[field] =
          t.form.errors[field as keyof typeof t.form.errors] ??
          t.form.errors.generic;
      }
      setErrors(nextErrors);
      requestAnimationFrame(() => {
        document.querySelector("#form-errors")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <section className="form-section" id="project-form" aria-labelledby="form-title">
      <div className="form-intro">
        <p className="eyebrow">{t.form.eyebrow}</p>
        <h2 id="form-title">{t.form.title}</h2>
        <p>{t.form.intro}</p>
        {demoMode && (
          <div className="form-note">
            <span className="asterisk" aria-hidden="true">✦</span>
            <div>
              <strong>{t.form.demoBadge}</strong>
              <p>{t.form.demoDescription}</p>
            </div>
          </div>
        )}
      </div>

      <form className="project-form" onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && (
          <div className="error-summary" id="form-errors" role="alert" tabIndex={-1}>
            <strong>{t.form.errorsTitle}</strong>
            <ul>
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="field field-wide">
          <div className="label-row">
            <label htmlFor="projectBrief">{t.form.brief}</label>
            <span>{t.form.required}</span>
          </div>
          <textarea
            aria-describedby="brief-hint brief-error"
            aria-invalid={Boolean(errors.projectBrief)}
            id="projectBrief"
            maxLength={2000}
            onChange={(event) => update("projectBrief", event.target.value)}
            placeholder={t.form.briefPlaceholder}
            rows={7}
            value={value.projectBrief}
          />
          <div className="field-meta" id="brief-hint">
            <span>{t.form.briefHint}</span>
            <span>{value.projectBrief.length}/2,000</span>
          </div>
          {errors.projectBrief && (
            <p className="field-error" id="brief-error">{errors.projectBrief}</p>
          )}
        </div>

        <div className="form-grid">
          <div className="field">
            <div className="label-row">
              <label htmlFor="deadline">{t.form.deadline}</label>
              <span>{t.form.required}</span>
            </div>
            <input
              aria-invalid={Boolean(errors.deadline)}
              id="deadline"
              min={toLocalDateKey(new Date())}
              onChange={(event) => update("deadline", event.target.value)}
              type="date"
              value={value.deadline}
            />
            {errors.deadline && <p className="field-error">{errors.deadline}</p>}
          </div>

          <div className="field">
            <div className="label-row">
              <label htmlFor="experience">{t.form.experience}</label>
              <span>{t.form.required}</span>
            </div>
            <textarea
              aria-invalid={Boolean(errors.currentExperience)}
              id="experience"
              maxLength={1000}
              onChange={(event) => update("currentExperience", event.target.value)}
              placeholder={t.form.experiencePlaceholder}
              rows={3}
              value={value.currentExperience}
            />
            {errors.currentExperience && (
              <p className="field-error">{errors.currentExperience}</p>
            )}
          </div>
        </div>

        <fieldset>
          <legend>
            <Clock3 aria-hidden="true" size={17} />
            {t.form.availableStudyTime}
          </legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="hoursPerDay">{t.form.hoursPerDay}</label>
              <input
                aria-invalid={Boolean(errors.hoursPerDay)}
                id="hoursPerDay"
                max="12"
                min="0.5"
                onChange={(event) => update("hoursPerDay", Number(event.target.value))}
                step="0.5"
                type="number"
                value={value.hoursPerDay}
              />
              {errors.hoursPerDay && (
                <p className="field-error">{errors.hoursPerDay}</p>
              )}
            </div>
            <div className="field">
              <label htmlFor="daysPerWeek">{t.form.daysPerWeek}</label>
              <input
                aria-invalid={Boolean(errors.daysPerWeek)}
                id="daysPerWeek"
                max="7"
                min="1"
                onChange={(event) => update("daysPerWeek", Number(event.target.value))}
                step="1"
                type="number"
                value={value.daysPerWeek}
              />
              {errors.daysPerWeek && (
                <p className="field-error">{errors.daysPerWeek}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="tutorialLanguage">{t.form.tutorialLanguage}</label>
            <select
              id="tutorialLanguage"
              onChange={(event) =>
                update(
                  "tutorialLanguage",
                  event.target.value as RoadmapRequest["tutorialLanguage"],
                )
              }
              value={value.tutorialLanguage}
            >
              {t.form.tutorialOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <div className="label-row">
              <label htmlFor="outputType">{t.form.outputType}</label>
              <span>{t.form.optional}</span>
            </div>
            <select
              id="outputType"
              onChange={(event) =>
                update("outputType", event.target.value as RoadmapRequest["outputType"])
              }
              value={value.outputType}
            >
              {t.form.outputOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend>{t.form.applications} <small>{t.form.optional}</small></legend>
          <label className="check-pill">
            <input
              checked={value.requiredApplications.length === 0}
              onChange={() => update("requiredApplications", [])}
              type="checkbox"
            />
            <span>{t.form.noApplication}</span>
          </label>
          <div className="application-grid">
            {applications.map((application) => (
              <label className="check-pill" key={application.id}>
                <input
                  checked={value.requiredApplications.includes(application.id)}
                  onChange={() => toggleApplication(application.id)}
                  type="checkbox"
                />
                <span>{application.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{t.form.targetQuality} <small>{t.form.optional}</small></legend>
          <div className="choice-row">
            {t.form.qualityOptions.map((option) => (
              <label className="choice-card" key={option.value}>
                <input
                  checked={value.targetQuality === option.value}
                  name="targetQuality"
                  onChange={() =>
                    update(
                      "targetQuality",
                      option.value as RoadmapRequest["targetQuality"],
                    )
                  }
                  type="radio"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-submit">
          <button
            aria-disabled={isSubmitting}
            className="button button-primary"
            disabled={isSubmitting}
            type="submit"
          >
            <Sparkles aria-hidden="true" size={17} />
            {t.form.submit}
            <ArrowRight aria-hidden="true" size={17} />
          </button>
          <p>
            <LockKeyhole aria-hidden="true" size={14} />
            {t.form.privacy}
          </p>
        </div>
      </form>
    </section>
  );
}
