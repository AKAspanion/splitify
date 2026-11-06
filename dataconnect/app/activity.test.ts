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
const H = "33333333-3333-4333-8333-333333333333";
const K = "44444444-4444-4444-8444-444444444444";
const strip = (id: string) => id.replaceAll("-", "");
const uuid = () => crypto.randomUUID();

let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

async function seedActivity(a: {
  id: string;
  title: string;
  minute: number;
  groupId?: string;
  actorId: string;
  subjectId?: string;
}) {
  await seed(`mutation($a: Activity_Data!) { activity_insert(data: $a) }`, {
    a: {
      id: a.id,
      type: "EXPENSE_PLUS",
      title: a.title,
      actorId: a.actorId,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, a.minute)).toISOString(),
      ...(a.groupId ? { groupId: a.groupId } : {}),
      ...(a.subjectId ? { subjectId: a.subjectId } : {}),
    },
  });
}

const query = async (dc: DataConnect, name: string, vars: object) =>
  (await executeQuery(queryRef(dc, name, vars as never))).data as never as any;
const mutate = (dc: DataConnect, name: string, vars: object) =>
  executeMutation(mutationRef(dc, name, vars as never));

const inG = uuid();
const inH = uuid();
const inK = uuid();

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  carol = await signInTestUser("carol");
});

beforeEach(async () => {
  await resetDatabase();
  for (const u of [alice, bob, carol])
    await seedUser({ id: u.uid, email: u.email, signedUp: true });
  await seedGroup({ id: G, title: "Shared", memberIds: [alice.uid, bob.uid] });
  await seedGroup({ id: H, title: "Other", memberIds: [bob.uid] });
  await seedGroup({ id: K, title: "Private", memberIds: [bob.uid] });
  // Bob's activity in G (Alice is a member), in H with Alice as the subject, and in K (Alice has nothing to do with it).
  await seedActivity({
    id: inG,
    title: "in G",
    minute: 1,
    groupId: G,
    actorId: bob.uid,
  });
  await seedActivity({
    id: inH,
    title: "in H",
    minute: 2,
    groupId: H,
    actorId: bob.uid,
    subjectId: alice.uid,
  });
  await seedActivity({
    id: inK,
    title: "in K",
    minute: 3,
    groupId: K,
    actorId: bob.uid,
  });
});

describe("ListMyActivity and GetActivity", () => {
  it("shows group, subject and own activity newest first, and not other groups'", async () => {
    await seedActivity({
      id: uuid(),
      title: "mine",
      minute: 4,
      actorId: alice.uid,
    });
    const { activities } = await query(alice.dc, "ListMyActivity", {
      limit: 10,
      offset: 0,
    });
    expect(activities.map((a: { title: string }) => a.title)).toEqual([
      "mine",
      "in H",
      "in G",
    ]);

    const paged = await query(alice.dc, "ListMyActivity", {
      limit: 1,
      offset: 1,
    });
    expect(paged.activities.map((a: { title: string }) => a.title)).toEqual([
      "in H",
    ]);
  });

  it("returns an activity the caller may see, and null for another group's", async () => {
    const seen = await query(alice.dc, "GetActivity", { id: inH });
    expect(strip(seen.activity.id)).toBe(strip(inH));
    expect(seen.activity.title).toBe("in H");
    expect(
      (await query(alice.dc, "GetActivity", { id: inK })).activity,
    ).toBeNull();
    expect(
      (await query(carol.dc, "GetActivity", { id: inG })).activity,
    ).toBeNull();
    const carolList = await query(carol.dc, "ListMyActivity", {
      limit: 10,
      offset: 0,
    });
    expect(carolList.activities).toEqual([]);
  });

  it("refuses a limit of 101 and accepts 100", async () => {
    await expect(
      query(alice.dc, "ListMyActivity", { limit: 101, offset: 0 }),
    ).rejects.toThrow();
    const { activities } = await query(alice.dc, "ListMyActivity", {
      limit: 100,
      offset: 0,
    });
    expect(activities).toHaveLength(2);
  });

  it("refuses a limit below 0 and an offset below 0, and accepts 0 and any offset the pager can reach", async () => {
    for (const vars of [
      { limit: -1, offset: 0 },
      { limit: 10, offset: -1 },
    ])
      await expect(query(alice.dc, "ListMyActivity", vars)).rejects.toThrow();
    const none = await query(alice.dc, "ListMyActivity", {
      limit: 0,
      offset: 0,
    });
    expect(none.activities).toEqual([]);
    const far = await query(alice.dc, "ListMyActivity", {
      limit: 100,
      offset: 10001,
    });
    expect(far.activities).toEqual([]);
  });

  it("refuses both when nobody is signed in", async () => {
    const dc = signedOutConnector(connectorConfig);
    await expect(
      query(dc, "ListMyActivity", { limit: 10, offset: 0 }),
    ).rejects.toThrow();
    await expect(query(dc, "GetActivity", { id: inG })).rejects.toThrow();
  });
});

describe("UpsertMyFeedback", () => {
  const rows = async () =>
    (
      (await seed(`query { feedbacks { user { id } title description } }`)) as {
        feedbacks: {
          user: { id: string };
          title: string;
          description: string | null;
        }[];
      }
    ).feedbacks;

  it("keeps one row per person, holding the latest text", async () => {
    await mutate(alice.dc, "UpsertMyFeedback", {
      title: "Love it",
      description: "first",
    });
    await mutate(alice.dc, "UpsertMyFeedback", {
      title: "Love it",
      description: "second",
    });
    await mutate(bob.dc, "UpsertMyFeedback", { title: "Bob" });
    const all = await rows();
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.user.id === alice.uid)).toMatchObject({
      title: "Love it",
      description: "second",
    });
  });

  it("refuses a title of 101 characters, a description of 501, and a signed-out caller", async () => {
    await expect(
      mutate(alice.dc, "UpsertMyFeedback", { title: "t".repeat(101) }),
    ).rejects.toThrow();
    await expect(
      mutate(alice.dc, "UpsertMyFeedback", {
        title: "ok",
        description: "d".repeat(501),
      }),
    ).rejects.toThrow();
    await expect(
      mutate(signedOutConnector(connectorConfig), "UpsertMyFeedback", {
        title: "ok",
      }),
    ).rejects.toThrow();
    expect(await rows()).toEqual([]);
    await mutate(alice.dc, "UpsertMyFeedback", { title: "t".repeat(100) });
    expect(await rows()).toHaveLength(1);
  });
});
