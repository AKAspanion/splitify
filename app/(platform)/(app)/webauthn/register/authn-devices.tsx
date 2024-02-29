import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

const AuthnDevices = async () => {
  const { userId } = auth();
  const devicesCount = await db.authnDevice.count({
    where: { userId: userId || "null" },
  });

  const deviceText = devicesCount === 1 ? "device" : "devices";

  return (
    <div className="py-6">
      {devicesCount} Authenticator {deviceText} found
    </div>
  );
};

export default AuthnDevices;
