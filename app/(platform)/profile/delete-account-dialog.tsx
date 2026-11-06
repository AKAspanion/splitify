"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const DELETE_WORD = "DELETE";

// Mounted only while the dialog is open, so the typed text starts empty every time it opens.
function DeleteAccountForm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed === DELETE_WORD;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (matches) onConfirm();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="delete-account-confirm" className="text-sm font-medium">
          Type {DELETE_WORD} to confirm
        </label>
        <Input
          id="delete-account-confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={!matches}>
          Delete account
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DeleteAccountDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            Your shared expenses stay, shown as Deleted user. This can&apos;t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DeleteAccountForm onCancel={onCancel} onConfirm={onConfirm} />
      </DialogContent>
    </Dialog>
  );
}
