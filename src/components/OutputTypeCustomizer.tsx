"use client";

import type { Translation } from "@/src/i18n/translations";
import type { DesiredOutputSelection, OutputType } from "@/src/types";
import { CustomOutputPicker } from "./CustomOutputPicker";

interface OutputTypeCustomizerProps {
  value: DesiredOutputSelection;
  t: Translation;
  onChange: (value: DesiredOutputSelection) => void;
}

export function OutputTypeCustomizer({
  value,
  t,
  onChange,
}: OutputTypeCustomizerProps) {
  const toggleOutputType = (outputType: OutputType) => {
    const selected = new Set(value.outputTypes ?? []);
    if (selected.has(outputType)) selected.delete(outputType);
    else selected.add(outputType);
    onChange({ ...value, outputType: "other", outputTypes: [...selected] });
  };

  return (
    <fieldset className="output-type-customizer" aria-describedby="output-type-customize-hint">
      <legend>{t.form.outputTypeCustomizeLabel} <small>{t.form.optional}</small></legend>
      <p className="application-support-copy" id="output-type-customize-hint">
        {t.form.outputTypeCustomizeHint}
      </p>
      <div className="choice-row">
        {t.form.outputOptions
          .filter((option) => option.value !== "other")
          .map((option) => {
            const outputType = option.value as OutputType;
            return (
              <label className="choice-card" key={option.value}>
                <input
                  checked={value.outputTypes?.includes(outputType) ?? false}
                  onChange={() => toggleOutputType(outputType)}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
      </div>
      <CustomOutputPicker
        onChange={(customOutputs) => onChange({ ...value, customOutputs })}
        selectedOutputs={value.customOutputs ?? []}
        t={t}
      />
    </fieldset>
  );
}
