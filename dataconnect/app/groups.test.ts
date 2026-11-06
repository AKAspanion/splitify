import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  executeMutation,
  executeQuery,
  mutationRef,
  queryRef,
  type DataConnect,
} from "firebase/data-connect";
import {
  connectorFor,
  resetDatabase,
  seed,
  seedFriendship,
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
  for (const u of [alice, bob, carol])
    await seedUser({ id: u.uid, email: u.email, signedUp: true });
  await seedGroup({ id: G, title: "Trip", memberIds: [alice.uid, bob.uid] });
});

const run = (dc: DataConnect, name: string, vars?: Record<string, unknown>) =>
  executeMutation(mutationRef(dc, name, vars as never));
const read = async <T>(
  dc: DataConnect,
  name: string,
  vars?: Record<string, unknown>,
) => (await executeQuery(queryRef(dc, name, vars as never))).data as T;

type GroupsRead = { groups: { id: string; title: string }[] };
type Activities = {
  activities: {
    type: string;
    title: string;
    actor: { id: string };
    subject: { id: string } | null;
    group: { id: string } | null;
  }[];
};
const ACTIVITIES = `query { activities { type title actor { id } subject { id } group { id } } }`;

describe("GetGroup and ListGroupMembers", () => {
  it("answers members with the group and members, a non-member with nothing", async () => {
    for (const u of [alice, bob]) {
      const data = await read<GroupsRead>(u.dc, "GetGroup", { id: G });
      expect(data.groups.map((g) => g.id)).toEqual([flat(G)]);
    }
    const carolGroup = await read<GroupsRead>(carol.dc, "GetGroup", { id: G });
    expect(carolGroup.groups).toEqual([]);

    const members = await read<{ groupMembers: { user: { id: string } }[] }>(
      alice.dc,
      "ListGroupMembers",
      { groupId: G },
    );
    expect(members.groupMembers.map((m) => m.user.id).sort()).toEqual(
      [alice.uid, bob.uid].sort(),
    );
    const carolMembers = await read<{ groupMembers: unknown[] }>(
      carol.dc,
      "ListGroupMembers",
      { groupId: G },
    );
    expect(carolMembers.groupMembers).toEqual([]);
  });
});

describe("a non-member", () => {
  it("gets Not found from UpdateGroup, DeleteGroup and AddGroupMember, and the group is unchanged", async () => {
    await seedFriendship(carol.uid, bob.uid);
    await expect(
      run(carol.dc, "UpdateGroup", {
        id: G,
        title: "Hacked",
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);
    await expect(run(carol.dc, "DeleteGroup", { id: G })).rejects.toThrow(
      /Not found/,
    );
    await expect(
      run(carol.dc, "AddGroupMember", {
        groupId: G,
        userId: carol.uid,
        activityId: uuid(),
      }),
    ).rejects.toThrow(/Not found/);

    const data = (await seed(
      `query { groups { id title } groupMembers { userId } activities { id } }`,
    )) as {
      groups: { title: string }[];
      groupMembers: unknown[];
      activities: unknown[];
    };
    expect(data.groups).toEqual([{ id: flat(G), title: "Trip" }]);
    expect(data.groupMembers).toHaveLength(2);
    expect(data.activities).toHaveLength(0);
  });
});

describe("CreateGroup", () => {
  it("creates the group, the caller's membership and a GROUP_PLUS activity", async () => {
    const id = uuid();
    await run(alice.dc, "CreateGroup", {
      id,
      title: "Goa trip",
      description: "Beach",
      type: "trip",
      activityId: uuid(),
    });
    const data = (await seed(
      `query($id: UUID!) {
        group(key: { id: $id }) { title description type }
        groupMembers(where: { groupId: { eq: $id } }) { userId }
      }`,
      { id },
    )) as {
      group: { title: string; description: string; type: string };
      groupMembers: { userId: string }[];
    };
    expect(data.group).toEqual({
      title: "Goa trip",
      description: "Beach",
      type: "trip",
    });
    expect(data.groupMembers).toEqual([{ userId: alice.uid }]);

    const activity = (await seed(ACTIVITIES)) as Activities;
    const created = activity.activities.filter((a) => a.type === "GROUP_PLUS");
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      title: "Goa trip",
      actor: { id: alice.uid },
      group: { id: flat(id) },
    });
  });

  it("refuses a 101 character title and a 501 character description, and accepts 100 and 500", async () => {
    await expect(
      run(alice.dc, "CreateGroup", {
        id: uuid(),
        title: "x".repeat(101),
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    await expect(
      run(alice.dc, "CreateGroup", {
        id: uuid(),
        title: "ok",
        description: "x".repeat(501),
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    await run(alice.dc, "CreateGroup", {
      id: uuid(),
      title: "x".repeat(100),
      description: "y".repeat(500),
      activityId: uuid(),
    });
    const data = (await seed(`query { groups { id } }`)) as {
      groups: unknown[];
    };
    expect(data.groups).toHaveLength(2); // Trip and the one that passed
  });

  it("refuses a type over 50 characters and accepts 50", async () => {
    await expect(
      run(alice.dc, "CreateGroup", {
        id: uuid(),
        title: "ok",
        type: "t".repeat(51),
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    const id = uuid();
    await run(alice.dc, "CreateGroup", {
      id,
      title: "ok",
      type: "t".repeat(50),
      activityId: uuid(),
    });
    const data = (await seed(`query { groups { id } }`)) as {
      groups: unknown[];
    };
    expect(data.groups).toHaveLength(2); // Trip and the one that passed
  });

  it("fails on an existing id and leaves the group as it was", async () => {
    await expect(
      run(carol.dc, "CreateGroup", {
        id: G,
        title: "Mine now",
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    const data = (await seed(
      `query { groups { title } groupMembers { userId } }`,
    )) as { groups: { title: string }[]; groupMembers: unknown[] };
    expect(data.groups).toEqual([{ title: "Trip" }]);
    expect(data.groupMembers).toHaveLength(2);
  });
});

describe("UpdateGroup", () => {
  it("updates the group for a member and records GROUP_UPDATE", async () => {
    await run(bob.dc, "UpdateGroup", {
      id: G,
      title: "Renamed",
      description: "New",
      type: "home",
      activityId: uuid(),
    });
    const data = (await seed(
      `query($id: UUID!) { group(key: { id: $id }) { title description type updatedAt } }`,
      { id: G },
    )) as { group: { title: string; updatedAt: string | null } };
    expect(data.group.title).toBe("Renamed");
    expect(data.group.updatedAt).not.toBeNull();
    const activity = (await seed(ACTIVITIES)) as Activities;
    expect(activity.activities).toHaveLength(1);
    expect(activity.activities[0]).toMatchObject({
      type: "GROUP_UPDATE",
      actor: { id: bob.uid },
      title: "Renamed",
    });
  });

  it("refuses a type over 50 characters, leaves the group unchanged, and accepts 50", async () => {
    await expect(
      run(bob.dc, "UpdateGroup", {
        id: G,
        title: "Renamed",
        type: "t".repeat(51),
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    const read = async () =>
      (
        (await seed(
          `query($id: UUID!) { group(key: { id: $id }) { title type } }`,
          { id: G },
        )) as { group: { title: string; type: string | null } }
      ).group;
    expect(await read()).toEqual({ title: "Trip", type: null });
    await run(bob.dc, "UpdateGroup", {
      id: G,
      title: "Renamed",
      type: "t".repeat(50),
      activityId: uuid(),
    });
    expect(await read()).toEqual({ title: "Renamed", type: "t".repeat(50) });
  });
});

describe("AddGroupMember", () => {
  it("adds a friend of the caller and records MEMBER_PLUS with the new member as subject", async () => {
    await seedFriendship(alice.uid, carol.uid);
    await run(alice.dc, "AddGroupMember", {
      groupId: G,
      userId: carol.uid,
      activityId: uuid(),
    });
    const data = (await seed(
      `query($id: UUID!) { groupMembers(where: { groupId: { eq: $id } }) { userId } }`,
      { id: G },
    )) as { groupMembers: { userId: string }[] };
    expect(data.groupMembers.map((m) => m.userId).sort()).toEqual(
      [alice.uid, bob.uid, carol.uid].sort(),
    );
    const activity = (await seed(ACTIVITIES)) as Activities;
    expect(activity.activities).toHaveLength(1);
    expect(activity.activities[0]).toMatchObject({
      type: "MEMBER_PLUS",
      actor: { id: alice.uid },
      subject: { id: carol.uid },
      group: { id: flat(G) },
      title: "Trip",
    });
  });

  it("refuses someone who is not the caller's friend, and writes nothing", async () => {
    await expect(
      run(alice.dc, "AddGroupMember", {
        groupId: G,
        userId: carol.uid,
        activityId: uuid(),
      }),
    ).rejects.toThrow("You can only add your friends to a group");
    const data = (await seed(
      `query { groupMembers { userId } activities { id } }`,
    )) as { groupMembers: unknown[]; activities: unknown[] };
    expect(data.groupMembers).toHaveLength(2);
    expect(data.activities).toHaveLength(0);
  });
});

describe("DeleteGroup", () => {
  it("returns the member ids and removes the group, members, expenses, payments, splits and activity", async () => {
    const expenseId = uuid();
    const aliceExpense = connectorFor(alice, expenseConfig);
    await run(aliceExpense, "CreateExpense", {
      id: expenseId,
      groupId: G,
      amount: 100,
      description: "Dinner",
      type: "EQUAL",
      activityId: uuid(),
      payments: [{ id: uuid(), expenseId, userId: alice.uid, amount: 100 }],
      splits: [
        { id: uuid(), expenseId, userId: alice.uid, amount: 50 },
        { id: uuid(), expenseId, userId: bob.uid, amount: 50 },
      ],
    });
    await run(alice.dc, "UpdateGroup", {
      id: G,
      title: "Trip 2",
      activityId: uuid(),
    });

    const result = await run(alice.dc, "DeleteGroup", { id: G });
    const returned = (
      result.data as unknown as {
        query: { group: { title: string }; memberIds: { userId: string }[] };
      }
    ).query;
    const memberIds = returned.memberIds.map((m) => m.userId);
    expect(returned.group.title).toBe("Trip 2");
    expect(memberIds.sort()).toEqual([alice.uid, bob.uid].sort());

    const data = (await seed(
      `query { groups { id } groupMembers { userId } expenses { id } userPayments { id } userSplits { id } activities { id } }`,
    )) as Record<string, unknown[]>;
    expect(data).toEqual({
      groups: [],
      groupMembers: [],
      expenses: [],
      userPayments: [],
      userSplits: [],
      activities: [],
    });
  });

  it("leaves another group's rows alone", async () => {
    const other = uuid();
    await seedGroup({ id: other, title: "Other", memberIds: [alice.uid] });
    await run(alice.dc, "DeleteGroup", { id: G });
    const data = (await seed(`query { groups { title } }`)) as {
      groups: { title: string }[];
    };
    expect(data.groups).toEqual([{ title: "Other" }]);
  });
});

describe("ListMyGroups", () => {
  beforeEach(async () => {
    await resetDatabase();
    for (const u of [alice, bob, carol])
      await seedUser({ id: u.uid, email: u.email, signedUp: true });
    // Created through the operation so createdAt differs: Home, then Goa trip, then Office (Alice not in it).
    await run(alice.dc, "CreateGroup", {
      id: uuid(),
      title: "Home",
      activityId: uuid(),
    });
    await run(alice.dc, "CreateGroup", {
      id: uuid(),
      title: "Goa trip",
      activityId: uuid(),
    });
    await run(bob.dc, "CreateGroup", {
      id: uuid(),
      title: "Office",
      activityId: uuid(),
    });
  });

  it("filters by a title search", async () => {
    const data = await read<GroupsRead>(alice.dc, "ListMyGroups", {
      search: "goa",
    });
    expect(data.groups.map((g) => g.title)).toEqual(["Goa trip"]);
  });

  it("lists the caller's groups newest first, and limits", async () => {
    const all = await read<GroupsRead>(alice.dc, "ListMyGroups");
    expect(all.groups.map((g) => g.title)).toEqual(["Goa trip", "Home"]);
    const one = await read<GroupsRead>(alice.dc, "ListMyGroups", { limit: 1 });
    expect(one.groups.map((g) => g.title)).toEqual(["Goa trip"]);
  });

  // 200 is MY_GROUPS_LIMIT in lib/data/groups.ts, the most the app asks for.
  it("refuses a limit below 0, over 200 or null, and accepts 0 and 200", async () => {
    for (const limit of [-1, 201, null])
      await expect(read(alice.dc, "ListMyGroups", { limit })).rejects.toThrow();
    const none = await read<GroupsRead>(alice.dc, "ListMyGroups", {
      limit: 0,
    });
    expect(none.groups).toEqual([]);
    const most = await read<GroupsRead>(alice.dc, "ListMyGroups", {
      limit: 200,
    });
    expect(most.groups).toHaveLength(2);
  });
});

describe("signed out", () => {
  it("is refused on every group operation", async () => {
    const dc = signedOutConnector({
      connector: "app",
      service: "splitify",
      location: "asia-south1",
    });
    await expect(read(dc, "GetGroup", { id: G })).rejects.toThrow();
    await expect(read(dc, "ListMyGroups")).rejects.toThrow();
    await expect(
      read(dc, "ListGroupMembers", { groupId: G }),
    ).rejects.toThrow();
    await expect(
      run(dc, "CreateGroup", { id: uuid(), title: "x", activityId: uuid() }),
    ).rejects.toThrow();
    await expect(
      run(dc, "UpdateGroup", { id: G, title: "x", activityId: uuid() }),
    ).rejects.toThrow();
    await expect(run(dc, "DeleteGroup", { id: G })).rejects.toThrow();
    await expect(
      run(dc, "AddGroupMember", {
        groupId: G,
        userId: alice.uid,
        activityId: uuid(),
      }),
    ).rejects.toThrow();
    const data = (await seed(`query { groups { id } }`)) as {
      groups: unknown[];
    };
    expect(data.groups).toHaveLength(1);
  });
});
