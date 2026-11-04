import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    group: { count: vi.fn() },
    user: { count: vi.fn() },
    expense: { findUnique: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import {
  areGroupMembers,
  groupIdOfExpense,
  isFriendOf,
  isGroupMember,
} from "./membership";

const groupCount = vi.mocked(db.group.count);
const userCount = vi.mocked(db.user.count);
const expenseFind = vi.mocked(db.expense.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isGroupMember", () => {
  it("is true when the group counts the user, and the query names both ids", async () => {
    groupCount.mockResolvedValue(1);
    await expect(isGroupMember("u1", "g1")).resolves.toBe(true);
    expect(groupCount).toHaveBeenCalledWith({
      where: { id: "g1", users: { some: { id: "u1" } } },
    });
  });

  it("is false when the count is 0", async () => {
    groupCount.mockResolvedValue(0);
    await expect(isGroupMember("u2", "g1")).resolves.toBe(false);
  });
});

describe("areGroupMembers", () => {
  it("is true when every distinct id is a member, counting duplicates once", async () => {
    userCount.mockResolvedValue(2);
    await expect(areGroupMembers("g1", ["u1", "u2", "u1"])).resolves.toBe(true);
    expect(userCount).toHaveBeenCalledWith({
      where: { id: { in: ["u1", "u2"] }, groups: { some: { id: "g1" } } },
    });
  });

  it("is false when one id is not a member", async () => {
    userCount.mockResolvedValue(1);
    await expect(areGroupMembers("g1", ["u1", "u3"])).resolves.toBe(false);
  });

  it("is true for an empty list without querying", async () => {
    await expect(areGroupMembers("g1", [])).resolves.toBe(true);
    expect(userCount).not.toHaveBeenCalled();
  });
});

describe("groupIdOfExpense", () => {
  it("returns the expense's group id", async () => {
    expenseFind.mockResolvedValue({ groupId: "g1" } as never);
    await expect(groupIdOfExpense("e1")).resolves.toBe("g1");
    expect(expenseFind).toHaveBeenCalledWith({
      where: { id: "e1" },
      select: { groupId: true },
    });
  });

  it("returns null for an unknown expense", async () => {
    expenseFind.mockResolvedValue(null);
    await expect(groupIdOfExpense("nope")).resolves.toBeNull();
  });

  it("returns null for an expense that is in no group", async () => {
    expenseFind.mockResolvedValue({ groupId: null } as never);
    await expect(groupIdOfExpense("e2")).resolves.toBeNull();
  });
});

describe("isFriendOf", () => {
  it("is true when the other user is in the friends list", async () => {
    userCount.mockResolvedValue(1);
    await expect(isFriendOf("u1", "u2")).resolves.toBe(true);
    expect(userCount).toHaveBeenCalledWith({
      where: { id: "u1", friends: { some: { id: "u2" } } },
    });
  });

  it("is false when they are not friends", async () => {
    userCount.mockResolvedValue(0);
    await expect(isFriendOf("u1", "u3")).resolves.toBe(false);
  });
});
