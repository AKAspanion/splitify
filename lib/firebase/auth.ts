import { upsertMe } from "@dataconnect/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { markSignOutIntended } from "../auth-redirect";
import { unregisterThisDevice } from "../push/register";
import { getDataConnectClient, getFirebaseAuth } from "./app";

/** Writes the person's own row from their token. Every sign-in function runs it once the Firebase user is set. */
async function upsertCurrentUser(): Promise<void> {
  markSignOutIntended(false);
  await upsertMe(getDataConnectClient());
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  await upsertCurrentUser();
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

/** Signs out this browser only, after removing this device's push token while the sign-in still authorises it. */
export async function signOut(): Promise<void> {
  markSignOutIntended(true);
  try {
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
