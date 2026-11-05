import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  executeMutation,
  executeQuery,
  mutationRef,
  queryRef,
  type DataConnect,
} from "firebase/data-connect";
import {
  resetDatabase,
  seed,
  seedGroup,
  seedUser,
  signedOutConnector,
  signInTestUser,
  type TestUser,
} from "../test-utils/emulator";
import { connectorConfig } from "@dataconnect/app";

const G = "11111111-1111-4111-8111-111111111111";
const E = "22222222-2222-4222-8222-222222222222";
const strip = (id: string) => id.replaceAll("-", "");
const uuid = () => crypto.randomUUID();

let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

type SeedExpense = {
  id: string;
  groupId?: string;
  amount?: number;
  description?: string;
  createdAt?: string;
};

async function seedExpense(e: SeedExpense) {
  const amount = e.amount ?? 300;
  await seed(
    `mutation($e: Expense_Data!, $p: UserPayment_Data!, $s: [UserSplit_Data!]!) {
      expense_insert(data: $e)
      userPayment_insert(data: $p)
      userSplit_insertMany(data: $s)
    }`,
    {
      e: {
        id: e.id,
        groupId: e.groupId ?? G,
        amount,
        description: e.description ?? "Dinner",
        type: "EQUAL",
        tag: "EXPENSE",
        creatorId: alice.uid,
        ...(e.createdAt ? { createdAt: e.createdAt } : {}),
      },
      p: { id: uuid(), expenseId: e.id, userId: alice.uid, amount },
      s: [
        { id: uuid(), expenseId: e.id, userId: alice.uid, amount: amount / 2 },
        { id: uuid(), expenseId: e.id, userId: bob.uid, amount: amount / 2 },
      ],
    },
  );
}

const query = async (dc: DataConnect, name: string, vars: object) =>
  (await executeQuery(queryRef(dc, name, vars as never))).data as never as any;
const mutate = (dc: DataConnect, name: string, vars: object) =>
  executeMutation(mutationRef(dc, name, vars as never));

async function state() {
  return (await seed(
    `query($id: UUID!) {
      expense(key: { id: $id }) { description amount }
      userPayments { id }
      userSplits { id }
      activities { type title amount expenseId actor { id } group { id } }
    }`,
    { id: E },
  )) as {
    expense: { description: string; amount: number } | null;
    userPayments: unknown[];
    userSplits: unknown[];
    activities: {
      type: string;
      title: string;
      amount: number;
      expenseId: string;
      actor: { id: string };
      group: { id: string } | null;
    }[];
  };
}

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  carol = await signInTestUser("carol");
});

beforeEach(async () => {
  await resetDatabase();
  for (const u of [alice, bob, carol])
    await seedUser({ id: u.uid, email: u.email, signedUp: true });
  await seedGroup({ id: G, title: "Trip", memberIds: [alice.uid, bob.uid] });
  await seedExpense({ id: E });
});

describe("GetExpense, ListGroupExpenses, GetGroupLedger", () => {
  it("gives a member the expense with payments, splits and creator, and a non-member null", async () => {
    for (const u of [alice, bob]) {
      const { expense } = await query(u.dc, "GetExpense", { id: E });
      expect(strip(expense.id)).toBe(strip(E));
      expect(expense.creator.id).toBe(alice.uid);
      expect(expense.payments).toHaveLength(1);
      expect(expense.payments[0]).toMatchObject({
        user: { id: alice.uid },
        amount: 300,
      });
      expect(expense.splits).toHaveLength(2);
    }
    expect((await query(carol.dc, "GetExpense", { id: E })).expense).toBeNull();
  });

  it("lists the group's expenses for a member and nothing for a non-member", async () => {
    const vars = { groupId: G, limit: 10, offset: 0 };
    const list = await query(bob.dc, "ListGroupExpenses", vars);
    expect(list.expenses.map((x: { id: string }) => strip(x.id))).toEqual([
      strip(E),
    ]);
    const none = await query(carol.dc, "ListGroupExpenses", vars);
    expect(none.expenses).toEqual([]);
    expect(none.total[0].count).toBe(0);

    const ledger = await query(alice.dc, "GetGroupLedger", { groupId: G });
    expect(ledger.expenses).toHaveLength(1);
    expect(ledger.expenses[0].payments).toHaveLength(1);
    expect(ledger.expenses[0].splits).toHaveLength(2);
    expect(
      (await query(carol.dc, "GetGroupLedger", { groupId: G })).expenses,
    ).toEqual([]);
  });

  it("pages newest first with a total count, and searches the description", async () => {
    await seed(`mutation { expense_deleteMany(all: true) }`);
    for (let i = 0; i < 25; i++) {
      await seedExpense({
        id: uuid(),
        description: i === 24 ? "Taxi" : `Item ${i}`,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      });
    }
    const page = await query(alice.dc, "ListGroupExpenses", {
      groupId: G,
      limit: 10,
      offset: 0,
    });
    expect(page.expenses).toHaveLength(10);
    expect(page.total[0].count).toBe(25);
    expect(page.expenses[0].description).toBe("Taxi");
    expect(page.expenses[1].description).toBe("Item 23");

    const second = await query(alice.dc, "ListGroupExpenses", {
      groupId: G,
      limit: 10,
      offset: 20,
    });
    expect(second.expenses).toHaveLength(5);

    const found = await query(alice.dc, "ListGroupExpenses", {
      groupId: G,
      limit: 10,
      offset: 0,
      search: "taxi",
    });
    expect(
      found.expenses.map((x: { description: string }) => x.description),
    ).toEqual(["Taxi"]);
    expect(found.total[0].count).toBe(1);
  });

  it("refuses a limit of 101 or a 101-character search, and runs with 100 of each", async () => {
    const base = { groupId: G, offset: 0 };
    await expect(
      query(alice.dc, "ListGroupExpenses", { ...base, limit: 101 }),
    ).rejects.toThrow();
    await expect(
      query(alice.dc, "ListGroupExpenses", {
        ...base,
        limit: 10,
        search: "x".repeat(101),
      }),
    ).rejects.toThrow();
    const ok = await query(alice.dc, "ListGroupExpenses", {
      ...base,
      limit: 100,
      search: "x".repeat(100),
    });
    expect(ok.expenses).toEqual([]);
    const all = await query(alice.dc, "ListGroupExpenses", {
      ...base,
      limit: 100,
    });
    expect(all.expenses).toHaveLength(1);
  });
});

describe("UpdateExpense", () => {
  it("changes only the description and records EXPENSE_UPDATE for a member", async () => {
    await mutate(alice.dc, "UpdateExpense", {
      id: E,
      description: "Dinner out",
      activityId: uuid(),
    });
    await mutate(bob.dc, "UpdateExpense", {
      id: E,
      description: "Dinner",
      activityId: uuid(),
    });
    await mutate(alice.dc, "UpdateExpense", {
      id: E,
      description: "Dinner",
      activityId: uuid(),
    });
    const s = await state();
    expect(s.expense).toEqual({ description: "Dinner", amount: 300 });
    expect(s.userPayments).toHaveLength(1);
    expect(s.userSplits).toHaveLength(2);
    expect(s.activities).toHaveLength(3);
    expect(s.activities.map((a) => a.actor.id).sort()).toEqual(
      [alice.uid, alice.uid, bob.uid].sort(),
    );
    for (const a of s.activities)
      expect(a).toMatchObject({
        type: "EXPENSE_UPDATE",
        amount: 300,
        expenseId: strip(E),
        group: { id: strip(G) },
      });
    expect(s.activities.map((a) => a.title).sort()).toEqual([
      "Dinner",
      "Dinner",
      "Dinner out",
    ]);
  });

  it("answers Not found for a non-member and an unknown expense, and changes nothing", async () => {
    await expect(
      mutate(carol.dc, "UpdateExpense", {
        id: E,
        description: "Hacked",
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    await expect(
      mutate(alice.dc, "UpdateExpense", {
        id: uuid(),
        description: "Nope",
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    const s = await state();
    expect(s.expense?.description).toBe("Dinner");
    expect(s.activities).toEqual([]);
  });

  it("refuses a description of 501 characters and accepts 500", async () => {
    await expect(
      mutate(alice.dc, "UpdateExpense", {
        id: E,
        description: "x".repeat(501),
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    expect((await state()).expense?.description).toBe("Dinner");
    await mutate(alice.dc, "UpdateExpense", {
      id: E,
      description: "x".repeat(500),
      activityId: uuid(),
    });
    expect((await state()).expense?.description).toHaveLength(500);
  });
});

describe("DeleteExpense", () => {
  it("deletes the expense with its payments and splits, and keeps an EXPENSE_MINUS activity", async () => {
    await mutate(alice.dc, "DeleteExpense", { id: E, activityId: uuid() });
    const s = await state();
    expect(s.expense).toBeNull();
    expect(s.userPayments).toEqual([]);
    expect(s.userSplits).toEqual([]);
    expect(s.activities).toHaveLength(1);
    expect(s.activities[0]).toMatchObject({
      type: "EXPENSE_MINUS",
      title: "Dinner",
      amount: 300,
      expenseId: strip(E),
      actor: { id: alice.uid },
      group: { id: strip(G) },
    });
  });

  it("answers Not found for a non-member and deletes nothing", async () => {
    await expect(
      mutate(carol.dc, "DeleteExpense", { id: E, activityId: uuid() }),
    ).rejects.toThrow(/Not found/);
    const s = await state();
    expect(s.expense).not.toBeNull();
    expect(s.userPayments).toHaveLength(1);
    expect(s.userSplits).toHaveLength(2);
    expect(s.activities).toEqual([]);
  });
});

describe("signed out", () => {
  it("refuses every expense operation", async () => {
    const dc = signedOutConnector(connectorConfig);
    await expect(query(dc, "GetExpense", { id: E })).rejects.toThrow();
    await expect(
      query(dc, "ListGroupExpenses", { groupId: G, limit: 10, offset: 0 }),
    ).rejects.toThrow();
    await expect(query(dc, "GetGroupLedger", { groupId: G })).rejects.toThrow();
    await expect(
      mutate(dc, "UpdateExpense", {
        id: E,
        description: "x",
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    await expect(
      mutate(dc, "DeleteExpense", { id: E, activityId: uuid() }),
    ).rejects.toThrow();
    expect((await state()).expense).not.toBeNull();
  });
});
