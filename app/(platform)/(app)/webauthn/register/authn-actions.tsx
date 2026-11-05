"use client";

import { Button } from "@/components/ui/button";
import { OnlineOnly } from "@/components/offline/online-only";
import { callFunction } from "@/lib/functions/call";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { useState } from "react";
import { toast } from "sonner";

type AuthnActionsProps = {
  /** Called after the person's devices changed, so the list can load again. */
  onChange: () => void;
};

const failure = (error: unknown) =>
  error instanceof Error ? error.message : "Oh no, something went wrong!";

const AuthnActions = ({ onChange }: AuthnActionsProps) => {
  const [registerLoading, setRegisterLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const register = async () => {
    try {
      setRegisterLoading(true);
      const resp = await callFunction(
        "/api/webauthn/generate-registration-options",
      );
      const { data } = await resp.json();

      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: data });
      } catch (e) {
        const error = e as Error;
        if (error.name === "InvalidStateError") {
          toast.error("You have already registred this device");
        } else {
          toast.error(error.message);
        }
        return;
      }

      const verificationResp = await callFunction(
        "/api/webauthn/verify-registration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attResp),
        },
      );

      const { data: verificationJSON } = await verificationResp.json();

      if (verificationJSON && verificationJSON.verified) {
        toast.success("Authenticator registered!");
      } else {
        toast.error("Oh no, something went wrong!");
      }
      onChange();
    } catch (e) {
      toast.error(failure(e));
    } finally {
      setRegisterLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  const verify = async () => {
    try {
      setVerifyLoading(true);
      const resp = await callFunction(
        "/api/webauthn/generate-authentication-options",
      );
      const { data } = await resp.json();

      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: data });
      } catch (e) {
        toast.error((e as Error).message);
        return;
      }

      const verificationResp = await callFunction(
        "/api/webauthn/verify-authentication",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(asseResp),
        },
      );

      const { data: verificationJSON } = await verificationResp.json();

      if (verificationJSON && verificationJSON.verified) {
        toast.success("Authentication successfull!");
      } else {
        toast.error("Oh no, something went wrong!");
      }
    } catch (e) {
      toast.error(failure(e));
    } finally {
      setVerifyLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  const remove = async () => {
    try {
      setRemoveLoading(true);
      await callFunction("/api/webauthn/devices/remove", { method: "POST" });
      toast.success("Authentication removed");
      onChange();
    } catch (e) {
      toast.error(failure(e));
    } finally {
      setRemoveLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  const busy = registerLoading || verifyLoading || removeLoading;

  return (
    <div className="flex flex-col gap-2">
      <OnlineOnly>
        {(offline) => {
          const disabled = busy || offline;
          return (
            <div className="flex flex-wrap gap-6">
              <Button
                disabled={disabled}
                loading={registerLoading}
                onClick={register}
              >
                Register
              </Button>
              <Button
                disabled={disabled}
                loading={verifyLoading}
                onClick={verify}
              >
                Verify
              </Button>
              <Button
                disabled={disabled}
                loading={removeLoading}
                variant="destructive"
                onClick={remove}
              >
                Remove authentication
              </Button>
            </div>
          );
        }}
      </OnlineOnly>
    </div>
  );
};

export default AuthnActions;
