import type { Translation } from "@/src/i18n/translations";

export function WorkflowProgress({ stage, t }: { stage: 0 | 1 | 2 | 3; t: Translation }) {
  const labels = [t.workflow.brief, t.workflow.review, t.workflow.prepare, t.workflow.plan];
  return <nav className="workflow-progress" aria-label={t.workflow.ariaLabel}>{labels.map((label, index) => <span className={index === stage ? "is-current" : index < stage ? "is-complete" : ""} key={label}><b>{index + 1}</b>{label}</span>)}</nav>;
}
