// Helpers for tests that run against the Firebase Auth and SQL Connect emulators (`yarn test:rules`).
import { connectorConfig } from "@dataconnect/app";
import { getApp, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  connectDataConnectEmulator,
  getDataConnect,
  type ConnectorConfig,
  type DataConnect,
} from "firebase/data-connect";
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from "firebase-admin/app";
import { getDataConnect as getAdminDataConnect } from "firebase-admin/data-connect";
import { EMULATOR_HOST, EMULATOR_PORTS } from "../../lib/firebase/emulators";

export type TestUser = { uid: string; email: string; dc: DataConnect };

const PROJECT_ID = "demo-splitify";
const AUTH_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??
  `${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`;
const DATA_CONNECT_HOST =
  process.env.DATA_CONNECT_EMULATOR_HOST ??
  `${EMULATOR_HOST}:${EMULATOR_PORTS.dataconnect}`;
const PASSWORD = "test-password-123";

// The admin SDK reads this to talk to the emulator, with no token, so `seed` bypasses `@auth`.
process.env.DATA_CONNECT_EMULATOR_HOST = DATA_CONNECT_HOST;

let instance = 0;

/** A SQL Connect handle for another connector (for example `expense`), signed in as the same person. */
export function connectorFor(
  user: TestUser,
  config: ConnectorConfig,
): DataConnect {
  const app = getApp(user.dc.app.name);
  const dc = getDataConnect(app, config);
  const [host, port] = DATA_CONNECT_HOST.split(":");
  connectDataConnectEmulator(dc, host, Number(port));
  return dc;
}

async function setEmailVerified(
  uid: string,
  emailVerified: boolean,
): Promise<void> {
  const response = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({ localId: uid, emailVerified }),
    },
  );
  if (!response.ok)
    throw new Error(
      `Could not set emailVerified on the Auth emulator: ${response.status}`,
    );
}

/**
 * Creates the user in the Auth emulator if missing, signs in on a Firebase app of its own with in-memory
 * persistence, and connects that app's SQL Connect to the emulator.
 */
export async function signInTestUser(
  name: "alice" | "bob" | "carol",
  opts: { emailVerified?: boolean } = {},
): Promise<TestUser> {
  const email = `${name}@example.test`;
  const app: FirebaseApp = initializeApp(
    { apiKey: "demo-api-key", projectId: PROJECT_ID },
    `test-${name}-${instance++}`,
  );
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, PASSWORD);
  } catch {
    credential = await createUserWithEmailAndPassword(auth, email, PASSWORD);
  }
  const uid = credential.user.uid;

  await setEmailVerified(uid, opts.emailVerified ?? true);
  // The ID token carries email_verified, so fetch a fresh one now that the flag is set.
  await credential.user.getIdToken(true);

  const dc = getDataConnect(app, connectorConfig);
  const [host, port] = DATA_CONNECT_HOST.split(":");
  connectDataConnectEmulator(dc, host, Number(port));
  return { uid, email, dc };
}

/** The admin SDK's handle for a connector: it runs named operations as the admin, which bypasses `@auth`. */
export function adminConnector(config: {
  connector: string;
  service: string;
  location: string;
}) {
  // The admin SDK caches its handle per app, so each connector gets an app of its own.
  const name = `test-admin-${config.connector}`;
  const app =
    getAdminApps().find((a) => a.name === name) ??
    initializeAdminApp({ projectId: PROJECT_ID }, name);
  return getAdminDataConnect(
    {
      serviceId: config.service,
      location: config.location,
      connector: config.connector,
    },
    app,
  );
}

function adminDataConnect() {
  return adminConnector(connectorConfig);
}

/** Runs GraphQL as the admin, which bypasses `@auth`. */
export async function seed(
  gql: string,
  variables?: Record<string, unknown>,
): Promise<unknown> {
  const result = await adminDataConnect().executeGraphql(
    gql,
    variables ? { variables } : undefined,
  );
  return result.data;
}

const TABLES_CHILD_FIRST = [
  "activity",
  "userSplit",
  "userPayment",
  "expense",
  "groupMember",
  "friendship",
  "pushToken",
  "feedback",
  "authnDevice",
  "group",
  "user",
];

/** Empties every table. */
export async function resetDatabase(): Promise<void> {
  for (const table of TABLES_CHILD_FIRST) {
    await seed(`mutation { ${table}_deleteMany(all: true) }`);
  }
}

export async function seedUser(u: {
  id: string;
  email: string;
  signedUp: boolean;
  name?: string;
}): Promise<void> {
  await seed(
    `mutation($id: String!, $email: String!, $signedUp: Boolean!, $name: String) {
      user_upsert(data: { id: $id, email: $email, signedUp: $signedUp, name: $name })
    }`,
    { id: u.id, email: u.email, signedUp: u.signedUp, name: u.name ?? null },
  );
}

export async function seedGroup(g: {
  id: string;
  title: string;
  memberIds: string[];
}): Promise<void> {
  await seed(
    `mutation($id: UUID!, $title: String!, $members: [GroupMember_Data!]!) {
      group_insert(data: { id: $id, title: $title })
      groupMember_insertMany(data: $members)
    }`,
    {
      id: g.id,
      title: g.title,
      members: g.memberIds.map((userId) => ({ groupId: g.id, userId })),
    },
  );
}

/** Makes `a` and `b` friends, in both directions. */
export async function seedFriendship(a: string, b: string): Promise<void> {
  await seed(
    `mutation($rows: [Friendship_Data!]!) { friendship_insertMany(data: $rows) }`,
    {
      rows: [
        { userId: a, friendId: b },
        { userId: b, friendId: a },
      ],
    },
  );
}

/** A SQL Connect handle for a connector with nobody signed in. */
export function signedOutConnector(config: ConnectorConfig): DataConnect {
  const app = initializeApp(
    { apiKey: "demo-api-key", projectId: PROJECT_ID },
    `test-signed-out-${instance++}`,
  );
  const dc = getDataConnect(app, config);
  const [host, port] = DATA_CONNECT_HOST.split(":");
  connectDataConnectEmulator(dc, host, Number(port));
  return dc;
}
