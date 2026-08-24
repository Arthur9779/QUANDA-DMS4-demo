"use client";

import { Check, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ApplicationSearchResponseSchema,
  type ApplicationSearchResult,
} from "@/src/application-search";
import {
  createCustomApplicationId,
  getApplicationName,
} from "@/src/data/applications";
import type { Translation } from "@/src/i18n/translations";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

interface ApplicationPickerProps {
  selectedIds: string[];
  t: Translation;
  onChange: (ids: string[]) => void;
  onValidSelection: () => void;
}

export function ApplicationPicker({
  selectedIds,
  t,
  onChange,
  onValidSelection,
}: ApplicationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApplicationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();
  const exactResult = results.some(
    (result) =>
      normalizeOntologyLabel(result.name) ===
      normalizeOntologyLabel(trimmedQuery),
  );

  useEffect(() => {
    if (trimmedQuery.length < 2) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/applications/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("application_search_failed");
        const parsed = ApplicationSearchResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success) throw new Error("invalid_application_search");
        setResults(parsed.data.results);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmedQuery]);

  const selectApplication = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 12) return;
    onChange([...selectedIds, id]);
    onValidSelection();
    setQuery("");
    setResults([]);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeApplication = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="application-picker">
      <button
        aria-pressed={selectedIds.length === 0}
        className="no-application-button"
        onClick={() => onChange([])}
        type="button"
      >
        {selectedIds.length === 0 && <Check aria-hidden="true" size={15} />}
        {t.form.noApplication}
      </button>

      {selectedIds.length > 0 && (
        <div className="selected-applications">
          <strong>{t.form.selectedApplications}</strong>
          <div>
            {selectedIds.map((id) => (
              <button
                aria-label={`${t.form.removeApplication}: ${getApplicationName(id)}`}
                key={id}
                onClick={() => removeApplication(id)}
                type="button"
              >
                {getApplicationName(id)}
                <X aria-hidden="true" size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field application-search-field">
        <label htmlFor="application-search">{t.form.applicationSearchLabel}</label>
        <div className="search-input-wrap">
          <Search aria-hidden="true" size={18} />
          <input
            autoComplete="off"
            id="application-search"
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (nextQuery.trim().length < 2) {
                setResults([]);
                setSearching(false);
              } else {
                setSearching(true);
              }
            }}
            placeholder={t.form.applicationSearchPlaceholder}
            ref={inputRef}
            type="search"
            value={query}
          />
        </div>
        <span>{t.form.applicationSearchHint}</span>
      </div>

      {trimmedQuery.length >= 2 && (
        <div aria-live="polite" className="application-search-results">
          {searching && <p>{t.form.applicationSearching}</p>}
          {!searching && results.length === 0 && (
            <p>{t.form.applicationNoResults}</p>
          )}
          {!searching && results.map((result) => {
            const selected = selectedIds.includes(result.id);
            return (
              <button
                aria-label={`${t.form.addApplication}: ${result.name}`}
                disabled={selected || selectedIds.length >= 12}
                key={result.id}
                onClick={() => selectApplication(result.id)}
                type="button"
              >
                <span>
                  <strong>{result.name}</strong>
                  <small>{result.category}</small>
                </span>
                {selected
                  ? <Check aria-hidden="true" size={17} />
                  : <Plus aria-hidden="true" size={17} />}
              </button>
            );
          })}
          {!searching && !exactResult && (
            <button
              className="application-custom-result"
              disabled={selectedIds.length >= 12}
              onClick={() =>
                selectApplication(createCustomApplicationId(trimmedQuery))
              }
              type="button"
            >
              <span>
                <strong>{t.form.addCustomApplication.replace("{name}", trimmedQuery)}</strong>
                <small>{t.form.customApplicationHint}</small>
              </span>
              <Plus aria-hidden="true" size={17} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
