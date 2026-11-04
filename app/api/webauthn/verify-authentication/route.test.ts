import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getChallengeSession: vi.fn() }));
vi.mock("@/lib/auth/service/devices", () => ({
  default: { getDevice: vi.fn(), updateCounter: vi.fn() },
}));
vi.mock("@simplewebauthn/server", () => ({
  verifyAuthenticationResponse: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import DevicesService from "@/lib/auth/service/devices";
import { getChallengeSession } from "@/lib/auth/session";
import { POST } from "./route";

const request = () =>
  new Request("http://localhost/api/webauthn/verify-authentication", {
    method: "POST",
    body: JSON.stringify({ rawId: "cred1" }),
  });

const signedIn = () =>
  vi.mocked(auth).mockResolvedValue({ userId: "u1" } as never);
const sessionWith = (currentChallenge?: string) =>
  vi
    .mocked(getChallengeSession)
    .mockResolvedValue({ currentChallenge, save: vi.fn() } as never);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "trace").mockImplementation(() => {});
});

describe("POST /api/webauthn/verify-authentication", () => {
  it("answers 401 without a user", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    expect((await POST(request())).status).toBe(401);
  });

  it("answers 400 and does not verify when the session has no challenge", async () => {
    signedIn();
    sessionWith(undefined);

    const res = await POST(request());

    expect(res.status).toBe(400);
    expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it("answers a generic 500 when the session password is missing", async () => {
    signedIn();
    vi.mocked(getChallengeSession).mockRejectedValue(
      new Error("secret detail"),
    );

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Something went wrong" });
  });

  it("saves the new counter after a verified authentication", async () => {
    signedIn();
    sessionWith("challenge1");
    vi.mocked(DevicesService.getDevice).mockResolvedValue([
      { id: "cred1", publicKey: new Uint8Array(), counter: 3 },
    ] as never);
    vi.mocked(verifyAuthenticationResponse).mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 7 },
    } as never);

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { verified: true } });
    expect(DevicesService.updateCounter).toHaveBeenCalledWith("u1", "cred1", 7);
  });
});
