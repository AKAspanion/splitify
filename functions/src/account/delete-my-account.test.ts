import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import {
  resetDatabase,
  seed,
  seedFriendship,
  seedGroup,
  seedUser,
} from "../../../dataconnect/test-utils/emulator";
import { deleteMyAccount } from "./delete-my-account";

vi.mock("firebase-functions/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

const G = "11111111-1111-4111-8111-111111111111";
const EXPENSE = "33333333-3333-4333-8333-333333333333";
const ALICE = "alice-uid";
const BOB = "bob-uid";

const auth = () =>
  getAuth(
    getApps().find((a) => a.name === "test-delete-auth") ??
      initializeApp({ projectId: "demo-splitify" }, "test-delete-auth"),
  );

// `onCall` functions expose their handler as `run`, which takes the request the runtime would build.
const call = (uid?: string) =>
  deleteMyAccount.run({
    data: undefined,
    auth: uid ? { uid, token: {} as never, rawToken: "" } : undefined,
    rawRequest: {} as never,
    acceptsStreaming: false,
  });

type World = {
  users: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  }[];
  groupMembers: { userId: string }[];
  userSplits: { userId: string }[];
  userPayments: { userId: string }[];
  pushTokens: { token: string }[];
  feedbacks: { userId: string }[];
  authnDevices: { userId: string }[];
  friendships: { userId: string; friendId: string }[];
  expenses: { id: string }[];
};

async function world(): Promise<World> {
  return (await seed(`query {
    users { id name email imageUrl }
    groupMembers { userId }
    userSplits { userId }
    userPayments { userId }
    pushTokens { token }
    feedbacks { userId }
    authnDevices { userId }
    friendships { userId friendId }
    expenses { id }
  }`)) as World;
}

beforeEach(async () => {
  await resetDatabase();
  // Other test files leave Auth users with these emails and other ids behind, which would clash with ours.
  for (const email of ["alice@example.test", "bob@example.test"])
    await auth()
      .getUserByEmail(email)
      .then((u) => auth().deleteUser(u.uid))
      .catch(() => undefined);
  for (const uid of [ALICE, BOB])
    await auth()
      .deleteUser(uid)
      .catch(() => undefined);
  await auth().createUser({ uid: ALICE, email: "alice@example.test" });
  await auth().createUser({ uid: BOB, email: "bob@example.test" });
  await seedUser({
    id: ALICE,
    email: "alice@example.test",
    signedUp: true,
    name: "Alice",
  });
  await seedUser({
    id: BOB,
    email: "bob@example.test",
    signedUp: true,
    name: "Bob",
  });
  await seedGroup({ id: G, title: "G", memberIds: [ALICE, BOB] });
  await seedFriendship(ALICE, BOB);
  await seed(
    `mutation($e: UUID!) {
      expense_insert(data: { id: $e, groupId: "${G}", amount: 100, description: "Dinner", type: EQUAL, tag: EXPENSE, creatorId: "${ALICE}" })
      userSplit_insert(data: { id: "44444444-4444-4444-8444-444444444444", expenseId: $e, userId: "${ALICE}", amount: 50 })
      splitBob: userSplit_insert(data: { id: "44444444-4444-4444-8444-444444444445", expenseId: $e, userId: "${BOB}", amount: 50 })
      userPayment_insert(data: { id: "55555555-5555-4555-8555-555555555555", expenseId: $e, userId: "${ALICE}", amount: 100 })
      pushToken_insert(data: { token: "alice-token", userId: "${ALICE}", platform: "web" })
      tokenBob: pushToken_insert(data: { token: "bob-token", userId: "${BOB}", platform: "web" })
      feedback_insert(data: { userId: "${ALICE}", title: "Hi" })
      authnDevice_insert(data: { userId: "${ALICE}", devices: [] })
    }`,
    { e: EXPENSE },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteMyAccount", () => {
  it("anonymises the caller, removes their own data, keeps shared records and deletes the Auth user", async () => {
    await expect(call(ALICE)).resolves.toEqual({ ok: true });

    const w = await world();
    const alice = w.users.find((u) => u.id === ALICE);
    expect(alice).toMatchObject({
      name: "Deleted user",
      email: `${ALICE}@deleted.invalid`,
      imageUrl: "/images/placeholder/avatar.jpeg",
    });
    expect(w.pushTokens.map((t) => t.token)).toEqual(["bob-token"]);
    expect(w.feedbacks).toEqual([]);
    expect(w.authnDevices).toEqual([]);
    expect(w.friendships).toEqual([]);
    expect(w.groupMembers.map((m) => m.userId).sort()).toEqual([ALICE, BOB]);
    expect(w.userSplits).toHaveLength(2);
    expect(w.userPayments).toEqual([{ userId: ALICE }]);
    await expect(auth().getUser(ALICE)).rejects.toMatchObject({
      code: "auth/user-not-found",
    });
    // Bob is untouched.
    expect(w.users.find((u) => u.id === BOB)?.name).toBe("Bob");
    await expect(auth().getUser(BOB)).resolves.toBeTruthy();
  });

  it("deletes a group only the caller was in, with its expenses and activity, and keeps a shared group", async () => {
    const SOLO = "66666666-6666-4666-8666-666666666666";
    const SOLO_EXPENSE = "77777777-7777-4777-8777-777777777777";
    await seedGroup({ id: SOLO, title: "Solo", memberIds: [ALICE] });
    await seed(
      `mutation {
        expense_insert(data: { id: "${SOLO_EXPENSE}", groupId: "${SOLO}", amount: 10, description: "Tea", type: EQUAL, tag: EXPENSE, creatorId: "${ALICE}" })
        userSplit_insert(data: { id: "88888888-8888-4888-8888-888888888888", expenseId: "${SOLO_EXPENSE}", userId: "${ALICE}", amount: 10 })
        userPayment_insert(data: { id: "99999999-9999-4999-8999-999999999999", expenseId: "${SOLO_EXPENSE}", userId: "${ALICE}", amount: 10 })
        activity_insert(data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", type: EXPENSE_PLUS, actorId: "${ALICE}", groupId: "${SOLO}", expenseId: "${SOLO_EXPENSE}", title: "Tea" })
      }`,
    );

    await expect(call(ALICE)).resolves.toEqual({ ok: true });

    const left = (await seed(`query {
      groups { id }
      expenses { id }
      activities { id }
      groupMembers { groupId userId }
      userSplits { expenseId }
      userPayments { expenseId }
    }`)) as {
      groups: { id: string }[];
      expenses: { id: string }[];
      activities: { id: string }[];
      groupMembers: { groupId: string }[];
      userSplits: { expenseId: string }[];
      userPayments: { expenseId: string }[];
    };
    // The database returns UUIDs without dashes.
    const bare = (id: string) => id.replaceAll("-", "");
    expect(left.groups.map((g) => g.id)).toEqual([bare(G)]);
    expect(left.expenses.map((e) => e.id)).toEqual([bare(EXPENSE)]);
    expect(left.activities).toEqual([]);
    expect(left.groupMembers.every((m) => m.groupId === bare(G))).toBe(true);
    expect(left.userSplits.every((s) => s.expenseId === bare(EXPENSE))).toBe(
      true,
    );
    expect(left.userPayments.every((p) => p.expenseId === bare(EXPENSE))).toBe(
      true,
    );
  });

  it("shows Deleted user where Alice was in Bob's view of the expense", async () => {
    await call(ALICE);
    const data = (await seed(
      `query($e: UUID!) { expense(key: { id: $e }) { creator { name } } userSplits(where: { expenseId: { eq: $e } }) { user { id name } } }`,
      { e: EXPENSE },
    )) as {
      expense: { creator: { name: string } };
      userSplits: { user: { id: string; name: string } }[];
    };
    expect(data.expense.creator.name).toBe("Deleted user");
    expect(data.userSplits.find((s) => s.user.id === ALICE)?.user.name).toBe(
      "Deleted user",
    );
    expect(data.userSplits.find((s) => s.user.id === BOB)?.user.name).toBe(
      "Bob",
    );
  });

  it("leaves the anonymisation in place when deleting the Auth user fails, and a second call finishes", async () => {
    vi.spyOn(Auth.prototype, "deleteUser").mockRejectedValueOnce(
      Object.assign(new Error("boom alice@example.test"), {
        code: "auth/internal-error",
      }),
    );

    await expect(call(ALICE)).rejects.toMatchObject({ code: "internal" });
    const after = await world();
    expect(after.users.find((u) => u.id === ALICE)?.name).toBe("Deleted user");
    await expect(auth().getUser(ALICE)).resolves.toBeTruthy();

    await expect(call(ALICE)).resolves.toEqual({ ok: true });
    await expect(auth().getUser(ALICE)).rejects.toMatchObject({
      code: "auth/user-not-found",
    });
  });

  it("does not leak the cause in the error the caller gets", async () => {
    vi.spyOn(Auth.prototype, "deleteUser").mockRejectedValueOnce(
      Object.assign(new Error("secret alice@example.test"), {
        code: "auth/internal-error",
      }),
    );
    const error = await call(ALICE).catch((e: Error) => e);
    expect((error as Error).message).not.toContain("alice@example.test");
  });

  it("finishes for a caller whose Auth user is already gone", async () => {
    await auth().deleteUser(ALICE);
    await expect(call(ALICE)).resolves.toEqual({ ok: true });
  });

  it("refuses an unauthenticated call and changes nothing", async () => {
    const before = await world();
    await expect(call()).rejects.toMatchObject({ code: "unauthenticated" });
    expect(await world()).toEqual(before);
    await expect(auth().getUser(ALICE)).resolves.toBeTruthy();
  });
});
