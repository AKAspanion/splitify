import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  resetDatabase,
  seed,
  seedGroup,
  seedUser,
  signInTestUser,
  type TestUser,
} from "../../dataconnect/test-utils/emulator";

// Read when lib/firebase/app.ts first builds the app, so they are set before the dynamic imports below.
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-splitify";
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true";

const PASSWORD = "test-password-123";
const G = "11111111-1111-4111-8111-111111111111";
const NOT_A_MEMBER = "Only members of this group can be added to an expense";

let writes: typeof import("./expense-writes");
let errors: typeof import("./errors");
let queued: typeof import("../offline/queued-writes");
let signInApp: (email: string) => Promise<void>;
let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

const uuid = () => crypto.randomUUID();

function expenseVars(
  splitUserIds: string[],
): import("./expense-writes").CreateExpenseVars {
  return {
    id: uuid(),
    groupId: G,
    amount: 300,
    description: "Dinner",
    type: "EQUAL",
    payments: [{ id: uuid(), userId: alice.uid, amount: 300 }],
    splits: splitUserIds.map((userId) => ({
      id: uuid(),
      userId,
      amount: 300 / splitUserIds.length,
    })),
    activityId: uuid(),
  };
}

async function expenseCount() {
  const data = (await seed(`query { expenses { id } }`)) as {
    expenses: unknown[];
  };
  return data.expenses.length;
}

beforeAll(async () => {
  // The default app is made first: getFirebaseApp() mistakes the test users' named apps for it.
  const { getFirebaseApp, getFirebaseAuth } = await import("../firebase/app");
  getFirebaseApp();
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  carol = await signInTestUser("carol");
  writes = await import("./expense-writes");
  errors = await import("./errors");
  queued = await import("../offline/queued-writes");
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  signInApp = async (email) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, PASSWORD);
  };
});

beforeEach(async () => {
  await resetDatabase();
  for (const u of [alice, bob, carol])
    await seedUser({ id: u.uid, email: u.email, signedUp: true });
  await seedGroup({ id: G, title: "Trip", memberIds: [alice.uid, bob.uid] });
  await signInApp(alice.email);
});

describe("createExpense", () => {
  it("writes the expense for a member and returns its id", async () => {
    const vars = expenseVars([alice.uid, bob.uid]);
    await expect(writes.createExpense(vars)).resolves.toEqual({ id: vars.id });
    expect(await expenseCount()).toBe(1);
  });

  it("rejects a split to someone outside the group, in people-facing words", async () => {
    const vars = expenseVars([alice.uid, carol.uid]);
    const failure = await writes.createExpense(vars).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(Error);
    expect(errors.toUserMessage(failure)).toBe(NOT_A_MEMBER);
    expect(await expenseCount()).toBe(0);
  });
});

describe("a write sent twice", () => {
  const settlement = () => ({
    id: uuid(),
    groupId: G,
    amount: 50,
    fromUserId: alice.uid,
    toUserId: bob.uid,
    paymentId: uuid(),
    splitId: uuid(),
    activityId: uuid(),
  });

  it("answers an expense's own id with the duplicate-id error, and writes it once", async () => {
    const vars = expenseVars([alice.uid, bob.uid]);
    await writes.createExpense(vars);
    const failure = await writes.createExpense(vars).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(Error);
    expect(queued.isDuplicateIdError(failure)).toBe(true);
    expect(await expenseCount()).toBe(1);
  });

  it("answers a settlement's own id with the duplicate-id error", async () => {
    const vars = settlement();
    await writes.createSettlement(vars);
    const failure = await writes
      .createSettlement(vars)
      .catch((e: unknown) => e);
    expect(queued.isDuplicateIdError(failure)).toBe(true);
    expect(await expenseCount()).toBe(1);
  });

  it("does not call a rejection for a non-member a duplicate", async () => {
    await signInApp(carol.email);
    const failure = await writes
      .createExpense(expenseVars([alice.uid]))
      .catch((e: unknown) => e);
    expect(errors.toUserMessage(failure)).toBe("Not found");
    expect(queued.isDuplicateIdError(failure)).toBe(false);
  });
});

describe("createSettlement", () => {
  const settlement = (toUserId: string) => ({
    id: uuid(),
    groupId: G,
    amount: 50,
    fromUserId: alice.uid,
    toUserId,
    paymentId: uuid(),
    splitId: uuid(),
    activityId: uuid(),
  });

  it("writes the settlement for a member and returns its id", async () => {
    const vars = settlement(bob.uid);
    await expect(writes.createSettlement(vars)).resolves.toEqual({
      id: vars.id,
    });
    expect(await expenseCount()).toBe(1);
  });

  it("rejects a settlement with someone outside the group", async () => {
    const failure = await writes
      .createSettlement(settlement(carol.uid))
      .catch((e: unknown) => e);
    expect(errors.toUserMessage(failure)).toBe(NOT_A_MEMBER);
    expect(await expenseCount()).toBe(0);
  });
});
