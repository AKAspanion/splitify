import { db } from "@/lib/db";
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

const getDevice = async (userId: string): Promise<AuthenticatorDevice[]> => {
  try {
    const deviceBlob = await db.authnDevice.findUnique({ where: { userId } });
    const devices = parseDevices((deviceBlob?.data || "").toString("utf8"));
    return devices || [];
  } catch (error) {
    console.trace(error);
    return [];
  }
};

const pushDevice = async (userId: string, device: AuthenticatorDevice) => {
  try {
    const deviceBlob = await getAuthnDevice(userId);
    let devices = parseDevices((deviceBlob?.data || "").toString("utf8"));
    if (devices && Array.isArray(devices)) {
      devices.push(device);
    } else {
      devices = [device];
    }

    const stringifiedDevices = JSON.stringify(devices);
    if (deviceBlob?.id) {
      await db.authnDevice.update({
        where: { id: deviceBlob.id },
        data: { data: Buffer.from(stringifiedDevices, "utf8") },
      });
    } else {
      await db.authnDevice.create({
        data: {
          data: Buffer.from(stringifiedDevices, "utf8"),
          user: { connect: { id: userId } },
        },
      });
    }
  } catch (error) {
    console.trace(error);
    return {};
  }
};

const getAuthnDevice = async (userId: string) => {
  try {
    return await db.authnDevice.findUnique({ where: { userId } });
  } catch (error) {
    return undefined;
  }
};

const DevicesService = { getDevice, pushDevice };

export default DevicesService;
