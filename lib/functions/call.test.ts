import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  currentUser: null as null | { getIdToken: () => Promise<string> },
}));
vi.mock("@/lib/firebase/app", () => ({ getFirebaseAuth: () => auth }));

import { callFunction } from "./call";

const fetchMock = vi.fn();

beforeEach(() => {
  auth.currentUser = { getIdToken: async () => "token-123" };
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("callFunction", () => {
  it("sends the signed-in person's ID token as a bearer token and keeps the caller's options", async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true }));

    const response = await callFunction("/api/reports/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: "g" }),
    });

    expect(response.status).toBe(200);
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/reports/expenses");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ groupId: "g" }));
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("throws the sign-in line on a 401", async () => {
    fetchMock.mockResolvedValue(
      json(401, { message: "Sign in again to continue." }),
    );
    await expect(callFunction("/api/x")).rejects.toThrow(
      "Sign in again to continue.",
    );
  });

  it("throws the sign-in line, without calling, when nobody is signed in", async () => {
    auth.currentUser = null;
    await expect(callFunction("/api/x")).rejects.toThrow(
      "Sign in again to continue.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws the connection line on a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(callFunction("/api/x")).rejects.toThrow(
      "Couldn't reach Splitify. Check your connection.",
    );
  });

  it("passes on the function's message for a check message and hides anything else", async () => {
    fetchMock.mockResolvedValueOnce(json(404, { message: "Not found" }));
    await expect(callFunction("/api/x")).rejects.toThrow(/^Not found$/);

    fetchMock.mockResolvedValueOnce(
      json(413, { message: "That request is too large." }),
    );
    await expect(callFunction("/api/x")).rejects.toThrow(
      /^That request is too large\.$/,
    );

    fetchMock.mockResolvedValueOnce(
      json(500, { message: "ER_ACCESS_DENIED at /srv/db" }),
    );
    await expect(callFunction("/api/x")).rejects.toThrow(
      /^Something went wrong\. Try again\.$/,
    );

    fetchMock.mockResolvedValueOnce(
      new Response("<html>bad gateway</html>", { status: 502 }),
    );
    await expect(callFunction("/api/x")).rejects.toThrow(
      /^Something went wrong\. Try again\.$/,
    );
  });
});
