"use client";

import {
  ArrowRight,
  Compass,
  LogIn,
  UserPlus,
} from "lucide-react";
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
          <svg viewBox="0 0 640 640" preserveAspectRatio="xMidYMid slice" role="presentation">
            <defs>
              <symbol id="garden-flower" viewBox="0 0 160 160">
                <g fill="#f2d38d" stroke="#10462c" strokeWidth="6">
                  <circle cx="80" cy="34" r="24" /><circle cx="122" cy="64" r="24" />
                  <circle cx="106" cy="112" r="24" /><circle cx="54" cy="112" r="24" />
                  <circle cx="38" cy="64" r="24" />
                </g>
                <circle cx="80" cy="76" r="22" fill="#da451f" stroke="#10462c" strokeWidth="6" />
              </symbol>
              <symbol id="garden-star" viewBox="0 0 160 160">
                <path d="m80 18 15 43 45-4-34 30 19 42-45-22-45 22 19-42-34-30 45 4Z" fill="#da451f" stroke="#10462c" strokeWidth="7" strokeLinejoin="round" />
              </symbol>
              <symbol id="garden-tulip" viewBox="0 0 160 160">
                <path d="M79 79v57" fill="none" stroke="#10462c" strokeWidth="8" strokeLinecap="round" />
                <path d="M80 46C51 18 29 34 35 65c4 22 21 33 45 25 24 8 41-3 45-25 6-31-16-47-45-19Z" fill="#da451f" stroke="#10462c" strokeWidth="7" strokeLinejoin="round" />
                <path d="M77 104c-17-18-34-22-51-12 15 22 32 28 51 12Zm7 4c17-18 34-22 51-12-15 22-32 28-51 12Z" fill="#19643d" stroke="#10462c" strokeWidth="6" strokeLinejoin="round" />
              </symbol>
              <symbol id="garden-house" viewBox="0 0 160 160">
                <path d="M29 75 80 30l51 45v56H29Z" fill="#f2d38d" stroke="#10462c" strokeWidth="7" strokeLinejoin="round" />
                <path d="m22 77 58-51 58 51" fill="none" stroke="#da451f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M68 131V96h24v35" fill="#da451f" stroke="#10462c" strokeWidth="6" />
                <circle cx="80" cy="82" r="8" fill="#19643d" />
              </symbol>
              <symbol id="garden-leaf" viewBox="0 0 160 160">
                <path d="M42 128C40 78 71 38 125 31c-5 50-34 85-83 97Z" fill="#19643d" stroke="#10462c" strokeWidth="7" strokeLinejoin="round" />
                <path d="M43 127c23-27 47-51 75-77" fill="none" stroke="#f2d38d" strokeWidth="7" strokeLinecap="round" />
              </symbol>
              <symbol id="garden-pot" viewBox="0 0 160 160">
                <path d="M47 78h66l-9 57H56Z" fill="#da451f" stroke="#10462c" strokeWidth="7" strokeLinejoin="round" />
                <path d="M80 78V45M80 57c-20-20-37-18-46-4 18 17 31 18 46 4Zm0 4c20-20 37-18 46-4-18 17-31 18-46 4Z" fill="#19643d" stroke="#10462c" strokeWidth="7" strokeLinejoin="round" />
              </symbol>
            </defs>
            <g>
              <rect width="160" height="160" fill="#19643d" /><rect x="160" width="160" height="160" fill="#f2d38d" />
              <rect x="320" width="160" height="160" fill="#da451f" /><rect x="480" width="160" height="160" fill="#f2d38d" />
              <rect y="160" width="160" height="160" fill="#f2d38d" /><rect x="160" y="160" width="160" height="160" fill="#da451f" />
              <rect x="320" y="160" width="160" height="160" fill="#19643d" /><rect x="480" y="160" width="160" height="160" fill="#f2d38d" />
              <rect y="320" width="160" height="160" fill="#da451f" /><rect x="160" y="320" width="160" height="160" fill="#f2d38d" />
              <rect x="320" y="320" width="160" height="160" fill="#f2d38d" /><rect x="480" y="320" width="160" height="160" fill="#19643d" />
              <rect y="480" width="160" height="160" fill="#19643d" /><rect x="160" y="480" width="160" height="160" fill="#f2d38d" />
              <rect x="320" y="480" width="160" height="160" fill="#da451f" /><rect x="480" y="480" width="160" height="160" fill="#f2d38d" />
            </g>
            <g>
              <use href="#garden-flower" x="0" y="0" width="160" height="160" />
              <use href="#garden-star" x="160" y="0" width="160" height="160" />
              <use href="#garden-tulip" x="320" y="0" width="160" height="160" />
              <use href="#garden-house" x="480" y="0" width="160" height="160" />
              <use href="#garden-leaf" x="0" y="160" width="160" height="160" />
              <use href="#garden-flower" x="160" y="160" width="160" height="160" />
              <use href="#garden-pot" x="320" y="160" width="160" height="160" />
              <use href="#garden-star" x="480" y="160" width="160" height="160" />
              <use href="#garden-house" x="0" y="320" width="160" height="160" />
              <use href="#garden-leaf" x="160" y="320" width="160" height="160" />
              <use href="#garden-tulip" x="320" y="320" width="160" height="160" />
              <use href="#garden-flower" x="480" y="320" width="160" height="160" />
              <use href="#garden-pot" x="0" y="480" width="160" height="160" />
              <use href="#garden-star" x="160" y="480" width="160" height="160" />
              <use href="#garden-tulip" x="320" y="480" width="160" height="160" />
              <use href="#garden-house" x="480" y="480" width="160" height="160" />
            </g>
          </svg>
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
