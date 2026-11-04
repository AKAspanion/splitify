import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { expense: { findUnique: vi.fn(), findFirst: vi.fn() } },
}));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getExpense } from "./index";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const expenseFind = vi.mocked(db.expense.findFirst);

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: "u1" });
});

describe("getExpense", () => {
  it("returns the expense for a member, matching membership in the query", async () => {
    expenseFind.mockResolvedValue({ id: "e1" } as never);
    const res = await getExpense("e1", "g1");
    expect(res).toEqual({ data: { id: "e1" }, error: null });
    expect(expenseFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "e1",
          groupId: "g1",
          group: { users: { some: { id: "u1" } } },
        },
      }),
    );
  });

  it("returns Not found when the query finds nothing (non-member or unknown)", async () => {
    expenseFind.mockResolvedValue(null);
    const res = await getExpense("e1", "g1");
    expect(res.error).toBe("Not found");
    expect(res.data).toBeNull();
  });

  it("returns Unauthorized without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await getExpense("e1", "g1")).error).toBe("Unauthorized");
  });
});
