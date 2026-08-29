import type { Translation } from "@/src/i18n/translations";

export type WorkflowStage = "brief" | "review" | "prepare" | "plan";

export function WorkflowToast({ stage, t, onDismiss }: { stage: WorkflowStage; t: Translation; onDismiss?: () => void }) {
  const labels = [t.workflow.brief, t.workflow.review, t.workflow.prepare, t.workflow.plan];
  const index = ["brief", "review", "prepare", "plan"].indexOf(stage);
  const next = labels[index + 1];
  return (
    <div className="workflow-toast" role="status" aria-live="polite">
      <span className="workflow-toast-dot" aria-hidden="true" />
      <strong>{labels[index]} {t.workflow.completed}</strong>
      {next && <span>{t.workflow.next}: {next}</span>}
      {onDismiss && <button className="workflow-toast-dismiss" onClick={onDismiss} type="button">{t.workflow.dismiss}</button>}
    </div>
  );
}
