import { connectorConfig } from "@dataconnect/app";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import {
  connectDataConnectEmulator,
  getDataConnect,
  type DataConnect,
} from "firebase/data-connect";

const AUTH_EMULATOR = "http://127.0.0.1:9099";
const DATA_CONNECT_EMULATOR = { host: "127.0.0.1", port: 9399 };

const useEmulators = () =>
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let auth: Auth | undefined;
let dataConnect: DataConnect | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  // The NEXT_PUBLIC_ keys are written out in full so Next inlines them into the browser bundle.
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

/** Auth for the app: IndexedDB persistence in the browser, so the person is restored on the next visit. */
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const app = getFirebaseApp();
  // Node (tests, server rendering) has no IndexedDB.
  const created = initializeAuth(app, {
    persistence:
      typeof window === "undefined"
        ? inMemoryPersistence
        : indexedDBLocalPersistence,
  });
  if (useEmulators())
    connectAuthEmulator(created, AUTH_EMULATOR, { disableWarnings: true });
  auth = created;
  return created;
}

export function getDataConnectClient(): DataConnect {
  if (dataConnect) return dataConnect;
  const client = getDataConnect(getFirebaseApp(), connectorConfig);
  if (useEmulators())
    connectDataConnectEmulator(
      client,
      DATA_CONNECT_EMULATOR.host,
      DATA_CONNECT_EMULATOR.port,
    );
  dataConnect = client;
  return client;
}
