"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, UserRound, X } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import { AuthApiError } from "@/src/lib/auth";
import { useAuth } from "@/src/auth/AuthContext";

type Dialog = "login" | "register" | "profile" | "projects" | null;

export function AccountControls({ t, onOpenProject }: { t: Translation; onOpenProject: (id: string) => Promise<void> }) {
  const auth = useAuth();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setDialog(null); setMenuOpen(false); }
    };
    const onPointer = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onPointer); };
  }, [menuOpen]);

  if (auth.loading) return <span className="account-loading" aria-hidden="true" />;
  if (!auth.user) {
    return <>
      <button className="account-login-button" onClick={() => setDialog("login")} type="button"><LogIn size={16} />{t.auth.login}</button>
      {dialog && <AuthDialog mode={dialog === "register" ? "register" : "login"} t={t} error={error} onClose={() => { setDialog(null); setError(""); }} onSwitch={setDialog} onSubmit={async (input) => {
        setError("");
        try {
          if (dialog === "register") await auth.register(input as { displayName: string; email: string; password: string });
          else await auth.login(input);
          setDialog(null);
        } catch (caught) { setError(authErrorMessage(caught, t)); }
      }} />}
    </>;
  }

  const initials = auth.user.displayName.split(/\s+/u).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="account-control" ref={menuRef}>
    <button className="account-profile-button" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((value) => !value)} type="button">
      <span className="account-avatar" aria-hidden="true">{initials || <UserRound size={15} />}</span>
      <span>{auth.user.displayName}</span><span aria-hidden="true">▾</span>
    </button>
    {menuOpen && <div className="account-menu" role="menu">
      <button role="menuitem" onClick={() => { setDialog("profile"); setMenuOpen(false); }}>{t.auth.profile}</button>
      <button role="menuitem" onClick={() => { void auth.refreshProjects(); setDialog("projects"); setMenuOpen(false); }}>{t.auth.myProjects}</button>
      <button role="menuitem" onClick={() => void auth.logout()}>{t.auth.logout}</button>
    </div>}
    {dialog === "profile" && <ProfileDialog t={t} error={error} onClose={() => { setDialog(null); setError(""); }} onSave={async (name) => {
      try { await auth.updateProfile(name); setDialog(null); } catch (caught) { setError(authErrorMessage(caught, t)); }
    }} />}
    {dialog === "projects" && <ProjectsDialog t={t} onClose={() => setDialog(null)} onOpen={async (id) => { await onOpenProject(id); setDialog(null); }} />}
  </div>;
}

function Modal({ title, onClose, closeLabel, children }: { title: string; onClose: () => void; closeLabel: string; children: React.ReactNode }) {
  return <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section aria-modal="true" className="auth-modal" role="dialog" aria-labelledby="auth-dialog-title">
      <div className="auth-modal-heading"><h2 id="auth-dialog-title">{title}</h2><button aria-label={closeLabel} className="icon-button" onClick={onClose} type="button"><X size={20} /></button></div>
      {children}
    </section>
  </div>;
}

function AuthDialog({ mode, t, error, onClose, onSwitch, onSubmit }: { mode: "login" | "register"; t: Translation; error: string; onClose: () => void; onSwitch: (mode: Dialog) => void; onSubmit: (input: { displayName?: string; email: string; password: string }) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const hasError = Boolean(localError || error);
  return <Modal title={mode === "register" ? t.auth.createAccount : t.auth.login} closeLabel={t.auth.close} onClose={onClose}>
    <p>{t.auth.crossDevice}</p>
    <form className="auth-form" onSubmit={(event) => {
      event.preventDefault(); setBusy(true);
      const data = new FormData(event.currentTarget);
      const password = String(data.get("password") ?? "");
      const confirmation = String(data.get("confirmPassword") ?? "");
      if (mode === "register" && password !== confirmation) { setLocalError(t.auth.passwordMismatch); setBusy(false); return; }
      setLocalError("");
      void onSubmit({ displayName: String(data.get("displayName") ?? ""), email: String(data.get("email") ?? ""), password }).finally(() => setBusy(false));
    }}>
      {mode === "register" && <label>{t.auth.displayName}<input aria-describedby={hasError ? "auth-form-error" : undefined} autoComplete="name" autoFocus name="displayName" required minLength={2} /></label>}
      <label>{t.auth.email}<input aria-describedby={hasError ? "auth-form-error" : undefined} autoComplete="email" autoFocus={mode === "login"} name="email" required type="email" /></label>
      <label>{t.auth.password}<input aria-describedby={hasError ? "auth-form-error" : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} name="password" required minLength={mode === "register" ? 10 : 1} type="password" /></label>
      {mode === "register" && <label>{t.auth.confirmPassword}<input aria-describedby={hasError ? "auth-form-error" : undefined} autoComplete="new-password" name="confirmPassword" required minLength={10} type="password" /></label>}
      {hasError && <p className="auth-error" id="auth-form-error" role="alert">{localError || error}</p>}
      <button className="button button-primary" disabled={busy} type="submit">{busy ? t.auth.working : mode === "register" ? t.auth.createAccount : t.auth.login}</button>
    </form>
    <button className="button button-text" onClick={() => onSwitch(mode === "login" ? "register" : "login")} type="button">{mode === "login" ? t.auth.needAccount : t.auth.haveAccount}</button>
    <button className="button button-text" onClick={onClose} type="button">{t.auth.continueGuest}</button>
  </Modal>;
}

function ProfileDialog({ t, error, onClose, onSave }: { t: Translation; error: string; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const auth = useAuth();
  return <Modal title={t.auth.profile} closeLabel={t.auth.close} onClose={onClose}>
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void onSave(String(new FormData(event.currentTarget).get("displayName") ?? "")); }}>
      <label>{t.auth.displayName}<input aria-describedby={error ? "profile-form-error" : undefined} autoFocus name="displayName" defaultValue={auth.user?.displayName} required minLength={2} /></label>
      <label>{t.auth.email}<input value={auth.user?.email ?? ""} disabled readOnly /></label>
      {error && <p className="auth-error" id="profile-form-error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit">{t.auth.saveProfile}</button>
    </form>
  </Modal>;
}

function ProjectsDialog({ t, onClose, onOpen }: { t: Translation; onClose: () => void; onOpen: (id: string) => Promise<void> }) {
  const { projects } = useAuth();
  return <Modal title={t.auth.myProjects} closeLabel={t.auth.close} onClose={onClose}>
    <div className="account-project-list">{projects.length === 0 ? <p>{t.auth.noProjects}</p> : projects.map((project) => <article key={project.id}>
      <div><strong>{project.title}</strong><span>{project.status} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(project.updatedAt))}</span></div>
      <button className="button button-secondary" onClick={() => void onOpen(project.id)} type="button">{t.auth.openProject}</button>
    </article>)}</div>
  </Modal>;
}

function authErrorMessage(error: unknown, t: Translation): string {
  if (error instanceof AuthApiError) {
    if (error.code === "invalid_credentials") return t.auth.invalidCredentials;
    if (error.code === "account_exists") return t.auth.accountExists;
    if (error.code === "invalid_request") return t.auth.invalidDetails;
  }
  return t.auth.unavailable;
}
