import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { authnDevice: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { db } from "@/lib/db";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import DevicesService from "./devices";

const find = vi.mocked(db.authnDevice.findUnique);
const update = vi.mocked(db.authnDevice.update);

const stored = (id: number, counter: number) => ({
  credentialPublicKey: new Uint8Array([id, 2, 3]),
  credentialID: new Uint8Array([id, 9, 9]),
  counter,
});
const idOf = (n: number) => isoBase64URL.fromBuffer(new Uint8Array([n, 9, 9]));
const blob = (devices: unknown[]) => ({
  id: "row1",
  data: new TextEncoder().encode(JSON.stringify(devices)),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateCounter", () => {
  it("sets the named credential's counter and leaves the others unchanged", async () => {
    find.mockResolvedValue(blob([stored(1, 3), stored(2, 5)]) as never);

    await DevicesService.updateCounter("u1", idOf(1), 7);

    expect(update).toHaveBeenCalledTimes(1);
    const call = update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "row1" });
    const writtenBytes = call.data.data as Uint8Array;

    // the stored format still reads back as the same credentials
    find.mockResolvedValue({ id: "row1", data: writtenBytes } as never);
    const devices = await DevicesService.getDevice("u1");
    expect(devices.map((d) => [d.id, d.counter])).toEqual([
      [idOf(1), 7],
      [idOf(2), 5],
    ]);
  });

  it("writes nothing when the user has no devices", async () => {
    find.mockResolvedValue(null);
    await DevicesService.updateCounter("u1", idOf(1), 7);
    expect(update).not.toHaveBeenCalled();
  });
});
