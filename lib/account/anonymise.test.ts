import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/logger", () => ({
  APILogger: { error: vi.fn(), info: vi.fn() },
}));

import { APILogger } from "@/lib/logger";
import { anonymiseUser, type TransactionClient } from "./anonymise";

type Row = {
  name: string | null;
  email: string;
  groups: { id: string; _count: { users: number } }[];
} | null;

const asha: NonNullable<Row> = {
  name: "Asha Rao",
  email: "asha@example.com",
  groups: [
    { id: "g1", _count: { users: 2 } },
    { id: "g2", _count: { users: 1 } },
  ],
};

function makeTx(row: Row) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(row),
      update: vi.fn().mockResolvedValue({}),
    },
    group: { deleteMany: vi.fn().mockResolvedValue({}), update: vi.fn() },
    authnDevice: { deleteMany: vi.fn().mockResolvedValue({}) },
    feedback: { deleteMany: vi.fn().mockResolvedValue({}) },
    expense: {} as Record<string, unknown>,
    userPayment: {} as Record<string, unknown>,
    userSplit: {} as Record<string, unknown>,
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
}
const asTx = (tx: ReturnType<typeof makeTx>) =>
  tx as unknown as TransactionClient;

type SqlLike = { strings: readonly string[]; values: unknown[] };
const isSql = (v: unknown): v is SqlLike =>
  typeof v === "object" && v !== null && "strings" in v && "values" in v;

/** Every SQL text fragment and every bound value of a tagged-template call, nested Sql included. */
function flatten(
  strings: readonly string[],
  values: unknown[],
): { text: string; bound: unknown[] } {
  let text = strings.join("?");
  const bound: unknown[] = [];
  for (const v of values) {
    if (isSql(v)) {
      const inner = flatten(v.strings, v.values);
      text += inner.text;
      bound.push(...inner.bound);
    } else {
      bound.push(v);
    }
  }
  return { text, bound };
}

describe("anonymiseUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes only groups where the person is the sole member", async () => {
    const tx = makeTx(asha);
    const result = await anonymiseUser(asTx(tx), "user_1");
    expect(result).toEqual({ anonymised: true });
    expect(tx.group.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.group.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["g2"] } },
    });
  });

  it("rewrites activity with a bound name and the kept group ids", async () => {
    const tx = makeTx(asha);
    await anonymiseUser(asTx(tx), "user_1");
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    const [strings, ...values] = tx.$executeRaw.mock.calls[0] as [
      string[],
      ...unknown[],
    ];
    const { text, bound } = flatten(strings, values);
    expect(bound).toContain("Asha Rao");
    expect(bound).toContain("g1");
    expect(bound).not.toContain("g2");
    expect(text).not.toContain("Asha Rao");
    expect(text).not.toContain("g2");
  });

  it("binds a hostile name instead of splicing it", async () => {
    const name = "x'); DROP TABLE User; --";
    const tx = makeTx({ ...asha, name });
    await anonymiseUser(asTx(tx), "user_1");
    const [strings, ...values] = tx.$executeRaw.mock.calls[0] as [
      string[],
      ...unknown[],
    ];
    const { text, bound } = flatten(strings, values);
    expect(bound).toContain(name);
    expect(text).not.toContain("DROP");
  });

  it("deletes the authn device and feedback rows", async () => {
    const tx = makeTx(asha);
    await anonymiseUser(asTx(tx), "user_1");
    expect(tx.authnDevice.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(tx.feedback.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
  });

  it("replaces the identifying fields and clears friendships", async () => {
    const tx = makeTx(asha);
    await anonymiseUser(asTx(tx), "user_1");
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        name: "Deleted user",
        firstName: "Deleted",
        lastName: "user",
        email: "deleted-user_1@deleted.invalid",
        image_url: "/images/placeholder/avatar.jpeg",
        profile_image_url: "/images/placeholder/avatar.jpeg",
        fromClerk: false,
        friends: { set: [] },
        symmetricFriends: { set: [] },
      },
    });
  });

  it.each(["", "   ", null])(
    "skips the activity rewrite for name %j but still anonymises",
    async (name) => {
      const tx = makeTx({ ...asha, name });
      const result = await anonymiseUser(asTx(tx), "user_1");
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.user.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ anonymised: true });
    },
  );

  it("skips the activity rewrite when every group was deleted", async () => {
    const tx = makeTx({
      ...asha,
      groups: [{ id: "g2", _count: { users: 1 } }],
    });
    const result = await anonymiseUser(asTx(tx), "user_1");
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(result).toEqual({ anonymised: true });
  });

  it("does nothing for an already anonymised row", async () => {
    const tx = makeTx({ ...asha, email: "deleted-user_1@deleted.invalid" });
    const result = await anonymiseUser(asTx(tx), "user_1");
    expect(result).toEqual({ anonymised: false });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.group.deleteMany).not.toHaveBeenCalled();
    expect(tx.authnDevice.deleteMany).not.toHaveBeenCalled();
    expect(tx.feedback.deleteMany).not.toHaveBeenCalled();
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it("does nothing for a missing row", async () => {
    const tx = makeTx(null);
    const result = await anonymiseUser(asTx(tx), "user_1");
    expect(result).toEqual({ anonymised: false });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.group.deleteMany).not.toHaveBeenCalled();
  });

  it("never touches expenses, payments, splits or group updates", async () => {
    const tx = makeTx(asha);
    const touched: string[] = [];
    for (const k of ["expense", "userPayment", "userSplit"] as const) {
      tx[k] = new Proxy(
        {},
        {
          get: (_t, p) => {
            touched.push(`${k}.${String(p)}`);
            return vi.fn();
          },
        },
      );
    }
    await anonymiseUser(asTx(tx), "user_1");
    expect(touched).toEqual([]);
    expect(tx.group.update).not.toHaveBeenCalled();
  });

  it("never throws: a failure is logged and reported as not anonymised", async () => {
    const tx = makeTx(asha);
    tx.user.update.mockRejectedValue(new Error("db down"));
    await expect(anonymiseUser(asTx(tx), "user_1")).resolves.toEqual({
      anonymised: false,
    });
    expect(APILogger.error).toHaveBeenCalled();
  });
});
