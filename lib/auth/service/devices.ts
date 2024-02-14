import { db } from "@/lib/db";
import { User } from "@prisma/client";
import type { AuthenticatorDevice } from "@simplewebauthn/types";

const parseDevices = (obj: string): AuthenticatorDevice[] => {
  try {
    if (!obj) return [];
    const parsed: AuthenticatorDevice[] = JSON.parse(obj);

    return parsed?.map((parsedobj) => {
      const unit8Values = Object.entries(parsedobj.credentialPublicKey).map(
        ([_, v]) => v
      );
      const unit32Values = Object.entries(parsedobj.credentialID).map(
        ([_, v]) => v
      );
      const credentialPublicKey = new Uint8Array(unit8Values);
      const credentialID = new Uint8Array(unit32Values);
      return {
        credentialPublicKey,
        credentialID,
        counter: parsedobj.counter,
        transports: parsedobj.transports,
      } as AuthenticatorDevice;
    });
  } catch (error) {
    console.trace(error);
    console.error("Parsing failed");
    return [];
  }
};

const getDevice = async (user: User): Promise<AuthenticatorDevice[]> => {
  try {
    const devices = parseDevices((user?.devices || "").toString("utf8"));
    return devices || [];
  } catch (error) {
    console.trace(error);
    return [];
  }
};

const pushDevice = async (user: User, device: AuthenticatorDevice) => {
  try {
    let devices = parseDevices((user?.devices || "").toString("utf8"));
    if (devices && Array.isArray(devices)) {
      devices.push(device);
    } else {
      devices = [device];
    }
    const stringifiedDevices = JSON.stringify(devices);
    await db.user.update({
      where: { id: user.id },
      data: { devices: Buffer.from(stringifiedDevices, "utf8") },
    });
  } catch (error) {
    console.trace(error);
    return {};
  }
};

const DevicesService = { getDevice, pushDevice };

export default DevicesService;
