import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  executeMutation,
  executeQuery,
  mutationRef,
  queryRef,
} from "firebase/data-connect";
import {
  adminConnector,
  connectorFor,
  resetDatabase,
  seed,
  seedFriendship,
  seedGroup,
  seedUser,
  signInTestUser,
  type TestUser,
} from "../test-utils/emulator";

const adminConfig = {
  connector: "admin",
  service: "splitify",
  location: "asia-south1",
};
const G = "11111111-1111-4111-8111-111111111111";
const OTHER_G = "22222222-2222-4222-8222-222222222222";
const EXPENSE = "33333333-3333-4333-8333-333333333333";
const strip = (id: string) => id.replaceAll("-", "");

let alice: TestUser;
let bob: TestUser;

const admin = () => adminConnector(adminConfig);

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
});

beforeEach(async () => {
  await resetDatabase();
  await seedUser({
    id: alice.uid,
    email: alice.email,
    signedUp: true,
    name: "Alice",
  });
  await seedUser({
    id: bob.uid,
    email: bob.email,
    signedUp: true,
    name: "Bob",
  });
  await seedGroup({ id: G, title: "Goa trip", memberIds: [alice.uid] });
  await seedGroup({ id: OTHER_G, title: "Flat", memberIds: [bob.uid] });
});

async function seedExpense() {
  await seed(
    `mutation($e: Expense_Data!, $p: UserPayment_Data!, $s: [UserSplit_Data!]!) {
      expense_insert(data: $e)
      userPayment_insert(data: $p)
      userSplit_insertMany(data: $s)
    }`,
    {
      e: {
        id: EXPENSE,
        groupId: G,
        amount: 90,
        description: "Dinner",
        type: "EQUAL",
        tag: "EXPENSE",
        creatorId: alice.uid,
      },
      p: {
        id: crypto.randomUUID(),
        expenseId: EXPENSE,
        userId: alice.uid,
        amount: 90,
      },
      s: [
        {
          id: crypto.randomUUID(),
          expenseId: EXPENSE,
          userId: alice.uid,
          amount: 45,
        },
        {
          id: crypto.randomUUID(),
          expenseId: EXPENSE,
          userId: bob.uid,
          amount: 45,
        },
      ],
    },
  );
}

const userRow = async (id: string) =>
  (
    (await seed(
      `query($id: String!) { user(key: { id: $id }) { id name firstName lastName email imageUrl signedUp } }`,
      { id },
    )) as { user: Record<string, unknown> | null }
  ).user;

describe("admin connector server operations", () => {
  it("refuses all four to a signed-in person", async () => {
    const dc = connectorFor(alice, adminConfig);
    const calls = [
      () =>
        executeQuery(
          queryRef(dc, "IsGroupMember", {
            groupId: G,
            userId: alice.uid,
          } as never),
        ),
      () =>
        executeQuery(
          queryRef(dc, "GetGroupLedgerAdmin", { groupId: G } as never),
        ),
      () =>
        executeMutation(
          mutationRef(dc, "AnonymiseUser", {
            userId: alice.uid,
            name: "x",
            email: "x@deleted.invalid",
            imageUrl: "/x",
          } as never),
        ),
      () =>
        executeMutation(
          mutationRef(dc, "DeleteUserData", { userId: alice.uid } as never),
        ),
    ];
    for (const call of calls) await expect(call()).rejects.toThrow();
    expect((await userRow(alice.uid))?.name).toBe("Alice");
  });

  it("IsGroupMember returns the row for a member and null for a non-member", async () => {
    const read = async (userId: string, groupId = G) =>
      (
        await admin().executeQuery<
          { groupMember: { groupId: string; userId: string } | null },
          unknown
        >("IsGroupMember", { groupId, userId })
      ).data.groupMember;

    expect(await read(alice.uid)).toEqual({
      groupId: strip(G),
      userId: alice.uid,
    });
    expect(await read(bob.uid)).toBeNull();
    expect(await read(alice.uid, OTHER_G)).toBeNull();
  });

  it("GetGroupLedgerAdmin returns the title and the group's expenses with names, and none from another group", async () => {
    await seedExpense();
    const { data } = await admin().executeQuery<
      {
        group: { title: string } | null;
        expenses: {
          description: string;
          creator: { name: string };
          payments: { amount: number; user: { name: string } }[];
          splits: { amount: number; user: { name: string } }[];
        }[];
      },
      unknown
    >("GetGroupLedgerAdmin", { groupId: G });
    expect(data.group?.title).toBe("Goa trip");
    expect(data.expenses).toHaveLength(1);
    expect(data.expenses[0].creator.name).toBe("Alice");
    expect(data.expenses[0].payments).toEqual([
      { amount: 90, user: { id: alice.uid, name: "Alice" } },
    ]);
    expect(data.expenses[0].splits.map((s) => s.user.name).sort()).toEqual([
      "Alice",
      "Bob",
    ]);

    const other = await admin().executeQuery<{ expenses: unknown[] }, unknown>(
      "GetGroupLedgerAdmin",
      { groupId: OTHER_G },
    );
    expect(other.data.expenses).toEqual([]);
  });

  it("AnonymiseUser replaces what identifies the person and leaves the rest of the row and the shared records", async () => {
    await seedExpense();
    await seed(
      `mutation($id: String!) { user_update(key: { id: $id }, data: { firstName: "Alice", lastName: "A", imageUrl: "https://x/y.png" }) }`,
      { id: alice.uid },
    );
    const bobBefore = await userRow(bob.uid);

    await admin().executeMutation("AnonymiseUser", {
      userId: alice.uid,
      name: "Deleted user",
      email: `deleted-${alice.uid}@deleted.invalid`,
      imageUrl: "/images/placeholder/avatar.jpeg",
    });

    expect(await userRow(alice.uid)).toEqual({
      id: alice.uid,
      name: "Deleted user",
      firstName: null,
      lastName: null,
      email: `deleted-${alice.uid}@deleted.invalid`,
      imageUrl: "/images/placeholder/avatar.jpeg",
      signedUp: true,
    });
    expect(await userRow(bob.uid)).toEqual(bobBefore);
    const kept = (await seed(
      `query { groupMembers { userId } expenses { id } userPayments { id } userSplits { id } }`,
    )) as Record<string, unknown[]>;
    expect(kept.groupMembers).toHaveLength(2);
    expect(kept.expenses).toHaveLength(1);
    expect(kept.userPayments).toHaveLength(1);
    expect(kept.userSplits).toHaveLength(2);
  });

  it("DeleteUserData removes the person's tokens, feedback, devices and friendships and keeps shared records and other people's", async () => {
    await seedExpense();
    await seedFriendship(alice.uid, bob.uid);
    await seed(
      `mutation($a: String!, $b: String!) {
        pushToken_insertMany(data: [
          { token: "tok-a", userId: $a, platform: "web" },
          { token: "tok-b", userId: $b, platform: "web" }
        ])
        feedback_insertMany(data: [
          { userId: $a, title: "mine" },
          { userId: $b, title: "theirs" }
        ])
        authnDevice_insertMany(data: [
          { userId: $a, devices: [{ id: "x" }] },
          { userId: $b, devices: [{ id: "y" }] }
        ])
      }`,
      { a: alice.uid, b: bob.uid },
    );

    await admin().executeMutation("DeleteUserData", { userId: alice.uid });

    const rows = (await seed(
      `query {
        pushTokens { token }
        feedbacks { title }
        authnDevices { user { id } }
        friendships { userId friendId }
        groupMembers { userId }
        userPayments { id }
        userSplits { id }
      }`,
    )) as Record<string, unknown[]>;
    expect(rows.pushTokens).toEqual([{ token: "tok-b" }]);
    expect(rows.feedbacks).toEqual([{ title: "theirs" }]);
    expect(rows.authnDevices).toEqual([{ user: { id: bob.uid } }]);
    expect(rows.friendships).toEqual([]);
    expect(rows.groupMembers).toHaveLength(2);
    expect(rows.userPayments).toHaveLength(1);
    expect(rows.userSplits).toHaveLength(2);
    expect(await userRow(alice.uid)).not.toBeNull();
  });
});
