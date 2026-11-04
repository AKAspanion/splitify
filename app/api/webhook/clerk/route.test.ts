import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));
vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook: vi.fn() }));

import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/lib/db";
import { POST } from "./route";

const verify = vi.mocked(verifyWebhook);
const request = () =>
  new Request("http://localhost/api/webhook/clerk", {
    method: "POST",
    body: "{}",
  }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/webhook/clerk", () => {
  it("answers 400 and touches no user when the signature is rejected", async () => {
    verify.mockRejectedValue(new Error("bad signature"));

    const res = await POST(request());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Invalid signature" });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it("writes the user and answers 200 for a verified user.created", async () => {
    verify.mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "Ada",
        last_name: "Lovelace",
        email_addresses: [{ email_address: "ada@example.com" }],
      },
    } as never);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Event received" });
    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "user_1",
        email: "ada@example.com",
        fromClerk: true,
      }),
    });
  });

  it("answers a generic 500 when writing the user fails", async () => {
    verify.mockResolvedValue({
      type: "user.created",
      data: { id: "user_1" },
    } as never);
    vi.mocked(db.user.create).mockRejectedValue(new Error("SQL detail"));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Something went wrong" });
  });
});
