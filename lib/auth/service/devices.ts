import { db } from "@/lib/db";
import type { WebAuthnCredential } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

/**
 * How a device is stored in `AuthnDevice.data`: the shape SimpleWebAuthn 9 called `AuthenticatorDevice`, with each
 * byte array serialised as an index-keyed object. It is kept as is, so passkeys registered before the upgrade still
 * work, and converted to SimpleWebAuthn's `WebAuthnCredential` on the way in and out.
 */
type StoredDevice = {
  credentialPublicKey: Uint8Array<ArrayBuffer>;
  credentialID: Uint8Array<ArrayBuffer>;
  counter: number;
  transports?: WebAuthnCredential["transports"];
};

const toCredential = (device: StoredDevice): WebAuthnCredential => ({
  id: isoBase64URL.fromBuffer(device.credentialID),
  publicKey: device.credentialPublicKey,
  counter: device.counter,
  transports: device.transports,
});

const toStoredDevice = (credential: WebAuthnCredential): StoredDevice => ({
  credentialPublicKey: credential.publicKey,
  credentialID: isoBase64URL.toBuffer(credential.id),
  counter: credential.counter,
  transports: credential.transports,
});

const parseDevices = (obj: string): StoredDevice[] => {
  try {
    if (!obj) return [];
    const parsed: StoredDevice[] = JSON.parse(obj);

    return parsed?.map((parsedobj) => {
      const unit8Values = Object.entries(parsedobj.credentialPublicKey).map(
        ([_, v]) => v,
      );
      const unit32Values = Object.entries(parsedobj.credentialID).map(
        ([_, v]) => v,
      );
      const credentialPublicKey = new Uint8Array(unit8Values);
      const credentialID = new Uint8Array(unit32Values);
      return {
        credentialPublicKey,
        credentialID,
        counter: parsedobj.counter,
        transports: parsedobj.transports,
      } as StoredDevice;
    });
  } catch (error) {
    console.trace(error);
    console.error("Parsing failed");
    return [];
  }
};

const getDevice = async (userId: string): Promise<WebAuthnCredential[]> => {
  try {
    const deviceBlob = await db.authnDevice.findUnique({ where: { userId } });
    const devices = parseDevices(new TextDecoder().decode(deviceBlob?.data));
    return (devices || []).map(toCredential);
  } catch (error) {
    console.trace(error);
    return [];
  }
};

const pushDevice = async (userId: string, credential: WebAuthnCredential) => {
  const device = toStoredDevice(credential);
  try {
    const deviceBlob = await getAuthnDevice(userId);
    let devices = parseDevices(new TextDecoder().decode(deviceBlob?.data));
    if (devices && Array.isArray(devices)) {
      devices.push(device);
    } else {
      devices = [device];
    }

    const stringifiedDevices = JSON.stringify(devices);
    if (deviceBlob?.id) {
      await db.authnDevice.update({
        where: { id: deviceBlob.id },
        data: { data: new TextEncoder().encode(stringifiedDevices) },
      });
    } else {
      await db.authnDevice.create({
        data: {
          data: new TextEncoder().encode(stringifiedDevices),
          user: { connect: { id: userId } },
        },
      });
    }
  } catch (error) {
    console.trace(error);
    return {};
  }
};

const removeDevices = async (userId: string) => {
  try {
    await db.authnDevice.deleteMany({ where: { userId } });
    return true;
  } catch (error) {
    return false;
  }
};

const getAuthnDevice = async (userId: string) => {
  try {
    return await db.authnDevice.findUnique({ where: { userId } });
  } catch (error) {
    return undefined;
  }
};

const DevicesService = { getDevice, pushDevice, removeDevices };

export default DevicesService;
