import { z } from "zod";
import { ACCOUNT_SESSION_KEY } from "@/src/lib/quandaApi";

const ANONYMOUS_SESSION_KEY = "quanda:v1:session-token";
const REQUEST_TIMEOUT_MS = 8_000;

export const AccountUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  avatar: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const AuthResponseSchema = z.object({
  user: AccountUserSchema,
  sessionToken: z.string().startsWith("qua_"),
  expiresAt: z.string(),
});

const MeResponseSchema = z.object({ user: AccountUserSchema });
const ProjectSummarySchema = z.object({
  id: z.string().uuid(),
  clientProjectId: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  version: z.number().int(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});
const ProjectListSchema = z.object({ projects: z.array(ProjectSummarySchema) });

export type AccountUser = z.infer<typeof AccountUserSchema>;
export type AccountProjectSummary = z.infer<typeof ProjectSummarySchema>;

export class AuthApiError extends Error {
  constructor(readonly code: string, readonly status: number) { super(code); }
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_QUANDA_API_URL ?? "").trim().replace(/\/+$/u, "");
}

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* local-first mode remains usable */ }
}

function remove(key: string): void {
  try { window.localStorage.removeItem(key); } catch { /* in-memory auth state still updates */ }
}

async function request(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const url = baseUrl();
  if (!url) throw new AuthApiError("backend_unavailable", 503);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new AuthApiError(body.error ?? "request_failed", response.status);
    }
    return response;
  } finally { window.clearTimeout(timeout); }
}

export function accountBackendEnabled(): boolean { return baseUrl().length > 0; }

export async function currentAccount(): Promise<AccountUser | null> {
  const token = read(ACCOUNT_SESSION_KEY);
  if (!token) return null;
  try {
    const parsed = MeResponseSchema.safeParse(await (await request("/api/v1/auth/me", {}, token)).json());
    if (!parsed.success) throw new AuthApiError("invalid_response", 502);
    return parsed.data.user;
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) remove(ACCOUNT_SESSION_KEY);
    return null;
  }
}

async function storeAuth(response: Response): Promise<AccountUser> {
  const parsed = AuthResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new AuthApiError("invalid_response", 502);
  write(ACCOUNT_SESSION_KEY, parsed.data.sessionToken);
  return parsed.data.user;
}

export async function registerAccount(input: { displayName: string; email: string; password: string }): Promise<AccountUser> {
  const anonymousSessionToken = read(ANONYMOUS_SESSION_KEY);
  return storeAuth(await request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, ...(anonymousSessionToken ? { anonymousSessionToken } : {}) }),
  }));
}

export async function loginAccount(input: { email: string; password: string }): Promise<AccountUser> {
  const user = await storeAuth(await request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) }));
  const token = read(ACCOUNT_SESSION_KEY);
  const anonymousSessionToken = read(ANONYMOUS_SESSION_KEY);
  if (token && anonymousSessionToken) {
    await request("/api/v1/auth/claim-anonymous-data", {
      method: "POST",
      body: JSON.stringify({ anonymousSessionToken }),
    }, token).catch(() => undefined);
  }
  return user;
}

export async function logoutAccount(): Promise<void> {
  const token = read(ACCOUNT_SESSION_KEY);
  remove(ACCOUNT_SESSION_KEY);
  if (token) await request("/api/v1/auth/logout", { method: "POST" }, token).catch(() => undefined);
}

export async function updateAccountProfile(displayName: string): Promise<AccountUser> {
  const token = read(ACCOUNT_SESSION_KEY);
  if (!token) throw new AuthApiError("unauthorized", 401);
  const parsed = MeResponseSchema.safeParse(await (await request("/api/v1/auth/profile", {
    method: "PATCH", body: JSON.stringify({ displayName }),
  }, token)).json());
  if (!parsed.success) throw new AuthApiError("invalid_response", 502);
  return parsed.data.user;
}

export async function listAccountProjects(): Promise<AccountProjectSummary[]> {
  const token = read(ACCOUNT_SESSION_KEY);
  if (!token) return [];
  const parsed = ProjectListSchema.safeParse(await (await request("/api/v1/projects?limit=100", {}, token)).json());
  if (!parsed.success) throw new AuthApiError("invalid_response", 502);
  return parsed.data.projects;
}
