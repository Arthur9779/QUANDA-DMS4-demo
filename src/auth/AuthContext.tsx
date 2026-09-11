"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  currentAccount,
  listAccountProjects,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccountProfile,
  type AccountProjectSummary,
  type AccountUser,
} from "@/src/lib/auth";

interface AuthContextValue {
  user: AccountUser | null;
  projects: AccountProjectSummary[];
  loading: boolean;
  login(input: { email: string; password: string }): Promise<void>;
  register(input: { displayName: string; email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  updateProfile(displayName: string): Promise<void>;
  refreshProjects(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [projects, setProjects] = useState<AccountProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void currentAccount().then((account) => {
      if (!active) return;
      setUser(account);
      setLoading(false);
      if (account) void listAccountProjects().then((items) => active && setProjects(items)).catch(() => undefined);
    });
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    projects,
    loading,
    async login(input) {
      const account = await loginAccount(input);
      setUser(account);
      setProjects(await listAccountProjects().catch(() => []));
    },
    async register(input) {
      const account = await registerAccount(input);
      setUser(account);
      setProjects(await listAccountProjects().catch(() => []));
    },
    async logout() {
      await logoutAccount();
      setUser(null);
      setProjects([]);
    },
    async updateProfile(displayName) {
      setUser(await updateAccountProfile(displayName));
    },
    async refreshProjects() {
      if (!user) return setProjects([]);
      const items = await listAccountProjects().catch(() => null);
      if (items) setProjects(items);
    },
  }), [loading, projects, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
