"use client";

import { ArrowRight, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import { EngineeringProjectSchema, type EngineeringProject } from "@/src/project-path/contracts";
import { toLocalDateKey } from "@/src/lib/date";
import type { OutputType } from "@/src/types";
import { OutputTypeCustomizer } from "./OutputTypeCustomizer";

interface EngineeringProjectFormProps {
  value: EngineeringProject;
  t: Translation;
  isSubmitting: boolean;
  onChange: (value: EngineeringProject) => void;
  onSubmit: (value: EngineeringProject) => void;
}

export function EngineeringProjectForm({ value, t, isSubmitting, onChange, onSubmit }: EngineeringProjectFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = <Key extends keyof EngineeringProject>(key: Key, next: EngineeringProject[Key]) => onChange({ ...value, [key]: next });
  const outputType = value.outputType ?? "other";
  const updateOutputType = (outputType: OutputType) => onChange({
    ...value,
    outputType,
    outputTypes: outputType === "other" ? value.outputTypes : undefined,
    customOutputs: outputType === "other" ? value.customOutputs : undefined,
  });
  const requiredExisting = value.startingPoint !== "new_project";
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = EngineeringProjectSchema.safeParse(value);
    const today = toLocalDateKey(new Date());
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "generic");
        const translationKey = field === "repositoryUrl" ? "repository" : field;
        nextErrors[field] = t.engineering.errors[translationKey as keyof typeof t.engineering.errors] ?? t.engineering.validationError;
      }
    }
    if (value.deadline < today) {
      nextErrors.deadline = t.engineering.errors.deadline;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      requestAnimationFrame(() => document.querySelector("#engineering-form-errors")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    if (!parsed.success) return;
    setErrors({});
    onSubmit(parsed.data);
  };
  return (
    <section className="form-section engineering-form-section" id="engineering-form" aria-labelledby="engineering-form-title">
      <div className="form-intro">
        <p className="eyebrow">{t.engineering.eyebrow}</p>
        <h2 id="engineering-form-title">{t.engineering.formTitle}</h2>
        <p>{t.engineering.formIntro}</p>
      </div>
      <form className="project-form" noValidate onSubmit={submit}>
        {Object.keys(errors).length > 0 && <div className="error-summary" id="engineering-form-errors" role="alert"><strong>{t.form.errorsTitle}</strong><ul>{Object.entries(errors).map(([field, message]) => <li key={field}>{message}</li>)}</ul></div>}
        <div className="field field-wide"><div className="label-row"><label htmlFor="engineeringBrief">{t.engineering.brief}</label><span>{t.form.required}</span></div><textarea aria-describedby={errors.technicalBrief ? "engineering-brief-error" : undefined} aria-invalid={Boolean(errors.technicalBrief)} id="engineeringBrief" maxLength={3_000} onChange={(event) => update("technicalBrief", event.target.value)} placeholder={t.engineering.briefPlaceholder} rows={7} value={value.technicalBrief} />{errors.technicalBrief && <p className="field-error" id="engineering-brief-error">{errors.technicalBrief}</p>}</div>
        <div className="form-grid">
          <div className="field"><label htmlFor="engineeringStartingPoint">{t.engineering.startingPoint}</label><select id="engineeringStartingPoint" onChange={(event) => update("startingPoint", event.target.value as EngineeringProject["startingPoint"])} value={value.startingPoint}>{t.engineering.startingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div className="field"><label htmlFor="engineeringPlatform">{t.engineering.platform}</label><select id="engineeringPlatform" onChange={(event) => update("targetPlatform", event.target.value as EngineeringProject["targetPlatform"])} value={value.targetPlatform}>{t.engineering.platformOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        </div>
        <div className="field field-wide">
          <div className="label-row"><label htmlFor="engineeringOutputType">{t.form.outputType}</label><span>{t.form.optional}</span></div>
          <select id="engineeringOutputType" onChange={(event) => updateOutputType(event.target.value as OutputType)} value={outputType}>
            {t.form.outputOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        {outputType === "other" && <OutputTypeCustomizer onChange={(next) => onChange({ ...value, ...next })} t={t} value={{ ...value, outputType }} />}
        {requiredExisting && <div className="form-grid"><div className="field"><label htmlFor="engineeringRepository">{t.engineering.repository}</label><input aria-invalid={Boolean(errors.repositoryUrl)} id="engineeringRepository" placeholder={t.engineering.repositoryPlaceholder} value={value.repositoryUrl ?? ""} onChange={(event) => update("repositoryUrl", event.target.value)} />{errors.repositoryUrl && <p className="field-error">{errors.repositoryUrl}</p>}</div><div className="field"><label htmlFor="engineeringLocation">{t.engineering.location}</label><input id="engineeringLocation" placeholder={t.engineering.locationPlaceholder} value={value.projectLocation ?? ""} onChange={(event) => update("projectLocation", event.target.value)} /></div></div>}
        <div className="field field-wide"><div className="label-row"><label htmlFor="engineeringDone">{t.engineering.definitionOfDone}</label><span>{t.form.required}</span></div><textarea aria-describedby={errors.definitionOfDone ? "engineering-done-error" : undefined} aria-invalid={Boolean(errors.definitionOfDone)} id="engineeringDone" placeholder={t.engineering.definitionPlaceholder} rows={4} value={value.definitionOfDone} onChange={(event) => update("definitionOfDone", event.target.value)} />{errors.definitionOfDone && <p className="field-error" id="engineering-done-error">{errors.definitionOfDone}</p>}</div>
        <div className="form-grid"><div className="field"><label htmlFor="engineeringTech">{t.engineering.technologies}</label><input id="engineeringTech" placeholder={t.engineering.technologiesPlaceholder} value={value.technologies ?? ""} onChange={(event) => update("technologies", event.target.value)} /></div><div className="field"><label htmlFor="engineeringDeployment">{t.engineering.deployment}</label><input id="engineeringDeployment" placeholder={t.engineering.deploymentPlaceholder} value={value.deploymentTarget ?? ""} onChange={(event) => update("deploymentTarget", event.target.value)} /></div></div>
        <div className="field field-wide"><div className="label-row"><label htmlFor="engineeringExperience">{t.engineering.experience}</label><span>{t.form.required}</span></div><textarea aria-describedby={errors.currentExperience ? "engineering-experience-error" : undefined} aria-invalid={Boolean(errors.currentExperience)} id="engineeringExperience" placeholder={t.engineering.experiencePlaceholder} rows={3} value={value.currentExperience} onChange={(event) => update("currentExperience", event.target.value)} />{errors.currentExperience && <p className="field-error" id="engineering-experience-error">{errors.currentExperience}</p>}</div>
        <fieldset><legend><Clock3 aria-hidden="true" size={17} />{t.form.availableStudyTime}</legend><div className="form-grid"><div className="field"><label htmlFor="engineeringHours">{t.engineering.hoursPerDay}</label><input id="engineeringHours" min="0.5" max="12" step="0.5" type="number" value={value.hoursPerDay} onChange={(event) => update("hoursPerDay", Number(event.target.value))} /></div><div className="field"><label htmlFor="engineeringDays">{t.engineering.daysPerWeek}</label><input id="engineeringDays" min="1" max="7" type="number" value={value.daysPerWeek} onChange={(event) => update("daysPerWeek", Number(event.target.value))} /></div></div></fieldset>
        <div className="form-grid"><div className="field"><div className="label-row"><label htmlFor="engineeringDeadline">{t.engineering.deadline}</label><span>{t.form.required}</span></div><input aria-describedby={errors.deadline ? "engineering-deadline-error" : undefined} aria-invalid={Boolean(errors.deadline)} id="engineeringDeadline" min={toLocalDateKey(new Date())} type="date" value={value.deadline} onChange={(event) => update("deadline", event.target.value)} />{errors.deadline && <p className="field-error" id="engineering-deadline-error">{errors.deadline}</p>}</div><div className="field"><label htmlFor="engineeringConstraints">{t.engineering.constraints}</label><textarea id="engineeringConstraints" placeholder={t.engineering.constraintsPlaceholder} rows={3} value={value.constraints ?? ""} onChange={(event) => update("constraints", event.target.value)} /></div></div>
        {value.startingPoint === "existing_bug" && <div className="field field-wide"><div className="label-row"><label htmlFor="engineeringBlockers">{t.engineering.blockers}</label><span>{t.form.required}</span></div><textarea aria-describedby={errors.existingErrors ? "engineering-blockers-error" : undefined} aria-invalid={Boolean(errors.existingErrors)} id="engineeringBlockers" placeholder={t.engineering.blockersPlaceholder} rows={3} value={value.existingErrors ?? ""} onChange={(event) => update("existingErrors", event.target.value)} />{errors.existingErrors && <p className="field-error" id="engineering-blockers-error">{errors.existingErrors}</p>}</div>}
        <div className="form-submit"><button className="button button-primary" disabled={isSubmitting} type="submit"><Sparkles aria-hidden="true" size={17} />{t.engineering.submit}<ArrowRight aria-hidden="true" size={17} /></button><p><LockKeyhole aria-hidden="true" size={14} />{t.form.privacy}</p></div>
      </form>
    </section>
  );
}
