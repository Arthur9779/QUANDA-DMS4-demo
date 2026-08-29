import { describe, expect, it } from "vitest";
import { QuandaApiClient } from "@/src/lib/quandaApi";
import { createProjectSnapshot } from "@/src/lib/projectSnapshot";
import type { RoadmapRequest } from "@/src/types";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "22222222-2222-4222-8222-222222222222";
const CLIENT_PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const SERVER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sessionResponse(returningUser = false) {
  return {
    user: { id: USER_ID, isNew: !returningUser },
    session: {
      id: SESSION_ID,
      isNew: !returningUser,
      startedAt: "2026-08-28T00:00:00.000Z",
    },
    returningUser,
    identityToken: "qui_identity-token",
    sessionToken: "qus_session-token",
  };
}

const form: RoadmapRequest = {
  interfaceLanguage: "en",
  projectBrief: "Create an interactive poster that responds to live microphone input.",
  deadline: "2099-09-30",
  currentExperience: "JavaScript beginner",
  hoursPerDay: 2,
  daysPerWeek: 4,
  tutorialLanguage: "en",
  requiredApplications: ["custom:p5.js"],
  outputType: "other",
  targetQuality: "portfolio",
};

const snapshot = createProjectSnapshot({
  form,
  creativeDnaReview: null,
  learningPlan: null,
  roadmap: null,
  completion: {},
  calendarTasks: [],
});

describe("QUANDA backend client", () => {
  it("creates an anonymous session, retains opaque tokens, and batches events", async () => {
    const storage = new MemoryStorage();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.endsWith("/api/v1/session")) return jsonResponse(sessionResponse(), 201);
      if (url.endsWith("/api/v1/events")) return jsonResponse({ accepted: 1, duplicate: 0 }, 202);
      throw new Error(`Unexpected request: ${url}`);
    };
    const client = new QuandaApiClient({
      apiBaseUrl: "https://quanda-api.example/",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
      schedule: () => ({}) as ReturnType<typeof setTimeout>,
    });

    const session = await client.initialize();
    expect(session?.user.id).toBe(USER_ID);
    expect(storage.getItem("quanda:v1:identity-token")).toBe("qui_identity-token");
    expect(storage.getItem("quanda:v1:session-token")).toBe("qus_session-token");

    client.track("brief_submitted", { outputType: "other" });
    await client.flushEvents();
    const eventRequest = requests.find((request) => request.url.endsWith("/api/v1/events"));
    expect(eventRequest?.init?.headers).toMatchObject({
      Authorization: "Bearer qus_session-token",
    });
    const eventBody = JSON.parse(String(eventRequest?.init?.body));
    expect(eventBody.events).toHaveLength(1);
    expect(eventBody.events[0]).toMatchObject({
      name: "brief_submitted",
      properties: { outputType: "other" },
    });
  });

  it("creates then version-updates one owned project", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "quanda:v1:backend-project",
      JSON.stringify({ clientProjectId: CLIENT_PROJECT_ID }),
    );
    const projectBodies: unknown[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/v1/session")) return jsonResponse(sessionResponse(), 201);
      if (url.endsWith("/api/v1/projects") && init?.method === "POST") {
        projectBodies.push(JSON.parse(String(init.body)));
        return jsonResponse(projectRecord(1, "draft"), 201);
      }
      if (url.endsWith(`/api/v1/projects/${SERVER_PROJECT_ID}`) && init?.method === "PATCH") {
        projectBodies.push(JSON.parse(String(init.body)));
        return jsonResponse(projectRecord(2, "planning"));
      }
      throw new Error(`Unexpected request: ${url}`);
    };
    const client = new QuandaApiClient({
      apiBaseUrl: "https://quanda-api.example",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
      schedule: () => ({}) as ReturnType<typeof setTimeout>,
    });

    const created = await client.saveProject({
      title: "Interactive poster",
      status: "draft",
      inputFingerprint: "12ab34cd",
      data: snapshot,
    });
    expect(created?.version).toBe(1);
    expect(projectBodies[0]).toMatchObject({
      clientProjectId: CLIENT_PROJECT_ID,
      schemaVersion: 1,
      status: "draft",
    });

    const updated = await client.saveProject({
      title: "Interactive poster",
      status: "planning",
      inputFingerprint: "12ab34cd",
      data: snapshot,
    });
    expect(updated?.version).toBe(2);
    expect(projectBodies[1]).toMatchObject({ expectedVersion: 1, status: "planning" });
    expect(JSON.parse(storage.getItem("quanda:v1:backend-project") ?? "{}")).toMatchObject({
      serverProjectId: SERVER_PROJECT_ID,
      version: 2,
      status: "planning",
    });
  });

  it("is a silent no-op when no backend URL is configured", async () => {
    let requestCount = 0;
    const client = new QuandaApiClient({
      apiBaseUrl: "",
      storage: new MemoryStorage(),
      fetchImpl: (async () => {
        requestCount += 1;
        throw new Error("should not run");
      }) as typeof fetch,
    });
    client.track("site_opened");
    expect(await client.initialize()).toBeNull();
    expect(
      await client.saveProject({
        title: "Offline",
        status: "draft",
        inputFingerprint: "12ab34cd",
        data: snapshot,
      }),
    ).toBeNull();
    expect(requestCount).toBe(0);
  });

  it("does not resurrect a remotely saved project after an explicit reset", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "quanda:v1:backend-project",
      JSON.stringify({
        clientProjectId: CLIENT_PROJECT_ID,
        serverProjectId: SERVER_PROJECT_ID,
        version: 1,
        status: "draft",
      }),
    );
    let listRequests = 0;
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/v1/session")) return jsonResponse(sessionResponse(), 200);
      if (url.endsWith(`/api/v1/projects/${SERVER_PROJECT_ID}`) && init?.method === "DELETE") {
        return new Response(null, { status: 503 });
      }
      if (url.includes("/api/v1/projects?")) {
        listRequests += 1;
        return jsonResponse({ projects: [projectRecord(1, "draft")] });
      }
      throw new Error(`Unexpected request: ${url}`);
    };
    const client = new QuandaApiClient({
      apiBaseUrl: "https://quanda-api.example",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await client.archiveCurrentProject();
    expect(await client.restoreLatestProject()).toBeNull();
    expect(listRequests).toBe(0);
  });
});

function projectRecord(version: number, status: "draft" | "planning") {
  return {
    id: SERVER_PROJECT_ID,
    clientProjectId: CLIENT_PROJECT_ID,
    schemaVersion: 1,
    title: "Interactive poster",
    status,
    inputFingerprint: "12ab34cd",
    version,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
    completedAt: null,
    data: snapshot,
  };
}
