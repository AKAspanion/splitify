"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { startAuthentication } from "@simplewebauthn/browser";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const publicRoutes = ["/webauthn", "/profile", "/sign-in", "/sign-out"];

let prevPath = "";

export const Biometric = () => {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useUser();

  const begin = async () => {
    const verified = sessionStorage.getItem("verified") === "true";

    if (verified) {
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const deviceResp = await fetch("/api/webauthn/devices");
    const { data } = await deviceResp.json();

    if (data && data?.length < 1) {
      setOpen(false);
      setLoading(false);
      return;
    }

    setOpen(true);

    const resp = await fetch("/api/webauthn/generate-authentication-options");

    let asseResp;
    try {
      const { data } = await resp.json();

      asseResp = await startAuthentication(data);
    } catch (e) {
      setLoading(false);
      const error = e as Error;
      throw new Error(error.message);
    }

    const verificationResp = await fetch(
      "/api/webauthn/verify-authentication",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(asseResp),
      },
    );

    const { data: verificationJSON } = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      setOpen(false);
      setLoading(false);
      toast.success("Verified");
      sessionStorage.setItem("verified", "true");
    }
  };

  const onVerify = async () => {
    try {
      await begin();
    } catch (error) {
      setLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  useEffect(() => {
    if (
      (user?.id,
      pathname &&
        prevPath !== pathname &&
        !publicRoutes.some((r) => pathname.includes(r)))
    ) {
      prevPath = pathname;
      onVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, pathname]);

  return (
    <Dialog open={open}>
      <DialogContent
        closable={false}
        className="max-w-[90vw] min-w-[90vw] sm:min-w-fit w-fit"
      >
        <DialogHeader>
          <DialogTitle>
            <div className="py-1">Authentication Required</div>
          </DialogTitle>
        </DialogHeader>
        <div>
          You have registered for biometric authentication. <br />
          Please provide verification.
        </div>
        <DialogFooter>
          <div className="w-full flex gap-4 items-center justify-end">
            <Link href="/webauthn/register" onClick={() => setOpen(false)}>
              <Button type="button" variant="outline" disabled={loading}>
                Not able to proceed?
              </Button>
            </Link>
            <Button loading={loading} title="" type="button" onClick={onVerify}>
              {loading ? "Verifying" : "Verify"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
