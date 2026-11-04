import { beforeEach, describe, expect, it, vi } from "vitest";
import * as logger from "firebase-functions/logger";
import {
  resetDatabase,
  seed,
  seedFriendship,
  seedGroup,
  seedUser,
} from "../../dataconnect/test-utils/emulator";
import {
  pushForActivity,
  pushForDeletedGroup,
  sendActivityPushApp,
  sendActivityPushExpense,
  sendGroupDeletedPush,
  type Messaging,
} from "./push-activity";

vi.mock("firebase-functions/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

const G = "11111111-1111-4111-8111-111111111111";
const E = "33333333-3333-4333-8333-333333333333";
const A1 = "66666666-6666-4666-8666-666666666661";
const A2 = "66666666-6666-4666-8666-666666666662";

type Message = Parameters<Messaging["sendEachForMulticast"]>[0];
type Responder = (message: Message) => Promise<{
  responses: { success: boolean; error?: { code: string } }[];
}>;

function fakeMessaging(respond?: Responder) {
  const calls: Message[] = [];
  const messaging: Messaging = {
    sendEachForMulticast: async (message) => {
      calls.push(message);
      return respond
        ? respond(message)
        : { responses: message.tokens.map(() => ({ success: true })) };
    },
  };
  return { messaging, calls };
}

async function seedWorld(mute = false) {
  for (const id of ["alice", "bob", "carol"])
    await seedUser({
      id,
      email: `${id}@example.test`,
      signedUp: true,
      name: id[0].toUpperCase() + id.slice(1),
    });
  await seedGroup({
    id: G,
    title: "Goa trip",
    memberIds: ["alice", "bob", "carol"],
  });
  if (mute)
    await seed(
      `mutation($g: UUID!) { group_update(key: { id: $g }, data: { mute: true }) }`,
      { g: G },
    );
  await seed(
    `mutation($rows: [PushToken_Data!]!) { pushToken_insertMany(data: $rows) }`,
    {
      rows: [
        { token: "tok-alice", userId: "alice", platform: "web" },
        { token: "tok-bob", userId: "bob", platform: "web" },
        { token: "tok-carol", userId: "carol", platform: "ios" },
      ],
    },
  );
}

async function seedExpenseActivity(id = A1, actorId = "alice") {
  await seed(
    `mutation($id: UUID!, $g: UUID!, $e: UUID!) {
      activity_insert(data: { id: $id, type: EXPENSE_PLUS, actorId: "${actorId}", groupId: $g, expenseId: $e, amount: 300, title: "Dinner" })
    }`,
    { id, g: G, e: E },
  );
}

async function tokensLeft(): Promise<string[]> {
  const data = (await seed(`query { pushTokens { token } }`)) as {
    pushTokens: { token: string }[];
  };
  return data.pushTokens.map((t) => t.token).sort();
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
});

describe("pushForActivity", () => {
  it("sends one multicast to every member's tokens except the actor's", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const { messaging, calls } = fakeMessaging();

    const result = await pushForActivity(A1, "alice", messaging);

    expect(result).toEqual({ sent: 2, removed: 0 });
    expect(calls).toHaveLength(1);
    expect([...calls[0].tokens].sort()).toEqual(["tok-bob", "tok-carol"]);
    expect(calls[0].notification).toEqual({
      title: "Expense added",
      body: "Alice added Dinner for ₹ 300",
    });
    expect(calls[0].webpush.fcmOptions.link).toBe(`/groups/${G}/expense/${E}`);
    expect(calls[0].data).toMatchObject({
      type: "EXPENSE_PLUS",
      link: `/groups/${G}/expense/${E}`,
    });
  });

  it("sends nothing when the activity's actor is not the caller", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const { messaging, calls } = fakeMessaging();

    expect(await pushForActivity(A1, "bob", messaging)).toEqual({
      sent: 0,
      removed: 0,
      skipped: "actor-mismatch",
    });
    expect(calls).toHaveLength(0);
  });

  it("sends nothing for an activity that does not exist", async () => {
    await seedWorld();
    const { messaging, calls } = fakeMessaging();
    expect((await pushForActivity(A2, "alice", messaging)).skipped).toBe(
      "actor-mismatch",
    );
    expect(calls).toHaveLength(0);
  });

  it("sends nothing when the group is muted", async () => {
    await seedWorld(true);
    await seedExpenseActivity();
    const { messaging, calls } = fakeMessaging();

    expect(await pushForActivity(A1, "alice", messaging)).toEqual({
      sent: 0,
      removed: 0,
      skipped: "muted",
    });
    expect(calls).toHaveLength(0);
  });

  it("sends a friend's USER activity with no group to the subject only", async () => {
    await seedWorld();
    await seedFriendship("alice", "bob");
    await seed(
      `mutation($id: UUID!) { activity_insert(data: { id: $id, type: USER, actorId: "alice", subjectId: "bob", title: "Bob" }) }`,
      { id: A2 },
    );
    const { messaging, calls } = fakeMessaging();

    expect(await pushForActivity(A2, "alice", messaging)).toEqual({
      sent: 1,
      removed: 0,
    });
    expect(calls[0].tokens).toEqual(["tok-bob"]);
    expect(calls[0].notification.body).toBe("Alice added you as a friend");
    expect(calls[0].webpush.fcmOptions.link).toBe("/friends/bob");
  });

  it("skips with no-recipients when the only member is the actor", async () => {
    await seedUser({
      id: "alice",
      email: "alice@example.test",
      signedUp: true,
    });
    await seedGroup({ id: G, title: "Solo", memberIds: ["alice"] });
    await seed(
      `mutation($id: UUID!, $g: UUID!) { activity_insert(data: { id: $id, type: GROUP_PLUS, actorId: "alice", groupId: $g, title: "Solo" }) }`,
      { id: A1, g: G },
    );
    const { messaging, calls } = fakeMessaging();
    expect((await pushForActivity(A1, "alice", messaging)).skipped).toBe(
      "no-recipients",
    );
    expect(calls).toHaveLength(0);
  });

  it("deletes a token FCM reports as not registered, and keeps the rest", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const { messaging } = fakeMessaging(async (m) => ({
      responses: m.tokens.map((t) =>
        t === "tok-bob"
          ? {
              success: false,
              error: { code: "messaging/registration-token-not-registered" },
            }
          : { success: true },
      ),
    }));

    expect(await pushForActivity(A1, "alice", messaging)).toEqual({
      sent: 1,
      removed: 1,
    });
    expect(await tokensLeft()).toEqual(["tok-alice", "tok-carol"]);
  });

  it("keeps a token whose failure is not a dead-token code", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const { messaging } = fakeMessaging(async (m) => ({
      responses: m.tokens.map(() => ({
        success: false,
        error: { code: "messaging/internal-error" },
      })),
    }));

    expect(await pushForActivity(A1, "alice", messaging)).toEqual({
      sent: 0,
      removed: 0,
    });
    expect(await tokensLeft()).toEqual(["tok-alice", "tok-bob", "tok-carol"]);
  });

  it("deletes a token FCM reports as invalid", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const { messaging } = fakeMessaging(async (m) => ({
      responses: m.tokens.map(() => ({
        success: false,
        error: { code: "messaging/invalid-registration-token" },
      })),
    }));
    expect(await pushForActivity(A1, "alice", messaging)).toEqual({
      sent: 0,
      removed: 2,
    });
    expect(await tokensLeft()).toEqual(["tok-alice"]);
  });

  it("resolves without sending when the messaging client rejects, and logs the operation and type only", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const messaging: Messaging = {
      sendEachForMulticast: () =>
        Promise.reject(new Error("boom tok-bob Dinner")),
    };

    expect(await pushForActivity(A1, "alice", messaging)).toEqual({
      sent: 0,
      removed: 0,
    });

    expect(logger.error).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(vi.mocked(logger.error).mock.calls[0]);
    expect(logged).toContain("sendActivityPush");
    expect(logged).toContain("EXPENSE_PLUS");
    expect(logged).not.toMatch(/tok-|Dinner|boom/);
  });

  it("gives up and logs when the messaging client takes longer than the deadline", async () => {
    await seedWorld();
    await seedExpenseActivity();
    const messaging: Messaging = {
      sendEachForMulticast: () => new Promise(() => undefined),
    };

    const started = Date.now();
    expect(await pushForActivity(A1, "alice", messaging, 50)).toEqual({
      sent: 0,
      removed: 0,
    });
    expect(Date.now() - started).toBeLessThan(5000);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls[0])).not.toMatch(
      /tok-|Dinner/,
    );
  });
});

describe("pushForDeletedGroup", () => {
  it("sends GROUP_MINUS text naming the group to the members but the actor", async () => {
    await seedWorld();
    const { messaging, calls } = fakeMessaging();

    const result = await pushForDeletedGroup(
      "Goa trip",
      ["alice", "bob"],
      "alice",
      messaging,
    );

    expect(result).toEqual({ sent: 1, removed: 0 });
    expect(calls).toHaveLength(1);
    expect(calls[0].tokens).toEqual(["tok-bob"]);
    expect(calls[0].notification).toEqual({
      title: "Deleted group",
      body: "Alice deleted group Goa trip",
    });
    expect(calls[0].webpush.fcmOptions.link).toBe("/groups");
  });

  it("resolves without sending when the messaging client rejects", async () => {
    await seedWorld();
    const messaging: Messaging = {
      sendEachForMulticast: () => Promise.reject(new Error("down")),
    };
    expect(
      await pushForDeletedGroup(
        "Goa trip",
        ["alice", "bob"],
        "alice",
        messaging,
      ),
    ).toEqual({
      sent: 0,
      removed: 0,
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

type Endpoint = {
  region: string[];
  eventTrigger: {
    eventType: string;
    eventFilters: Record<string, string>;
    eventFilterPathPatterns: Record<string, string>;
  };
};
const endpointOf = (fn: unknown) => (fn as { __endpoint: Endpoint }).__endpoint;

describe("triggers", () => {
  it.each([
    ["sendActivityPushApp", sendActivityPushApp, "app"],
    ["sendActivityPushExpense", sendActivityPushExpense, "expense"],
    ["sendGroupDeletedPush", sendGroupDeletedPush, "app"],
  ] as const)(
    "%s runs in asia-south1 on connector %s",
    (_name, fn, connector) => {
      const endpoint = endpointOf(fn);
      expect(endpoint.region).toEqual(["asia-south1"]);
      expect(endpoint.eventTrigger.eventType).toContain("mutationExecuted");
      expect(endpoint.eventTrigger.eventFilters).toMatchObject({
        service: "splitify",
        connector,
      });
    },
  );

  it("sendGroupDeletedPush filters on DeleteGroup", () => {
    expect(
      endpointOf(sendGroupDeletedPush).eventTrigger.eventFilters.operation,
    ).toBe("DeleteGroup");
  });

  it("the activity triggers take any operation of their connector and act only on theirs", () => {
    // SQL Connect cannot filter on a list of operations, so the handler checks the operation itself.
    expect(
      endpointOf(sendActivityPushApp).eventTrigger.eventFilterPathPatterns
        .operation,
    ).toBeTruthy();
    expect(
      endpointOf(sendActivityPushExpense).eventTrigger.eventFilterPathPatterns
        .operation,
    ).toBeTruthy();
  });

  it("ignores an operation that is not one of its own", async () => {
    const event = {
      authId: "alice",
      params: { operation: "UpsertMe" },
      data: {
        payload: { variables: { activityId: A1 }, data: {}, errors: [] },
      },
    };
    const run = (
      sendActivityPushApp as unknown as {
        run: (e: unknown) => Promise<unknown>;
      }
    ).run;
    await expect(run(event)).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
