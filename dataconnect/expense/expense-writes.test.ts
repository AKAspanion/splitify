import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  executeMutation,
  mutationRef,
  type DataConnect,
} from "firebase/data-connect";
import {
  connectorFor,
  resetDatabase,
  seed,
  seedGroup,
  seedUser,
  signedOutConnector,
  signInTestUser,
  type TestUser,
} from "../test-utils/emulator";

const expenseConfig = {
  connector: "expense",
  service: "splitify",
  location: "asia-south1",
};
const NOT_A_MEMBER = "Only members of this group can be added to an expense";

const G = "11111111-1111-4111-8111-111111111111";
let alice: TestUser;
let bob: TestUser;
let carol: TestUser;
let aliceExpense: DataConnect;
let bobExpense: DataConnect;
let carolExpense: DataConnect;

const uuid = () => crypto.randomUUID();

function expenseVars(
  over: Record<string, unknown> & {
    payments?: { userId: string; amount: number }[];
    splits?: { userId: string; amount: number }[];
  } = {},
) {
  const id = (over.id as string) ?? uuid();
  const payments = (over.payments ?? [{ userId: alice.uid, amount: 300 }]).map(
    (p) => ({ id: uuid(), expenseId: id, ...p }),
  );
  const splits = (
    over.splits ?? [
      { userId: alice.uid, amount: 150 },
      { userId: bob.uid, amount: 150 },
    ]
  ).map((s) => ({ id: uuid(), expenseId: id, ...s }));
  return {
    id,
    groupId: G,
    amount: 300,
    description: "Dinner",
    type: "EQUAL",
    activityId: uuid(),
    ...over,
    payments,
    splits,
  };
}

const createExpense = (dc: DataConnect, vars: Record<string, unknown>) =>
  executeMutation(mutationRef(dc, "CreateExpense", vars as never));

async function counts() {
  const data = (await seed(
    `query { expenses { id } userPayments { id } userSplits { id } activities { id } }`,
  )) as {
    expenses: unknown[];
    userPayments: unknown[];
    userSplits: unknown[];
    activities: unknown[];
  };
  return {
    expenses: data.expenses.length,
    payments: data.userPayments.length,
    splits: data.userSplits.length,
    activities: data.activities.length,
  };
}
const NOTHING = { expenses: 0, payments: 0, splits: 0, activities: 0 };

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  carol = await signInTestUser("carol");
  aliceExpense = connectorFor(alice, expenseConfig);
  bobExpense = connectorFor(bob, expenseConfig);
  carolExpense = connectorFor(carol, expenseConfig);
});

beforeEach(async () => {
  await resetDatabase();
  for (const u of [alice, bob, carol])
    await seedUser({ id: u.uid, email: u.email, signedUp: true });
  await seedGroup({ id: G, title: "Trip", memberIds: [alice.uid, bob.uid] });
});

describe("CreateExpense", () => {
  it("writes the expense, its payment, splits and EXPENSE_PLUS activity for a member", async () => {
    const vars = expenseVars();
    await createExpense(aliceExpense, vars);

    expect(await counts()).toEqual({
      expenses: 1,
      payments: 1,
      splits: 2,
      activities: 1,
    });
    const data = (await seed(
      `query($id: UUID!) {
        expense(key: { id: $id }) { amount tag type description creator { id } group { id } }
        activities { type actor { id } title amount expenseId group { id } }
      }`,
      { id: vars.id },
    )) as {
      expense: {
        amount: number;
        tag: string;
        type: string;
        description: string;
        creator: { id: string };
      };
      activities: {
        type: string;
        actor: { id: string };
        title: string;
        amount: number;
        expenseId: string;
      }[];
    };
    expect(data.expense).toMatchObject({
      amount: 300,
      tag: "EXPENSE",
      type: "EQUAL",
      creator: { id: alice.uid },
    });
    expect(data.activities[0]).toMatchObject({
      type: "EXPENSE_PLUS",
      actor: { id: alice.uid },
      title: "Dinner",
      amount: 300,
      expenseId: vars.id.replaceAll("-", ""), // the database returns a UUID without hyphens
    });
  });

  it("answers Not found for someone who is not a member, and writes nothing", async () => {
    await expect(createExpense(carolExpense, expenseVars())).rejects.toThrow(
      /Not found/,
    );
    expect(await counts()).toEqual(NOTHING);
  });

  it("refuses a split to a non-member, and writes nothing", async () => {
    const vars = expenseVars({
      splits: [
        { userId: alice.uid, amount: 150 },
        { userId: carol.uid, amount: 150 },
      ],
    });
    await expect(createExpense(aliceExpense, vars)).rejects.toThrow(
      NOT_A_MEMBER,
    );
    expect(await counts()).toEqual(NOTHING);
  });

  it("refuses a payment by a non-member, and writes nothing", async () => {
    const vars = expenseVars({
      payments: [{ userId: carol.uid, amount: 300 }],
    });
    await expect(createExpense(aliceExpense, vars)).rejects.toThrow(
      NOT_A_MEMBER,
    );
    expect(await counts()).toEqual(NOTHING);
  });

  it("fails on an existing id and leaves the expense, its payments and splits unchanged", async () => {
    const first = expenseVars();
    await createExpense(aliceExpense, first);
    const again = expenseVars({
      id: first.id,
      amount: 999,
      description: "Changed",
    });
    await expect(createExpense(aliceExpense, again)).rejects.toThrow();
    expect(await counts()).toEqual({
      expenses: 1,
      payments: 1,
      splits: 2,
      activities: 1,
    });
    const data = (await seed(
      `query($id: UUID!) { expense(key: { id: $id }) { amount description } }`,
      { id: first.id },
    )) as {
      expense: { amount: number; description: string };
    };
    expect(data.expense).toEqual({ amount: 300, description: "Dinner" });
  });

  it.each([0, -1, 10000000.01])(
    "refuses the amount %s, and writes nothing",
    async (amount) => {
      await expect(
        createExpense(aliceExpense, expenseVars({ amount })),
      ).rejects.toThrow();
      expect(await counts()).toEqual(NOTHING);
    },
  );

  it("accepts an amount of exactly 10,000,000", async () => {
    await createExpense(aliceExpense, expenseVars({ amount: 10000000 }));
    expect((await counts()).expenses).toBe(1);
  });

  it("refuses a description of 501 characters and accepts 500", async () => {
    await expect(
      createExpense(
        aliceExpense,
        expenseVars({ description: "a".repeat(501) }),
      ),
    ).rejects.toThrow();
    expect(await counts()).toEqual(NOTHING);
    await createExpense(
      aliceExpense,
      expenseVars({ description: "a".repeat(500) }),
    );
    expect((await counts()).expenses).toBe(1);
  });

  it("refuses 51 splits and accepts 50", async () => {
    const many = (n: number) =>
      Array.from({ length: n }, () => ({ userId: bob.uid, amount: 1 }));
    await expect(
      createExpense(aliceExpense, expenseVars({ splits: many(51) })),
    ).rejects.toThrow();
    expect(await counts()).toEqual(NOTHING);
    await createExpense(aliceExpense, expenseVars({ splits: many(50) }));
    expect((await counts()).splits).toBe(50);
  });

  it("refuses 51 payments and accepts 50", async () => {
    const many = (n: number) =>
      Array.from({ length: n }, () => ({ userId: alice.uid, amount: 1 }));
    await expect(
      createExpense(aliceExpense, expenseVars({ payments: many(51) })),
    ).rejects.toThrow();
    expect(await counts()).toEqual(NOTHING);
    await createExpense(aliceExpense, expenseVars({ payments: many(50) }));
    expect((await counts()).payments).toBe(50);
  });

  it("refuses a payment or split that names another expense", async () => {
    const mine = expenseVars();
    const other = expenseVars();
    await createExpense(bobExpense, other);
    const sneaky = {
      ...mine,
      payments: mine.payments.map((p) => ({ ...p, expenseId: other.id })),
    };
    await expect(createExpense(aliceExpense, sneaky)).rejects.toThrow();
    const sneakySplit = {
      ...mine,
      splits: mine.splits.map((s) => ({ ...s, expenseId: other.id })),
    };
    await expect(createExpense(aliceExpense, sneakySplit)).rejects.toThrow();
    expect(await counts()).toEqual({
      expenses: 1,
      payments: 1,
      splits: 2,
      activities: 1,
    });
  });

  it("is refused when no one is signed in", async () => {
    await expect(
      createExpense(signedOutConnector(expenseConfig), expenseVars()),
    ).rejects.toThrow();
    expect(await counts()).toEqual(NOTHING);
  });
});

describe("CreateSettlement", () => {
  const settle = (dc: DataConnect, over: Record<string, unknown> = {}) =>
    executeMutation(
      mutationRef(dc, "CreateSettlement", {
        id: uuid(),
        groupId: G,
        amount: 120,
        fromUserId: alice.uid,
        toUserId: bob.uid,
        paymentId: uuid(),
        splitId: uuid(),
        activityId: uuid(),
        ...over,
      } as never),
    );

  it("writes a SETTLEMENT expense with one payment, one split and a SETTLEMENT_PLUS activity", async () => {
    await settle(aliceExpense);
    expect(await counts()).toEqual({
      expenses: 1,
      payments: 1,
      splits: 1,
      activities: 1,
    });
    const data = (await seed(`query {
      expenses { tag type description amount creator { id } }
      userPayments { amount user { id } }
      userSplits { amount user { id } }
      activities { type actor { id } subject { id } }
    }`)) as Record<string, unknown[]>;
    expect(data.expenses[0]).toMatchObject({
      tag: "SETTLEMENT",
      type: "EXACT",
      description: "Settlement",
      amount: 120,
      creator: { id: alice.uid },
    });
    expect(data.userPayments[0]).toMatchObject({
      amount: 120,
      user: { id: alice.uid },
    });
    expect(data.userSplits[0]).toMatchObject({
      amount: 120,
      user: { id: bob.uid },
    });
    expect(data.activities[0]).toMatchObject({
      type: "SETTLEMENT_PLUS",
      actor: { id: alice.uid },
      subject: { id: bob.uid },
    });
  });

  it("refuses a settlement to a non-member, and answers Not found to a non-member caller", async () => {
    await expect(settle(aliceExpense, { toUserId: carol.uid })).rejects.toThrow(
      NOT_A_MEMBER,
    );
    await expect(settle(carolExpense)).rejects.toThrow(/Not found/);
    expect(await counts()).toEqual(NOTHING);
  });

  it("refuses an amount outside 0 to 10,000,000, and a caller who is signed out", async () => {
    await expect(settle(aliceExpense, { amount: 0 })).rejects.toThrow();
    await expect(
      settle(aliceExpense, { amount: 10000000.01 }),
    ).rejects.toThrow();
    await expect(settle(signedOutConnector(expenseConfig))).rejects.toThrow();
    expect(await counts()).toEqual(NOTHING);
  });
});

describe("schema cascade", () => {
  it("deleting an expense removes its payments and splits", async () => {
    const vars = expenseVars();
    await createExpense(aliceExpense, vars);
    await seed(`mutation($id: UUID!) { expense_delete(key: { id: $id }) }`, {
      id: vars.id,
    });
    expect(await counts()).toMatchObject({
      expenses: 0,
      payments: 0,
      splits: 0,
    });
  });

  it("deleting a group removes its members, expenses, payments and splits, but not its activity", async () => {
    await createExpense(aliceExpense, expenseVars());
    await seed(`mutation($id: UUID!) { group_delete(key: { id: $id }) }`, {
      id: G,
    });
    expect(await counts()).toEqual({ ...NOTHING, activities: 1 });
    const members = (await seed(`query { groupMembers { userId } }`)) as {
      groupMembers: unknown[];
    };
    expect(members.groupMembers).toEqual([]);
    // Activity.group is optional, so SQL Connect clears it instead of cascading: a group-deleting mutation must
    // delete the group's activity itself, first.
    const activity = (await seed(`query { activities { group { id } } }`)) as {
      activities: { group: unknown }[];
    };
    expect(activity.activities[0].group).toBeNull();
  });
});
