"use client";

import { Button } from "@/components/ui/button";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { useState } from "react";
import { toast } from "sonner";

const Authn = () => {
  const [registerLoading, setRegisterLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const register = async () => {
    try {
      setRegisterLoading(true);
      const resp = await fetch("/api/webauthn/generate-registration-options");

      let attResp;
      try {
        const { data } = await resp.json();

        attResp = await startRegistration(data);
      } catch (e) {
        setRegisterLoading(false);
        const error = e as Error;
        if (error.name === "InvalidStateError") {
          toast.error("You have already registred this device");
        } else {
          toast.error(error.message);
        }

        throw error;
      }

      const verificationResp = await fetch(
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
      setRegisterLoading(false);
      sessionStorage.setItem("verified", "false");
    } catch (e) {
      setVerifyLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  const verify = async () => {
    try {
      setVerifyLoading(true);
      const resp = await fetch("/api/webauthn/generate-authentication-options");

      let asseResp;
      try {
        const { data } = await resp.json();

        asseResp = await startAuthentication(data);
      } catch (e) {
        setVerifyLoading(false);
        const error = e as Error;
        throw new Error(error.message);
      }

      const verificationResp = await fetch(
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
      sessionStorage.setItem("verified", "false");
      setVerifyLoading(false);
    } catch (e) {
      setVerifyLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  const remove = async () => {
    try {
      setRemoveLoading(true);
      await fetch("/api/webauthn/devices/remove", {
        method: "POST",
      });
      toast.success("Authentication removed");
      setRemoveLoading(false);
      sessionStorage.setItem("verified", "false");
    } catch (error) {
      setRemoveLoading(false);
      sessionStorage.setItem("verified", "false");
    }
  };

  const disabled = registerLoading || verifyLoading || removeLoading;

  return (
    <div className="flex flex-wrap gap-6">
      <Button disabled={disabled} loading={registerLoading} onClick={register}>
        Register
      </Button>
      <Button disabled={disabled} loading={verifyLoading} onClick={verify}>
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
};

export default Authn;
