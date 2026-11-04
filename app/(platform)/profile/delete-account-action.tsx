"use client";

import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import Link from "next/link";

// Deleting an account is done on the /delete-account page, which says how.
export default function DeleteAccountAction() {
  return (
    <Link href="/delete-account">
      <Button variant="destructive">
        <Trash2Icon />
        <div>Delete account</div>
      </Button>
    </Link>
  );
}
