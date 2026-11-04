import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduled: Array<() => Promise<void>> = [];

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({
  after: (fn: () => Promise<void>) => {
    scheduled.push(fn);
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    expense: { create: vi.fn() },
    activity: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/logger", () => ({
  APILogger: { error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/onesignal", () => ({ sendNotification: vi.fn() }));
vi.mock("@/lib/auth/membership", () => ({
  isGroupMember: vi.fn(),
  areGroupMembers: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { APILogger } from "@/lib/logger";
import { sendNotification } from "@/lib/onesignal";
import { areGroupMembers, isGroupMember } from "@/lib/auth/membership";
import { createExpense } from "./index";

const input = {
  amount: 100,
  description: "Dinner",
  groupId: "g1",
  createrId: "someone-else",
  type: "EQUAL" as const,
  payments: [{ amount: 100, userId: "u1" }],
  splits: [
    { amount: 50, userId: "u1", type: "EQUAL" as const },
    { amount: 50, userId: "u2", type: "EQUAL" as const },
  ],
};

const created = {
  id: "e1",
  groupId: "g1",
  description: "Dinner",
  amount: 100,
  createrId: "u1",
  group: { title: "Goa trip", users: [{ id: "u1" }, { id: "u2" }] },
};

beforeEach(() => {
  vi.clearAllMocks();
  scheduled.length = 0;
  vi.mocked(auth).mockResolvedValue({ userId: "u1" } as never);
  vi.mocked(db.$transaction).mockImplementation((async (fn: unknown) =>
    (fn as (tx: unknown) => unknown)(db)) as never);
  vi.mocked(db.user.findUnique).mockResolvedValue({
    firstName: "Asha",
    name: null,
  } as never);
  vi.mocked(db.expense.create).mockResolvedValue(created as never);
  vi.mocked(isGroupMember).mockResolvedValue(true);
  vi.mocked(areGroupMembers).mockResolvedValue(true);
});

describe("createExpense", () => {
  it("stores the caller as creator whatever the input says", async () => {
    const res = await createExpense(input);

    expect(res.data?.expense.createrId).toBe("u1");
    expect(vi.mocked(db.expense.create).mock.calls[0][0].data.createrId).toBe(
      "u1",
    );
    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: "g1",
        type: "EXPENSE_PLUS",
        users: { connect: [{ id: "u1" }] },
      }),
    });
    expect(res.data?.expense).not.toHaveProperty("group");
  });

  it("checks every payer and split user is a member", async () => {
    await createExpense(input);
    expect(areGroupMembers).toHaveBeenCalledWith("g1", ["u1", "u1", "u2"]);
  });

  it("refuses a split user who isn't a member and writes nothing", async () => {
    vi.mocked(areGroupMembers).mockResolvedValue(false);

    const res = await createExpense(input);

    expect(res).toEqual({
      error: "Only members of this group can be added to an expense",
    });
    expect(db.expense.create).not.toHaveBeenCalled();
    expect(db.activity.create).not.toHaveBeenCalled();
  });

  it("answers a non-member of the group as Not found", async () => {
    vi.mocked(isGroupMember).mockResolvedValue(false);

    const res = await createExpense(input);

    expect(res).toEqual({ error: "Not found" });
    expect(db.expense.create).not.toHaveBeenCalled();
  });

  it("still returns the expense when OneSignal rejects, logging one line with the type and no body", async () => {
    vi.mocked(sendNotification).mockRejectedValue(new Error("boom"));

    const res = await createExpense(input);
    await Promise.all(scheduled.map((fn) => fn()));

    expect(res.data?.expense.id).toBe("e1");
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(APILogger.error).toHaveBeenCalledTimes(1);
    expect(APILogger.error).toHaveBeenCalledWith("Push notification failed", {
      type: "EXPENSE_PLUS",
      failed: 2,
    });
  });

  it("sends the caller 'You' and the other members the caller's name", async () => {
    vi.mocked(sendNotification).mockResolvedValue({ id: "n" });

    await createExpense(input);
    await Promise.all(scheduled.map((fn) => fn()));

    const contents = vi
      .mocked(sendNotification)
      .mock.calls.map(([n]) => [n.external_id[0], n.content]);
    expect(contents).toEqual([
      ["u1", 'You added expense "Dinner" in group "Goa trip"'],
      ["u2", 'Asha added expense "Dinner" in group "Goa trip"'],
    ]);
    expect(APILogger.error).not.toHaveBeenCalled();
  });
});
