import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock("iron-session", () => ({ getIronSession: vi.fn(async () => ({})) }));

import { getIronSession } from "iron-session";
import { getChallengeSession } from "./session";

const FAKE_PASSWORD = "test-only-fake-password-0123456789ab";

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getChallengeSession", () => {
  it("throws when SESSION_PASSWORD is unset", async () => {
    vi.stubEnv("SESSION_PASSWORD", "");
    await expect(getChallengeSession()).rejects.toThrow("SESSION_PASSWORD");
    expect(getIronSession).not.toHaveBeenCalled();
  });

  it("throws for a 31-character password", async () => {
    vi.stubEnv("SESSION_PASSWORD", FAKE_PASSWORD.slice(0, 31));
    await expect(getChallengeSession()).rejects.toThrow("SESSION_PASSWORD");
  });

  it("opens the challenge cookie with a 32-character password", async () => {
    vi.stubEnv("SESSION_PASSWORD", FAKE_PASSWORD.slice(0, 32));
    await getChallengeSession();
    expect(getIronSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        password: FAKE_PASSWORD.slice(0, 32),
        cookieName: "challenge",
      }),
    );
  });
});
