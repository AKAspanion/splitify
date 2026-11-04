import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";
import {
  resetDatabase,
  seed,
  seedFriendship,
  seedGroup,
  seedUser,
} from "../../dataconnect/test-utils/emulator";
import { mergeContactForUser, mergeContactOnSignUp } from "./merge-contact";

vi.mock("firebase-functions/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

const G = "11111111-1111-4111-8111-111111111111";
const EXPENSE = "33333333-3333-4333-8333-333333333333";
const CONTACT = "spuser_d";
const NEW_UID = "new-user-uid";
const EMAIL = "dev@example.test";

const strip = (id: string) => id.replace(/-/g, "");

const auth = () =>
  getAuth(
    getApps().find((a) => a.name === "test-merge-auth") ??
      initializeApp({ projectId: "demo-splitify" }, "test-merge-auth"),
  );

async function createAuthUser(emailVerified: boolean, uid = NEW_UID) {
  // One address belongs to one Auth user, so clear the ones earlier tests made.
  for (const old of [NEW_UID, "no-row-uid"])
    await auth()
      .deleteUser(old)
      .catch(() => undefined);
  await auth().createUser({ uid, email: EMAIL, emailVerified });
}

type Rows = {
  groupMembers: { groupId: string; userId: string }[];
  userSplits: { userId: string; amount: number }[];
  userPayments: { userId: string }[];
  friendships: { userId: string; friendId: string }[];
  expenses: { creatorId: string }[];
  activities: { actorId: string; subjectId: string | null }[];
  users: { id: string }[];
};

async function rows(): Promise<Rows> {
  const data = (await seed(`query {
    groupMembers { groupId userId }
    userSplits { userId amount }
    userPayments { userId }
    friendships { userId friendId }
    expenses { creatorId }
    activities { actorId subjectId }
    users { id }
  }`)) as Rows;
  const norm = <T extends { groupId?: string }>(r: T) =>
    r.groupId ? { ...r, groupId: strip(r.groupId) } : r;
  return { ...data, groupMembers: data.groupMembers.map(norm) };
}

/** Contact D: member of G with a split of 100, friends with Alice, creator of an expense, actor of an activity. */
async function seedContactWorld() {
  await seedUser({ id: CONTACT, email: EMAIL, signedUp: false });
  await seedUser({ id: "alice", email: "alice@example.test", signedUp: true });
  await seedUser({ id: NEW_UID, email: EMAIL, signedUp: true });
  await seedGroup({ id: G, title: "G", memberIds: [CONTACT, "alice"] });
  await seedFriendship(CONTACT, "alice");
  await seed(
    `mutation($g: UUID!, $e: UUID!) {
      expense_insert(data: { id: $e, groupId: $g, amount: 100, description: "x", type: EQUAL, tag: EXPENSE, creatorId: "${CONTACT}" })
      userSplit_insert(data: { id: "44444444-4444-4444-8444-444444444444", expenseId: $e, userId: "${CONTACT}", amount: 100 })
      userPayment_insert(data: { id: "55555555-5555-4555-8555-555555555555", expenseId: $e, userId: "${CONTACT}", amount: 100 })
      activity_insert(data: { id: "66666666-6666-4666-8666-666666666666", type: EXPENSE_PLUS, actorId: "${CONTACT}", groupId: $g, title: "x" })
    }`,
    { g: G, e: EXPENSE },
  );
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
});

describe("mergeContactForUser", () => {
  it("moves the contact's rows to the verified new user and deletes the contact", async () => {
    await seedContactWorld();
    await createAuthUser(true);

    expect(await mergeContactForUser(NEW_UID)).toBe("merged");

    const after = await rows();
    expect(after.groupMembers).toHaveLength(2);
    expect(after.groupMembers).toEqual(
      expect.arrayContaining([
        { groupId: strip(G), userId: NEW_UID },
        { groupId: strip(G), userId: "alice" },
      ]),
    );
    expect(after.userSplits).toEqual([{ userId: NEW_UID, amount: 100 }]);
    expect(after.userPayments).toEqual([{ userId: NEW_UID }]);
    expect(after.friendships).toHaveLength(2);
    expect(after.friendships).toEqual(
      expect.arrayContaining([
        { userId: NEW_UID, friendId: "alice" },
        { userId: "alice", friendId: NEW_UID },
      ]),
    );
    expect(after.expenses).toEqual([{ creatorId: NEW_UID }]);
    expect(after.activities).toEqual([{ actorId: NEW_UID, subjectId: null }]);
    expect(after.users.map((u) => u.id).sort()).toEqual(
      ["alice", NEW_UID].sort(),
    );
  });

  it("leaves everything as it was when the email is not verified", async () => {
    await seedContactWorld();
    await createAuthUser(false);
    const before = await rows();

    expect(await mergeContactForUser(NEW_UID)).toBe("unverified");
    expect(await rows()).toEqual(before);
  });

  it("keeps one membership when the new user is already in the group", async () => {
    await seedContactWorld();
    await seed(
      `mutation($g: UUID!) { groupMember_insert(data: { groupId: $g, userId: "${NEW_UID}" }) }`,
      { g: G },
    );
    await createAuthUser(true);

    expect(await mergeContactForUser(NEW_UID)).toBe("merged");
    const members = (await rows()).groupMembers.map((m) => m.userId).sort();
    expect(members).toEqual(["alice", NEW_UID].sort());
  });

  it("drops a friendship the new user already has instead of duplicating it", async () => {
    await seedContactWorld();
    await seedFriendship(NEW_UID, "alice");
    await createAuthUser(true);

    expect(await mergeContactForUser(NEW_UID)).toBe("merged");
    const friendships = (await rows()).friendships;
    expect(friendships).toHaveLength(2);
    expect(friendships).toEqual(
      expect.arrayContaining([
        { userId: NEW_UID, friendId: "alice" },
        { userId: "alice", friendId: NEW_UID },
      ]),
    );
  });

  it("drops a friendship between the contact and the new user", async () => {
    await seedContactWorld();
    await seedFriendship(CONTACT, NEW_UID);
    await createAuthUser(true);

    expect(await mergeContactForUser(NEW_UID)).toBe("merged");
    const friendships = (await rows()).friendships;
    expect(friendships.some((f) => f.userId === f.friendId)).toBe(false);
    expect(friendships).toHaveLength(2);
  });

  it("returns none when it runs again, and when no contact has the email", async () => {
    await seedContactWorld();
    await createAuthUser(true);
    expect(await mergeContactForUser(NEW_UID)).toBe("merged");
    const after = await rows();

    expect(await mergeContactForUser(NEW_UID)).toBe("none");
    expect(await rows()).toEqual(after);

    await resetDatabase();
    await seedUser({ id: NEW_UID, email: EMAIL, signedUp: true });
    expect(await mergeContactForUser(NEW_UID)).toBe("none");
  });

  it("moves nothing and logs the operation and cause class, without the email, when the merge fails part-way", async () => {
    await seedContactWorld();
    // Forced failure: there is no User row for this uid, so the first move hits a foreign key.
    await createAuthUser(true, "no-row-uid");
    const before = await rows();

    await expect(mergeContactForUser("no-row-uid")).rejects.toThrow();

    expect(await rows()).toEqual(before);
    const error = vi.mocked(logger.error);
    expect(error).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(error.mock.calls[0]);
    expect(logged).toContain("MergeContactIntoUser");
    expect(logged).not.toContain("example.test");
    expect(logged).not.toContain(CONTACT);
  });
});

describe("mergeContactOnSignUp", () => {
  it("filters on connector app and operation UpsertMe in asia-south1", () => {
    const endpoint = (
      mergeContactOnSignUp as unknown as {
        __endpoint: {
          region: string[];
          eventTrigger: {
            eventType: string;
            eventFilters: Record<string, string>;
          };
        };
      }
    ).__endpoint;
    expect(endpoint.region).toEqual(["asia-south1"]);
    expect(endpoint.eventTrigger.eventType).toContain("mutationExecuted");
    expect(endpoint.eventTrigger.eventFilters).toMatchObject({
      connector: "app",
      operation: "UpsertMe",
      service: "splitify",
    });
  });

  it("runs only admin operations", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("./merge-contact.ts", import.meta.url), "utf8"),
    );
    const operations = [
      ...source.matchAll(/execute(?:Query|Mutation)[^"]*"(\w+)"/g),
    ].map((m) => m[1]);
    expect(operations.sort()).toEqual([
      "FindContactByEmail",
      "MergeContactIntoUser",
    ]);
    expect(source).toContain('connector: "admin"');
  });
});
