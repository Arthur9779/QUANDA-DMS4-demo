"use client";

import { Plus, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

interface CustomOutputPickerProps {
  selectedOutputs: string[];
  t: Translation;
  onChange: (outputs: string[]) => void;
}

export function CustomOutputPicker({
  selectedOutputs,
  t,
  onChange,
}: CustomOutputPickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();
  const alreadySelected = selectedOutputs.some(
    (output) => normalizeOntologyLabel(output) === normalizeOntologyLabel(trimmedQuery),
  );

  const addOutput = () => {
    if (!trimmedQuery || alreadySelected || selectedOutputs.length >= 12) return;
    onChange([...selectedOutputs, trimmedQuery]);
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeOutput = (output: string) => {
    onChange(selectedOutputs.filter((selected) => selected !== output));
  };

  return (
    <div className="custom-output-picker">
      {selectedOutputs.length > 0 && (
        <div className="selected-custom-outputs">
          <strong>{t.form.selectedCustomOutputs}</strong>
          <div>
            {selectedOutputs.map((output) => (
              <button
                aria-label={`${t.form.removeCustomOutput}: ${output}`}
                key={output}
                onClick={() => removeOutput(output)}
                type="button"
              >
                {output}
                <X aria-hidden="true" size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="field custom-output-search-field">
        <label htmlFor="custom-output-search">{t.form.customOutputSearchLabel}</label>
        <div className="search-input-wrap">
          <Search aria-hidden="true" size={18} />
          <input
            aria-describedby="custom-output-search-hint"
            autoComplete="off"
            id="custom-output-search"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOutput();
              }
            }}
            placeholder={t.form.customOutputSearchPlaceholder}
            ref={inputRef}
            type="search"
            value={query}
          />
        </div>
        <span id="custom-output-search-hint">{t.form.customOutputSearchHint}</span>
      </div>
      {trimmedQuery.length > 0 && (
        <div aria-live="polite" className="custom-output-result">
          <button
            aria-label={t.form.addCustomOutput.replace("{name}", trimmedQuery)}
            disabled={alreadySelected || selectedOutputs.length >= 12}
            onClick={addOutput}
            type="button"
          >
            <span>
              <strong>{t.form.addCustomOutput.replace("{name}", trimmedQuery)}</strong>
              <small>{t.form.customOutputHint}</small>
            </span>
            <Plus aria-hidden="true" size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
