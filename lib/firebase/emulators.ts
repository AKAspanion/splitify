// The browser's copy of firebase.json's emulator addresses, for the three emulators the browser calls. The browser
// bundle can't read firebase.json, so lib/firebase/emulators.test.ts holds these equal to it.
export const EMULATOR_HOST = "127.0.0.1" as const;
export const EMULATOR_PORTS = {
  auth: 2142,
  dataconnect: 2143,
  functions: 2145,
} as const;
