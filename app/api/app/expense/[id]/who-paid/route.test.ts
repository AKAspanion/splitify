import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    group: { count: vi.fn() },
    expense: { findUnique: vi.fn() },
    userPayment: { findMany: vi.fn() },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { GET } from "./route";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const groupCount = vi.mocked(db.group.count);
const expenseFind = vi.mocked(db.expense.findUnique);
const paymentFindMany = vi.mocked(db.userPayment.findMany);

const call = (id = "e1") =>
  GET(new Request(`http://localhost/api/app/expense/${id}/who-paid`), {
    params: Promise.resolve({ id }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: "u1" });
});

describe("GET /api/app/expense/:id/who-paid", () => {
  it("answers 401 without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await call()).status).toBe(401);
  });

  it("answers a member with the payers", async () => {
    expenseFind.mockResolvedValue({ groupId: "g1" } as never);
    groupCount.mockResolvedValue(1);
    paymentFindMany.mockResolvedValue([] as never);
    expect((await call()).status).toBe(200);
  });

  it("answers a non-member of the expense's group with 404 and reads no payments", async () => {
    expenseFind.mockResolvedValue({ groupId: "g1" } as never);
    groupCount.mockResolvedValue(0);
    const res = await call();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Not found" });
    expect(paymentFindMany).not.toHaveBeenCalled();
  });

  it("answers an unknown expense exactly like a non-member", async () => {
    expenseFind.mockResolvedValue(null);
    const res = await call("nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Not found" });
    expect(paymentFindMany).not.toHaveBeenCalled();
  });

  it("answers 500 with a fixed message when the database throws", async () => {
    expenseFind.mockResolvedValue({ groupId: "g1" } as never);
    groupCount.mockResolvedValue(1);
    paymentFindMany.mockRejectedValue(new Error("secret sql detail"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Something went wrong" });
  });
});
