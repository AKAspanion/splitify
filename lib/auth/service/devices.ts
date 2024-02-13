import type { AuthenticatorDevice } from "@simplewebauthn/types";
import { readFile, writeFile } from "fs/promises";

type DevicesStore = Record<string, AuthenticatorDevice[]>;

const Service = {
  async getDevices(store: DevicesStore): Promise<DevicesStore> {
    try {
      return store;
    } catch (error) {
      console.trace(error);
      return {};
    }
  },
  async getDevice(
    store: DevicesStore,
    userId: string
  ): Promise<AuthenticatorDevice[]> {
    try {
      return store[userId] || [];
    } catch (error) {
      console.trace(error);
      return [];
    }
  },
  async pushDevice(
    store: DevicesStore,
    userId: string,
    device: AuthenticatorDevice
  ) {
    try {
      const devices = store[userId];
      if (devices && Array.isArray(devices)) {
        devices.push(device);
      } else {
        store[userId] = [device];
      }
    } catch (error) {
      console.trace(error);
      return {};
    }
  },
};

const createService = () => {
  const store: DevicesStore = {};
  return {
    getDevice: (userId: string) => Service.getDevice(store, userId),
    pushDevice: (userId: string, device: AuthenticatorDevice) =>
      Service.pushDevice(store, userId, device),
  };
};

export default createService();

// export const DevicesService = {
//   async getDevices(): Promise<DevicesStore> {
//     try {
//       const devices = JSON.parse(await readFile(deviceFilePath, "utf-8"));
//       return devices;
//     } catch (error) {
//       console.trace(error);
//       return {};
//     }
//   },
//   async getDevice(userId: string): Promise<AuthenticatorDevice[]> {
//     try {
//       const devices = JSON.parse(await readFile(deviceFilePath, "utf-8"));
//       return devices[userId] || [];
//     } catch (error) {
//       console.trace(error);
//       return [];
//     }
//   },
//   async pushDevice(userId: string, device: AuthenticatorDevice) {
//     try {
//       const devices = JSON.parse(await readFile(deviceFilePath, "utf-8"));
//       if (devices[userId] && Array.isArray(devices[userId])) {
//         devices[userId].push(device);
//       } else {
//         devices[userId] = [device];
//       }
//       await writeFile(deviceFilePath, JSON.stringify(devices, null, 2));
//     } catch (error) {
//       console.trace(error);
//       return {};
//     }
//   },
// };
