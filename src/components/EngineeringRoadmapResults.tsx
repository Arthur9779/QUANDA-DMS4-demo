"use client";

import { CheckCircle2, ChevronDown, ChevronUp, CircleDot, Clock3, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import type { EngineeringRoadmap, EngineeringTask } from "@/src/project-path/contracts";

function TaskCard({ task, t, complete, onToggle }: { task: EngineeringTask; t: Translation; complete: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(task.order === 1);
  const executor = t.engineering[task.executor];
  return <article className={`engineering-task-card${complete ? " is-complete" : ""}`}>
    <div className="engineering-task-header">
      <label className="engineering-task-check"><input checked={complete} onChange={onToggle} type="checkbox" /><span className="sr-only">{task.title}</span></label>
      <span className="engineering-task-number">{String(task.order).padStart(2, "0")}</span>
      <div><p className="eyebrow">{executor}</p><h3>{task.title}</h3></div>
      <button aria-expanded={open} aria-label={open ? `Collapse ${task.title}` : `Expand ${task.title}`} className="icon-button" onClick={() => setOpen((current) => !current)} type="button">{open ? <ChevronUp aria-hidden="true" size={19} /> : <ChevronDown aria-hidden="true" size={19} />}</button>
    </div>
    {open && <div className="engineering-task-content">
      <div className="engineering-task-summary"><div><strong>{t.engineering.outcome}</strong><p>{task.outcome}</p></div><div><strong>{t.engineering.whyItMatters}</strong><p>{task.whyItMatters}</p></div></div>
      <div className="engineering-task-meta"><span><CircleDot aria-hidden="true" size={15} />{executor}</span><span><Clock3 aria-hidden="true" size={15} />{task.estimatedAgentMinutes + task.estimatedHumanReviewMinutes} {t.engineering.minutes}</span><span><ShieldCheck aria-hidden="true" size={15} />{task.relevantTechnologies.join(", ") || t.engineering.noValue}</span></div>
      <div className="engineering-task-columns"><div><strong>{t.engineering.agentPrompt}</strong><pre>{task.agentPrompt}</pre></div><div><strong>{t.engineering.acceptance}</strong><ul>{task.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>{t.engineering.verification}</strong><ul>{task.verificationChecks.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>{t.engineering.expectedArtifact}</strong><p>{task.expectedArtifact}</p><strong>{t.engineering.humanCheckpoint}</strong><p>{task.humanReviewCheckpoint}</p></div><div><strong>{t.engineering.failureFallback}</strong><p>{task.failureFallback}</p></div></div>
    </div>}
  </article>;
}

export function EngineeringRoadmapResults({ roadmap, completedTaskIds, onToggleTask, onStartOver, t }: { roadmap: EngineeringRoadmap; completedTaskIds: string[]; onToggleTask: (id: string) => void; onStartOver: () => void; t: Translation }) {
  return <section className="engineering-roadmap-results" id="engineering-roadmap-results" aria-labelledby="engineering-roadmap-title">
    <div className="section-heading"><p className="eyebrow">{t.engineering.roadmapEyebrow}</p><h2 id="engineering-roadmap-title">{t.engineering.roadmapTitle}</h2><p>{t.engineering.roadmapIntro}</p></div>
    <div className="engineering-roadmap-summary"><div><strong>{roadmap.title}</strong><p>{roadmap.summary}</p></div><div><strong>{roadmap.totalEstimatedAgentMinutes + roadmap.totalEstimatedHumanReviewMinutes} {t.engineering.minutes}</strong><p>{roadmap.tasks.length} concrete tasks</p></div></div>
    {roadmap.notice && <p className="engineering-notice" role="status">{roadmap.notice}</p>}
    <div className="engineering-task-list">{roadmap.tasks.map((task) => <TaskCard key={task.id} complete={completedTaskIds.includes(task.id)} onToggle={() => onToggleTask(task.id)} task={task} t={t} />)}</div>
    <div className="engineering-warnings"><strong>{t.engineering.warnings}</strong><ul>{roadmap.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
    <button className="button button-secondary" onClick={onStartOver} type="button"><CheckCircle2 aria-hidden="true" size={17} />{t.results.startOver}</button>
  </section>;
}
