import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "@/src/lib/auth";
import { ACCOUNT_SESSION_KEY } from "@/src/lib/quandaApi";

const USER_ID = "11111111-1111-4111-8111-111111111111";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const account = {
  id: USER_ID,
  email: "artist@example.com",
  displayName: "Quanda Artist",
  avatar: null,
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authResponse() {
  return {
    user: account,
    sessionToken: "qua_account-session",
    expiresAt: "2026-10-10T00:00:00.000Z",
  };
}

function installBrowser(storage: Storage, fetchMock: typeof fetch) {
  vi.stubGlobal("window", {
    localStorage: storage,
    setTimeout,
    clearTimeout,
  });
  vi.stubGlobal("fetch", fetchMock);
  process.env.NEXT_PUBLIC_QUANDA_API_URL = "https://quanda-api.example";
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_QUANDA_API_URL;
  vi.unstubAllGlobals();
});

describe("optional account client", () => {
  it("upgrades the active anonymous session during registration", async () => {
    const storage = new MemoryStorage();
    storage.setItem("quanda:v1:session-token", "qus_guest-session");
    const fetchMock = vi.fn(async (...request: [RequestInfo | URL, RequestInit?]) => {
      void request;
      return jsonResponse(authResponse(), 201);
    });
    installBrowser(storage, fetchMock as typeof fetch);

    const user = await registerAccount({
      displayName: "Quanda Artist",
      email: "artist@example.com",
      password: "StrongPass1",
    });

    expect(user).toEqual(account);
    expect(storage.getItem(ACCOUNT_SESSION_KEY)).toBe("qua_account-session");
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      email: "artist@example.com",
      anonymousSessionToken: "qus_guest-session",
    });
    expect(JSON.stringify(await (await jsonResponse(authResponse())).json())).not.toContain("StrongPass1");
  });

  it("logs in on another device and claims that device's guest projects", async () => {
    const storage = new MemoryStorage();
    storage.setItem("quanda:v1:session-token", "qus_second-device-guest");
    const fetchMock = vi.fn(async (...request: [RequestInfo | URL, RequestInit?]) => {
      const [input] = request;
      const url = String(input);
      if (url.endsWith("/login")) return jsonResponse(authResponse());
      if (url.endsWith("/claim-anonymous-data")) return jsonResponse({ claimed: 1, conflictsResolved: 0 });
      throw new Error(`Unexpected request: ${url}`);
    });
    installBrowser(storage, fetchMock as typeof fetch);

    expect(await loginAccount({ email: "artist@example.com", password: "StrongPass1" })).toEqual(account);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: "Bearer qua_account-session",
    });
  });

  it("restores a persisted account session and removes it on logout even offline", async () => {
    const storage = new MemoryStorage();
    storage.setItem(ACCOUNT_SESSION_KEY, "qua_account-session");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/me")) return jsonResponse({ user: account });
      throw new TypeError("offline");
    });
    installBrowser(storage, fetchMock as typeof fetch);

    expect(await currentAccount()).toEqual(account);
    await logoutAccount();
    expect(storage.getItem(ACCOUNT_SESSION_KEY)).toBeNull();
  });
});
