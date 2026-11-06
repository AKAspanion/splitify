"use client";

import { Button } from "@/components/ui/button";
import { OnlineOnly } from "@/components/offline/online-only";
import { markSignOutIntended } from "@/lib/auth-redirect";
import { toUserMessage } from "@/lib/data/errors";
import { signOut } from "@/lib/firebase/auth";
import { getFirebaseApp, getFirebaseAuth } from "@/lib/firebase/app";
import { EMULATOR_HOST, EMULATOR_PORTS } from "@/lib/firebase/emulators";
import { signOut as firebaseSignOut } from "firebase/auth";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAccountDialog } from "./delete-account-dialog";
import {
  deleteAccountFailure,
  SIGN_IN_AGAIN_PATH,
} from "./delete-account-failure";

const REGION = "asia-south1";

let functionsClient: ReturnType<typeof getFunctions> | undefined;

function deleteMyAccount() {
  if (!functionsClient) {
    functionsClient = getFunctions(getFirebaseApp(), REGION);
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true")
      connectFunctionsEmulator(
        functionsClient,
        EMULATOR_HOST,
        EMULATOR_PORTS.functions,
      );
  }
  return httpsCallable<undefined, { ok: true }>(
    functionsClient,
    "deleteMyAccount",
  )();
}

export default function DeleteAccountAction() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // The function wants a recent sign-in. Signed out first, so the sign-in screen shows its form rather than going
  // straight on to `next`; it then brings the person back here to finish.
  const signInAgain = async () => {
    try {
      await signOut({ toSignIn: true });
    } catch (error) {
      toast.error(toUserMessage(error));
      setDeleting(false);
      return;
    }
    router.replace(SIGN_IN_AGAIN_PATH);
  };

  const handleDelete = async () => {
    setConfirming(false);
    setDeleting(true);
    try {
      await deleteMyAccount();
    } catch (error) {
      const failure = deleteAccountFailure(error);
      toast.error(failure.message);
      if (failure.signInAgain) await signInAgain();
      else setDeleting(false);
      return;
    }
    // The Auth user is gone, so this browser's sign-in is too: leave home first, then clear it locally.
    markSignOutIntended(true);
    router.push("/");
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch {
      // The account is already deleted; the stale local session ends on the next token refresh.
    }
  };

  return (
    <div className="flex flex-col">
      <OnlineOnly>
        {(offline) => (
          <Button
            variant="destructive"
            onClick={() => setConfirming(true)}
            disabled={deleting || offline}
          >
            <Trash2Icon />
            <div>{deleting ? "Deleting account" : "Delete account"}</div>
          </Button>
        )}
      </OnlineOnly>
      <DeleteAccountDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
