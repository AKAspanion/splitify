import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/logger", () => ({
  APILogger: { error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/auth/membership", () => ({ isFriendOf: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isFriendOf } from "@/lib/auth/membership";
import { updateContact } from "./index";

const input = { id: "c1", name: "Ravi K", email: "ravi@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ userId: "u1" } as never);
  vi.mocked(db.user.update).mockResolvedValue({ id: "c1" } as never);
});

describe("updateContact", () => {
  it("updates a friend who isn't from Clerk", async () => {
    vi.mocked(isFriendOf).mockResolvedValue(true);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      fromClerk: null,
    } as never);

    const res = await updateContact(input);

    expect(isFriendOf).toHaveBeenCalledWith("u1", "c1");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { email: "ravi@example.com", name: "Ravi K" },
    });
    expect(res.data?.user.id).toBe("c1");
  });

  it("refuses a user who isn't the caller's friend", async () => {
    vi.mocked(isFriendOf).mockResolvedValue(false);

    const res = await updateContact(input);

    expect(res).toEqual({ error: "You can't edit this contact" });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("refuses a friend who signed up with Clerk", async () => {
    vi.mocked(isFriendOf).mockResolvedValue(true);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      fromClerk: true,
    } as never);

    const res = await updateContact(input);

    expect(res).toEqual({ error: "You can't edit this contact" });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("refuses a contact that doesn't exist", async () => {
    vi.mocked(isFriendOf).mockResolvedValue(true);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const res = await updateContact(input);

    expect(res).toEqual({ error: "You can't edit this contact" });
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
