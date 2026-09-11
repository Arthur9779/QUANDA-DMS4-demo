import { Compass, Sparkles } from "lucide-react";
import type { Locale } from "@/src/types";
import type { Translation } from "@/src/i18n/translations";
import { LanguageToggle } from "./LanguageToggle";
import { AccountControls } from "./AccountControls";

interface HeaderProps {
  locale: Locale;
  t: Translation;
  isReady: boolean;
  onLanguageChange: (locale: Locale) => void;
  onLoadExample: () => void;
  onOpenProject: (id: string) => Promise<void>;
}

export function Header({
  locale,
  t,
  isReady,
  onLanguageChange,
  onLoadExample,
  onOpenProject,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand" href="#top" aria-label={t.nav.homeLabel}>
          <span className="brand-mark" aria-hidden="true">
            <Compass size={20} strokeWidth={2.2} />
          </span>
          <span>QUANDA</span>
        </a>
        <nav aria-label={t.nav.primaryLabel}>
          <a href="#how-it-works">{t.nav.howItWorks}</a>
          <LanguageToggle
            label={t.nav.languageLabel}
            locale={locale}
            disabled={!isReady}
            onChange={onLanguageChange}
          />
          <button
            className="button button-secondary"
            disabled={!isReady}
            onClick={onLoadExample}
            type="button"
          >
            <Sparkles aria-hidden="true" size={16} />
            {t.nav.loadExample}
          </button>
          <AccountControls t={t} onOpenProject={onOpenProject} />
        </nav>
      </div>
    </header>
  );
}
