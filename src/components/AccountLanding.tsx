"use client";

import { ArrowRight, Compass, LogIn, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/src/auth/AuthContext";
import type { Translation } from "@/src/i18n/translations";
import type { Locale } from "@/src/types";
import { AuthDialog, authErrorMessage, type AuthMode } from "./AccountControls";
import { LanguageToggle } from "./LanguageToggle";

interface AccountLandingProps {
  isReady: boolean;
  locale: Locale;
  onContinueGuest: () => void;
  onLanguageChange: (locale: Locale) => void;
  t: Translation;
}

export function AccountLanding({
  isReady,
  locale,
  onContinueGuest,
  onLanguageChange,
  t,
}: AccountLandingProps) {
  const auth = useAuth();
  const [dialog, setDialog] = useState<AuthMode | null>(null);
  const [error, setError] = useState("");

  const closeDialog = () => {
    setDialog(null);
    setError("");
  };

  return (
    <section className="account-welcome" aria-labelledby="account-welcome-title">
      <header className="account-welcome-nav">
        <span className="account-welcome-brand">
          <span className="account-welcome-brand-mark" aria-hidden="true">
            <Compass size={20} strokeWidth={2.2} />
          </span>
          QUANDA
        </span>
        <LanguageToggle
          disabled={!isReady}
          label={t.nav.languageLabel}
          locale={locale}
          onChange={onLanguageChange}
        />
      </header>

      <div className="account-welcome-poster">
        <div className="account-welcome-doodle account-welcome-doodle-left" aria-hidden="true">
          <span className="account-welcome-orbit" />
          <Sparkles size={52} strokeWidth={1.4} />
          <strong>Q</strong>
        </div>

        <div className="account-welcome-copy">
          <p className="account-welcome-eyebrow">{t.accountLanding.eyebrow}</p>
          <h1 id="account-welcome-title">
            {t.accountLanding.titleLead}
            <em>{t.accountLanding.titleAccent}</em>
          </h1>
          <p className="account-welcome-intro">{t.accountLanding.intro}</p>

          <div className="account-choice-card">
            <span className="account-choice-index" aria-hidden="true">01 / 03</span>
            <h2>{t.accountLanding.question}</h2>
            <div className="account-choice-actions">
              <button
                className="account-choice-button account-choice-login"
                disabled={!isReady || auth.loading}
                onClick={() => setDialog("login")}
                type="button"
              >
                <LogIn aria-hidden="true" size={18} />
                <span><strong>{t.auth.login}</strong><small>{t.accountLanding.hasAccount}</small></span>
                <ArrowRight aria-hidden="true" size={17} />
              </button>
              <button
                className="account-choice-button account-choice-create"
                disabled={!isReady || auth.loading}
                onClick={() => setDialog("register")}
                type="button"
              >
                <UserPlus aria-hidden="true" size={18} />
                <span><strong>{t.auth.createAccount}</strong><small>{t.accountLanding.noAccount}</small></span>
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            </div>
            <button
              className="account-choice-guest"
              disabled={!isReady || auth.loading}
              onClick={onContinueGuest}
              type="button"
            >
              {t.auth.continueGuest}
              <ArrowRight aria-hidden="true" size={16} />
            </button>
            <p>{t.accountLanding.guestNote}</p>
          </div>
        </div>

        <div className="account-welcome-doodle account-welcome-doodle-right" aria-hidden="true">
          <span className="account-welcome-face">•ᴗ•</span>
          <span className="account-welcome-checker" />
          <small>BRIEF / PATH / MOMENTUM</small>
        </div>
      </div>

      <div className="account-welcome-footer" aria-hidden="true">
        <span />
        <strong>PLAN · LEARN · MAKE</strong>
        <span />
      </div>

      {dialog && (
        <AuthDialog
          error={error}
          mode={dialog}
          onClose={closeDialog}
          onContinueGuest={() => {
            closeDialog();
            onContinueGuest();
          }}
          onSubmit={async (input) => {
            setError("");
            try {
              if (dialog === "register") {
                await auth.register(input as { displayName: string; email: string; password: string });
              } else {
                await auth.login(input);
              }
              closeDialog();
            } catch (caught) {
              setError(authErrorMessage(caught, t));
            }
          }}
          onSwitch={setDialog}
          t={t}
        />
      )}
    </section>
  );
}
