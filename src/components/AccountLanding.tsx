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
        <div className="account-welcome-garden" aria-hidden="true">
          <svg viewBox="0 0 640 640" role="presentation">
            <defs>
              <pattern id="account-garden-grid" width="160" height="160" patternUnits="userSpaceOnUse">
                <rect width="160" height="160" fill="#f2d38d" />
                <path d="M0 159.5h160M159.5 0v160" stroke="#19643d" strokeWidth="3" opacity=".2" />
              </pattern>
              <clipPath id="account-garden-clip"><rect width="640" height="640" rx="24" /></clipPath>
            </defs>
            <g clipPath="url(#account-garden-clip)">
              <rect width="640" height="640" fill="url(#account-garden-grid)" />
              <rect width="160" height="160" fill="#19643d" />
              <rect x="320" width="160" height="160" fill="#da451f" />
              <rect x="160" y="160" width="160" height="160" fill="#19643d" />
              <rect x="480" y="160" width="160" height="160" fill="#19643d" />
              <rect y="320" width="160" height="160" fill="#da451f" />
              <rect x="320" y="320" width="160" height="160" fill="#19643d" />
              <rect x="160" y="480" width="160" height="160" fill="#da451f" />
              <rect x="480" y="480" width="160" height="160" fill="#19643d" />
              <g fill="none" stroke="#19643d" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M36 122c38-43 71-63 108-68 4 39-7 79-38 108" />
                <path d="M70 112c9-28 28-47 65-58" />
                <path d="M206 285c25-48 57-80 99-96-3 46-21 82-58 107" />
                <path d="M241 271c14-30 33-53 61-72" />
                <path d="M526 286c29-42 65-65 106-75-6 41-27 73-65 97" />
                <path d="M554 277c18-26 40-45 67-59" />
                <path d="M36 447c29-43 66-68 107-78-7 42-28 75-67 98" />
                <path d="M68 433c17-28 39-48 69-61" />
                <path d="M368 447c23-48 56-79 99-95-3 44-23 81-61 105" />
                <path d="M404 431c14-30 32-53 61-72" />
                <path d="M207 606c20-43 53-73 98-89-2 42-19 77-55 101" />
                <path d="M243 585c15-27 32-47 59-67" />
              </g>
              <g fill="#f2d38d" stroke="#19643d" strokeWidth="6">
                <path d="M56 50c25-27 59-25 77 3 14 22 5 52-22 72-28 21-61 16-74-9-11-23-2-48 19-66Z" />
                <path d="M376 48c25-27 59-25 77 3 14 22 5 52-22 72-28 21-61 16-74-9-11-23-2-48 19-66Z" />
                <path d="M213 370c25-27 59-24 76 4 13 23 4 53-24 73-28 19-60 14-72-11-11-23-1-47 20-66Z" />
                <path d="M533 370c25-27 59-24 76 4 13 23 4 53-24 73-28 19-60 14-72-11-11-23-1-47 20-66Z" />
              </g>
              <g fill="#da451f" stroke="#f2d38d" strokeWidth="6">
                <circle cx="240" cy="84" r="20" /><circle cx="560" cy="244" r="20" />
                <circle cx="80" cy="404" r="20" /><circle cx="400" cy="564" r="20" />
              </g>
              <g fill="#19643d">
                <path d="M96 205c28-28 63-32 98-17-18 33-54 47-98 17Z" />
                <path d="M416 205c28-28 63-32 98-17-18 33-54 47-98 17Z" />
                <path d="M257 525c28-28 63-32 98-17-18 33-54 47-98 17Z" />
              </g>
            </g>
          </svg>
        </div>
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
