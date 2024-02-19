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

const publicRoutes = ["/webauthn", "/profile"];

let prevPath = "";

export const Biometric = () => {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
      pathname &&
      prevPath !== pathname &&
      !pathname.includes(publicRoutes.join("**"))
    ) {
      prevPath = pathname;
      onVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-[90vw] min-w-[90vw] sm:min-w-fit w-fit">
        <DialogHeader>
          <DialogTitle>
            <div className="py-1">Authentication</div>
          </DialogTitle>
        </DialogHeader>
        <div>
          You have opted for biometric authntication. Please wait for
          verification.
        </div>
        <DialogFooter>
          <Link href="/webauthn/register">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Not able to verify?
            </Button>
          </Link>
          <Button loading={loading} title="" type="button" onClick={onVerify}>
            {loading ? "Verifying" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
