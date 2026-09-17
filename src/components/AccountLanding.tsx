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
        <div className="account-welcome-stickers" aria-hidden="true">
          <svg className="account-sticker account-sticker-flower" viewBox="0 0 160 160" role="presentation">
            <g fill="#da451f" stroke="#fffdf1" strokeWidth="9" strokeLinejoin="round">
              <circle cx="80" cy="34" r="25" /><circle cx="124" cy="65" r="25" />
              <circle cx="106" cy="116" r="25" /><circle cx="54" cy="116" r="25" />
              <circle cx="36" cy="65" r="25" />
            </g>
            <circle cx="80" cy="76" r="22" fill="#f2d38d" stroke="#fffdf1" strokeWidth="9" />
          </svg>
          <svg className="account-sticker account-sticker-leaf" viewBox="0 0 180 150" role="presentation">
            <path d="M32 126C37 77 72 37 145 24c-9 57-46 91-113 102Z" fill="#19643d" stroke="#fffdf1" strokeWidth="10" strokeLinejoin="round" />
            <path d="M36 124c27-31 58-60 94-86" fill="none" stroke="#f2d38d" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <svg className="account-sticker account-sticker-sun" viewBox="0 0 170 170" role="presentation">
            <path d="m85 12 12 39 40-13-24 34 36 22-42 3 3 42-25-33-34 25 14-39-39-14 41-8Z" fill="#f2d38d" stroke="#fffdf1" strokeWidth="9" strokeLinejoin="round" />
            <circle cx="85" cy="85" r="22" fill="#da451f" stroke="#fffdf1" strokeWidth="8" />
          </svg>
          <svg className="account-sticker account-sticker-sprig" viewBox="0 0 170 190" role="presentation">
            <path d="M84 176C80 125 85 74 105 22" fill="none" stroke="#fffdf1" strokeWidth="10" strokeLinecap="round" />
            <path d="M91 117C56 105 38 82 39 52c31 5 51 26 52 58Zm5-49c-1-28 13-47 40-55 6 27-8 47-40 55Zm-8 80c-35-2-55-17-64-45 30-5 53 10 64 45Z" fill="#79a35b" stroke="#fffdf1" strokeWidth="9" strokeLinejoin="round" />
          </svg>
          <svg className="account-sticker account-sticker-mushroom" viewBox="0 0 180 160" role="presentation">
            <path d="M90 20C53 20 27 47 27 79h126c0-32-26-59-63-59Z" fill="#da451f" stroke="#fffdf1" strokeWidth="10" strokeLinejoin="round" />
            <path d="M75 79h30v49c0 17-30 17-30 0Z" fill="#f2d38d" stroke="#fffdf1" strokeWidth="9" />
            <circle cx="61" cy="54" r="7" fill="#f2d38d" /><circle cx="111" cy="43" r="7" fill="#f2d38d" />
          </svg>
          <svg className="account-sticker account-sticker-sparkle" viewBox="0 0 130 130" role="presentation">
            <path d="m65 8 12 45 45 12-45 12-12 45-12-45-45-12 45-12Z" fill="#f2d38d" stroke="#fffdf1" strokeWidth="9" strokeLinejoin="round" />
          </svg>
          <svg className="account-sticker account-sticker-bloom" viewBox="0 0 170 180" role="presentation">
            <path d="M85 169V91" fill="none" stroke="#fffdf1" strokeWidth="10" strokeLinecap="round" />
            <path d="M83 121c-31-19-49-17-63 3 25 15 45 13 63-3Zm5 0c31-19 49-17 63 3-25 15-45 13-63-3Z" fill="#19643d" stroke="#fffdf1" strokeWidth="9" strokeLinejoin="round" />
            <path d="M85 98C51 98 30 78 34 51c3-23 20-35 42-20 4-25 26-31 40-13 15-18 39-7 41 16 3 34-26 64-72 64Z" fill="#d7e8a3" stroke="#fffdf1" strokeWidth="10" strokeLinejoin="round" />
            <circle cx="85" cy="63" r="18" fill="#da451f" stroke="#fffdf1" strokeWidth="8" />
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
