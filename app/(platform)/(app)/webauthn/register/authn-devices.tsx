import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Fingerprint } from "lucide-react";

const AuthnDevices = async () => {
  const { userId } = auth();
  const devicesCount = await db.authnDevice.count({
    where: { userId: userId || "null" },
  });

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
