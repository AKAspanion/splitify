import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    group: { count: vi.fn() },
    expense: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { GET } from "./route";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const groupCount = vi.mocked(db.group.count);
const expenseCount = vi.mocked(db.expense.count);
const expenseFindMany = vi.mocked(db.expense.findMany);

const call = (id = "g1") =>
  GET(new Request(`http://localhost/api/app/group/${id}/expense`), {
    params: Promise.resolve({ id }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: "u1" });
});

describe("GET /api/app/group/:id/expense", () => {
  it("answers 401 without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await call()).status).toBe(401);
    expect(expenseFindMany).not.toHaveBeenCalled();
  });

  it("answers a member with count and expenses", async () => {
    groupCount.mockResolvedValue(1);
    expenseCount.mockResolvedValue(1);
    expenseFindMany.mockResolvedValue([{ id: "e1" }] as never);
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 1, expenses: [{ id: "e1" }] });
  });

  it("answers a non-member or unknown group with 404 and reads no expenses", async () => {
    groupCount.mockResolvedValue(0);
    const res = await call();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Not found" });
    expect(expenseFindMany).not.toHaveBeenCalled();
    expect(expenseCount).not.toHaveBeenCalled();
  });

  it("answers 500 with a fixed message when the database throws", async () => {
    groupCount.mockResolvedValue(1);
    expenseCount.mockRejectedValue(new Error("secret sql detail"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Something went wrong" });
  });
});
