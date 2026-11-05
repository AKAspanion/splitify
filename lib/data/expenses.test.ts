import { describe, expect, it } from "vitest";
import {
  invalidatedByExpenseWrite,
  prepareExpense,
  prepareSettlement,
  validateExpense,
} from "./expenses";
import { yourShareInExpense } from "@/app/(platform)/(app)/_utils/expense";
import type { User, UserPayment, UserSplit } from "@/generated/prisma/browser";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GROUP = "11111111-1111-4111-8111-111111111111";
const EXPENSE = "22222222-2222-4222-8222-222222222222";

const names = (keys: readonly unknown[][]) => keys.map((k) => k[0]);

describe("invalidatedByExpenseWrite", () => {
  it.each(["CreateExpense", "CreateSettlement"] as const)(
    "%s makes the group's ledger, expenses and page, and the activity, stale",
    (op) => {
      const keys = invalidatedByExpenseWrite(op, GROUP);
      expect(keys).toEqual([
        ["GetGroupLedger", { groupId: GROUP }],
        ["ListGroupExpenses", { groupId: GROUP }],
        ["GetGroup", { id: GROUP }],
        ["ListMyActivity"],
      ]);
    },
  );

  it.each(["UpdateExpense", "DeleteExpense"] as const)(
    "%s also makes the expense itself stale",
    (op) => {
      const keys = invalidatedByExpenseWrite(op, GROUP, EXPENSE);
      expect(names(keys)).toEqual([
        "GetGroupLedger",
        "ListGroupExpenses",
        "GetGroup",
        "ListMyActivity",
        "GetExpense",
      ]);
      expect(keys.at(-1)).toEqual(["GetExpense", { id: EXPENSE }]);
    },
  );
});

describe("prepareExpense", () => {
  const input = {
    groupId: GROUP,
    amount: 300,
    description: "Dinner",
    category: "general",
    type: "EQUAL" as const,
    payments: [{ userId: "a", amount: 300 }],
    splits: [
      { userId: "a", amount: 100 },
      { userId: "b", amount: 100 },
      { userId: "c", amount: 100 },
    ],
  };

  it("makes different ids for two expenses from the same input, each a fresh UUID", () => {
    const one = prepareExpense(input);
    const two = prepareExpense(input);
    expect(one.id).toMatch(UUID);
    expect(two.id).toMatch(UUID);
    expect(one.id).not.toBe(two.id);

    const ids = [one, two].flatMap((e) => [
      e.id,
      e.activityId,
      ...e.payments.map((p) => p.id),
      ...e.splits.map((s) => s.id),
    ]);
    expect(ids).toHaveLength(2 * (1 + 1 + 1 + 3));
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(UUID));
  });

  it("keeps the people and amounts it was given", () => {
    const vars = prepareExpense(input);
    expect(
      vars.payments.map(({ userId, amount }) => ({ userId, amount })),
    ).toEqual(input.payments);
    expect(
      vars.splits.map(({ userId, amount }) => ({ userId, amount })),
    ).toEqual(input.splits);
  });
});

describe("prepareSettlement", () => {
  it("makes every id fresh", () => {
    const input = {
      groupId: GROUP,
      amount: 100,
      fromUserId: "b",
      toUserId: "a",
    };
    const one = prepareSettlement(input);
    const two = prepareSettlement(input);
    const ids = [one, two].flatMap((s) => [
      s.id,
      s.paymentId,
      s.splitId,
      s.activityId,
    ]);
    expect(new Set(ids).size).toBe(8);
    ids.forEach((id) => expect(id).toMatch(UUID));
  });
});

describe("validateExpense", () => {
  const base = {
    description: "Dinner",
    amount: 300,
    groupId: GROUP,
    payments: [{ amount: 300 }],
    splits: [{ amount: 100 }, { amount: 100 }, { amount: 100 }],
  };

  it("accepts a balanced expense", () => {
    expect(validateExpense(base)).toBeNull();
  });

  it("refuses splits that don't add up to the total", () => {
    expect(
      validateExpense({ ...base, splits: [{ amount: 100 }, { amount: 50 }] }),
    ).toEqual({ splits: ["All split amount don't add up to total amount"] });
  });

  it("refuses payments that don't add up, a short description and a missing group", () => {
    expect(
      validateExpense({
        ...base,
        description: "ab",
        groupId: "",
        payments: [{ amount: 10 }],
      }),
    ).toEqual({
      description: ["Minimum 3 chars required"],
      groupId: ["Please select a group"],
      payments: ["All paid amount don't add up to total amount"],
    });
  });

  it("asks for an amount when it is empty", () => {
    expect(validateExpense({ ...base, amount: NaN })?.amount).toEqual([
      "Please enter an amount",
    ]);
  });
});

describe("yourShareInExpense", () => {
  const user = (id: string) => ({ id }) as User;
  const pay = (userId: string, amount: number) =>
    ({ userId, amount }) as UserPayment;
  const split = (userId: string, amount: number) =>
    ({ userId, amount }) as UserSplit;

  it("shows what you owe net of what you paid", () => {
    const share = yourShareInExpense(
      "a",
      [user("a"), user("b")],
      [pay("a", 50), pay("b", 250)],
      [split("a", 100), split("b", 200)],
    );
    expect(share.text).toBe("You owe ₹ 50");
  });

  it("shows what you get back", () => {
    const share = yourShareInExpense(
      "b",
      [user("a"), user("b")],
      [pay("a", 50), pay("b", 250)],
      [split("a", 100), split("b", 200)],
    );
    expect(share.text).toBe("You get back ₹ 50");
  });

  it("shows nothing owed when you paid exactly your share", () => {
    const share = yourShareInExpense(
      "a",
      [user("a"), user("b")],
      [pay("a", 100), pay("b", 100)],
      [split("a", 100), split("b", 100)],
    );
    expect(share.text).toBe("You are settled up");
  });
});
