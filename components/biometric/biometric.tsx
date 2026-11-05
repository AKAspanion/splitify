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
import { useAuth } from "@/hooks/use-auth";
import { callFunction } from "@/lib/functions/call";

const publicRoutes = ["/webauthn", "/profile", "/sign-in", "/sign-out"];

let prevPath = "";

export const Biometric = () => {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const isVerified = () => sessionStorage.getItem("verified") === "true";

  // Once the account's devices are known: asks for a passkey when it has one. It runs as the devices request's
  // callback, so a path change can start verification from an effect without setting state synchronously there.
  const verifyWithDevices = async (deviceResp: Response) => {
    const { data } = await deviceResp.json();

    if (data && data?.length < 1) {
      setOpen(false);
      setLoading(false);
      sessionStorage.setItem("verified", "true");
      return;
    }

    setLoading(true);
    setOpen(true);

    const resp = await callFunction(
      "/api/webauthn/generate-authentication-options",
    );

    let asseResp;
    try {
      const { data } = await resp.json();

      asseResp = await startAuthentication({ optionsJSON: data });
    } catch (e) {
      setLoading(false);
      const error = e as Error;
      throw new Error(error.message);
    }

    const verificationResp = await callFunction(
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

  const onVerifyFailed = () => {
    setLoading(false);
    sessionStorage.setItem("verified", "false");
  };

  const verify = () =>
    callFunction("/api/webauthn/devices")
      .then(verifyWithDevices)
      .catch(onVerifyFailed);

  // The Verify button: shows it's working at once, while the devices are fetched.
  const onVerify = async () => {
    if (isVerified()) {
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    await verify();
  };

  useEffect(() => {
    if (
      user?.uid &&
      pathname &&
      prevPath !== pathname &&
      !publicRoutes.some((r) => pathname.includes(r))
    ) {
      prevPath = pathname;
      // Already verified this session: the dialog is closed and idle, so there is nothing to change.
      if (!isVerified()) void verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, pathname]);

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
        <div className="text-center sm:text-left">
          You have registered for biometric authentication. <br />
          Please provide verification.
        </div>
        <DialogFooter>
          <div className="w-full flex gap-4 items-center justify-between sm:justify-end">
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
