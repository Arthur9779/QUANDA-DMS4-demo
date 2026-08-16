"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type {
  CreativeDNA,
  CreativeDNAConcept,
  UnknownConcept,
} from "@/src/contracts/knowledge";
import {
  OntologySearchResponseSchema,
  type OntologySearchResult,
} from "@/src/creative-dna-review/contracts";
import {
  conceptIdentity,
  constraintIdentity,
  unknownIdentity,
} from "@/src/creative-dna-review/operations";
import {
  groupCreativeDnaConcepts,
  type CreativeDnaGroupKey,
} from "@/src/creative-dna-review/grouping";
import type { Translation } from "@/src/i18n/translations";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

const VISIBLE_CONCEPTS = 6;

function format(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

function provenanceLabel(concept: CreativeDNAConcept, t: Translation) {
  if (concept.source === "explicit_requirement") return t.review.required;
  if (concept.source === "user_added") return t.review.addedByYou;
  if (concept.source === "user_preference") return t.review.preference;
  return t.review.suggested;
}

function displayConstraintLabel(label: string, t: Translation): string {
  const deliverable = label.match(/^Deliverable:\s*(.+)$/i);
  if (deliverable) {
    const value = deliverable[1];
    const translated = t.form.outputOptions.find((option) => option.value === value)?.label ?? value;
    return `${t.review.constraintLabels.deliverable}: ${translated}`;
  }
  const deadline = label.match(/^Deadline:\s*(.+)$/i);
  if (deadline) return `${t.review.constraintLabels.deadline}: ${deadline[1]}`;
  const quality = label.match(/^Target quality:\s*(.+)$/i);
  if (quality) {
    const value = quality[1];
    const translated = t.form.qualityOptions.find((option) => option.value === value)?.label ?? value;
    return `${t.review.constraintLabels.targetQuality}: ${translated}`;
  }
  const availability = label.match(/^(\d+(?:\.\d+)?) hours\/day, (\d+) days\/week$/i);
  if (availability) {
    return `${availability[1]} ${t.review.constraintLabels.hoursPerDay}, ${availability[2]} ${t.review.constraintLabels.daysPerWeek}`;
  }
  return label;
}

function normalizedApplicationLabel(label: string): string {
  return normalizeOntologyLabel(label).replace(/^adobe\s+/, "");
}

interface CreativeDnaReviewProps {
  creativeDna: CreativeDNA;
  isFallback: boolean;
  isStale: boolean;
  isBusy: boolean;
  t: Translation;
  onAddOntology: (node: OntologySearchResult) => void;
  onAddUnknown: (wording: string) => void;
  onConfirm: () => void;
  onEditDetails: () => void;
  onIntentChange: (intent: string) => void;
  onReanalyze: () => void;
  onRejectConcept: (identity: string, deliberate?: boolean) => void;
  onRejectConstraint: (identity: string, deliberate?: boolean) => void;
  onRejectUnknown: (identity: string) => void;
  onRestore: (identity: string) => void;
}

export function CreativeDnaReview({
  creativeDna,
  isFallback,
  isStale,
  isBusy,
  t,
  onAddOntology,
  onAddUnknown,
  onConfirm,
  onEditDetails,
  onIntentChange,
  onReanalyze,
  onRejectConcept,
  onRejectConstraint,
  onRejectUnknown,
  onRestore,
}: CreativeDnaReviewProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OntologySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [customWording, setCustomWording] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<CreativeDnaGroupKey>>(
    new Set(),
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const groups = groupCreativeDnaConcepts(creativeDna.concepts);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/ontology/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search_failed");
        const parsed = OntologySearchResponseSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("invalid_search_response");
        setSearchResults(parsed.data.results);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSearchResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchOpen, searchQuery]);

  const openSearch = () => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setCustomWording("");
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const confirmRequirementRemoval = (
    label: string,
    callback: () => void,
  ) => {
    if (window.confirm(`${t.review.requirementWarning}\n\n${label}`)) callback();
  };

  const submitUnknown = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customWording.trim()) return;
    onAddUnknown(customWording);
    closeSearch();
  };

  const explicitConcepts = creativeDna.concepts.filter(
    (concept) =>
      concept.source === "explicit_requirement" &&
      concept.status !== "user_rejected",
  );
  const explicitLabels = new Set(
    explicitConcepts.map((concept) => normalizedApplicationLabel(concept.label)),
  );
  const activeConstraints = creativeDna.constraints.filter((constraint) => {
    if (constraint.status === "user_rejected") return false;
    const application = normalizedApplicationLabel(
      constraint.label.split(":").at(-1)?.trim() ?? "",
    );
    return !(constraint.label.toLocaleLowerCase("en").startsWith("required application:") && application && explicitLabels.has(application));
  });
  const activeUnknowns = creativeDna.unknownConcepts.filter(
    (concept) => concept.status !== "user_rejected",
  );
  const rejected = [
    ...creativeDna.concepts
      .filter((concept) => concept.status === "user_rejected")
      .map((concept) => ({ identity: conceptIdentity(concept), label: concept.label })),
    ...creativeDna.unknownConcepts
      .filter((concept) => concept.status === "user_rejected")
      .map((concept) => ({ identity: unknownIdentity(concept), label: concept.raw })),
    ...creativeDna.constraints
      .filter((constraint) => constraint.status === "user_rejected")
      .map((constraint) => ({ identity: constraintIdentity(constraint), label: constraint.label })),
  ];

  return (
    <section className="creative-dna-review" id="creative-dna-review" aria-labelledby="creative-dna-title">
      <div className="review-heading">
        <div>
          <p className="eyebrow">{t.review.eyebrow}</p>
          <h2 id="creative-dna-title">{t.review.title}</h2>
          <p>{t.review.intro}</p>
        </div>
        <button className="button button-secondary review-add-top" onClick={openSearch} type="button">
          <Plus aria-hidden="true" size={17} />
          {t.review.addConcept}
        </button>
      </div>

      {isStale && (
        <div className="review-notice review-notice-stale" role="status">
          <AlertTriangle aria-hidden="true" size={21} />
          <div><strong>{t.review.staleTitle}</strong><p>{t.review.staleMessage}</p></div>
          <button className="button button-primary" disabled={isBusy} onClick={onReanalyze} type="button">
            <RotateCcw aria-hidden="true" size={16} />{t.review.analyzeAgain}
          </button>
        </div>
      )}

      {isFallback && !isStale && (
        <div className="review-notice" role="status">
          <AlertTriangle aria-hidden="true" size={21} />
          <div><strong>{t.review.fallbackTitle}</strong><p>{t.review.fallbackMessage}</p></div>
        </div>
      )}

      <div className="review-intent field">
        <label htmlFor="creative-dna-intent">{t.review.intentLabel}</label>
        <textarea
          defaultValue={creativeDna.projectIntent}
          id="creative-dna-intent"
          key={creativeDna.projectIntent}
          maxLength={1200}
          onBlur={(event) => {
            if (event.currentTarget.value.trim()) {
              onIntentChange(event.currentTarget.value);
            } else {
              event.currentTarget.value = creativeDna.projectIntent;
            }
          }}
          rows={3}
        />
        <span>{t.review.intentHint}</span>
      </div>

      {(explicitConcepts.length > 0 || activeConstraints.length > 0) && (
        <section className="review-group review-requirements" aria-labelledby="review-requirements-title">
          <div className="review-group-heading">
            <h3 id="review-requirements-title">{t.review.requirements}</h3>
          </div>
          <div className="concept-list">
            {explicitConcepts.map((concept) => (
              <article className="concept-chip concept-chip-required" key={conceptIdentity(concept)}>
                <span className="concept-copy"><strong>{concept.label}</strong><small>{t.review.required}</small></span>
                <button
                  aria-label={format(t.review.editRequirement, { label: concept.label })}
                  onClick={() => confirmRequirementRemoval(concept.label, () => onRejectConcept(conceptIdentity(concept), true))}
                  type="button"
                ><X aria-hidden="true" size={15} /></button>
              </article>
            ))}
            {activeConstraints.map((constraint) => {
              const label = displayConstraintLabel(constraint.label, t);
              return (
              <article className="concept-chip concept-chip-required" key={constraintIdentity(constraint)}>
                <span className="concept-copy"><strong>{label}</strong><small>{t.review.required}</small></span>
                <button
                  aria-label={format(t.review.editRequirement, { label })}
                  onClick={() => confirmRequirementRemoval(label, () => onRejectConstraint(constraintIdentity(constraint), true))}
                  type="button"
                ><X aria-hidden="true" size={15} /></button>
              </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="review-groups">
        {groups.map((group) => {
          const expanded = expandedGroups.has(group.key);
          const visible = expanded ? group.concepts : group.concepts.slice(0, VISIBLE_CONCEPTS);
          const remaining = group.concepts.length - VISIBLE_CONCEPTS;
          return (
            <section className="review-group" key={group.key} aria-labelledby={`review-group-${group.key}`}>
              <div className="review-group-heading">
                <h3 id={`review-group-${group.key}`}>{t.review.groups[group.key]}</h3>
                <button className="review-add" onClick={openSearch} type="button">
                  <Plus aria-hidden="true" size={15} />{t.review.addConcept}
                </button>
              </div>
              <div className="concept-list">
                {visible.map((concept) => (
                  <ConceptChip
                    concept={concept}
                    key={conceptIdentity(concept)}
                    onRemove={() => onRejectConcept(conceptIdentity(concept))}
                    t={t}
                  />
                ))}
              </div>
              {remaining > 0 && (
                <button
                  className="review-expand"
                  onClick={() => setExpandedGroups((current) => {
                    const next = new Set(current);
                    if (expanded) next.delete(group.key); else next.add(group.key);
                    return next;
                  })}
                  type="button"
                >
                  {expanded ? <ChevronUp aria-hidden="true" size={15} /> : <ChevronDown aria-hidden="true" size={15} />}
                  {expanded ? t.review.showLess : format(t.review.showMore, { count: remaining })}
                </button>
              )}
            </section>
          );
        })}
      </div>

      {activeUnknowns.length > 0 && (
        <section className="review-group review-unknowns" aria-labelledby="review-unknown-title">
          <div className="review-group-heading"><div><h3 id="review-unknown-title">{t.review.ownWording}</h3><p>{t.review.ownWordingHelp}</p></div><button className="review-add" onClick={openSearch} type="button"><Plus aria-hidden="true" size={15} />{t.review.addConcept}</button></div>
          <div className="concept-list">
            {activeUnknowns.map((concept: UnknownConcept) => (
              <article className="concept-chip concept-chip-unknown" key={unknownIdentity(concept)}>
                <span className="concept-copy"><strong>{concept.raw}</strong><small>{t.review.ownWording}</small></span>
                <button aria-label={format(t.review.removeConcept, { label: concept.raw })} onClick={() => onRejectUnknown(unknownIdentity(concept))} type="button"><X aria-hidden="true" size={15} /></button>
              </article>
            ))}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <details className="review-removed">
          <summary>{t.review.removed} <span>{rejected.length}</span></summary>
          <p>{t.review.removedHint}</p>
          <div className="concept-list">
            {rejected.map((item) => (
              <button className="restore-chip" key={`${item.identity}-${item.label}`} onClick={() => onRestore(item.identity)} type="button">
                <RotateCcw aria-hidden="true" size={14} />{format(t.review.restore, { label: item.label })}
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="review-actions">
        <button className="button button-text" onClick={onEditDetails} type="button">{t.review.editDetails}</button>
        <div><button className="button button-primary" disabled={isBusy || isStale} onClick={onConfirm} type="button"><Check aria-hidden="true" size={17} />{t.review.confirm}</button><p>{t.review.confirmHint}</p></div>
      </div>

      {searchOpen && (
        <div className="concept-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSearch(); }}>
          <div aria-labelledby="concept-search-title" aria-modal="true" className="concept-dialog" onKeyDown={handleDialogKeyDown} ref={dialogRef} role="dialog">
            <div className="concept-dialog-header"><div><p className="eyebrow">Creative DNA</p><h2 id="concept-search-title">{t.review.searchTitle}</h2></div><button aria-label={t.review.closeSearch} className="dialog-close" onClick={closeSearch} type="button"><X aria-hidden="true" size={20} /></button></div>
            <div className="field search-field"><label htmlFor="ontology-search">{t.review.searchLabel}</label><div className="search-input-wrap"><Search aria-hidden="true" size={17} /><input autoComplete="off" id="ontology-search" onChange={(event) => { const next = event.target.value; setSearchQuery(next); if (next.trim().length < 2) { setSearchResults([]); setSearching(false); } }} placeholder={t.review.searchPlaceholder} ref={searchInputRef} type="search" value={searchQuery} /></div><span>{t.review.searchHint}</span></div>
            <div aria-live="polite" className="search-results">
              {searching && <p>{t.review.searching}</p>}
              {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && <p>{t.review.noResults}</p>}
              {searchResults.map((result) => (
                <button aria-label={format(t.review.addResult, { label: result.label })} key={result.id} onClick={() => { onAddOntology(result); closeSearch(); }} type="button"><span><strong>{result.label}</strong><small>{result.family} · {result.category}</small></span><Plus aria-hidden="true" size={17} /></button>
              ))}
            </div>
            <form className="custom-concept-form" onSubmit={submitUnknown}><h3>{t.review.cantFind}</h3><label htmlFor="custom-concept">{t.review.customLabel}</label><div><input id="custom-concept" maxLength={240} onChange={(event) => setCustomWording(event.target.value)} placeholder={t.review.customPlaceholder} value={customWording} /><button className="button button-secondary" disabled={!customWording.trim()} type="submit">{t.review.addOwn}</button></div></form>
          </div>
        </div>
      )}
    </section>
  );
}

function ConceptChip({ concept, t, onRemove }: { concept: CreativeDNAConcept; t: Translation; onRemove: () => void }) {
  const uncertain = concept.source === "ai_inferred" && (concept.confidence ?? 1) < 0.7;
  return (
    <article className={`concept-chip concept-chip-${concept.source}${uncertain ? " is-uncertain" : ""}`}>
      <span className="concept-copy"><strong>{concept.label}</strong><small>{uncertain ? t.review.notSure : provenanceLabel(concept, t)}</small></span>
      <button aria-label={format(t.review.removeConcept, { label: concept.label })} onClick={onRemove} type="button"><X aria-hidden="true" size={15} /></button>
      {process.env.NODE_ENV === "development" && (
        <details className="concept-debug"><summary>{t.review.debugDetails}</summary><code>{concept.ontologyId}<br />{concept.family} / {concept.category}<br />{concept.source} · {concept.confidence ?? "—"}</code></details>
      )}
    </article>
  );
}
