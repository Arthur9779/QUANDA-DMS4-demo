"use client";

import { Plus, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import type { EngineeringPlatform, EngineeringProject } from "@/src/project-path/contracts";
import { normalizeOntologyLabel } from "@/src/ontology/normalization";

type EngineeringSelectablePlatform = Exclude<EngineeringPlatform, "other">;

interface TargetPlatformCustomizerProps {
  value: EngineeringProject;
  t: Translation;
  onChange: (value: EngineeringProject) => void;
}

export function TargetPlatformCustomizer({ value, t, onChange }: TargetPlatformCustomizerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedPlatforms = new Set<EngineeringSelectablePlatform>(value.targetPlatforms ?? []);
  const trimmedQuery = query.trim();
  const alreadySelected = (value.customTargetPlatforms ?? []).some(
    (target) => normalizeOntologyLabel(target) === normalizeOntologyLabel(trimmedQuery),
  );

  const togglePlatform = (platform: EngineeringSelectablePlatform) => {
    const next = new Set(selectedPlatforms);
    if (next.has(platform)) next.delete(platform);
    else next.add(platform);
    onChange({ ...value, targetPlatform: "other", targetPlatforms: [...next] });
  };

  const addCustomTarget = () => {
    const current = value.customTargetPlatforms ?? [];
    if (!trimmedQuery || alreadySelected || current.length >= 12) return;
    onChange({
      ...value,
      targetPlatform: "other",
      customTargetPlatforms: [...current, trimmedQuery],
    });
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeCustomTarget = (target: string) => {
    onChange({
      ...value,
      customTargetPlatforms: (value.customTargetPlatforms ?? []).filter((item) => item !== target),
    });
  };

  return (
    <fieldset className="output-type-customizer target-platform-customizer" aria-describedby="target-platform-customize-hint">
      <legend>{t.engineering.platformCustomizeLabel} <small>{t.form.optional}</small></legend>
      <p className="application-support-copy" id="target-platform-customize-hint">
        {t.engineering.platformCustomizeHint}
      </p>
      <div className="choice-row">
        {t.engineering.platformOptions
          .filter((option) => option.value !== "other")
          .map((option) => {
            const platform = option.value as EngineeringSelectablePlatform;
            return (
              <label className="choice-card" key={option.value}>
                <input
                  checked={selectedPlatforms.has(platform)}
                  onChange={() => togglePlatform(platform)}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
      </div>
      {(value.customTargetPlatforms ?? []).length > 0 && (
        <div className="selected-custom-outputs">
          <strong>{t.engineering.selectedCustomPlatforms}</strong>
          <div>
            {(value.customTargetPlatforms ?? []).map((target) => (
              <button
                aria-label={`${t.engineering.removeCustomPlatform}: ${target}`}
                key={target}
                onClick={() => removeCustomTarget(target)}
                type="button"
              >
                {target}
                <X aria-hidden="true" size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="field custom-output-search-field">
        <label htmlFor="custom-target-platform-search">{t.engineering.customPlatformSearchLabel}</label>
        <div className="search-input-wrap">
          <Search aria-hidden="true" size={18} />
          <input
            aria-describedby="custom-target-platform-search-hint"
            autoComplete="off"
            id="custom-target-platform-search"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomTarget();
              }
            }}
            placeholder={t.engineering.customPlatformSearchPlaceholder}
            ref={inputRef}
            type="search"
            value={query}
          />
        </div>
        <span id="custom-target-platform-search-hint">{t.engineering.customPlatformSearchHint}</span>
      </div>
      {trimmedQuery.length > 0 && (
        <div aria-live="polite" className="custom-output-result">
          <button
            aria-label={t.engineering.addCustomPlatform.replace("{name}", trimmedQuery)}
            disabled={alreadySelected || (value.customTargetPlatforms ?? []).length >= 12}
            onClick={addCustomTarget}
            type="button"
          >
            <span>
              <strong>{t.engineering.addCustomPlatform.replace("{name}", trimmedQuery)}</strong>
              <small>{t.engineering.customPlatformHint}</small>
            </span>
            <Plus aria-hidden="true" size={17} />
          </button>
        </div>
      )}
    </fieldset>
  );
}
