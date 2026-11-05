import { describe, expect, it } from "vitest";
import type { GetGroupLedgerData } from "@dataconnect/app";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";
import type { User } from "@/types/shared";
import {
  calcGroupSplits,
  evaluateTotals,
} from "@/app/(platform)/(app)/_utils/calculation";
import { toLedgerExpenses } from "./ledger";

const ALICE = "alice";
const BOB = "bob";
const CAROL = "carol";

const user = (id: string): User =>
  ({ id, name: id, firstName: id, email: `${id}@x.com` }) as User;
const users = [ALICE, BOB, CAROL].map(user);

const at = "2026-11-05T10:00:00.000Z";

const ledger = [
  {
    id: "e1",
    amount: 300,
    description: "Dinner",
    tag: "EXPENSE",
    type: "EQUAL",
    createdAt: at,
    payments: [{ user: { id: ALICE }, amount: 300 }],
    splits: [ALICE, BOB, CAROL].map((id) => ({
      user: { id },
      amount: 100,
      percent: null,
    })),
  },
  {
    id: "e2",
    amount: 100,
    description: "Taxi",
    tag: "EXPENSE",
    type: "EXACT",
    createdAt: at,
    payments: [{ user: { id: BOB }, amount: 100 }],
    splits: [
      { user: { id: ALICE }, amount: 60, percent: null },
      { user: { id: CAROL }, amount: 40, percent: null },
    ],
  },
  {
    id: "e3",
    amount: 50,
    description: "Settle",
    tag: "SETTLEMENT",
    type: "EXACT",
    createdAt: at,
    payments: [{ user: { id: CAROL }, amount: 50 }],
    splits: [{ user: { id: ALICE }, amount: 50, percent: null }],
  },
] as unknown as GetGroupLedgerData["expenses"];

// The same three expenses in the old Prisma shape.
const base = {
  currency: "inr",
  category: null,
  settlement: null,
  groupId: "g",
  createrId: "x",
  createdAt: new Date(at),
  updatedAt: null,
};
const old = [
  {
    ...base,
    id: "e1",
    amount: 300,
    description: "Dinner",
    tag: "EXPENSE",
    type: "EQUAL",
    payments: [
      {
        id: "p",
        userId: ALICE,
        expenseId: "e1",
        amount: 300,
        user: user(ALICE),
      },
    ],
    splits: [ALICE, BOB, CAROL].map((id) => ({
      id: "s",
      userId: id,
      expenseId: "e1",
      amount: 100,
      percent: null,
      user: user(id),
    })),
  },
  {
    ...base,
    id: "e2",
    amount: 100,
    description: "Taxi",
    tag: "EXPENSE",
    type: "EXACT",
    payments: [
      { id: "p", userId: BOB, expenseId: "e2", amount: 100, user: user(BOB) },
    ],
    splits: [
      {
        id: "s",
        userId: ALICE,
        expenseId: "e2",
        amount: 60,
        percent: null,
        user: user(ALICE),
      },
      {
        id: "s",
        userId: CAROL,
        expenseId: "e2",
        amount: 40,
        percent: null,
        user: user(CAROL),
      },
    ],
  },
  {
    ...base,
    id: "e3",
    amount: 50,
    description: "Settle",
    tag: "SETTLEMENT",
    type: "EXACT",
    payments: [
      {
        id: "p",
        userId: CAROL,
        expenseId: "e3",
        amount: 50,
        user: user(CAROL),
      },
    ],
    splits: [
      {
        id: "s",
        userId: ALICE,
        expenseId: "e3",
        amount: 50,
        percent: null,
        user: user(ALICE),
      },
    ],
  },
] as unknown as ExpenseWithPaymentWithSplit[];

describe("toLedgerExpenses", () => {
  it("keeps tag and type", () => {
    const out = toLedgerExpenses(ledger);
    expect(out.map((e) => [e.tag, e.type])).toEqual([
      ["EXPENSE", "EQUAL"],
      ["EXPENSE", "EXACT"],
      ["SETTLEMENT", "EXACT"],
    ]);
  });

  it("gives the same balances as the old shape", () => {
    const out = toLedgerExpenses(ledger);
    expect(out).toHaveLength(3);
    for (const detailed of [false, true]) {
      const got = calcGroupSplits(ALICE, out, users, detailed);
      expect(got.length).toBeGreaterThan(0);
      expect(got).toEqual(calcGroupSplits(ALICE, old, users, detailed));
    }
  });

  it("gives the same totals as the old shape", () => {
    const out = toLedgerExpenses(ledger);
    const got = evaluateTotals(out, ALICE);
    expect(got).toEqual({ totals: 400, yours: 300 });
    expect(got).toEqual(evaluateTotals(old, ALICE));
  });

  it("gives an empty list for an empty ledger", () => {
    expect(toLedgerExpenses([])).toEqual([]);
  });
});
