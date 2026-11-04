import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  executeMutation,
  executeQuery,
  mutationRef,
  queryRef,
} from "firebase/data-connect";
import { getAuth, updateProfile } from "firebase/auth";
import {
  adminConnector,
  connectorFor,
  resetDatabase,
  seed,
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

type Me = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  signedUp: boolean;
} | null;

let alice: TestUser;
let bob: TestUser;

const upsertMe = (user: TestUser, vars: Record<string, unknown> = {}) =>
  executeMutation(mutationRef(user.dc, "UpsertMe", vars as never));
const getMe = async (user: TestUser) =>
  (
    await executeQuery(queryRef(user.dc, "GetMe"), {
      fetchPolicy: "SERVER_ONLY",
    })
  ).data as unknown as { user: Me };

async function setName(user: TestUser, name: string) {
  const auth = getAuth(user.dc.app);
  await updateProfile(auth.currentUser!, { displayName: name });
  // The new name reaches the token only when it is refreshed.
  await auth.currentUser!.getIdToken(true);
}

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
});

beforeEach(async () => {
  await resetDatabase();
  await setName(alice, "Alice A");
  await setName(bob, "Bob B");
});

describe("UpsertMe and GetMe", () => {
  it("writes the caller's row from the token, and GetMe returns only the caller's own", async () => {
    expect((await getMe(alice)).user).toBeNull();
    await upsertMe(alice);
    await upsertMe(bob);

    const aliceRow = (await getMe(alice)).user;
    expect(aliceRow).toMatchObject({
      id: alice.uid,
      email: "alice@example.test",
      name: "Alice A",
      signedUp: true,
    });
    const bobRow = (await getMe(bob)).user;
    expect(bobRow).toMatchObject({ id: bob.uid, email: "bob@example.test" });
    expect(bobRow?.id).not.toBe(alice.uid);
  });

  it("keeps one row when it runs twice, and stores the second run's names", async () => {
    await upsertMe(alice, { firstName: "Ali" });
    await upsertMe(alice, { firstName: "Alicia", lastName: "A" });

    const data = (await seed(`query { users { id firstName lastName } }`)) as {
      users: { id: string; firstName: string; lastName: string }[];
    };
    expect(data.users).toEqual([
      { id: alice.uid, firstName: "Alicia", lastName: "A" },
    ]);
  });

  it("marks an existing row with the caller's id as signed up", async () => {
    await seed(
      `mutation($id: String!, $email: String!) { user_insert(data: { id: $id, email: $email, signedUp: false }) }`,
      { id: alice.uid, email: alice.email },
    );
    await upsertMe(alice);
    expect((await getMe(alice)).user?.signedUp).toBe(true);
  });

  it("refuses names longer than 100 characters", async () => {
    await expect(
      upsertMe(alice, { firstName: "x".repeat(101) }),
    ).rejects.toThrow();
    await setName(alice, "n".repeat(101));
    await expect(upsertMe(alice)).rejects.toThrow();
    expect(
      ((await seed(`query { users { id } }`)) as { users: [] }).users,
    ).toEqual([]);
  });

  it("refuses a person who is not signed in", async () => {
    const out = signedOutConnector(appConfig);
    await expect(
      executeMutation(mutationRef(out, "UpsertMe", {} as never)),
    ).rejects.toThrow();
    await expect(executeQuery(queryRef(out, "GetMe"))).rejects.toThrow();
  });
});

describe("admin connector merge operations", () => {
  it("refuses FindContactByEmail and MergeContactIntoUser to a signed-in person", async () => {
    const dc = connectorFor(alice, adminConfig);
    await expect(
      executeQuery(
        queryRef(dc, "FindContactByEmail", {
          email: "dev@example.test",
          notId: alice.uid,
        } as never),
      ),
    ).rejects.toThrow();
    await expect(
      executeMutation(
        mutationRef(dc, "MergeContactIntoUser", {
          contactId: "spuser_d",
          userId: alice.uid,
        } as never),
      ),
    ).rejects.toThrow();
  });

  it("finds a contact by email as admin, never a signed-up person or the excluded id", async () => {
    await seed(
      `mutation { user_insertMany(data: [
        { id: "spuser_d", email: "dev@example.test", signedUp: false },
        { id: "spuser_e", email: "signed@example.test", signedUp: true }
      ]) }`,
    );
    const admin = adminConnector(adminConfig);
    const find = async (email: string, notId: string) =>
      (
        await admin.executeQuery<{ users: { id: string }[] }, unknown>(
          "FindContactByEmail",
          { email, notId },
        )
      ).data.users.map((u) => u.id);
    expect(await find("dev@example.test", alice.uid)).toEqual(["spuser_d"]);
    expect(await find("dev@example.test", "spuser_d")).toEqual([]);
    expect(await find("signed@example.test", alice.uid)).toEqual([]);
    expect(await find("nobody@example.test", alice.uid)).toEqual([]);
  });
});
