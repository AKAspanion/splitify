import { upsertMe } from "@dataconnect/app";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { clearSavedCache } from "../offline/persist";
import { markSignOutIntended } from "../auth-redirect";
import { unregisterThisDevice } from "../push/register";
import { getDataConnectClient, getFirebaseAuth } from "./app";

/** Writes the person's own row from their token. Every sign-in function runs it once the Firebase user is set. */
async function upsertCurrentUser(): Promise<void> {
  markSignOutIntended(false);
  await upsertMe(getDataConnectClient());
}

/**
 * Set in this tab's sessionStorage just before Google sign-in leaves the page, and cleared once the page has loaded
 * back and the sign-in is finished. sessionStorage is per tab and survives the round trip to Google.
 */
const GOOGLE_REDIRECT_MARKER = "splitify:google-redirect";

/** This tab's sessionStorage, or null where there is none (Node) or the browser blocks it. */
function tabStorage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch (error) {
    console.warn(
      "Google sign-in: sessionStorage is unavailable",
      error instanceof Error ? error.name : typeof error,
    );
    return null;
  }
}

/** Leaves the page for Google's sign-in. Sets the redirect marker first; resolves only if the redirect fails to start. */
export async function signInWithGoogle(): Promise<void> {
  const storage = tabStorage();
  // Firebase keeps the redirect's own state in sessionStorage too, so without it the sign-in couldn't finish. The
  // code is Firebase's own for this case, so the form says Google sign-in isn't available here.
  if (!storage)
    throw Object.assign(new Error("Google sign-in needs sessionStorage"), {
      code: "auth/web-storage-unsupported",
    });
  storage.setItem(GOOGLE_REDIRECT_MARKER, "1");
  try {
    await signInWithRedirect(getFirebaseAuth(), new GoogleAuthProvider());
  } catch (error) {
    storage.removeItem(GOOGLE_REDIRECT_MARKER);
    throw error;
  }
}

/** True while a Google redirect this tab started hasn't been completed. False where there is no sessionStorage. */
export function googleRedirectPending(): boolean {
  return tabStorage()?.getItem(GOOGLE_REDIRECT_MARKER) != null;
}

/** Forgets a Google redirect this tab started, for a page the browser restored after the person left for Google. */
export function clearGoogleRedirect(): void {
  tabStorage()?.removeItem(GOOGLE_REDIRECT_MARKER);
}

/** Where indexedDBLocalPersistence keeps the signed-in user: Firebase Auth's own names. */
const AUTH_DB = "firebaseLocalStorageDb";
const AUTH_STORE = "firebaseLocalStorage";
/** The keys Firebase Auth saves a user under, in IndexedDB and in web storage: `<prefix><apiKey>:<appName>`. */
const SAVED_USER_PREFIXES = ["firebase:authUser:", "firebase:redirectUser:"];

function isSavedUserKey(key: unknown): key is string {
  return (
    typeof key === "string" &&
    SAVED_USER_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

/** Removes Firebase Auth's saved users from one web storage; does nothing where the browser has none or blocks it. */
function removeSavedUsers(name: "localStorage" | "sessionStorage"): void {
  let storage: Storage | undefined;
  try {
    storage = globalThis[name];
  } catch {
    return;
  }
  if (!storage) return;
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (isSavedUserKey(key)) storage.removeItem(key);
  }
}

/**
 * Deletes Firebase Auth's saved users from its IndexedDB store, record by record, so its own open connection isn't
 * blocked, as deleting the database would be. Creates no database when there is none.
 */
function removeSavedUsersFromIndexedDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return resolve();
    const open = indexedDB.open(AUTH_DB);
    // No database yet, so nothing is saved: abort the upgrade, and the open fails without creating one.
    open.onupgradeneeded = () => open.transaction?.abort();
    open.onerror = () =>
      open.error?.name === "AbortError" ? resolve() : reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(AUTH_STORE)) {
        db.close();
        return resolve();
      }
      const tx = db.transaction(AUTH_STORE, "readwrite");
      const cursor = tx.objectStore(AUTH_STORE).openCursor();
      cursor.onsuccess = () => {
        const current = cursor.result;
        if (!current) return;
        if (isSavedUserKey(current.key)) current.delete();
        current.continue();
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}

/**
 * Clears what Firebase Auth saved of the signed-in user, for when its own sign-out failed: without it the next load
 * restores the user. Never rejects: a failure is logged with its class.
 */
async function clearSavedSignIn(): Promise<void> {
  try {
    removeSavedUsers("localStorage");
    removeSavedUsers("sessionStorage");
    await removeSavedUsersFromIndexedDb();
  } catch (error) {
    console.warn(
      "Google sign-in: clearing the saved sign-in after sign-out failed did not finish",
      error instanceof Error ? error.name : typeof error,
    );
  }
}

let completing: Promise<boolean> | undefined;

/**
 * After the page loads back from Google: when the marker is set, reads the redirect result, runs UpsertMe for the
 * signed-in person and clears the marker. Resolves true when a Google sign-in completed, false when none was in
 * flight or the person came back without signing in. Rejects with Firebase's error, marker cleared. When UpsertMe
 * fails, signs the person out of Firebase Auth before rejecting with UpsertMe's error, so nobody stays signed in
 * without their User row; when that sign-out fails too, clears the user Firebase Auth saved, so the next load
 * doesn't restore them.
 *
 * A call made while another is still running shares its result, so UpsertMe runs once even when React runs the
 * calling effect twice.
 */
export function completeGoogleSignIn(): Promise<boolean> {
  if (completing) return completing;
  const storage = tabStorage();
  if (!storage || storage.getItem(GOOGLE_REDIRECT_MARKER) == null)
    return Promise.resolve(false);
  completing = (async () => {
    try {
      const result = await getRedirectResult(getFirebaseAuth());
      if (!result) return false;
      try {
        await upsertCurrentUser();
      } catch (error) {
        // Firebase Auth's sign-out only: the app's signOut also clears caches and push tokens nobody has yet.
        try {
          await firebaseSignOut(getFirebaseAuth());
        } catch (signOutError) {
          console.warn(
            "Google sign-in: signing out after UpsertMe failed did not finish",
            signOutError instanceof Error
              ? signOutError.name
              : typeof signOutError,
          );
          // Firebase drops the user from memory before it fails to delete the saved copy, which the next load restores.
          await clearSavedSignIn();
        }
        throw error;
      }
      return true;
    } finally {
      storage.removeItem(GOOGLE_REDIRECT_MARKER);
      completing = undefined;
    }
  })();
  return completing;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  await upsertCurrentUser();
}

/** Creates the account, sends the verification email and runs `UpsertMe` with the name on the token. */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await updateProfile(credential.user, { displayName: name.trim() });
  await sendEmailVerification(credential.user);
  // The new name reaches the token only when it is refreshed.
  await credential.user.getIdToken(true);
  await upsertCurrentUser();
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

/**
 * Signs out this browser only: deletes the person's saved cache, then removes this device's push token while the
 * sign-in still authorises it.
 */
export async function signOut(): Promise<void> {
  markSignOutIntended(true);
  try {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (uid) await clearSavedCache(uid);
    await unregisterThisDevice();
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    markSignOutIntended(false);
    throw error;
  }
}

export function onUserChanged(
  cb: (
    user: { uid: string; email: string; emailVerified: boolean } | null,
  ) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (user: User | null) =>
    cb(
      user
        ? {
            uid: user.uid,
            email: user.email ?? "",
            emailVerified: user.emailVerified,
          }
        : null,
    ),
  );
}

/** Sends the verification email to the signed-in person. Throws when nobody is signed in. */
export async function sendVerificationEmail(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  await sendEmailVerification(user);
}

/** Reloads the signed-in person and refreshes their token, so a verification done elsewhere shows. True once verified. */
export async function reloadEmailVerified(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
}
