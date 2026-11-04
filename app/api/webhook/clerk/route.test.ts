import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyWebhook, anonymiseUser, db } = vi.hoisted(() => {
  const db = {
    user: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  };
  return { verifyWebhook: vi.fn(), anonymiseUser: vi.fn(), db };
});

vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/account/anonymise", () => ({ anonymiseUser }));

import { POST } from "./route";

const tx = { marker: "tx" };
const request = () =>
  new Request("http://localhost/api/webhook/clerk", {
    method: "POST",
  }) as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.$transaction.mockImplementation(async (fn: (t: unknown) => unknown) =>
    fn(tx),
  );
  anonymiseUser.mockResolvedValue({ anonymised: true });
});

describe("POST /api/webhook/clerk", () => {
  it("anonymises the user inside a transaction on user.deleted", async () => {
    verifyWebhook.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_1" },
    });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Event received" });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(anonymiseUser).toHaveBeenCalledWith(tx, "user_1");
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it("answers 200 when nothing was anonymised", async () => {
    verifyWebhook.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_1" },
    });
    anonymiseUser.mockResolvedValue({ anonymised: false });
    const res = await POST(request());
    expect(res.status).toBe(200);
  });

  it("answers 400 and does nothing when the signature is invalid", async () => {
    verifyWebhook.mockRejectedValue(new Error("bad"));
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Invalid signature" });
    expect(anonymiseUser).not.toHaveBeenCalled();
  });

  it("answers 200 without anonymising when user.deleted has no id", async () => {
    verifyWebhook.mockResolvedValue({ type: "user.deleted", data: {} });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(anonymiseUser).not.toHaveBeenCalled();
  });

  it("answers 500 when anonymiseUser rejects", async () => {
    verifyWebhook.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_1" },
    });
    anonymiseUser.mockRejectedValue(new Error("boom"));
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Something went wrong" });
  });

  it("keeps the upsert path for user.updated", async () => {
    verifyWebhook.mockResolvedValue({
      type: "user.updated",
      data: {
        id: "user_1",
        email_addresses: [{ email_address: "a@b.c" }],
        first_name: "A",
      },
    });
    db.user.findUnique.mockResolvedValue(null);
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(db.user.upsert).toHaveBeenCalledTimes(1);
    expect(anonymiseUser).not.toHaveBeenCalled();
  });
});
