import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/excel", () => ({ generateXLS: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    group: { count: vi.fn(), findUnique: vi.fn() },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateXLS } from "@/lib/excel";
import { POST } from "./route";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const groupCount = vi.mocked(db.group.count);
const groupFind = vi.mocked(db.group.findUnique);
const generate = vi.mocked(generateXLS);

const call = (body: unknown = { groupId: "g1" }) =>
  POST(
    new Request("http://localhost/api/generate/csv/expense", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ userId: "u1" });
});

describe("POST /api/generate/csv/expense", () => {
  it("answers 401 without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await call()).status).toBe(401);
  });

  it("builds the export for a member", async () => {
    groupCount.mockResolvedValue(1);
    groupFind.mockResolvedValue({
      title: "T",
      expenses: [{ id: "e1" }],
    } as never);
    generate.mockResolvedValue(Buffer.from("x") as never);
    const res = await call();
    expect(res.status).toBe(200);
    expect(generate).toHaveBeenCalled();
  });

  it("answers a non-member with 404 and builds no export", async () => {
    groupCount.mockResolvedValue(0);
    const res = await call();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Not found" });
    expect(groupFind).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("answers 500 with a fixed message when the database throws", async () => {
    groupCount.mockResolvedValue(1);
    groupFind.mockRejectedValue(new Error("secret sql detail"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Something went wrong" });
  });
});
