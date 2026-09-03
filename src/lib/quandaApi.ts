import { z } from "zod";
import type { QuandaProjectSnapshot } from "@/src/lib/projectSnapshot";

const IDENTITY_KEY = "quanda:v1:identity-token";
const SESSION_KEY = "quanda:v1:session-token";
const PROJECT_REFERENCE_KEY = "quanda:v1:backend-project";
const RESTORE_SUPPRESSED_KEY = "quanda:v1:remote-restore-suppressed";
const REQUEST_TIMEOUT_MS = 8_000;
const EVENT_BATCH_DELAY_MS = 250;

const SessionResponseSchema = z.object({
  user: z.object({ id: z.string().uuid(), isNew: z.boolean() }),
  session: z.object({
    id: z.string().uuid(),
    isNew: z.boolean(),
    startedAt: z.string(),
  }),
  returningUser: z.boolean(),
  identityToken: z.string().startsWith("qui_"),
  sessionToken: z.string().startsWith("qus_"),
});

const ProjectRecordSchema = z.object({
  id: z.string().uuid(),
  clientProjectId: z.string().uuid(),
  schemaVersion: z.number().int(),
  title: z.string(),
  status: z.enum(["draft", "planning", "active", "completed", "archived"]),
  inputFingerprint: z.string().nullable().optional(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  data: z.unknown().optional(),
});

const ProjectListSchema = z.object({
  projects: z.array(ProjectRecordSchema),
});

const ProjectReferenceSchema = z.object({
  clientProjectId: z.string().uuid(),
  serverProjectId: z.string().uuid().optional(),
  version: z.number().int().positive().optional(),
  status: z.enum(["draft", "planning", "active", "completed", "archived"]).optional(),
});

export type BackendEventName =
  | "site_opened"
  | "brief_submitted"
  | "creative_dna_analysis_completed"
  | "creative_dna_confirmed"
  | "tutorial_matching_completed"
  | "tutorial_opened"
  | "tutorial_replaced"
  | "tutorial_replacement_undone"
  | "skill_gap_updated"
  | "roadmap_generated"
  | "roadmap_viewed"
  | "roadmap_stage_completed"
  | "calendar_opened"
  | "calendar_item_created"
  | "calendar_item_completed"
  | "calendar_navigation_used"
  | "project_created"
  | "project_updated"
  | "project_completed"
  | "language_changed"
  | "creative_dna_analysis_started"
  | "creative_dna_analysis_succeeded"
  | "creative_dna_analysis_fallback"
  | "creative_dna_review_viewed"
  | "creative_dna_concept_removed"
  | "creative_dna_concept_added"
  | "creative_dna_unknown_added"
  | "creative_dna_reanalysis_requested"
  | "tutorial_matching_started"
  | "tutorial_matching_succeeded"
  | "roadmap_generate_started"
  | "roadmap_generate_failed"
  | "roadmap_generate_succeeded"
  | "roadmap_generate_fallback"
  | "roadmap_regenerated"
  | "engineering_interpretation_started"
  | "engineering_interpretation_completed"
  | "engineering_interpretation_failed"
  | "engineering_preparation_selected"
  | "engineering_plan_generate_started"
  | "engineering_plan_generate_failed"
  | "engineering_plan_generated"
  | "engineering_task_completed"
  | "stage_completed";

export type EventProperties = Record<
  string,
  string | number | boolean | null
>;

export type BackendSession = z.infer<typeof SessionResponseSchema>;
export type BackendProjectRecord = z.infer<typeof ProjectRecordSchema>;
type ProjectReference = z.infer<typeof ProjectReferenceSchema>;

interface QuandaApiOptions {
  apiBaseUrl: string;
  storage: Storage;
  fetchImpl?: typeof fetch;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
}

class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function safeStorageRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageWrite(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Backend persistence is an enhancement; local app behavior must continue.
  }
}

function safeStorageRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // An in-memory session can continue when browser storage is unavailable.
  }
}

function normalizedBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/u, "");
}

export class QuandaApiClient {
  private readonly baseUrl: string;
  private readonly storage: Storage;
  private readonly fetchImpl: typeof fetch;
  private readonly schedule: NonNullable<QuandaApiOptions["schedule"]>;
  private session: BackendSession | null = null;
  private sessionPromise: Promise<BackendSession | null> | null = null;
  private eventQueue: Array<{
    id: string;
    name: BackendEventName;
    eventTime: string;
    projectId?: string;
    properties: EventProperties;
  }> = [];
  private flushScheduled = false;
  private currentProjectId: string | null = null;
  private lastProjectPayload = "";
  private saveChain: Promise<BackendProjectRecord | null> = Promise.resolve(null);

  constructor(options: QuandaApiOptions) {
    this.baseUrl = normalizedBaseUrl(options.apiBaseUrl);
    this.storage = options.storage;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.schedule = options.schedule ?? ((callback, delay) => setTimeout(callback, delay));
  }

  get enabled(): boolean {
    return this.baseUrl.length > 0;
  }

  async initialize(): Promise<BackendSession | null> {
    if (!this.enabled) return null;
    if (this.session) return this.session;
    if (this.sessionPromise) return this.sessionPromise;
    this.sessionPromise = this.bootstrapSession().finally(() => {
      this.sessionPromise = null;
    });
    return this.sessionPromise;
  }

  track(name: BackendEventName, properties: EventProperties = {}): void {
    if (!this.enabled) return;
    this.eventQueue.push({
      id: randomUuid(),
      name,
      eventTime: new Date().toISOString(),
      ...(this.currentProjectId ? { projectId: this.currentProjectId } : {}),
      properties,
    });
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    this.schedule(() => {
      this.flushScheduled = false;
      void this.flushEvents();
    }, EVENT_BATCH_DELAY_MS);
  }

  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    if (!(await this.initialize())) {
      this.eventQueue = [];
      return;
    }
    const events = this.eventQueue.splice(0, 50);
    try {
      await this.authenticatedRequest("/api/v1/events", {
        method: "POST",
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch {
      // Analytics failures are intentionally invisible to the product flow.
    }
    if (this.eventQueue.length > 0) {
      this.schedule(() => void this.flushEvents(), EVENT_BATCH_DELAY_MS);
    }
  }

  saveProject(input: {
    title: string;
    status: "draft" | "planning" | "active" | "completed";
    inputFingerprint: string;
    data: QuandaProjectSnapshot;
  }): Promise<BackendProjectRecord | null> {
    const payloadKey = JSON.stringify(input);
    if (payloadKey === this.lastProjectPayload) return this.saveChain;
    this.lastProjectPayload = payloadKey;
    this.saveChain = this.saveChain
      .catch(() => null)
      .then(() => this.saveProjectNow(input))
      .then((result) => {
        if (!result && this.lastProjectPayload === payloadKey) {
          this.lastProjectPayload = "";
        }
        return result;
      })
      .catch(() => {
        if (this.lastProjectPayload === payloadKey) this.lastProjectPayload = "";
        return null;
      });
    return this.saveChain;
  }

  async restoreLatestProject(): Promise<BackendProjectRecord | null> {
    if (safeStorageRead(this.storage, RESTORE_SUPPRESSED_KEY) === "1") return null;
    if (!(await this.initialize())) return null;
    try {
      const response = await this.authenticatedRequest("/api/v1/projects?limit=1");
      const list = ProjectListSchema.safeParse(await response.json());
      if (!list.success || !list.data.projects[0]) return null;
      const summary = list.data.projects[0];
      const fullResponse = await this.authenticatedRequest(
        `/api/v1/projects/${summary.id}`,
      );
      const record = ProjectRecordSchema.safeParse(await fullResponse.json());
      if (!record.success) return null;
      this.writeProjectReference({
        clientProjectId: record.data.clientProjectId,
        serverProjectId: record.data.id,
        version: record.data.version,
        status: record.data.status,
      });
      this.currentProjectId = record.data.id;
      return record.data;
    } catch {
      return null;
    }
  }

  async archiveCurrentProject(): Promise<void> {
    await this.saveChain.catch(() => null);
    const reference = this.readProjectReference();
    if (reference?.serverProjectId && (await this.initialize())) {
      try {
        await this.authenticatedRequest(`/api/v1/projects/${reference.serverProjectId}`, {
          method: "DELETE",
        });
      } catch {
        // Local reset remains successful if remote archival is unavailable.
      }
    }
    safeStorageRemove(this.storage, PROJECT_REFERENCE_KEY);
    safeStorageWrite(this.storage, RESTORE_SUPPRESSED_KEY, "1");
    this.currentProjectId = null;
    this.lastProjectPayload = "";
  }

  private async bootstrapSession(): Promise<BackendSession | null> {
    try {
      const identityToken = safeStorageRead(this.storage, IDENTITY_KEY);
      const sessionToken = safeStorageRead(this.storage, SESSION_KEY);
      const response = await this.request("/api/v1/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(identityToken ? { identityToken } : {}),
          ...(sessionToken ? { sessionToken } : {}),
        }),
      });
      const parsed = SessionResponseSchema.safeParse(await response.json());
      if (!parsed.success) return null;
      this.session = parsed.data;
      safeStorageWrite(this.storage, IDENTITY_KEY, parsed.data.identityToken);
      safeStorageWrite(this.storage, SESSION_KEY, parsed.data.sessionToken);
      const reference = this.readProjectReference();
      this.currentProjectId = reference?.serverProjectId ?? null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  private async saveProjectNow(input: {
    title: string;
    status: "draft" | "planning" | "active" | "completed";
    inputFingerprint: string;
    data: QuandaProjectSnapshot;
  }, allowConflictRetry = true): Promise<BackendProjectRecord | null> {
    if (!(await this.initialize())) return null;
    const reference = this.readProjectReference() ?? {
      clientProjectId: randomUuid(),
    };
    const body = {
      schemaVersion: 1,
      title: input.title,
      status: input.status,
      inputFingerprint: input.inputFingerprint,
      data: input.data,
    };

    try {
      let response: Response;
      let created = false;
      if (reference.serverProjectId && reference.version) {
        response = await this.authenticatedRequest(
          `/api/v1/projects/${reference.serverProjectId}`,
          {
          method: "PATCH",
          body: JSON.stringify({ expectedVersion: reference.version, ...body }),
          },
        );
      } else {
        response = await this.authenticatedRequest("/api/v1/projects", {
          method: "POST",
          body: JSON.stringify({ clientProjectId: reference.clientProjectId, ...body }),
        });
        created = response.status === 201;
      }
      const parsed = ProjectRecordSchema.safeParse(await response.json());
      if (!parsed.success) return null;
      this.currentProjectId = parsed.data.id;
      this.writeProjectReference({
        clientProjectId: parsed.data.clientProjectId,
        serverProjectId: parsed.data.id,
        version: parsed.data.version,
        status: parsed.data.status,
      });
      safeStorageRemove(this.storage, RESTORE_SUPPRESSED_KEY);
      this.track(created ? "project_created" : "project_updated", {
        status: parsed.data.status,
        version: parsed.data.version,
      });
      if (parsed.data.status === "completed" && reference.status !== "completed") {
        this.track("project_completed", { version: parsed.data.version });
      }
      return parsed.data;
    } catch (error) {
      if (
        allowConflictRetry &&
        error instanceof ApiError &&
        error.status === 409 &&
        reference.serverProjectId
      ) {
        try {
          const response = await this.authenticatedRequest(
            `/api/v1/projects/${reference.serverProjectId}`,
          );
          const current = ProjectRecordSchema.safeParse(await response.json());
          if (current.success) {
            this.writeProjectReference({
              clientProjectId: current.data.clientProjectId,
              serverProjectId: current.data.id,
              version: current.data.version,
              status: current.data.status,
            });
            return this.saveProjectNow(input, false);
          }
        } catch {
          return null;
        }
      }
      if (error instanceof ApiError && error.status === 404) {
        safeStorageRemove(this.storage, PROJECT_REFERENCE_KEY);
        this.currentProjectId = null;
      }
      return null;
    }
  }

  private readProjectReference(): ProjectReference | null {
    const raw = safeStorageRead(this.storage, PROJECT_REFERENCE_KEY);
    if (!raw) return null;
    try {
      const parsed = ProjectReferenceSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private writeProjectReference(reference: ProjectReference): void {
    safeStorageWrite(this.storage, PROJECT_REFERENCE_KEY, JSON.stringify(reference));
  }

  private authHeaders(sessionToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    };
  }

  private async authenticatedRequest(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    let session = await this.initialize();
    if (!session) throw new ApiError(503, "QUANDA API session unavailable");
    const send = (token: string) =>
      this.request(path, {
        ...init,
        headers: {
          ...this.authHeaders(token),
          ...(init.headers as Record<string, string> | undefined),
        },
      });
    try {
      return await send(session.sessionToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      this.session = null;
      safeStorageRemove(this.storage, SESSION_KEY);
      session = await this.initialize();
      if (!session) throw error;
      return send(session.sessionToken);
    }
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (!response.ok) throw new ApiError(response.status, `QUANDA API ${response.status}`);
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

let browserClient: QuandaApiClient | null = null;

export function getQuandaApiClient(): QuandaApiClient | null {
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = new QuandaApiClient({
      apiBaseUrl: process.env.NEXT_PUBLIC_QUANDA_API_URL ?? "",
      storage: window.localStorage,
      fetchImpl: window.fetch.bind(window),
    });
  }
  return browserClient;
}

export function initializeQuandaApi(): Promise<BackendSession | null> {
  return getQuandaApiClient()?.initialize() ?? Promise.resolve(null);
}

export function persistQuandaProject(input: Parameters<QuandaApiClient["saveProject"]>[0]) {
  return getQuandaApiClient()?.saveProject(input) ?? Promise.resolve(null);
}

export function restoreLatestQuandaProject() {
  return getQuandaApiClient()?.restoreLatestProject() ?? Promise.resolve(null);
}

export function archiveCurrentQuandaProject() {
  return getQuandaApiClient()?.archiveCurrentProject() ?? Promise.resolve();
}

export function queueBackendEvent(
  name: BackendEventName,
  properties: EventProperties = {},
): void {
  getQuandaApiClient()?.track(name, properties);
}
