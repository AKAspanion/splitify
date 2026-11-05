"use client";

import useConfirm from "@/components/confirm/useConfirm";
import { Button } from "@/components/ui/button";
import { OnlineOnly } from "@/components/offline/online-only";
import { markSignOutIntended } from "@/lib/auth-redirect";
import { toUserMessage } from "@/lib/data/errors";
import { getFirebaseApp, getFirebaseAuth } from "@/lib/firebase/app";
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

const REGION = "asia-south1";
const FUNCTIONS_EMULATOR = { host: "127.0.0.1", port: 5001 };

let functionsClient: ReturnType<typeof getFunctions> | undefined;

function deleteMyAccount() {
  if (!functionsClient) {
    functionsClient = getFunctions(getFirebaseApp(), REGION);
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true")
      connectFunctionsEmulator(
        functionsClient,
        FUNCTIONS_EMULATOR.host,
        FUNCTIONS_EMULATOR.port,
      );
  }
  return httpsCallable<undefined, { ok: true }>(
    functionsClient,
    "deleteMyAccount",
  )();
}

export default function DeleteAccountAction() {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = await getConfirmation({
      title: "Delete your account?",
      subtitle:
        "Your shared expenses stay, shown as Deleted user. This can't be undone.",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteMyAccount();
    } catch (error) {
      toast.error(toUserMessage(error));
      setDeleting(false);
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
            onClick={handleDelete}
            disabled={deleting || offline}
          >
            <Trash2Icon />
            <div>{deleting ? "Deleting account" : "Delete account"}</div>
          </Button>
        )}
      </OnlineOnly>
    </div>
  );
}
