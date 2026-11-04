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
  seedUser,
  signInTestUser,
  type TestUser,
} from "../test-utils/emulator";

const adminConfig = {
  connector: "admin",
  service: "splitify",
  location: "asia-south1",
};
let alice: TestUser;

beforeAll(async () => {
  alice = await signInTestUser("alice");
});

beforeEach(async () => {
  await resetDatabase();
  await seedUser({ id: alice.uid, email: alice.email, signedUp: true });
});

describe("admin connector devices", () => {
  it("refuses GetDevices and SaveDevices to a signed-in person", async () => {
    const dc = connectorFor(alice, adminConfig);
    await expect(
      executeQuery(queryRef(dc, "GetDevices", { userId: alice.uid } as never)),
    ).rejects.toThrow();
    await expect(
      executeMutation(
        mutationRef(dc, "SaveDevices", {
          userId: alice.uid,
          devices: [{ id: "x" }],
        } as never),
      ),
    ).rejects.toThrow();
  });

  it("saves devices as admin and reads the same JSON back, null when none", async () => {
    const admin = adminConnector(adminConfig);
    const read = async () =>
      (
        await admin.executeQuery<
          { authnDevice: { devices: unknown } | null },
          unknown
        >("GetDevices", { userId: alice.uid })
      ).data;
    expect(await read()).toEqual({ authnDevice: null });

    const devices = [
      { credentialID: "abc", counter: 3, transports: ["internal"] },
    ];
    await admin.executeMutation("SaveDevices", { userId: alice.uid, devices });
    expect(await read()).toEqual({ authnDevice: { devices } });

    const replaced = [{ credentialID: "def", counter: 1 }];
    await admin.executeMutation("SaveDevices", {
      userId: alice.uid,
      devices: replaced,
    });
    expect(await read()).toEqual({ authnDevice: { devices: replaced } });
  });
});
