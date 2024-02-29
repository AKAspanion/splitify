import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

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

const AuthnRegister = async () => {
  return (
    <div>
      <AuthnActions />
      <AuthnDevices />
    </div>
  );
};

export default AuthnRegister;
