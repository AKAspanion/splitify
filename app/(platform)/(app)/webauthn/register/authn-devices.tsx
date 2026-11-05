"use client";

import { useEffect, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Fingerprint } from "lucide-react";
import { callFunction } from "@/lib/functions/call";

type AuthnDevicesProps = {
  /** Changes when the devices changed: the list loads them again. */
  version?: number;
};

const AuthnDevices = ({ version = 0 }: AuthnDevicesProps) => {
  const [devicesCount, setDevicesCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    callFunction("/api/webauthn/devices")
      .then((response) => response.json())
      .then(({ data }: { data?: unknown[] }) => {
        if (!cancelled) setDevicesCount(data?.length ?? 0);
      })
      .catch(() => {
        if (!cancelled) setDevicesCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (devicesCount === null) return null;

  const deviceText = devicesCount === 0 ? "device not" : "device";

  return (
    <div className="py-6">
      <Alert>
        <Fingerprint className="h-4 w-4" />
        <AlertTitle> Authenticator {deviceText} found</AlertTitle>
      </Alert>
    </div>
  );
};

export default AuthnDevices;
