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
  seedFriendship,
  seedGroup,
  seedUser,
  signedOutConnector,
  signInTestUser,
  type TestUser,
} from "../test-utils/emulator";
import {
  getApps as getAdminApps,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { mergeContactForUser } from "../../functions/src/merge-contact";

const G = "11111111-1111-4111-8111-111111111111";
const uuid = () => crypto.randomUUID();
const flat = (id: string) => id.replaceAll("-", ""); // the database returns a UUID without hyphens

let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  carol = await signInTestUser("carol");
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
  await seedUser({
    id: carol.uid,
    email: carol.email,
    signedUp: true,
    name: "Carol",
  });
});

const run = (dc: DataConnect, name: string, vars?: Record<string, unknown>) =>
  executeMutation(mutationRef(dc, name, vars as never));
// From the server every time: the SDK caches a query's result by its variables, which would carry one test's rows
// into the next.
const read = async <T>(
  dc: DataConnect,
  name: string,
  vars?: Record<string, unknown>,
) =>
  (
    await executeQuery(queryRef(dc, name, vars as never), {
      fetchPolicy: "SERVER_ONLY",
    })
  ).data as T;

type Rows = Record<string, { id: string; name: string | null }[]>;
const ACTIVITIES = `query { activities { type title actor { id } subject { id } group { id } } }`;
const FRIENDSHIPS = `query { friendships { userId friendId } }`;

describe("SearchUserByEmail", () => {
  it("returns nothing for someone else's offline contact", async () => {
    await seedUser({
      id: "spuser_mom",
      email: "mom@example.test",
      signedUp: false,
      name: "Mom",
    });
    await seedFriendship(bob.uid, "spuser_mom");
    const data = await read<{ users: unknown[] }>(
      carol.dc,
      "SearchUserByEmail",
      { email: "mom@example.test" },
    );
    expect(data.users).toEqual([]);
  });

  it("finds the caller's own offline contact", async () => {
    await seedUser({
      id: "spuser_mom",
      email: "mom@example.test",
      signedUp: false,
      name: "Mom",
    });
    await seedFriendship(bob.uid, "spuser_mom");
    const data = await read<{ users: { id: string }[] }>(
      bob.dc,
      "SearchUserByEmail",
      { email: "mom@example.test" },
    );
    expect(data.users).toEqual([
      { id: "spuser_mom", name: "Mom", imageUrl: null },
    ]);
  });

  it("returns id, name and image for an exact match, and no email", async () => {
    const data = await read<{ users: Record<string, unknown>[] }>(
      carol.dc,
      "SearchUserByEmail",
      { email: bob.email },
    );
    expect(data.users).toEqual([{ id: bob.uid, name: "Bob", imageUrl: null }]);
    expect(Object.keys(data.users[0])).not.toContain("email");
  });

  it("returns nothing for an unknown email", async () => {
    const data = await read<{ users: unknown[] }>(
      carol.dc,
      "SearchUserByEmail",
      { email: "nobody@example.test" },
    );
    expect(data.users).toEqual([]);
  });
});

describe("CreateContact", () => {
  it("creates a not-signed-up contact and both friendships", async () => {
    await run(alice.dc, "CreateContact", {
      id: "spuser_abc",
      email: "dev@example.test",
      name: "Dev",
    });
    const data = (await seed(
      `query { user(key: { id: "spuser_abc" }) { email name signedUp } }`,
    )) as { user: { email: string; name: string; signedUp: boolean } };
    expect(data.user).toEqual({
      email: "dev@example.test",
      name: "Dev",
      signedUp: false,
    });
    const friendships = (await seed(FRIENDSHIPS)) as {
      friendships: { userId: string; friendId: string }[];
    };
    expect(friendships.friendships).toHaveLength(2);
    expect(friendships.friendships).toContainEqual({
      userId: alice.uid,
      friendId: "spuser_abc",
    });
    expect(friendships.friendships).toContainEqual({
      userId: "spuser_abc",
      friendId: alice.uid,
    });
  });

  it("fails on an email that is taken, and writes nothing", async () => {
    await expect(
      run(alice.dc, "CreateContact", {
        id: "spuser_dup",
        email: bob.email,
        name: "Imposter",
      }),
    ).rejects.toThrow();
    const data = (await seed(`query { users { id } }`)) as Rows;
    expect(data.users).toHaveLength(3);
    const friendships = (await seed(FRIENDSHIPS)) as { friendships: unknown[] };
    expect(friendships.friendships).toHaveLength(0);
  });

  it("fails on an id without the spuser_ prefix", async () => {
    await expect(
      run(alice.dc, "CreateContact", {
        id: "abc",
        email: "dev@example.test",
        name: "Dev",
      }),
    ).rejects.toThrow();
    const data = (await seed(`query { users { id } }`)) as Rows;
    expect(data.users).toHaveLength(3);
  });

  it("fails on a name over 100 characters or an email over 254", async () => {
    await expect(
      run(alice.dc, "CreateContact", {
        id: "spuser_long",
        email: "dev@example.test",
        name: "x".repeat(101),
      }),
    ).rejects.toThrow();
    await expect(
      run(alice.dc, "CreateContact", {
        id: "spuser_long",
        email: `${"x".repeat(250)}@e.test`,
        name: "Dev",
      }),
    ).rejects.toThrow();
  });
});

describe("UpdateContact", () => {
  beforeEach(async () => {
    await seedUser({
      id: "spuser_d",
      email: "d@example.test",
      signedUp: false,
      name: "D",
    });
    await seedFriendship(alice.uid, "spuser_d");
    await seedFriendship(alice.uid, bob.uid);
  });

  it("answers Not found for someone who is not the contact's friend", async () => {
    await expect(
      run(carol.dc, "UpdateContact", {
        id: "spuser_d",
        email: "d@example.test",
        name: "Hacked",
      }),
    ).rejects.toThrow(/Not found/);
    const data = (await seed(
      `query { user(key: { id: "spuser_d" }) { name } }`,
    )) as { user: { name: string } };
    expect(data.user.name).toBe("D");
  });

  it("changes the contact for a friend", async () => {
    await run(alice.dc, "UpdateContact", {
      id: "spuser_d",
      email: "d2@example.test",
      name: "Dee",
    });
    const data = (await seed(
      `query { user(key: { id: "spuser_d" }) { name email } }`,
    )) as { user: { name: string; email: string } };
    expect(data.user).toEqual({ name: "Dee", email: "d2@example.test" });
  });

  it("refuses an email another user has, and leaves the contact's email unchanged", async () => {
    await expect(
      run(alice.dc, "UpdateContact", {
        id: "spuser_d",
        email: carol.email,
        name: "D",
      }),
    ).rejects.toThrow(/That email is already in use/);
    const data = (await seed(
      `query { user(key: { id: "spuser_d" }) { email } }`,
    )) as { user: { email: string } };
    expect(data.user.email).toBe("d@example.test");
  });

  it("keeps the contact's own email while renaming it", async () => {
    await run(alice.dc, "UpdateContact", {
      id: "spuser_d",
      email: "d@example.test",
      name: "Dee",
    });
    const data = (await seed(
      `query { user(key: { id: "spuser_d" }) { name email } }`,
    )) as { user: { name: string; email: string } };
    expect(data.user).toEqual({ name: "Dee", email: "d@example.test" });
  });

  it("answers Not found for a signed-up friend, and leaves them unchanged", async () => {
    await expect(
      run(alice.dc, "UpdateContact", {
        id: bob.uid,
        email: bob.email,
        name: "Hacked",
      }),
    ).rejects.toThrow(/Not found/);
    const data = (await seed(
      `query($id: String!) { user(key: { id: $id }) { name } }`,
      { id: bob.uid },
    )) as { user: { name: string } };
    expect(data.user.name).toBe("Bob");
  });
});

// Bob created the offline contact Mom; Alice became her friend through the AddFriend that let anyone befriend a
// contact, before contacts-editable-only-by-their-friends. Only a contact's sole friend may change her email.
describe("UpdateContact on a contact with two friends", () => {
  const MOM = "spuser_mom";
  const SHARED = /This contact is shared with someone else/;
  const mom = async () =>
    (await seed(
      `query($id: String!) {
          user(key: { id: $id }) { name email }
          groupMembers(where: { userId: { eq: $id } }) { groupId }
        }`,
      { id: MOM },
    )) as {
      user: { name: string; email: string };
      groupMembers: { groupId: string }[];
    };

  beforeEach(async () => {
    await seedUser({
      id: MOM,
      email: "mom@example.test",
      signedUp: false,
      name: "Mom",
    });
    await seedFriendship(bob.uid, MOM);
    await seedFriendship(alice.uid, MOM);
    await seedGroup({ id: G, title: "Family", memberIds: [bob.uid, MOM] });
  });

  it("refuses a second friend's email change, and leaves her email unchanged", async () => {
    await expect(
      run(alice.dc, "UpdateContact", {
        id: MOM,
        email: "alice.alt@example.test",
        name: "Mom",
      }),
    ).rejects.toThrow(SHARED);
    // A change of case only is a change too: the merge looks the address up in lowercase.
    await expect(
      run(alice.dc, "UpdateContact", {
        id: MOM,
        email: "MOM@example.test",
        name: "Mom",
      }),
    ).rejects.toThrow(SHARED);
    expect((await mom()).user.email).toBe("mom@example.test");
  });

  it("refuses her creator too while someone else is her friend", async () => {
    await expect(
      run(bob.dc, "UpdateContact", {
        id: MOM,
        email: "mom2@example.test",
        name: "Mom",
      }),
    ).rejects.toThrow(SHARED);
    expect((await mom()).user.email).toBe("mom@example.test");
  });

  it("lets a second friend rename her", async () => {
    await run(alice.dc, "UpdateContact", {
      id: MOM,
      email: "mom@example.test",
      name: "Mama",
    });
    expect((await mom()).user).toEqual({
      name: "Mama",
      email: "mom@example.test",
    });
  });

  it("lets her sole friend change her email", async () => {
    await seed(
      `mutation($a: String!, $m: String!) {
        friendship_deleteMany(where: { _or: [{ userId: { eq: $a }, friendId: { eq: $m } }, { userId: { eq: $m }, friendId: { eq: $a } }] })
      }`,
      { a: alice.uid, m: MOM },
    );
    await run(bob.dc, "UpdateContact", {
      id: MOM,
      email: "mom2@example.test",
      name: "Mom",
    });
    expect((await mom()).user.email).toBe("mom2@example.test");
  });

  it("stops the takeover: a second friend's own address, verified, merges nothing of hers", async () => {
    const attackerEmail = "alice.alt@example.test";
    await expect(
      run(alice.dc, "UpdateContact", {
        id: MOM,
        email: attackerEmail,
        name: "Mom",
      }),
    ).rejects.toThrow(SHARED);

    // Alice signs up with the address she owns, verifies it, and the sign-up merge runs for her new account.
    const attackerUid = "alice-alt-uid";
    const auth = getAdminAuth(
      getAdminApps().find((a) => a.name === "test-people-auth") ??
        initializeAdminApp({ projectId: "demo-splitify" }, "test-people-auth"),
    );
    await auth.deleteUser(attackerUid).catch(() => undefined);
    await auth.createUser({
      uid: attackerUid,
      email: attackerEmail,
      emailVerified: true,
    });
    await seedUser({
      id: attackerUid,
      email: attackerEmail,
      signedUp: true,
      name: "Alice alt",
    });
    expect(await mergeContactForUser(attackerUid)).toBe("none");

    const after = await mom();
    expect(after.user.email).toBe("mom@example.test");
    expect(after.groupMembers).toEqual([{ groupId: flat(G) }]);
    await auth.deleteUser(attackerUid);
  });
});

describe("ListFriends and GetFriend", () => {
  beforeEach(async () => {
    await seedFriendship(alice.uid, bob.uid);
  });

  it("lists only the caller's friends", async () => {
    const data = await read<{
      friendships: { friend: { id: string; signedUp: boolean } }[];
    }>(alice.dc, "ListFriends");
    expect(data.friendships.map((f) => f.friend.id)).toEqual([bob.uid]);
    const limited = await read<{ friendships: unknown[] }>(
      alice.dc,
      "ListFriends",
      { limit: 1 },
    );
    expect(limited.friendships).toHaveLength(1);
    const carolList = await read<{ friendships: unknown[] }>(
      carol.dc,
      "ListFriends",
    );
    expect(carolList.friendships).toEqual([]);
  });

  it("refuses a limit below 0, over 500 or an explicit null, and accepts 0 and 500", async () => {
    await expect(
      read(alice.dc, "ListFriends", { limit: -1 }),
    ).rejects.toThrow();
    const none = await read<{ friendships: unknown[] }>(
      alice.dc,
      "ListFriends",
      { limit: 0 },
    );
    expect(none.friendships).toEqual([]);
    await expect(
      read(alice.dc, "ListFriends", { limit: 501 }),
    ).rejects.toThrow();
    await expect(
      read(alice.dc, "ListFriends", { limit: null }),
    ).rejects.toThrow();
    const data = await read<{ friendships: unknown[] }>(
      alice.dc,
      "ListFriends",
      { limit: 500 },
    );
    expect(data.friendships).toHaveLength(1);
  });

  it("returns at most 500 friends when no limit is given", async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `spuser_many${i}`);
    // The emulator takes at most 100 rows per insertMany.
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      await seed(
        `mutation($users: [User_Data!]!, $rows: [Friendship_Data!]!) {
          user_insertMany(data: $users)
          friendship_insertMany(data: $rows)
        }`,
        {
          users: batch.map((id) => ({
            id,
            email: `${id}@example.test`,
            signedUp: false,
          })),
          rows: batch.map((friendId) => ({ userId: carol.uid, friendId })),
        },
      );
    }
    const seeded = (await seed(
      `query($id: String!) { friendships(where: { userId: { eq: $id } }, limit: 1000) { friendId } }`,
      { id: carol.uid },
    )) as { friendships: unknown[] };
    expect(seeded.friendships).toHaveLength(501);
    const data = await read<{ friendships: unknown[] }>(
      carol.dc,
      "ListFriends",
    );
    expect(data.friendships).toHaveLength(500);
  });

  it("returns a friend, and null for someone who is not one", async () => {
    const bobData = await read<{ friendship: { friend: { id: string } } }>(
      alice.dc,
      "GetFriend",
      { id: bob.uid },
    );
    expect(bobData.friendship.friend.id).toBe(bob.uid);
    const carolData = await read<{ friendship: unknown }>(
      alice.dc,
      "GetFriend",
      { id: carol.uid },
    );
    expect(carolData.friendship).toBeNull();
  });
});

describe("AddFriend", () => {
  it("without a group writes both friendships and a USER activity about the friend", async () => {
    await run(alice.dc, "AddFriend", {
      friendId: bob.uid,
      withGroup: false,
      activityId: uuid(),
    });
    const friendships = (await seed(FRIENDSHIPS)) as {
      friendships: { userId: string; friendId: string }[];
    };
    expect(friendships.friendships).toHaveLength(2);
    const activity = (await seed(ACTIVITIES)) as {
      activities: Record<string, unknown>[];
    };
    expect(activity.activities).toHaveLength(1);
    expect(activity.activities[0]).toMatchObject({
      type: "USER",
      actor: { id: alice.uid },
      subject: { id: bob.uid },
      group: null,
    });
  });

  it("with a group the caller is in, also adds the friend as a member and records MEMBER_PLUS", async () => {
    await seedGroup({ id: G, title: "Trip", memberIds: [alice.uid] });
    await run(alice.dc, "AddFriend", {
      friendId: bob.uid,
      groupId: G,
      withGroup: true,
      activityId: uuid(),
    });
    const data = (await seed(
      `query { groupMembers { userId } friendships { userId } activities { type subject { id } group { id } } }`,
    )) as {
      groupMembers: { userId: string }[];
      friendships: unknown[];
      activities: {
        type: string;
        subject: { id: string };
        group: { id: string };
      }[];
    };
    expect(data.groupMembers.map((m) => m.userId).sort()).toEqual(
      [alice.uid, bob.uid].sort(),
    );
    expect(data.friendships).toHaveLength(2);
    expect(data.activities).toEqual([
      { type: "MEMBER_PLUS", subject: { id: bob.uid }, group: { id: flat(G) } },
    ]);
  });

  it("answers Not found when the caller is not in the group, and writes nothing", async () => {
    await seedGroup({ id: G, title: "Trip", memberIds: [carol.uid] });
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: bob.uid,
        groupId: G,
        withGroup: true,
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    const data = (await seed(
      `query { friendships { userId } groupMembers { userId } activities { id } }`,
    )) as Record<string, unknown[]>;
    expect(data.friendships).toHaveLength(0);
    expect(data.groupMembers).toHaveLength(1);
    expect(data.activities).toHaveLength(0);
  });

  it("refuses a withGroup that disagrees with groupId, and writes nothing", async () => {
    await seedGroup({ id: G, title: "Trip", memberIds: [alice.uid] });
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: bob.uid,
        groupId: G,
        withGroup: false,
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: bob.uid,
        withGroup: true,
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    const data = (await seed(`query { friendships { userId } }`)) as {
      friendships: unknown[];
    };
    expect(data.friendships).toHaveLength(0);
  });

  it("answers Not found for a friend who does not exist", async () => {
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: "ghost",
        withGroup: false,
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
  });
});

// Bob created the offline contact Mom and put her in group G, which Alice (playing the attacker) shares with them.
// Only Mom's existing friends may befriend her: see knowledge/decisions/contacts-editable-only-by-their-friends.md.
describe("AddFriend on someone else's offline contact", () => {
  const MOM = "spuser_mom";
  type World = {
    friendships: { userId: string; friendId: string }[];
    groupMembers: { userId: string }[];
    activities: { id: string }[];
  };
  const world = async () =>
    (await seed(
      `query { friendships { userId friendId } groupMembers { userId } activities { id } }`,
    )) as World;

  beforeEach(async () => {
    await seedUser({
      id: MOM,
      email: "mom@example.test",
      signedUp: false,
      name: "Mom",
    });
    await seedFriendship(bob.uid, MOM);
    await seedGroup({
      id: G,
      title: "Family",
      memberIds: [alice.uid, bob.uid, MOM],
    });
  });

  it("answers Not found to a group-mate who is not her friend, with or without the group, and writes nothing", async () => {
    const before = await world();
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: MOM,
        withGroup: false,
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: MOM,
        groupId: G,
        withGroup: true,
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    expect(await world()).toEqual(before);
  });

  it("lets her creator and friend add her again", async () => {
    await run(bob.dc, "AddFriend", {
      friendId: MOM,
      groupId: G,
      withGroup: true,
      activityId: uuid(),
    });
    const after = await world();
    expect(after.friendships).toHaveLength(2);
    expect(after.activities).toHaveLength(1);
  });

  it("still lets anyone add a signed-up user", async () => {
    await run(alice.dc, "AddFriend", {
      friendId: carol.uid,
      groupId: G,
      withGroup: true,
      activityId: uuid(),
    });
    const after = await world();
    expect(after.friendships).toContainEqual({
      userId: alice.uid,
      friendId: carol.uid,
    });
    expect(after.groupMembers.map((m) => m.userId)).toContain(carol.uid);
  });

  it("stops the takeover: Mom keeps her email and her memberships after AddFriend, UpdateContact and UpsertMe", async () => {
    await expect(
      run(alice.dc, "AddFriend", {
        friendId: MOM,
        groupId: G,
        withGroup: true,
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    await expect(
      run(alice.dc, "UpdateContact", {
        id: MOM,
        email: alice.email,
        name: "Mom",
      }),
    ).rejects.toThrow(/Not found/);
    await run(alice.dc, "UpsertMe", {});

    const data = (await seed(
      `query($id: String!) {
        user(key: { id: $id }) { email }
        groupMembers(where: { userId: { eq: $id } }) { groupId }
      }`,
      { id: MOM },
    )) as { user: { email: string }; groupMembers: { groupId: string }[] };
    expect(data.user.email).toBe("mom@example.test");
    expect(data.groupMembers).toEqual([{ groupId: flat(G) }]);
  });
});

describe("signed out", () => {
  it("is refused on every people operation", async () => {
    const dc = signedOutConnector({
      connector: "app",
      service: "splitify",
      location: "asia-south1",
    });
    await expect(
      read(dc, "SearchUserByEmail", { email: bob.email }),
    ).rejects.toThrow();
    await expect(read(dc, "ListFriends")).rejects.toThrow();
    await expect(read(dc, "GetFriend", { id: bob.uid })).rejects.toThrow();
    await expect(
      run(dc, "CreateContact", {
        id: "spuser_x",
        email: "x@example.test",
        name: "X",
      }),
    ).rejects.toThrow();
    await expect(
      run(dc, "UpdateContact", {
        id: bob.uid,
        email: bob.email,
        name: "X",
      }),
    ).rejects.toThrow();
    await expect(
      run(dc, "AddFriend", {
        friendId: bob.uid,
        withGroup: false,
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    const data = (await seed(
      `query { users { id } friendships { userId } }`,
    )) as Rows;
    expect(data.users).toHaveLength(3);
    expect(data.friendships).toHaveLength(0);
  });
});
