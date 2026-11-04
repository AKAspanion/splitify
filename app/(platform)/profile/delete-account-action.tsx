"use client";

import { deleteAccount } from "@/actions/delete-account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAction } from "@/hooks/use-action";
import { useClerk } from "@clerk/nextjs";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function DeleteAccountAction() {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const { execute, loading } = useAction(deleteAccount, {
    onSuccess: () => {
      signOut(() => router.push("/"));
    },
    onError: (error, debug) => {
      console.error(error, debug);
      toast.error(error);
    },
  });

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2Icon />
        <div>Delete account</div>
      </Button>
      <Dialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your name, email, picture, passkey, friends and feedback are
              removed. Expenses you share with others stay in their groups under
              &quot;Deleted user&quot;. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => execute({})}
            >
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
