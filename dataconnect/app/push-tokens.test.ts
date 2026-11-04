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
  seedUser,
  signedOutConnector,
  signInTestUser,
  type TestUser,
} from "../test-utils/emulator";

const appConfig = {
  connector: "app",
  service: "splitify",
  location: "asia-south1",
};
const adminConfig = { ...appConfig, connector: "admin" };

let alice: TestUser;
let bob: TestUser;

const register = (user: TestUser, token: string, platform: string) =>
  executeMutation(
    mutationRef(user.dc, "RegisterMyPushToken", { token, platform } as never),
  );
const remove = async (user: TestUser, token: string) =>
  (
    await executeMutation(
      mutationRef(user.dc, "RemoveMyPushToken", { token } as never),
    )
  ).data as unknown as { pushToken_deleteMany: number };
const rows = async () =>
  (
    (await seed(`query { pushTokens { token user { id } platform } }`)) as {
      pushTokens: { token: string; user: { id: string }; platform: string }[];
    }
  ).pushTokens;

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
});

beforeEach(async () => {
  await resetDatabase();
  for (const u of [alice, bob])
    await seedUser({ id: u.uid, email: u.email, signedUp: true });
});

describe("RegisterMyPushToken", () => {
  it("stores the token for the caller with the platform", async () => {
    await register(alice, "tok-a", "web");
    expect(await rows()).toEqual([
      { token: "tok-a", user: { id: alice.uid }, platform: "web" },
    ]);
  });

  it("moves a token to whoever registers it now, and updates the platform", async () => {
    await register(alice, "tok-a", "web");
    await register(bob, "tok-a", "ios");
    expect(await rows()).toEqual([
      { token: "tok-a", user: { id: bob.uid }, platform: "ios" },
    ]);
  });

  it("accepts 4096 characters and refuses 4097, writing nothing", async () => {
    await register(alice, "x".repeat(4096), "ios");
    expect(await rows()).toHaveLength(1);
    await expect(register(alice, "y".repeat(4097), "web")).rejects.toThrow();
    expect(await rows()).toHaveLength(1);
  });

  it("refuses an empty token and a platform other than web or ios", async () => {
    await expect(register(alice, "", "web")).rejects.toThrow();
    await expect(register(alice, "tok-b", "android")).rejects.toThrow();
    expect(await rows()).toEqual([]);
  });

  it("is refused when nobody is signed in", async () => {
    const dc = signedOutConnector(appConfig);
    await expect(
      executeMutation(
        mutationRef(dc, "RegisterMyPushToken", {
          token: "tok-a",
          platform: "web",
        } as never),
      ),
    ).rejects.toThrow();
    expect(await rows()).toEqual([]);
  });
});

describe("RemoveMyPushToken", () => {
  it("returns 0 and keeps the row for someone else's token, deletes it for the owner", async () => {
    await register(alice, "tok-a", "web");
    expect((await remove(bob, "tok-a")).pushToken_deleteMany).toBe(0);
    expect(await rows()).toHaveLength(1);
    expect((await remove(alice, "tok-a")).pushToken_deleteMany).toBe(1);
    expect(await rows()).toEqual([]);
  });

  it("is refused when nobody is signed in", async () => {
    await register(alice, "tok-a", "web");
    const dc = signedOutConnector(appConfig);
    await expect(
      executeMutation(
        mutationRef(dc, "RemoveMyPushToken", { token: "tok-a" } as never),
      ),
    ).rejects.toThrow();
    expect(await rows()).toHaveLength(1);
  });
});

describe("admin connector push tokens", () => {
  it("refuses ListPushTokens and DeletePushTokens to a signed-in person", async () => {
    await register(alice, "tok-a", "web");
    const dc = connectorFor(alice, adminConfig);
    await expect(
      executeQuery(
        queryRef(dc, "ListPushTokens", { userIds: [alice.uid] } as never),
      ),
    ).rejects.toThrow();
    await expect(
      executeMutation(
        mutationRef(dc, "DeletePushTokens", { tokens: ["tok-a"] } as never),
      ),
    ).rejects.toThrow();
    expect(await rows()).toHaveLength(1);
  });

  it("lists the tokens of the given users and deletes by token as admin", async () => {
    await register(alice, "tok-a", "web");
    await register(alice, "tok-b", "ios");
    await register(bob, "tok-c", "web");
    const admin = adminConnector(adminConfig);
    const listed = (
      await admin.executeQuery<
        {
          pushTokens: {
            token: string;
            user: { id: string };
            platform: string;
          }[];
        },
        unknown
      >("ListPushTokens", { userIds: [alice.uid] })
    ).data.pushTokens;
    expect(listed.map((t) => t.token).sort()).toEqual(["tok-a", "tok-b"]);
    expect(listed.every((t) => t.user.id === alice.uid)).toBe(true);

    const deleted = (
      await admin.executeMutation<{ pushToken_deleteMany: number }, unknown>(
        "DeletePushTokens",
        { tokens: ["tok-a", "tok-b"] },
      )
    ).data.pushToken_deleteMany;
    expect(deleted).toBe(2);
    expect((await rows()).map((r) => r.token)).toEqual(["tok-c"]);
  });
});
