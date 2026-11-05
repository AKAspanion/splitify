import { upsertMe } from "@dataconnect/app";
import {
  applyActionCode,
  confirmPasswordReset,
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
  verifyPasswordResetCode,
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

let completing: Promise<boolean> | undefined;

/**
 * After the page loads back from Google: when the marker is set, reads the redirect result, runs UpsertMe for the
 * signed-in person and clears the marker. Resolves true when a Google sign-in completed, false when none was in
 * flight or the person came back without signing in. Rejects with Firebase's error, marker cleared. When UpsertMe
 * fails, signs the person out of Firebase Auth before rejecting with UpsertMe's error, so nobody stays signed in
 * without their User row.
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
        await firebaseSignOut(getFirebaseAuth()).catch((signOutError) =>
          console.warn(
            "Google sign-in: signing out after UpsertMe failed did not finish",
            signOutError instanceof Error
              ? signOutError.name
              : typeof signOutError,
          ),
        );
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

/** The email a reset code belongs to. Rejects with Firebase's error (expired, invalid, disabled user). */
export async function readPasswordResetEmail(code: string): Promise<string> {
  return await verifyPasswordResetCode(getFirebaseAuth(), code);
}

/** Sets the new password with the reset code. Rejects with Firebase's error. */
export async function resetPassword(
  code: string,
  newPassword: string,
): Promise<void> {
  await confirmPasswordReset(getFirebaseAuth(), code, newPassword);
}

/**
 * Applies a verify-email code; when someone is signed in on this browser, reloads them and refreshes their token so
 * the banner clears. Rejects with Firebase's error when the code isn't applied. Once it is, the code is spent, so a
 * failed reload is logged and not thrown: the person's email is verified, and the next reload shows it.
 */
export async function verifyEmailWithCode(code: string): Promise<void> {
  await applyActionCode(getFirebaseAuth(), code);
  try {
    await reloadEmailVerified();
  } catch (error) {
    console.warn(
      "Verify email: the code was applied but reloading the signed-in person failed",
      error instanceof Error ? error.name : typeof error,
    );
  }
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
