import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

export type PushDeps = {
  getToken(): Promise<string | null>;
  requestPermission(): Promise<NotificationPermission>;
  register(token: string, platform: "web" | "ios"): Promise<void>;
  remove(token: string): Promise<void>;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
};

/** Where this device's registered token is kept, so sign-out knows which one to remove. */
const TOKEN_KEY = "splitify.pushToken";
/** What the iOS wrapper sends as the event's detail when it could not get a token. */
const IOS_ERROR_DETAIL = "ERROR GET TOKEN";
/** The same limit `RegisterMyPushToken` enforces. */
const MAX_TOKEN_LENGTH = 4096;
const WORKER_PATH = "/sw.js";
const PUSH_APP_NAME = "splitify-push";

/** Logs the cause class only: never the token, and never an upstream message. */
function logFailure(what: string, error: unknown): void {
  console.error(
    `[push] ${what} failed: ${error instanceof Error ? error.name : "unknown"}`,
  );
}

function browserStorage(): PushDeps["storage"] {
  const noop = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  try {
    return typeof localStorage === "undefined" ? noop : localStorage;
  } catch {
    // Blocked site data.
    return noop;
  }
}

/** Storage can throw (private windows, blocked data): a push token is never worth failing over. */
function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Messaging needs the sender id, which is the project number inside the web app id (`1:<number>:web:<hash>`). */
function messagingConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  return {
    apiKey,
    projectId,
    appId,
    messagingSenderId: appId?.split(":")[1],
  };
}

function getMessagingApp(): FirebaseApp {
  const existing = getApps().find((app) => app.name === PUSH_APP_NAME);
  if (existing) return existing;
  return initializeApp(messagingConfig(), PUSH_APP_NAME);
}

/**
 * Registers the app's one service worker (offline shell and push). The worker cannot read the bundle's environment:
 * it takes the public web config from its own URL, and every caller must register that same URL, or each would
 * replace the other's worker.
 */
export function registerAppWorker(): Promise<ServiceWorkerRegistration> {
  const { apiKey, projectId, appId } = messagingConfig();
  const query = new URLSearchParams({
    apiKey: apiKey ?? "",
    projectId: projectId ?? "",
    appId: appId ?? "",
  });
  return navigator.serviceWorker.register(`${WORKER_PATH}?${query.toString()}`);
}

async function defaultGetToken(): Promise<string | null> {
  const { getMessaging, getToken } = await import("firebase/messaging");
  const serviceWorkerRegistration = await registerAppWorker();
  return (
    (await getToken(getMessaging(getMessagingApp()), {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    })) || null
  );
}

function withDefaults(deps?: Partial<PushDeps>): PushDeps {
  return {
    getToken: defaultGetToken,
    requestPermission: () => Notification.requestPermission(),
    // Loaded on use, so the unit tests (which inject their own) need no generated SDK.
    register: async (token, platform) => {
      const [{ registerMyPushToken }, { getDataConnectClient }] =
        await Promise.all([
          import("@dataconnect/app"),
          import("../firebase/app"),
        ]);
      await registerMyPushToken(getDataConnectClient(), { token, platform });
    },
    remove: async (token) => {
      const [{ removeMyPushToken }, { getDataConnectClient }] =
        await Promise.all([
          import("@dataconnect/app"),
          import("../firebase/app"),
        ]);
      await removeMyPushToken(getDataConnectClient(), { token });
    },
    storage: browserStorage(),
    ...deps,
  };
}

/** Asks for notification permission, gets this browser's token and registers it on the signed-in account. Never rejects. */
export async function registerWebPush(
  deps?: Partial<PushDeps>,
): Promise<"registered" | "denied" | "unsupported"> {
  if (
    typeof Notification === "undefined" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  )
    return "unsupported";
  const d = withDefaults(deps);
  try {
    if ((await d.requestPermission()) !== "granted") return "denied";
    const token = await d.getToken();
    if (!token) return "unsupported";
    await d.register(token, "web");
    safely(() => d.storage.setItem(TOKEN_KEY, token), undefined);
    return "registered";
  } catch (error) {
    logFailure("web registration", error);
    return "unsupported";
  }
}

/** Registers the token the iOS wrapper hands over in its `push-token` event. Returns the unsubscribe. */
export function listenForIosToken(deps?: Partial<PushDeps>): () => void {
  const d = withDefaults(deps);
  const onToken = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (
      typeof detail !== "string" ||
      detail === "" ||
      detail === IOS_ERROR_DETAIL ||
      detail.length > MAX_TOKEN_LENGTH
    )
      return;
    d.register(detail, "ios").then(
      () => safely(() => d.storage.setItem(TOKEN_KEY, detail), undefined),
      (error) => logFailure("ios registration", error),
    );
  };
  window.addEventListener("push-token", onToken);
  return () => window.removeEventListener("push-token", onToken);
}

/** Removes this device's token from the account, for sign-out. Never rejects: sign-out goes on whatever happens. */
export async function unregisterThisDevice(
  deps?: Partial<PushDeps>,
): Promise<void> {
  const d = withDefaults(deps);
  const token = safely(() => d.storage.getItem(TOKEN_KEY), null);
  if (!token) return;
  try {
    await d.remove(token);
  } catch (error) {
    logFailure("token removal", error);
  }
  safely(() => d.storage.removeItem(TOKEN_KEY), undefined);
}
