"use client";

import { CheckCircle2, PencilLine } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { EngineeringInterpretation as EngineeringInterpretationValue } from "@/src/project-path/contracts";

interface Props {
  value: EngineeringInterpretationValue;
  isBusy: boolean;
  t: Translation;
  onChange: (value: EngineeringInterpretationValue) => void;
  onConfirm: () => void;
  onEdit: () => void;
}

function listValue(items: string[]): string { return items.join("\n"); }
function parseList(value: string): string[] { return value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 12); }

export function EngineeringInterpretation({ value, isBusy, t, onChange, onConfirm, onEdit }: Props) {
  const updateList = (key: "coreFeatures" | "suggestedTechnologyStack" | "mainRisks" | "importantConstraints", next: string) => onChange({ ...value, [key]: parseList(next) });
  return (
    <section className="engineering-interpretation" id="engineering-interpretation" aria-labelledby="engineering-interpretation-title">
      <div className="section-heading"><p className="eyebrow">{t.engineering.eyebrow}</p><h2 id="engineering-interpretation-title">{t.engineering.interpretTitle}</h2><p>{t.engineering.interpretIntro}</p></div>
      <div className="engineering-interpretation-grid">
        <div className="field"><label htmlFor="engineeringProductType">{t.engineering.productType}</label><input id="engineeringProductType" value={value.productType} onChange={(event) => onChange({ ...value, productType: event.target.value })} /></div>
        <div className="field"><label htmlFor="engineeringStartingReview">{t.engineering.startingPoint}</label><input id="engineeringStartingReview" readOnly value={value.startingPoint.replaceAll("_", " ")} /></div>
        <div className="field field-wide"><label htmlFor="engineeringCoreFeatures">{t.engineering.coreFeatures}</label><textarea id="engineeringCoreFeatures" rows={5} value={listValue(value.coreFeatures)} onChange={(event) => updateList("coreFeatures", event.target.value)} /></div>
        <div className="field field-wide"><label htmlFor="engineeringSuggestedStack">{t.engineering.suggestedStack}</label><textarea id="engineeringSuggestedStack" rows={3} value={listValue(value.suggestedTechnologyStack)} onChange={(event) => updateList("suggestedTechnologyStack", event.target.value)} /></div>
        <div className="field field-wide"><label htmlFor="engineeringRepositoryContext">{t.engineering.repositoryContext}</label><textarea id="engineeringRepositoryContext" rows={3} value={value.repositoryContext} onChange={(event) => onChange({ ...value, repositoryContext: event.target.value })} /></div>
        <div className="field field-wide"><label htmlFor="engineeringDataApi">{t.engineering.dataApi}</label><textarea id="engineeringDataApi" rows={3} value={value.dataAndApiRequirements} onChange={(event) => onChange({ ...value, dataAndApiRequirements: event.target.value })} /></div>
        <div className="field"><label htmlFor="engineeringDeploymentReview">{t.engineering.deploymentTarget}</label><input id="engineeringDeploymentReview" value={value.deploymentTarget} onChange={(event) => onChange({ ...value, deploymentTarget: event.target.value })} /></div>
        <div className="field field-wide"><label htmlFor="engineeringDoneReview">{t.engineering.definitionOfDone}</label><textarea id="engineeringDoneReview" rows={4} value={value.definitionOfDone} onChange={(event) => onChange({ ...value, definitionOfDone: event.target.value })} /></div>
        <div className="field field-wide"><label htmlFor="engineeringRisks">{t.engineering.risks}</label><textarea id="engineeringRisks" rows={4} value={listValue(value.mainRisks)} onChange={(event) => updateList("mainRisks", event.target.value)} /></div>
        <div className="field field-wide"><label htmlFor="engineeringImportantConstraints">{t.engineering.importantConstraints}</label><textarea id="engineeringImportantConstraints" rows={4} value={listValue(value.importantConstraints)} onChange={(event) => updateList("importantConstraints", event.target.value)} /></div>
      </div>
      <div className="form-submit engineering-review-actions"><button className="button button-primary" disabled={isBusy} onClick={onConfirm} type="button"><CheckCircle2 aria-hidden="true" size={17} />{t.engineering.confirm}</button><button className="button button-secondary" disabled={isBusy} onClick={onEdit} type="button"><PencilLine aria-hidden="true" size={17} />{t.engineering.edit}</button></div>
    </section>
  );
}
