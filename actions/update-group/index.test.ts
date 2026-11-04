import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    group: { update: vi.fn() },
    activity: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/logger", () => ({
  APILogger: { error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/auth/membership", () => ({ isGroupMember: vi.fn() }));
vi.mock("@/lib/notification/notify", () => ({ notifyAfterResponse: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isGroupMember } from "@/lib/auth/membership";
import { notifyAfterResponse } from "@/lib/notification/notify";
import { updateGroup } from "./index";

const input = { groupId: "g1", title: "Goa trip", type: "trip" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ userId: "u1" } as never);
  vi.mocked(db.$transaction).mockImplementation((async (fn: unknown) =>
    (fn as (tx: unknown) => unknown)(db)) as never);
  vi.mocked(db.user.findUnique).mockResolvedValue({
    firstName: "Asha",
    name: null,
  } as never);
  vi.mocked(db.group.update).mockResolvedValue({
    id: "g1",
    title: "Goa trip",
  } as never);
});

describe("updateGroup", () => {
  it("writes the group and a GROUP_UPDATE activity in one transaction, then notifies the caller", async () => {
    vi.mocked(isGroupMember).mockResolvedValue(true);

    const res = await updateGroup(input);

    expect(res.data?.userId).toBe("u1");
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.group.update).toHaveBeenCalledTimes(1);
    expect(db.activity.create).toHaveBeenCalledWith({
      data: {
        groupId: "g1",
        type: "GROUP_UPDATE",
        message: "Asha updated group Goa trip",
        users: { connect: [{ id: "u1" }] },
      },
    });
    expect(notifyAfterResponse).toHaveBeenCalledWith(
      ["u1"],
      expect.objectContaining({ type: "GROUP_UPDATE" }),
      "u1",
    );
  });

  it("answers a non-member as Not found and writes nothing", async () => {
    vi.mocked(isGroupMember).mockResolvedValue(false);

    const res = await updateGroup(input);

    expect(res).toEqual({ error: "Not found" });
    expect(isGroupMember).toHaveBeenCalledWith("u1", "g1");
    expect(db.group.update).not.toHaveBeenCalled();
    expect(db.activity.create).not.toHaveBeenCalled();
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });

  it("refuses a caller who isn't signed in", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const res = await updateGroup(input);

    expect(res).toEqual({ error: "Unauthorized" });
    expect(isGroupMember).not.toHaveBeenCalled();
  });

  it("returns a fixed error with no Prisma message when the write fails", async () => {
    vi.mocked(isGroupMember).mockResolvedValue(true);
    vi.mocked(db.group.update).mockRejectedValue(new Error("SQL secret"));

    const res = await updateGroup(input);

    expect(res).toEqual({ error: "Failed to update group" });
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });
});
