"use client";

import { useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import type { RouteCandidate, RouteCriterion, RouteEvaluation } from "@/src/route-planning/contracts";

const criteria: RouteCriterion[] = ["requirements_fit", "familiarity", "time_fit", "switching_cost", "resources", "risk"];

export function RouteEvaluationCard({ evaluation, t }: { evaluation: RouteEvaluation; t: Translation }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const recommended = evaluation.routes.find((route) => route.id === evaluation.recommendedRouteId) ?? evaluation.routes[0];
  const alternatives = evaluation.routes.filter((route) => route.id !== recommended?.id);
  if (!recommended) return null;
  const label = (criterion: RouteCriterion) => t.routeEvaluation.criteria[criterion];
  return <section className="route-evaluation" aria-labelledby="route-evaluation-title">
    <div className="route-evaluation-heading"><div><p className="eyebrow">{t.routeEvaluation.eyebrow}</p><h3 id="route-evaluation-title">{t.routeEvaluation.title}</h3><p>{evaluation.explanation}</p></div><div className="route-score" aria-label={`${recommended.score} ${t.routeEvaluation.outOf}`}><strong>{recommended.score}</strong><span>/100</span></div></div>
    <article className="route-winner"><div className="route-winner-title"><span className="route-status route-status-recommended">{t.routeEvaluation.recommended}</span><h4>{recommended.title}</h4></div><p>{recommended.summary}</p><div className="route-tool-sequence" aria-label={t.routeEvaluation.tools}>{recommended.toolSequence.map((tool) => <span key={tool}>{tool}</span>)}</div><div className="route-score-grid">{criteria.map((criterion) => { const item = recommended.scoreBreakdown.find((score) => score.criterion === criterion); return item ? <div key={criterion} className="route-score-item"><div><span>{label(criterion)}</span><strong>{item.score}/100</strong></div><progress max="100" value={item.score} aria-label={`${label(criterion)} ${item.score}/100`} /><p>{item.rationale}</p></div> : null; })}</div><details className="route-details"><summary>{t.routeEvaluation.showEvidence}</summary><div className="route-evidence-grid">{recommended.scoreBreakdown.map((item) => <div key={item.criterion}><strong>{label(item.criterion)}</strong><ul>{item.evidence.map((evidence) => <li key={`${evidence.source}-${evidence.statement}`}>{evidence.statement}</li>)}</ul></div>)}</div></details><div className="route-strengths"><div><strong>{t.routeEvaluation.strengths}</strong><ul>{recommended.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>{t.routeEvaluation.tradeoffs}</strong><ul>{recommended.tradeoffs.map((item) => <li key={item}>{item}</li>)}</ul></div></div></article>
    {alternatives.length > 0 && <div className="route-alternatives"><button className="button button-secondary" onClick={() => setShowAlternatives((value) => !value)} type="button" aria-expanded={showAlternatives}>{showAlternatives ? t.routeEvaluation.hideAlternatives : t.routeEvaluation.showAlternatives}</button>{showAlternatives && <div className="route-alternative-list">{alternatives.map((route) => <AlternativeRoute key={route.id} route={route} t={t} />)}</div>}</div>}
  </section>;
}

function AlternativeRoute({ route, t }: { route: RouteCandidate; t: Translation }) {
  const [open, setOpen] = useState(false);
  const label = (criterion: RouteCriterion) => t.routeEvaluation.criteria[criterion];
  return <article className={`route-alternative route-${route.status}`}><div className="route-alternative-header"><div><span className={`route-status route-status-${route.status}`}>{route.status === "rejected" ? t.routeEvaluation.rejected : t.routeEvaluation.alternative}</span><h4>{route.title}</h4><p>{route.summary}</p></div><strong>{route.score}/100</strong><button className="icon-button" aria-expanded={open} aria-label={`${open ? t.routeEvaluation.hideDetails : t.routeEvaluation.showDetails}: ${route.title}`} onClick={() => setOpen((value) => !value)} type="button">{open ? "−" : "+"}</button></div>{open && <div className="route-alternative-details"><p><strong>{t.routeEvaluation.tools}:</strong> {route.toolSequence.join(", ")}</p><ol>{route.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="route-score-grid">{route.scoreBreakdown.map((item) => <div key={item.criterion} className="route-score-item"><div><span>{label(item.criterion)}</span><strong>{item.score}/100</strong></div><progress max="100" value={item.score} aria-label={`${label(item.criterion)} ${item.score}/100`} /></div>)}</div>{route.rejectionReason && <p className="route-rejection"><strong>{t.routeEvaluation.whyRejected}:</strong> {route.rejectionReason}</p>}<div className="route-strengths"><div><strong>{t.routeEvaluation.strengths}</strong><ul>{route.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>{t.routeEvaluation.tradeoffs}</strong><ul>{route.tradeoffs.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div>}</article>;
}
