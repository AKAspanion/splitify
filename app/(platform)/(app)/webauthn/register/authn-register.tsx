"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useState } from "react";

const AuthnActions = dynamic(() => import("./authn-actions"), {
  loading: () => (
    <div className="flex flex-wrap gap-6">
      <Skeleton className="w-[88px] h-10 rounded-md" />
      <Skeleton className="w-[72px] h-10 rounded-md" />
      <Skeleton className="w-[186px] h-10 rounded-md" />
    </div>
  ),
});

const AuthnDevices = dynamic(() => import("./authn-devices"), {
  loading: () => (
    <div className="my-6">
      <Skeleton className="w-[220px] h-5 rounded-md" />
    </div>
  ),
});

const AuthnRegister = () => {
  // The actions change the devices; bumping this makes the list load them again.
  const [version, setVersion] = useState(0);

  return (
    <div>
      <AuthnActions onChange={() => setVersion((v) => v + 1)} />
      <AuthnDevices version={version} />
    </div>
  );
};

export default AuthnRegister;
