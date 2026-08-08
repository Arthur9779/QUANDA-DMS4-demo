"use client";

import type { Locale } from "@/src/types";

interface LanguageToggleProps {
  locale: Locale;
  label: string;
  disabled?: boolean;
  onChange: (locale: Locale) => void;
}

export function LanguageToggle({
  locale,
  label,
  disabled = false,
  onChange,
}: LanguageToggleProps) {
  return (
    <div className="language-toggle" role="group" aria-label={label}>
      {(["en", "vi"] as const).map((option) => (
        <button
          aria-pressed={locale === option}
          className={locale === option ? "is-active" : ""}
          disabled={disabled}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
